import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../utils/api";
import "../styles/study-plan.css";

const STORAGE_KEY = "sp_reminder_dismissed";

export default function StudyPlanReminderModal() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed) {
      const ts = Number(dismissed);
      if (Date.now() - ts < 24 * 60 * 60 * 1000) return;
    }
    apiGet("/v1/study-plans/summary")
      .then((data) => {
        if (data && data.activePlans > 0) {
          setSummary(data);
          setShow(true);
        }
      })
      .catch(() => {});
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setShow(false);
  };

  if (!show || !summary) return null;

  return (
    <div className="sp-reminder-overlay" onClick={dismiss}>
      <div className="sp-reminder-card" onClick={(e) => e.stopPropagation()}>
        <span className="material-symbols-outlined" style={{ fontSize: 48, color: "#ff7f2a" }}>
          event_note
        </span>
        <h2>시험 공부 알림</h2>
        <p>진행 중인 학습 계획표가 {summary.activePlans}건 있습니다.</p>
        {summary.totalPending > 0 && <p>미수행 할일: {summary.totalPending}건</p>}
        {summary.totalUnassigned > 0 && (
          <p style={{ color: "#999" }}>미배정 항목: {summary.totalUnassigned}건</p>
        )}
        <div className="sp-reminder-actions">
          <button className="sp-reminder-go" onClick={() => { setShow(false); navigate("/study-plan"); }}>
            시험 공부 시작
          </button>
          <button className="sp-reminder-dismiss" onClick={dismiss}>
            24시간 동안 보지 않기
          </button>
        </div>
      </div>
    </div>
  );
}
