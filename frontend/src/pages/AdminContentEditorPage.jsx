import { useSearchParams, useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import EditorShell from "../components/editor/EditorShell";

/**
 * 콘텐츠 비주얼 에디터 페이지
 * 라우트: /admin/content/edit?id=xxx
 */
export default function AdminContentEditorPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const contentId = params.get("id");
  const source = params.get("source");
  const staticInfo = source === "static" ? {
    jsonPath: params.get("jsonPath"),
    contentType: params.get("type"),
    title: params.get("title"),
  } : null;

  if (!contentId) {
    return (
      <AdminLayout>
        <div className="admin-detail-wrap">
          <div className="admin-detail-card admin-single-card" style={{ textAlign: "center", padding: 40 }}>
            <p>콘텐츠 ID가 지정되지 않았습니다.</p>
            <button
              className="admin-detail-btn"
              onClick={() => navigate("/admin/content")}
              style={{ marginTop: 12 }}
            >
              목록으로 돌아가기
            </button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <EditorShell contentId={contentId} staticInfo={staticInfo} />
    </AdminLayout>
  );
}
