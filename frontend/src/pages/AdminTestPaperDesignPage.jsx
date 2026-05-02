import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import TestPaperRenderer from "../components/test-paper/TestPaperRenderer";
import TestPaperEditor from "../components/test-paper/TestPaperEditor";
import { apiGet, apiPut, apiPost } from "../utils/adminApi";

/**
 * 시험지 디자인 — 어드민이 시험지/정답해설 인쇄용 페이지를 시각 편집.
 * 1차: 자동 채우기 + 미리보기 + 인쇄 + 저장 (페이지 단위 그대로).
 * 2차: 페이지 추가/삭제, 블록 추가/편집, 다단 토글, 이미지 업로드 등.
 */
export default function AdminTestPaperDesignPage() {
  const { testId } = useParams();
  const navigate = useNavigate();

  const [type, setType] = useState("paper"); // paper | answer
  const [layout, setLayout] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [meta, setMeta] = useState(null);
  const [mode, setMode] = useState("edit"); // edit | preview

  const load = async (t = type) => {
    if (!testId) return;
    setLoading(true);
    setError("");
    try {
      const [layoutRes, metaRes] = await Promise.all([
        apiGet(`/v1/admin/test-papers/${testId}/layout?type=${t}`),
        apiGet(`/v1/admin/test-papers/${testId}`).catch(() => null),
      ]);
      setLayout(layoutRes?.layout || null);
      setMeta(metaRes || null);
    } catch (e) {
      setError(e?.message || "불러오기 실패");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(type); }, [testId, type]); // eslint-disable-line

  const handleAutoFill = async () => {
    if (!confirm(
      type === "answer"
        ? "정답·해설 레이아웃을 시험 데이터로 자동 채웁니다. 기존 편집 내용은 덮어씌워집니다. 계속할까요?"
        : "시험지 레이아웃을 시험 데이터로 자동 채웁니다. 기존 편집 내용은 덮어씌워집니다. 계속할까요?"
    )) return;
    setSaving(true);
    try {
      const res = await apiPost(`/v1/admin/test-papers/${testId}/layout/auto-fill?type=${type}`);
      setLayout(res?.layout || null);
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
    const url = `/admin/tests/${testId}/print?type=${type}&autoprint=1`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <AdminLayout>
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>
            <span className="material-symbols-outlined" style={{ verticalAlign: "middle", marginRight: 8 }}>palette</span>
            시험지 디자인
          </h1>
          <div className="admin-detail-header-actions" style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <Link
              to="/admin/test-papers"
              style={{
                color: "var(--admin-accent-strong, #1f4a37)",
                fontSize: 13,
                textDecoration: "none",
              }}
            >← 목록으로</Link>
          </div>
        </div>

        {/* 메타 + 도구 모음 */}
        <div className="admin-detail-card" style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
            <h3 style={{ margin: 0, color: "var(--admin-ink)" }}>
              {meta?.title || "(시험 정보)"}
            </h3>
            <span style={{ color: "var(--admin-muted)", fontSize: 12 }}>
              {meta?.totalQuestions ?? "-"}문항 · {meta?.totalPoints ?? "-"}점
              {meta?.timeLimitMinutes ? ` · ${meta.timeLimitMinutes}분` : ""}
            </span>
            <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
              <div style={{
                display: "inline-flex", border: "1px solid rgba(31,58,44,0.18)",
                borderRadius: 8, overflow: "hidden",
              }}>
                <button
                  onClick={() => setType("paper")}
                  style={{
                    padding: "6px 14px", fontSize: 13,
                    background: type === "paper" ? "var(--admin-accent, #2d6a4f)" : "#fff",
                    color: type === "paper" ? "#fff" : "var(--admin-ink)",
                    border: "none", cursor: "pointer",
                  }}
                >시험지</button>
                <button
                  onClick={() => setType("answer")}
                  style={{
                    padding: "6px 14px", fontSize: 13,
                    background: type === "answer" ? "var(--admin-accent, #2d6a4f)" : "#fff",
                    color: type === "answer" ? "#fff" : "var(--admin-ink)",
                    border: "none", borderLeft: "1px solid rgba(31,58,44,0.18)", cursor: "pointer",
                  }}
                >정답·해설</button>
              </div>
              <div style={{
                display: "inline-flex", border: "1px solid rgba(31,58,44,0.18)",
                borderRadius: 8, overflow: "hidden",
              }}>
                <button
                  onClick={() => setMode("edit")}
                  style={{
                    padding: "6px 14px", fontSize: 13,
                    background: mode === "edit" ? "var(--admin-accent, #2d6a4f)" : "#fff",
                    color: mode === "edit" ? "#fff" : "var(--admin-ink)",
                    border: "none", cursor: "pointer",
                  }}
                >편집</button>
                <button
                  onClick={() => setMode("preview")}
                  style={{
                    padding: "6px 14px", fontSize: 13,
                    background: mode === "preview" ? "var(--admin-accent, #2d6a4f)" : "#fff",
                    color: mode === "preview" ? "#fff" : "var(--admin-ink)",
                    border: "none", borderLeft: "1px solid rgba(31,58,44,0.18)", cursor: "pointer",
                  }}
                >미리보기</button>
              </div>
              <button className="admin-detail-btn" onClick={handleAutoFill} disabled={saving}>
                자동 채우기
              </button>
              <button className="admin-detail-btn" onClick={handleSave} disabled={saving || !layout}>
                {saving ? "저장 중..." : "저장"}
              </button>
              <button className="admin-detail-btn primary" onClick={handlePrint} disabled={!layout}>
                🖨 인쇄
              </button>
            </div>
          </div>
          {error && <div style={{ color: "#c0392b", marginTop: 8 }}>{error}</div>}
          <div style={{ marginTop: 8, fontSize: 12, color: "var(--admin-muted)" }}>
            ※ 편집 모드: 페이지 추가·삭제·블록 편집·이미지 업로드 가능. 미리보기 모드: 학생이 보게 될 시험지 그대로. 인쇄 버튼은 새 탭에서 인쇄 미리보기 + 자동 인쇄 다이얼로그 호출.
          </div>
        </div>

        {/* 편집/미리보기 영역 */}
        <div className="admin-detail-card" style={{ padding: 0, overflow: "hidden" }}>
          {loading ? (
            <p style={{ padding: 24, textAlign: "center", color: "var(--admin-muted)" }}>불러오는 중...</p>
          ) : !layout ? (
            <div style={{ padding: 60, textAlign: "center", color: "var(--admin-muted)" }}>
              <p>아직 디자인된 레이아웃이 없습니다.</p>
              <button className="admin-detail-btn primary" onClick={handleAutoFill} style={{ marginTop: 12 }}>
                자동 채우기로 시작하기
              </button>
            </div>
          ) : mode === "edit" ? (
            <TestPaperEditor layout={layout} onChange={setLayout} />
          ) : (
            <TestPaperRenderer layout={layout} editable={false} />
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
