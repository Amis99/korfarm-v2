import { useSearchParams, useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import EditorShell from "../components/editor/EditorShell";
import { useRequireRole } from "../hooks/useRequireRole";

/**
 * 콘텐츠 비주얼 에디터 페이지
 * 라우트: /admin/content/edit?id=xxx
 */
export default function AdminContentEditorPage() {
  useRequireRole("HQ_ADMIN");
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const contentId = params.get("id");
  // 학습 콘텐츠 DB 단일 소스 — static 분기 제거 (옛 source=static URL 들어와도 무시)
  const staticInfo = null;

  if (!contentId) {
    return (
      <AdminLayout>
        <div className="admin-detail-wrap">
          <div className="admin-detail-card admin-single-card" style={{ textAlign: "center", padding: 40 }}>
            <p>콘텐츠 ID가 지정되지 않았습니다.</p>
            <button
              className="admin-detail-btn"
              onClick={() => navigate(params.get("from") || "/admin/content")}
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
