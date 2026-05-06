import { useEffect, useMemo, useState } from "react";
import { apiGetCamel, apiPut } from "../../utils/adminApi";

/**
 * 영역(area) → 세부영역(sub_area) 멀티 → 주제(theme) 멀티 cascading 분류 선택기.
 *
 * Props:
 *   targetType: "content" | "test-question"
 *   targetId: 콘텐츠 또는 문항 ID
 *   compact: 좁은 공간에 표시할 때
 *   onSaved: (items) => void — 저장 후 콜백
 *
 * 사용:
 *   <ClassificationPicker targetType="content" targetId={contentId} />
 */
export default function ClassificationPicker({ targetType, targetId, compact = false, onSaved }) {
  const [tree, setTree] = useState(null);
  const [items, setItems] = useState([]);   // [{code, isPrimary, type, labelKo, parentCode}]
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");

  const apiPath = targetType === "content"
    ? `/v1/admin/classifications/contents/${encodeURIComponent(targetId || "")}`
    : `/v1/admin/classifications/test-questions/${encodeURIComponent(targetId || "")}`;

  const reload = async () => {
    if (!targetId) { setLoading(false); return; }
    setLoading(true);
    setError(null);
    try {
      const [treeData, current] = await Promise.all([
        apiGetCamel("/v1/admin/classifications/tree"),
        apiGetCamel(apiPath).catch(() => []),
      ]);
      setTree(treeData);
      setItems(Array.isArray(current) ? current : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [targetId, targetType]);

  const selectedAreas = useMemo(() => items.filter((x) => x.type === "area").map((x) => x.code), [items]);
  const selectedSubAreas = useMemo(() => items.filter((x) => x.type === "sub_area").map((x) => x.code), [items]);
  const selectedThemes = useMemo(() => items.filter((x) => x.type === "theme").map((x) => x.code), [items]);
  const primaryCode = items.find((x) => x.isPrimary)?.code;

  const toggleItem = (code, type, parentCode, labelKo) => {
    setItems((prev) => {
      const exists = prev.find((x) => x.code === code);
      if (exists) {
        // 이미 있으면 제거 (단 isPrimary 면 다른 것을 primary 로 옮길 필요는 사용자가 직접)
        return prev.filter((x) => x.code !== code);
      }
      return [...prev, { code, type, parentCode, labelKo, isPrimary: prev.length === 0 }];
    });
  };

  const setPrimary = (code) => {
    setItems((prev) => prev.map((x) => ({ ...x, isPrimary: x.code === code })));
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    setMessage("");
    try {
      await apiPut(apiPath, {
        items: items.map((x) => ({ code: x.code, isPrimary: !!x.isPrimary })),
      });
      setMessage("분류 저장 완료.");
      onSaved?.(items);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  if (!targetId) {
    return <div style={{ color: "#999", fontSize: 13 }}>저장 후 분류를 선택할 수 있습니다.</div>;
  }
  if (loading) return <div style={{ fontSize: 13 }}>분류 카탈로그 불러오는 중...</div>;
  if (!tree) return <div style={{ color: "#c00" }}>{error || "분류 트리를 불러올 수 없습니다."}</div>;

  // 선택된 sub_area 의 주제 목록 (영역 직속 주제 = 화법·작문·매체 도 포함)
  const themesForSelectedSubs = [];
  for (const area of tree.areas) {
    if (selectedAreas.includes(area.code)) {
      themesForSelectedSubs.push(...area.themesAtArea); // 영역 직속 (화·작·매)
    }
    for (const sub of area.subAreas) {
      if (selectedSubAreas.includes(sub.code)) {
        themesForSelectedSubs.push(...sub.themes);
      }
    }
  }

  const tagStyle = (active, isPrimary) => ({
    display: "inline-block",
    padding: compact ? "2px 8px" : "4px 10px",
    margin: "2px 4px 2px 0",
    background: active ? (isPrimary ? "#a85c00" : "#2f7a3e") : "#fff",
    color: active ? "#fff" : "#333",
    border: `1px solid ${active ? (isPrimary ? "#a85c00" : "#2f7a3e") : "#ccc"}`,
    borderRadius: 14,
    fontSize: compact ? 11 : 12,
    cursor: "pointer",
    fontWeight: isPrimary ? 700 : 400,
  });

  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 6, padding: compact ? 10 : 14, background: "#fafafa" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <strong style={{ fontSize: compact ? 13 : 14 }}>📚 분류 (영역·세부영역·주제)</strong>
        <span style={{ fontSize: 11, color: "#888" }}>
          선택된 분류: {items.length}개 · 대표: {primaryCode || "(없음)"}
        </span>
      </div>

      {error && <div style={{ padding: 6, background: "#fee", color: "#c00", borderRadius: 3, marginBottom: 8, fontSize: 12 }}>{error}</div>}
      {message && <div style={{ padding: 6, background: "#efe", color: "#2f7a3e", borderRadius: 3, marginBottom: 8, fontSize: 12 }}>{message}</div>}

      {/* 영역 (단일 권장이지만 복수 가능 — 복합 지문) */}
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>영역 (복수 선택 가능)</div>
        <div>
          {tree.areas.map((a) => {
            const active = selectedAreas.includes(a.code);
            return (
              <span key={a.code}
                style={tagStyle(active, primaryCode === a.code)}
                onClick={() => toggleItem(a.code, "area", null, a.labelKo)}>
                {a.labelKo}
              </span>
            );
          })}
        </div>
      </div>

      {/* 세부영역 */}
      {selectedAreas.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>세부영역 (복수)</div>
          <div>
            {tree.areas.filter((a) => selectedAreas.includes(a.code)).flatMap((a) => a.subAreas).map((s) => {
              const active = selectedSubAreas.includes(s.code);
              return (
                <span key={s.code}
                  style={tagStyle(active, primaryCode === s.code)}
                  onClick={() => toggleItem(s.code, "sub_area", s.parentCode, s.labelKo)}>
                  {s.labelKo}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* 주제 */}
      {(selectedAreas.length > 0 || selectedSubAreas.length > 0) && themesForSelectedSubs.length > 0 && (
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>주제 (복수)</div>
          <div style={{ maxHeight: compact ? 120 : 200, overflowY: "auto", padding: 4, background: "#fff", border: "1px solid #eee", borderRadius: 4 }}>
            {themesForSelectedSubs.map((t) => {
              const active = selectedThemes.includes(t.code);
              return (
                <span key={t.code}
                  style={tagStyle(active, primaryCode === t.code)}
                  onClick={() => toggleItem(t.code, "theme", null, t.labelKo)}>
                  {t.labelKo}
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* 선택된 분류 + 대표 지정 + 저장 */}
      {items.length > 0 && (
        <div style={{ marginTop: 10, padding: 8, background: "#fff", border: "1px dashed #ccc", borderRadius: 4 }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4 }}>선택된 분류 (대표 지정 클릭)</div>
          {items.map((x) => (
            <span key={x.code}
              onClick={() => setPrimary(x.code)}
              style={{
                ...tagStyle(true, x.isPrimary),
                cursor: "pointer",
              }}
              title="클릭하면 대표 분류로 지정">
              {x.labelKo} {x.isPrimary && "★"}
            </span>
          ))}
        </div>
      )}

      <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button onClick={reload} disabled={saving}
          style={{ padding: "6px 14px", background: "none", border: "1px solid #ccc", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>
          되돌리기
        </button>
        <button onClick={save} disabled={saving}
          style={{ padding: "6px 14px", background: "#2f7a3e", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
          {saving ? "저장 중..." : "분류 저장"}
        </button>
      </div>
    </div>
  );
}
