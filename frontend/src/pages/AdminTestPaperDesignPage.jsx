import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import LayoutVisualEditor from "../components/test-paper/LayoutVisualEditor";
import { apiGet, apiPut, apiPost } from "../utils/adminApi";
import { API_BASE, TOKEN_KEY } from "../utils/api";

/**
 * 시험지 디자인 — 비주얼 에디터 + Typst 컴파일 PDF 미리보기.
 * 어드민은 코드 안 봄. 편집 결과 layout JSON → 백엔드 자동 typst 변환 → PDF.
 */
export default function AdminTestPaperDesignPage() {
  const { testId } = useParams();

  const [type, setType] = useState("paper");
  const [layout, setLayout] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [compiling, setCompiling] = useState(false);
  const [error, setError] = useState("");
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

  const compileDebounceRef = useRef(null);

  const load = async (t = type) => {
    setLoading(true);
    setError("");
    try {
      const [layoutRes, paper] = await Promise.all([
        apiGet(`/v1/admin/test-papers/${testId}/layout?type=${t}`),
        apiGet(`/v1/admin/test-papers/${testId}`).catch(() => null),
      ]);
      setLayout(layoutRes?.layout || null);
      setMeta(paper);
    } catch (e) {
      setError(e?.message || "불러오기 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!testId) return;
    load(type);
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
      if (compileDebounceRef.current) clearTimeout(compileDebounceRef.current);
    };
  }, [testId, type]); // eslint-disable-line

  const compile = useCallback(async (currentLayout) => {
    if (!currentLayout || !currentLayout.blocks?.length) {
      setError("내용이 없습니다. 자동 채우기를 먼저 실행해주세요.");
      return;
    }
    setCompiling(true);
    setError("");
    try {
      const token = sessionStorage.getItem(TOKEN_KEY);
      const res = await fetch(
        `${API_BASE}/v1/admin/test-papers/${testId}/layout/compile?type=${type}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ layout: currentLayout }),
        }
      );
      if (!res.ok) {
        const text = await res.text();
        let msg = `컴파일 실패 (${res.status})`;
        try {
          const json = JSON.parse(text);
          msg = json?.error?.message || json?.message || msg;
        } catch { /* not json */ }
        throw new Error(msg);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
      setPdfBlobUrl(url);
    } catch (e) {
      setError(e?.message || "컴파일 실패");
    } finally {
      setCompiling(false);
    }
  }, [testId, type, pdfBlobUrl]);

  // 편집 시 자동 컴파일 (debounce 800ms)
  const handleLayoutChange = (next) => {
    setLayout(next);
    if (compileDebounceRef.current) clearTimeout(compileDebounceRef.current);
    compileDebounceRef.current = setTimeout(() => compile(next), 800);
  };

  const handleAutoFill = async () => {
    if (layout?.blocks?.length && !confirm("기존 편집 내용을 덮어씁니다. 계속할까요?")) return;
    setSaving(true);
    try {
      const res = await apiPost(`/v1/admin/test-papers/${testId}/layout/auto-fill?type=${type}`);
      const newLayout = res?.layout || null;
      setLayout(newLayout);
      compile(newLayout);
    } catch (e) {
      setError(e?.message || "자동 채우기 실패");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (!layout) return;
    setSaving(true);
    try {
      await apiPut(`/v1/admin/test-papers/${testId}/layout?type=${type}`, { layout });
      alert("저장됐습니다.");
    } catch (e) {
      setError(e?.message || "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    if (!pdfBlobUrl) {
      compile(layout);
      return;
    }
    const w = window.open(pdfBlobUrl, "_blank");
    if (w) {
      setTimeout(() => { try { w.print(); } catch { /* */ } }, 800);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>
            <span className="material-symbols-outlined" style={{ verticalAlign: "middle", marginRight: 8 }}>palette</span>
            시험지 디자인
          </h1>
          <Link to="/admin/test-papers" style={{
            color: "var(--admin-accent-strong, #1f4a37)", fontSize: 13, textDecoration: "none",
          }}>← 목록으로</Link>
        </div>

        <div className="admin-detail-card" style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
            <h3 style={{ margin: 0, color: "var(--admin-ink)" }}>
              {meta?.title || "(시험)"}
            </h3>
            <span style={{ color: "var(--admin-muted)", fontSize: 12 }}>
              {meta?.totalQuestions ?? "-"}문항 · {meta?.totalPoints ?? "-"}점
              {meta?.timeLimitMinutes ? ` · ${meta.timeLimitMinutes}분` : ""}
            </span>

            <div style={{ marginLeft: "auto", display: "flex", gap: 8, flexWrap: "wrap" }}>
              <div style={{
                display: "inline-flex", border: "1px solid rgba(31,58,44,0.18)",
                borderRadius: 8, overflow: "hidden",
              }}>
                <button onClick={() => setType("paper")} style={tabBtn(type === "paper")}>시험지</button>
                <button onClick={() => setType("answer")} style={tabBtn(type === "answer")}>정답·해설</button>
              </div>
              <button className="admin-detail-btn" onClick={handleAutoFill} disabled={saving || compiling}>
                자동 채우기
              </button>
              <button className="admin-detail-btn" onClick={() => compile(layout)} disabled={compiling || !layout}>
                {compiling ? "컴파일 중..." : "🔍 미리보기"}
              </button>
              <button className="admin-detail-btn" onClick={handleSave} disabled={saving || !layout}>
                {saving ? "저장 중..." : "💾 저장"}
              </button>
              <button className="admin-detail-btn primary" onClick={handlePrint} disabled={compiling}>
                🖨 인쇄
              </button>
            </div>
          </div>
          {error && <div style={{ color: "#c0392b", marginTop: 8, fontSize: 13, whiteSpace: "pre-wrap" }}>{error}</div>}
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          gap: 12, alignItems: "stretch",
        }}>
          {/* 좌: 비주얼 편집기 */}
          <div className="admin-detail-card" style={{ padding: 0, display: "flex", flexDirection: "column" }}>
            <div style={{
              padding: "8px 12px", borderBottom: "1px solid rgba(31,58,44,0.12)",
              fontSize: 12, fontWeight: 600, background: "var(--admin-panel-light, #f5f9f3)",
            }}>
              편집기 — 변경 시 자동 컴파일 (우측 미리보기 갱신)
            </div>
            {loading ? (
              <p style={{ padding: 24, color: "var(--admin-muted)", textAlign: "center" }}>불러오는 중...</p>
            ) : !layout ? (
              <div style={{ padding: 60, textAlign: "center", color: "var(--admin-muted)" }}>
                <p>아직 디자인된 레이아웃이 없습니다.</p>
                <button className="admin-detail-btn primary" onClick={handleAutoFill} style={{ marginTop: 12 }}>
                  자동 채우기로 시작하기
                </button>
              </div>
            ) : (
              <div style={{ flex: 1, overflow: "auto", maxHeight: 720 }}>
                <LayoutVisualEditor layout={layout} onChange={handleLayoutChange} />
              </div>
            )}
          </div>

          {/* 우: PDF 미리보기 */}
          <div className="admin-detail-card" style={{ padding: 0, display: "flex", flexDirection: "column" }}>
            <div style={{
              padding: "8px 12px", borderBottom: "1px solid rgba(31,58,44,0.12)",
              fontSize: 12, fontWeight: 600, background: "var(--admin-panel-light, #f5f9f3)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span>미리보기 (PDF · A4)</span>
              {compiling && <span style={{ color: "var(--admin-accent)" }}>컴파일 중...</span>}
              {pdfBlobUrl && (
                <a href={pdfBlobUrl} download={`test_${testId}_${type}.pdf`}
                  style={{ fontSize: 11, color: "var(--admin-accent-strong)" }}>
                  ⬇ PDF 다운로드
                </a>
              )}
            </div>
            {pdfBlobUrl ? (
              <iframe
                src={pdfBlobUrl}
                title="시험지 미리보기"
                style={{ width: "100%", height: 720, border: "none", flex: 1, background: "#fff" }}
              />
            ) : (
              <div style={{ padding: 60, textAlign: "center", color: "var(--admin-muted)" }}>
                <p>미리보기가 아직 컴파일되지 않았습니다.</p>
                <p style={{ fontSize: 12 }}>편집을 시작하거나 [미리보기] 버튼을 누르세요.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

const tabBtn = (active) => ({
  padding: "6px 14px", fontSize: 13,
  background: active ? "var(--admin-accent, #2d6a4f)" : "#fff",
  color: active ? "#fff" : "var(--admin-ink)",
  border: "none", cursor: "pointer",
  borderLeft: "1px solid rgba(31,58,44,0.18)",
});
