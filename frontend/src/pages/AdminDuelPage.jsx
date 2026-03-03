import { useSearchParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import AdminDuelQuestionsPage from "./AdminDuelQuestionsPage";
import AdminSeasonsPage from "./AdminSeasonsPage";
import "../styles/admin-detail.css";

function AdminDuelPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "questions";

  return (
    <AdminLayout>
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>대결 관리</h1>
        </div>
        <div className="admin-tabs">
          <button
            className={`admin-tab ${tab === "questions" ? "active" : ""}`}
            onClick={() => setParams({ tab: "questions" })}
          >
            문제 관리
          </button>
          <button
            className={`admin-tab ${tab === "seasons" ? "active" : ""}`}
            onClick={() => setParams({ tab: "seasons" })}
          >
            시즌
          </button>
        </div>
        {tab === "questions" ? (
          <AdminDuelQuestionsPage wrap={false} />
        ) : (
          <AdminSeasonsPage wrap={false} />
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminDuelPage;
