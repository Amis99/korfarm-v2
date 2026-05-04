import { useSearchParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import AdminDuelQuestionsPage from "./AdminDuelQuestionsPage";
import AdminSeasonsPage from "./AdminSeasonsPage";
import AdminDuelMatchesPage from "./AdminDuelMatchesPage";
import AdminThemeDuelPage from "./AdminThemeDuelPage";
import { useAuth } from "../hooks/useAuth";
import "../styles/admin-detail.css";

const HQ_TABS = [
  { key: "questions", label: "문제 풀", icon: "quiz" },
  { key: "matches", label: "매치 기록", icon: "history" },
  { key: "seasons", label: "시즌·랭킹", icon: "leaderboard" },
  { key: "theme", label: "테마 대결", icon: "groups" },
];

const ORG_ONLY_TABS = [
  { key: "theme", label: "테마 대결", icon: "groups" },
];

function AdminDuelPage() {
  const [params, setParams] = useSearchParams();
  const { user } = useAuth();
  const userRoles = user?.roles || [];
  const isOrgAdminOnly = userRoles.includes("ORG_ADMIN") && !userRoles.includes("HQ_ADMIN");
  const TABS = isOrgAdminOnly ? ORG_ONLY_TABS : HQ_TABS;
  const tab = params.get("tab") || (isOrgAdminOnly ? "theme" : "questions");

  return (
    <AdminLayout>
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>{isOrgAdminOnly ? "테마 대결 관리" : "대결 관리"}</h1>
        </div>
        <div className="admin-tabs">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`admin-tab ${tab === t.key ? "active" : ""}`}
              onClick={() => setParams({ tab: t.key })}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16, marginRight: 4 }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
        {tab === "questions" && !isOrgAdminOnly && <AdminDuelQuestionsPage wrap={false} />}
        {tab === "matches" && !isOrgAdminOnly && <AdminDuelMatchesPage wrap={false} />}
        {tab === "seasons" && !isOrgAdminOnly && <AdminSeasonsPage wrap={false} />}
        {tab === "theme" && <AdminThemeDuelPage wrap={false} />}
      </div>
    </AdminLayout>
  );
}

export default AdminDuelPage;
