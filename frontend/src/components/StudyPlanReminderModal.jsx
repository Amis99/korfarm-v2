import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../utils/api";
import "../styles/study-plan.css";

const STORAGE_KEY = "sp_reminder_dismissed";

const ASSET_TYPE_LABEL = {
  korfarm: "국어농장",
  activity: "학습활동",
  test: "테스트",
};

export default function StudyPlanReminderModal() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // N-9 (2026-05-21) — recentlyAssignedCount > 0 이면 dismiss 무시하고 강제 노출
    const dismissed = localStorage.getItem(STORAGE_KEY);
    const dismissedRecently = dismissed &&
      Date.now() - Number(dismissed) < 24 * 60 * 60 * 1000;
    apiGet("/v1/study-plans/summary")
      .then((data) => {
        if (!data || data.activePlans <= 0) return;
        const forceShow = (data.recentlyAssignedCount || 0) > 0;
        if (dismissedRecently && !forceShow) return;
        setSummary(data);
        setShow(true);
        if (data.upcomingItems) {
          setUpcoming(data.upcomingItems.slice(0, 3));
        }
      })
      .catch(() => {});

    // 임박 스케줄 별도 조회
    apiGet("/v1/study-plans/upcoming")
      .then((items) => {
        if (Array.isArray(items) && items.length > 0) {
          setUpcoming(items.slice(0, 3));
        }
      })
      .catch(() => {});
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
    setShow(false);
  };

  if (!show || !summary) return null;

  const formatDate = (d) => {
    if (!d) return "";
    const date = new Date(d);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${month}/${day}`;
  };

  return (
    <div className="sp-reminder-overlay" onClick={dismiss}>
      <div className="sp-reminder-card" onClick={(e) => e.stopPropagation()}>
        <span className="material-symbols-outlined" style={{ fontSize: 48, color: "#ff7f2a" }}>
          event_note
        </span>
        <h2>학습 계획표 알림</h2>
        <p>진행 중인 학습 계획표가 {summary.activePlans}건 있습니다.</p>
        {/* N-9 — 24h 내 신규 배정 강조 */}
        {summary.recentlyAssignedCount > 0 && (
          <p style={{
            background: "rgba(255,127,42,0.12)",
            color: "#c0392b",
            padding: "8px 12px",
            borderRadius: 8,
            fontWeight: 700,
            margin: "8px 0"
          }}>
            ✨ 새로 배정된 학습 <strong>{summary.recentlyAssignedCount}건</strong> — 확인해 주세요!
          </p>
        )}
        {summary.totalPending > 0 && (
          <p>미수행 할일: <strong>{summary.totalPending}건</strong></p>
        )}

        {/* 임박 활동 상세 */}
        {upcoming.length > 0 && (
          <div className="sp-reminder-upcoming">
            <div className="sp-reminder-upcoming-title">📌 임박한 활동</div>
            {upcoming.map((item, i) => (
              <div key={i} className="sp-reminder-upcoming-item">
                <span className="sp-reminder-upcoming-type">
                  {ASSET_TYPE_LABEL[item.assetType] || item.assetType}
                </span>
                <span className="sp-reminder-upcoming-label">{item.label || item.title || "활동"}</span>
                {item.scheduledDate && (
                  <span className="sp-reminder-upcoming-date">{formatDate(item.scheduledDate)}</span>
                )}
                {item.dueDate && (
                  <span className="sp-reminder-upcoming-date">~{formatDate(item.dueDate)}</span>
                )}
              </div>
            ))}
          </div>
        )}

        {summary.totalUnassigned > 0 && (
          <p style={{ color: "#999", fontSize: 13 }}>미배정 항목: {summary.totalUnassigned}건</p>
        )}
        <div className="sp-reminder-actions">
          <button className="sp-reminder-go" onClick={() => { setShow(false); navigate("/study-plan"); }}>
            학습 계획표 보기
          </button>
          <button className="sp-reminder-dismiss" onClick={dismiss}>
            24시간 동안 보지 않기
          </button>
        </div>
      </div>
    </div>
  );
}
