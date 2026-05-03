import { useSearchParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import AdminDuelQuestionsPage from "./AdminDuelQuestionsPage";
import AdminSeasonsPage from "./AdminSeasonsPage";
import AdminDuelMatchesPage from "./AdminDuelMatchesPage";
import AdminDuelRulesPage from "./AdminDuelRulesPage";
import "../styles/admin-detail.css";

const TABS = [
  { key: "questions", label: "문제 풀", icon: "quiz" },
  { key: "matches", label: "매치 기록", icon: "history" },
  { key: "seasons", label: "시즌·랭킹", icon: "leaderboard" },
  { key: "rules", label: "AI·룰", icon: "settings" },
  { key: "theme", label: "테마 대결", icon: "groups", placeholder: true },
];

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
          {TABS.map(t => (
            <button
              key={t.key}
              className={`admin-tab ${tab === t.key ? "active" : ""}`}
              onClick={() => setParams({ tab: t.key })}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16, marginRight: 4 }}>{t.icon}</span>
              {t.label}
              {t.placeholder && <span className="ldb-pill" style={{ marginLeft: 6, fontSize: 10 }}>예정</span>}
            </button>
          ))}
        </div>
        {tab === "questions" && <AdminDuelQuestionsPage wrap={false} />}
        {tab === "matches" && <AdminDuelMatchesPage wrap={false} />}
        {tab === "seasons" && <AdminSeasonsPage wrap={false} />}
        {tab === "rules" && <AdminDuelRulesPage wrap={false} />}
        {tab === "theme" && (
          <div className="admin-detail-card" style={{ padding: 32, textAlign: "center", color: "#666" }}>
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: "#ccc" }}>groups</span>
            <h2 style={{ marginTop: 8 }}>테마 대결 (Phase 3 예정)</h2>
            <p>특정 기관에서 등록한 문제로, 그 기관 학생들끼리만 대결.<br />씨앗 X · 기관 관리자도 접근 가능.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminDuelPage;
