import "../styles/study-plan.css";

const EVENT_TYPE_MAP = {
  submitted: { label: "제출", icon: "upload", color: "#2196f3" },
  approved: { label: "승인", icon: "check_circle", color: "#4caf50" },
  rejected: { label: "반려", icon: "cancel", color: "#ef5350" },
  passed: { label: "합격", icon: "emoji_events", color: "#4caf50" },
  failed: { label: "불합격", icon: "close", color: "#ef5350" },
  retry: { label: "재시도", icon: "refresh", color: "#ff9800" },
};

export default function CalendarEventModal({ date, events, onClose }) {
  if (!events || events.length === 0) return null;

  return (
    <div className="sp-reminder-overlay" onClick={onClose}>
      <div className="sp-event-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sp-event-modal-header">
          <h3>{date}</h3>
          <button onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <ul className="sp-event-list">
          {events.map((ev) => {
            const info = EVENT_TYPE_MAP[ev.eventType] || {
              label: ev.eventType,
              icon: "event",
              color: "#999",
            };
            return (
              <li key={ev.id} className="sp-event-item">
                <span
                  className="material-symbols-outlined sp-event-icon"
                  style={{ color: info.color }}
                >
                  {info.icon}
                </span>
                <div className="sp-event-detail">
                  <span className="sp-event-type" style={{ color: info.color }}>
                    {info.label}
                  </span>
                  {ev.refLabel && (
                    <span className="sp-event-ref">{ev.refLabel}</span>
                  )}
                  {ev.memo && (
                    <span className="sp-event-memo">{ev.memo}</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
