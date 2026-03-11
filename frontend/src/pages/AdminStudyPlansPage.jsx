import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../utils/api";
import AdminLayout from "../components/AdminLayout";
import StudyPlanCreateForm from "../components/StudyPlanCreateForm";
import "../styles/admin-study-plan.css";

export default function AdminStudyPlansPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  const load = () => {
    setLoading(true);
    apiGet("/v1/admin/study-plans")
      .then((data) => setPlans(Array.isArray(data) ? data : []))
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  return (
    <AdminLayout>
      <div className="asp-header">
        <h1>
          <span className="material-symbols-outlined">event_note</span>
          학습 계획표
        </h1>
        <button className="asp-create-btn" onClick={() => setShowCreate(true)}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          새 계획표
        </button>
      </div>

      {loading ? (
        <div className="asp-loading">불러오는 중...</div>
      ) : plans.length === 0 ? (
        <div className="asp-empty">
          <span className="material-symbols-outlined">event_note</span>
          <p>등록된 학습 계획표가 없습니다.</p>
        </div>
      ) : (
        <table className="asp-table">
          <thead>
            <tr>
              <th>제목</th>
              <th>기간</th>
              <th>대상</th>
              <th>상태</th>
              <th>생성일</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.planId} onClick={() => navigate(`/admin/study-plans/${p.planId}`)}>
                <td>{p.title}</td>
                <td>{p.startDate} ~ {p.endDate}</td>
                <td>{p.targetCount}건</td>
                <td>
                  <span className={`asp-status ${p.status}`}>
                    {p.status === "active" ? "진행중" : "보관"}
                  </span>
                </td>
                <td>{p.createdAt?.split("T")[0]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showCreate && (
        <StudyPlanCreateForm
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load(); }}
        />
      )}
    </AdminLayout>
  );
}
