import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import Toast from "../components/learning-db/Toast";
import LDBManuscriptTab from "../components/learning-db/LDBManuscriptTab";
import LDBExamTab from "../components/learning-db/LDBExamTab";
import LDBCommentaryTab from "../components/learning-db/LDBCommentaryTab";
import LDBQuestionBankTab from "../components/learning-db/LDBQuestionBankTab";
import "../styles/learning-db.css";
import "../styles/question-bank.css";

const TABS = [
  { key: "manuscripts", label: "교재 원고", icon: "auto_stories" },
  { key: "exams", label: "시험지", icon: "assignment" },
  { key: "commentary", label: "해설서", icon: "menu_book" },
  { key: "question-bank", label: "문제은행", icon: "quiz" },
];

function AdminLearningDBPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "manuscripts";
  const [toast, setToast] = useState(null);

  const handleTabChange = (key) => {
    setSearchParams({ tab: key });
  };

  return (
    <AdminLayout>
      <div className="ldb-page">
        {/* 탭 */}
        <div className="ldb-tabs">
          {TABS.map(t => (
            <button key={t.key}
              className={`ldb-tab ${activeTab === t.key ? "active" : ""}`}
              onClick={() => handleTabChange(t.key)}>
              <span className="material-symbols-outlined">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* 탭 내용 */}
        {activeTab === "manuscripts" && <LDBManuscriptTab setToast={setToast} />}
        {activeTab === "exams" && <LDBExamTab setToast={setToast} />}
        {activeTab === "commentary" && <LDBCommentaryTab setToast={setToast} />}
        {activeTab === "question-bank" && <LDBQuestionBankTab />}
      </div>

      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
    </AdminLayout>
  );
}

export default AdminLearningDBPage;
