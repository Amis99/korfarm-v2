import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import TestPaperWordEditor from "../components/test-paper/TestPaperWordEditor";
import { apiGet, apiPut, apiPost } from "../utils/adminApi";
import { API_BASE, TOKEN_KEY } from "../utils/api";

/**
 * 시험지 디자인 — 워드프로세서 + 자동 PDF 생성 (Chrome headless).
 */
export default function AdminTestPaperDesignPage() {
  const { testId } = useParams();

  const [type, setType] = useState("paper");
  const [html, setHtml] = useState("");
  const [pdfFileId, setPdfFileId] = useState(null);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // 우측 미리보기 PDF blob
  const [previewBlobUrl, setPreviewBlobUrl] = useState(null);
  const [previewing, setPreviewing] = useState(false);
  const previewDebounceRef = useRef(null);

  // 마지막 저장된 HTML — 변경 감지
  const savedHtmlRef = useRef("");
  const dirty = html !== savedHtmlRef.current;

  const load = async (t = type) => {
    setLoading(true);
    setError("");
    try {
      const [data, paper] = await Promise.all([
        apiGet(`/v1/admin/test-papers/${testId}/html?type=${t}`),
        apiGet(`/v1/admin/test-papers/${testId}`).catch(() => null),
      ]);
      const loadedHtml = data?.html || "";
      setHtml(loadedHtml);
      savedHtmlRef.current = loadedHtml;
      setPdfFileId(data?.pdfFileId || null);
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
      if (previewBlobUrl) URL.revokeObjectURL(previewBlobUrl);
      if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
    };
  }, [testId, type]); // eslint-disable-line

  // 우측 PDF 미리보기 컴파일
  const compilePreview = useCallback(async (currentHtml) => {
    if (!currentHtml?.trim()) return;
    setPreviewing(true);
    try {
      const token = sessionStorage.getItem(TOKEN_KEY);
      const res = await fetch(
        `${API_BASE}/v1/admin/test-papers/${testId}/html/compile?type=${type}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ html: currentHtml }),
        }
      );
      if (!res.ok) throw new Error(`미리보기 실패 (${res.status})`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPreviewBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return url;
      });
    } catch (e) {
      // 미리보기 실패는 silent (편집 흐름 방해 X)
    } finally {
      setPreviewing(false);
    }
  }, [testId, type]);

  // html 변경 시 3s debounce 후 미리보기 자동 갱신 (Chrome 호출 빈도 감소)
  const handleHtmlChange = (next) => {
    setHtml(next);
    if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
    previewDebounceRef.current = setTimeout(() => compilePreview(next), 3000);
  };

  // 첫 로드 후 초기 미리보기
  useEffect(() => {
    if (html && !previewBlobUrl && !loading) compilePreview(html);
  }, [html, loading]); // eslint-disable-line

  const handleAutoFill = async () => {
    if (html.trim() && !confirm("기존 편집 내용을 덮어씁니다. 계속할까요?")) return;
    setSaving(true);
    setError("");
    try {
      const res = await apiPost(`/v1/admin/test-papers/${testId}/html/auto-fill?type=${type}`);
      const newHtml = res?.html || "";
      setHtml(newHtml);
      savedHtmlRef.current = newHtml;
      compilePreview(newHtml);
    } catch (e) {
      setError(e?.message || "자동 채우기 실패");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      await apiPut(`/v1/admin/test-papers/${testId}/html?type=${type}`, { html });
      savedHtmlRef.current = html;
      alert("저장됐습니다.");
    } catch (e) {
      setError(e?.message || "저장 실패");
    } finally {
      setSaving(false);
    }
  };

  // 저장 + PDF 생성 + 서버 저장
  const handleSaveAndPdf = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await apiPost(`/v1/admin/test-papers/${testId}/html/save-pdf?type=${type}`, { html });
      savedHtmlRef.current = html;
      setPdfFileId(res?.fileId || null);
      alert("PDF 가 생성되어 서버에 저장됐습니다.");
    } catch (e) {
      setError(e?.message || "PDF 생성 실패");
    } finally {
      setSaving(false);
    }
  };

  const handleOpenPdf = () => {
    if (!pdfFileId) {
      alert("아직 PDF 가 생성되지 않았습니다. [저장 + PDF 생성] 을 먼저 실행해주세요.");
      return;
    }
    const token = sessionStorage.getItem(TOKEN_KEY);
    const url = `${API_BASE}/v1/files/${pdfFileId}/download${token ? `?token=${token}` : ""}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handlePrint = () => {
    // 우측 PDF 가 있으면 그걸 새 탭으로 열어 인쇄
    if (previewBlobUrl) {
      const w = window.open(previewBlobUrl, "_blank");
      if (w) setTimeout(() => { try { w.print(); } catch { /* */ } }, 800);
      return;
    }
    // 미리보기 없으면 즉시 컴파일 후 인쇄
    compilePreview(html).then(() => {
      if (previewBlobUrl) {
        const w = window.open(previewBlobUrl, "_blank");
        if (w) setTimeout(() => { try { w.print(); } catch { /* */ } }, 800);
      }
    });
  };

  return (
    <AdminLayout>
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>
            <span className="material-symbols-outlined" style={{ verticalAlign: "middle", marginRight: 8 }}>palette</span>
            시험지 디자인
          </h1>
          <Link to="/admin/tests" style={{
            color: "var(--admin-accent-strong, #1f4a37)", fontSize: 13, textDecoration: "none",
          }}>← 목록으로</Link>
        </div>

        <div className="admin-detail-card" style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
            <h3 style={{ margin: 0, color: "var(--admin-ink)" }}>{meta?.title || "(시험)"}</h3>
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
              <button className="admin-detail-btn" onClick={handleAutoFill} disabled={saving}>
                자동 채우기
              </button>
              <button className="admin-detail-btn" onClick={handleSave} disabled={saving || !dirty}>
                {saving ? "저장 중..." : "💾 저장"}
              </button>
              <button className="admin-detail-btn primary" onClick={handleSaveAndPdf} disabled={saving}>
                💾 저장 + PDF 생성
              </button>
              <button className="admin-detail-btn" onClick={handleOpenPdf} disabled={!pdfFileId}>
                📄 PDF 열기
              </button>
              <button className="admin-detail-btn" onClick={handlePrint}>
                🖨 인쇄
              </button>
            </div>
          </div>
          {error && <div style={{ color: "#c0392b", marginTop: 8, fontSize: 13, whiteSpace: "pre-wrap" }}>{error}</div>}
          <div style={{ marginTop: 6, fontSize: 12, color: "var(--admin-muted)" }}>
            ※ 좌측에서 워드 편집 → 우측에 PDF 미리보기 자동 갱신 (페이지 분할 정확). [저장 + PDF 생성] 으로 서버에 PDF 저장.
          </div>
        </div>

        <div style={{
          display: "grid", gridTemplateColumns: "minmax(0, 3fr) minmax(0, 2fr)",
          gap: 12, alignItems: "stretch",
        }}>
          {/* 좌: 워드 편집기 */}
          <div className="admin-detail-card" style={{ padding: 0, display: "flex", flexDirection: "column" }}>
            <div style={{
              padding: "8px 12px", borderBottom: "1px solid rgba(31,58,44,0.12)",
              fontSize: 12, fontWeight: 600, background: "var(--admin-panel-light, #f5f9f3)",
            }}>
              워드 편집기
            </div>
            {loading ? (
              <p style={{ padding: 24, textAlign: "center", color: "var(--admin-muted)" }}>불러오는 중...</p>
            ) : (
              <div style={{ flex: 1, overflow: "auto", maxHeight: 800 }}>
                <TestPaperWordEditor html={html} onChange={handleHtmlChange} />
              </div>
            )}
          </div>

          {/* 우: PDF 미리보기 (페이지 분할 정확) */}
          <div className="admin-detail-card" style={{ padding: 0, display: "flex", flexDirection: "column" }}>
            <div style={{
              padding: "8px 12px", borderBottom: "1px solid rgba(31,58,44,0.12)",
              fontSize: 12, fontWeight: 600, background: "var(--admin-panel-light, #f5f9f3)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
            }}>
              <span>미리보기 (PDF · A4 자동 분할)</span>
              {previewing && <span style={{ color: "var(--admin-accent)" }}>컴파일 중...</span>}
            </div>
            {previewBlobUrl ? (
              <iframe
                src={previewBlobUrl}
                title="시험지 미리보기"
                style={{ width: "100%", height: 800, border: "none", flex: 1, background: "#fff" }}
              />
            ) : (
              <div style={{ padding: 60, textAlign: "center", color: "var(--admin-muted)" }}>
                <p>미리보기 준비 중...</p>
                <p style={{ fontSize: 12 }}>편집 후 1.5초 뒤 자동 갱신됩니다.</p>
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
