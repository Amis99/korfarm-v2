import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { apiGet, apiPut, apiPost } from "../utils/adminApi";
import { API_BASE, TOKEN_KEY } from "../utils/api";

/**
 * 시험지 디자인 — Typst 기반.
 * - 좌: typst 코드 에디터 (textarea)
 * - 우: 컴파일된 PDF 미리보기 (iframe)
 * - [자동 채우기] / [컴파일·미리보기] / [저장] / [인쇄]
 *
 * 자동 페이지 분할은 typst 엔진이 처리 — A4 사이즈 절대 안 늘어남.
 */
export default function AdminTestPaperDesignPage() {
  const { testId } = useParams();

  const [type, setType] = useState("paper");
  const [source, setSource] = useState("");
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [compiling, setCompiling] = useState(false);
  const [error, setError] = useState("");
  const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

  // 소스 로드
  const load = async (t = type) => {
    setLoading(true);
    setError("");
    try {
      const [src, paper] = await Promise.all([
        apiGet(`/v1/admin/test-papers/${testId}/typst?type=${t}`),
        apiGet(`/v1/admin/test-papers/${testId}`).catch(() => null),
      ]);
      setSource(src?.source || "");
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
    };
  }, [testId, type]); // eslint-disable-line

  // 컴파일 → PDF blob URL
  const compile = useCallback(async (currentSource) => {
    if (!currentSource?.trim()) {
      setError("소스가 비어 있습니다. 자동 채우기를 먼저 실행해주세요.");
      return;
    }
    setCompiling(true);
    setError("");
    try {
      const token = sessionStorage.getItem(TOKEN_KEY);
      const res = await fetch(
        `${API_BASE}/v1/admin/test-papers/${testId}/typst/compile?type=${type}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ source: currentSource }),
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

  const handleAutoFill = async () => {
    if (source.trim() && !confirm("기존 typst 소스를 덮어씁니다. 계속할까요?")) return;
    setSaving(true);
    try {
      const res = await apiPost(`/v1/admin/test-papers/${testId}/typst/auto-fill?type=${type}`);
      const newSource = res?.source || "";
      setSource(newSource);
      // 자동 채우기 후 즉시 컴파일
      compile(newSource);
    } catch (e) {
      setError(e?.message || "자동 채우기 실패");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiPut(`/v1/admin/test-papers/${testId}/typst?type=${type}`, { source });
      setError("");
      alert("저장됐습니다.");
    } catch (e) {
      setError(e?.message || "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    if (!pdfBlobUrl) {
      compile(source);
      return;
    }
    // 인쇄 전용 새 탭
    const w = window.open(pdfBlobUrl, "_blank");
    if (w) {
      // PDF 가 로드된 후 인쇄 다이얼로그 호출 (브라우저별로 작동 차이)
      setTimeout(() => { try { w.print(); } catch { /* */ } }, 800);
    }
  };

  // 스니펫 삽입
  const insertSnippet = (snippet) => {
    setSource((prev) => `${prev}\n${snippet}\n`);
  };

  return (
    <AdminLayout>
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>
            <span className="material-symbols-outlined" style={{ verticalAlign: "middle", marginRight: 8 }}>palette</span>
            시험지 디자인 (Typst)
          </h1>
          <Link to="/admin/test-papers" style={{
            color: "var(--admin-accent-strong, #1f4a37)", fontSize: 13, textDecoration: "none",
          }}>← 목록으로</Link>
        </div>

        {/* 도구 모음 */}
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
              <button className="admin-detail-btn" onClick={() => compile(source)} disabled={compiling}>
                {compiling ? "컴파일 중..." : "🔍 미리보기"}
              </button>
              <button className="admin-detail-btn" onClick={handleSave} disabled={saving}>
                {saving ? "저장 중..." : "💾 저장"}
              </button>
              <button className="admin-detail-btn primary" onClick={handlePrint} disabled={compiling}>
                🖨 인쇄
              </button>
            </div>
          </div>
          {error && <div style={{ color: "#c0392b", marginTop: 8, fontSize: 13, whiteSpace: "pre-wrap" }}>{error}</div>}

          {/* 스니펫 */}
          <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 6, fontSize: 12 }}>
            <span style={{ color: "var(--admin-muted)" }}>스니펫:</span>
            {SNIPPETS.map((s) => (
              <button key={s.label} onClick={() => insertSnippet(s.code)} style={snippetBtn}>
                + {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* 좌(코드) / 우(미리보기) */}
        <div style={{
          display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)",
          gap: 12, alignItems: "stretch",
        }}>
          <div className="admin-detail-card" style={{ padding: 0, display: "flex", flexDirection: "column" }}>
            <div style={{
              padding: "8px 12px", borderBottom: "1px solid rgba(31,58,44,0.12)",
              fontSize: 12, fontWeight: 600, background: "var(--admin-panel-light, #f5f9f3)",
            }}>
              Typst 코드
            </div>
            {loading ? (
              <p style={{ padding: 24, color: "var(--admin-muted)", textAlign: "center" }}>불러오는 중...</p>
            ) : (
              <textarea
                value={source}
                onChange={(e) => setSource(e.target.value)}
                spellCheck={false}
                style={{
                  width: "100%", minHeight: 540, flex: 1,
                  padding: 12,
                  fontFamily: "Menlo, Consolas, 'Courier New', monospace",
                  fontSize: 13, lineHeight: 1.55,
                  border: "none", outline: "none", resize: "vertical",
                  background: "#fafafa", color: "#222",
                }}
                onKeyDown={(e) => {
                  // 탭 키로 들여쓰기
                  if (e.key === "Tab") {
                    e.preventDefault();
                    const ta = e.target;
                    const start = ta.selectionStart;
                    const end = ta.selectionEnd;
                    const next = source.slice(0, start) + "  " + source.slice(end);
                    setSource(next);
                    requestAnimationFrame(() => {
                      ta.selectionStart = ta.selectionEnd = start + 2;
                    });
                  }
                }}
              />
            )}
          </div>

          <div className="admin-detail-card" style={{ padding: 0, display: "flex", flexDirection: "column" }}>
            <div style={{
              padding: "8px 12px", borderBottom: "1px solid rgba(31,58,44,0.12)",
              fontSize: 12, fontWeight: 600, background: "var(--admin-panel-light, #f5f9f3)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span>미리보기 (PDF)</span>
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
                <p>아직 컴파일되지 않았습니다.</p>
                <p style={{ fontSize: 12 }}>[자동 채우기] 또는 [미리보기] 클릭 시 PDF 가 표시됩니다.</p>
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
const snippetBtn = {
  padding: "3px 10px", fontSize: 12,
  border: "1px solid rgba(45,106,79,0.3)",
  background: "rgba(45,106,79,0.08)",
  color: "var(--admin-accent-strong, #1f4a37)",
  borderRadius: 4, cursor: "pointer",
};

const SNIPPETS = [
  {
    label: "지문",
    code: `*[1~5]* 다음 글을 읽고 답하시오.\n\n#par(justify: true)[\n  지문 본문을 여기에 입력합니다.\n]\n#v(6pt)`,
  },
  {
    label: "문제",
    code: `*1.* 문제 발문을 입력하세요. #h(0.5em) #text(size: 9pt, fill: gray)[\\[4점\\]]\n#h(1em) ① 첫 번째\\\n#h(1em) ② 두 번째\\\n#h(1em) ③ 세 번째\\\n#h(1em) ④ 네 번째\\\n#h(1em) ⑤ 다섯 번째\n#v(4pt)`,
  },
  {
    label: "박스",
    code: `#box(stroke: 1pt + black, inset: 8pt, radius: 4pt, width: 100%)[\n  *<보기>* 박스 내용\n]\n#v(4pt)`,
  },
  {
    label: "표",
    code: `#table(\n  columns: (1fr, 1fr, 1fr),\n  align: center,\n  stroke: 0.5pt,\n  table.header([항목], [값], [비고]),\n  [a], [1], [-],\n  [b], [2], [-],\n)\n#v(4pt)`,
  },
  {
    label: "이미지",
    code: `#align(center)[\n  #image("https://via.placeholder.com/300", width: 60%)\n  #text(size: 9pt, fill: gray)[(이미지 설명)]\n]\n#v(4pt)`,
  },
  {
    label: "페이지 분할",
    code: `#pagebreak()`,
  },
  {
    label: "2단 시작",
    code: `#columns(2, gutter: 12pt)[\n  // 본문\n]`,
  },
];
