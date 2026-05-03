import { Link, useNavigate, useSearchParams } from "react-router-dom";
import EngineShell from "../engine/core/EngineShell";
import AnswerKeyView from "../components/answer-key/AnswerKeyView";
import "../styles/pro-mode.css";
import "../styles/answer-key.css";

function AdminContentPreviewPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const backPath = params.get("from") || "/admin/content";
  let content = null;
  let moduleKey = null;

  try {
    content = JSON.parse(localStorage.getItem("korfarm_preview_content") || "null");
    moduleKey = localStorage.getItem("korfarm_preview_module") || "worksheet_quiz";
  } catch {
    content = null;
  }

  if (!content) {
    return (
      <div style={{ padding: "40px" }}>
        <h1>미리보기 데이터를 찾을 수 없습니다.</h1>
        <Link to={backPath} style={previewBackBtnStyle}>← 돌아가기</Link>
      </div>
    );
  }

  // PRO_ANSWER (정답·해설) 미리보기 — 학생 ProAnswerKeyPage 와 완전 동일한 마크업으로 표시
  // 별도 라우트로 점프하지 않고 같은 컴포넌트(AnswerKeyView) + 같은 wrapping 으로 외관 일치
  if (moduleKey === "answer_key") {
    const payload = content?.payload || content || {};
    const sections = payload?.sections || payload?.payload?.sections || [];
    return (
      <div className="pro">
        <div className="pro-topbar no-print">
          <div className="pro-topbar-inner">
            <button
              type="button"
              className="pro-back"
              onClick={() => navigate(backPath)}
              style={{ background: "transparent", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              <span className="material-symbols-outlined">arrow_back</span>
              학습 목록
            </button>
            <h1 className="pro-topbar-title">정답과 해설</h1>
            <button className="ak-print-btn" onClick={() => window.print()} style={{ marginLeft: "auto" }}>
              <span className="material-symbols-outlined">print</span>
              인쇄
            </button>
          </div>
        </div>
        <div className="pro-body">
          {(content?.title || payload?.title) && (
            <h2 className="ak-page-title">{content?.title || payload?.title}</h2>
          )}
          <AnswerKeyView sections={sections} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div style={{ padding: "16px" }}>
        <button type="button" onClick={() => navigate(backPath)} style={previewBackBtnStyle}>
          ← 돌아가기
        </button>
      </div>
      <EngineShell content={content} moduleKey={moduleKey} onExit={() => navigate(backPath)} />
    </div>
  );
}

const previewBackBtnStyle = {
  display: "inline-block",
  padding: "6px 14px",
  fontSize: 13,
  fontWeight: 600,
  background: "#ffffff",
  color: "#1a2920",
  border: "1px solid rgba(31, 58, 44, 0.2)",
  borderRadius: 6,
  cursor: "pointer",
  fontFamily: "inherit",
  textDecoration: "none",
};

export default AdminContentPreviewPage;
