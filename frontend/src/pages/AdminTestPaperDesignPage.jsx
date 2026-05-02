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
  }, [testId, type]); // eslint-disable-line

  // 자동 채우기 — test.payload → HTML 변환은 백엔드 신규 endpoint 필요 (후속)
  // 우선 빈 시작
  const handleAutoFill = async () => {
    if (html.trim() && !confirm("기존 편집 내용을 덮어씁니다. 계속할까요?")) return;
    // 임시: 현재는 자동 채우기 endpoint 없음 — 빈 골조 제공
    const skel = type === "answer"
      ? `<h1 style="text-align:center">${meta?.title || "시험지"} — 정답·해설</h1><h2>정답표</h2><p>(여기에 정답표를 작성하세요)</p><h2>해설</h2><div class="tp-cols-2"><p>(해설을 작성하세요)</p></div>`
      : `<h1 style="text-align:center">${meta?.title || "시험지"}</h1><p style="text-align:center">${meta?.totalQuestions ?? 0}문항 · ${meta?.totalPoints ?? 0}점${meta?.timeLimitMinutes ? ` · ${meta.timeLimitMinutes}분` : ""}</p><p>학교 _________ 학년/반 ____ 이름 _________</p><div class="tp-cols-2"><div class="tp-passage"><p><strong>[1~3]</strong> 다음 글을 읽고 답하시오.</p><p>지문 본문을 여기에 입력합니다.</p></div><div class="tp-question"><p>1. 문제 발문을 입력하세요.</p><p>① 첫 번째</p><p>② 두 번째</p><p>③ 세 번째</p></div></div>`;
    setHtml(skel);
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

  const handlePrint = () => window.print();

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
            ※ 워드 편집 후 [저장 + PDF 생성] 을 누르면 서버에서 자동으로 PDF 가 만들어집니다 (학습 계획표·인쇄에 활용).
            인쇄 버튼은 현재 화면을 직접 인쇄합니다.
          </div>
        </div>

        <div className="admin-detail-card" style={{ padding: 0, overflow: "hidden" }}>
          {loading ? (
            <p style={{ padding: 24, textAlign: "center", color: "var(--admin-muted)" }}>불러오는 중...</p>
          ) : (
            <TestPaperWordEditor html={html} onChange={setHtml} />
          )}
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
