import { Link, useNavigate } from "react-router-dom";
import EngineShell from "../engine/core/EngineShell";

function AdminContentPreviewPage() {
  const navigate = useNavigate();
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
        <Link to="/admin/content">콘텐츠 관리로 돌아가기</Link>
      </div>
    );
  }

  return (
    <div>
      <div style={{ padding: "16px" }}>
        <button type="button" onClick={() => navigate("/admin/content")}>돌아가기</button>
      </div>
      <EngineShell content={content} moduleKey={moduleKey} onExit={() => navigate("/admin/content")} />
    </div>
  );
}

export default AdminContentPreviewPage;
