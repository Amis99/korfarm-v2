import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { apiGet } from "../utils/api";
import StudyPlanMatrix from "../components/StudyPlanMatrix";
import StudyPlanCalendar from "../components/StudyPlanCalendar";
import CalendarEventModal from "../components/CalendarEventModal";
import "../styles/study-plan.css";

export default function ParentStudyPlanPage() {
  const { studentId } = useParams();
  const [plans, setPlans] = useState([]);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [planDetail, setPlanDetail] = useState(null);
  const [matrix, setMatrix] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [eventModal, setEventModal] = useState(null);
  const [tab, setTab] = useState("matrix");
  const [loading, setLoading] = useState(true);
  const [studentName, setStudentName] = useState("");

  const base = `/v1/parents/children/${studentId}/study-plans`;

  useEffect(() => {
    apiGet(`/v1/parents/children/${studentId}/profile`)
      .then((data) => setStudentName(data?.name || ""))
      .catch(() => {});

    apiGet(base)
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setPlans(list);
        if (list.length > 0) setSelectedPlanId(list[0].planId);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [studentId]);

  const loadCalendarEvents = useCallback((month) => {
    if (!selectedPlanId) return;
    const ym = month || (() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    })();
    apiGet(`${base}/${selectedPlanId}/calendar/events?month=${ym}`)
      .then((data) => setCalendarEvents(Array.isArray(data) ? data : []))
      .catch(() => setCalendarEvents([]));
  }, [selectedPlanId, base]);

  useEffect(() => {
    if (!selectedPlanId) return;
    const plan = plans.find((p) => p.planId === selectedPlanId);
    setPlanDetail(plan);

    apiGet(`${base}/${selectedPlanId}/matrix`)
      .then(setMatrix)
      .catch(() => setMatrix(null));

    apiGet(`${base}/${selectedPlanId}/calendar`)
      .then((data) => setSchedules(Array.isArray(data) ? data : []))
      .catch(() => setSchedules([]));

    loadCalendarEvents();
  }, [selectedPlanId]);

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
          {studentName ? `${studentName}의 학습 계획표` : "학습 계획표"}
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
          학습 현황
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
        />
      )}

      {tab === "calendar" && (
        <StudyPlanCalendar
          schedules={schedules}
          startDate={planDetail?.startDate}
          endDate={planDetail?.endDate}
          events={calendarEvents}
          onMonthChange={loadCalendarEvents}
          onDateClick={(date, evts) => setEventModal({ date, events: evts })}
        />
      )}

      {eventModal && (
        <CalendarEventModal
          date={eventModal.date}
          events={eventModal.events}
          onClose={() => setEventModal(null)}
        />
      )}
    </div>
  );
}
