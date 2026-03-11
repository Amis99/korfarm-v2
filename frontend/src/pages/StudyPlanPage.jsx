import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../utils/api";
import StudyPlanMatrix from "../components/StudyPlanMatrix";
import StudyPlanCalendar from "../components/StudyPlanCalendar";
import "../styles/study-plan.css";

export default function StudyPlanPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [planDetail, setPlanDetail] = useState(null);
  const [matrix, setMatrix] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [tab, setTab] = useState("matrix");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/v1/study-plans")
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setPlans(list);
        if (list.length > 0) setSelectedPlanId(list[0].planId);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedPlanId) return;
    const plan = plans.find((p) => p.planId === selectedPlanId);
    setPlanDetail(plan);

    apiGet(`/v1/study-plans/${selectedPlanId}/matrix`)
      .then(setMatrix)
      .catch(() => setMatrix(null));

    apiGet(`/v1/study-plans/${selectedPlanId}/calendar`)
      .then((data) => setSchedules(Array.isArray(data) ? data : []))
      .catch(() => setSchedules([]));
  }, [selectedPlanId]);

  const handleCellClick = (cell, scope, asset) => {
    if (!cell) return;
    const aType = asset?.assetType || cell?.assetType;
    const aKind = asset?.assetKind || cell?.assetKind;
    const refId = asset?.refId || cell?.refId;

    if (aType === "korfarm" && refId) {
      navigate(`/learning/${refId}`);
    } else if (aKind === "test" && refId) {
      navigate(`/tests/${refId}/omr`);
    } else if (cell.status === "pending" || cell.status === "rejected") {
      navigate(`/study-plan/submit/${cell.cellId}`);
    }
  };

  if (loading) {
    return <div className="sp-page"><div className="asp-loading">불러오는 중...</div></div>;
  }

  if (plans.length === 0) {
    return (
      <div className="sp-page">
        <div className="asp-empty">
          <span className="material-symbols-outlined">event_note</span>
          <p>배정된 학습 계획표가 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sp-page">
      <div className="sp-header">
        <h1>
          <span className="material-symbols-outlined">event_note</span>
          시험 공부
        </h1>
        {plans.length > 1 && (
          <div className="sp-plan-select">
            <select value={selectedPlanId || ""} onChange={(e) => setSelectedPlanId(e.target.value)}>
              {plans.map((p) => (
                <option key={p.planId} value={p.planId}>{p.title}</option>
              ))}
            </select>
          </div>
        )}
        {planDetail?.examScope && (
          <div className="sp-exam-scope">{planDetail.examScope}</div>
        )}
      </div>

      <div className="sp-tabs">
        <button className={`sp-tab ${tab === "matrix" ? "active" : ""}`} onClick={() => setTab("matrix")}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>grid_on</span>
          할일 목록
        </button>
        <button className={`sp-tab ${tab === "calendar" ? "active" : ""}`} onClick={() => setTab("calendar")}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>calendar_month</span>
          캘린더
        </button>
      </div>

      {tab === "matrix" && matrix && (
        <StudyPlanMatrix
          scopes={matrix.scopes}
          assets={matrix.assets}
          cells={matrix.cells}
          onCellClick={handleCellClick}
        />
      )}

      {tab === "calendar" && (
        <StudyPlanCalendar
          schedules={schedules}
          startDate={planDetail?.startDate}
          endDate={planDetail?.endDate}
        />
      )}
    </div>
  );
}
