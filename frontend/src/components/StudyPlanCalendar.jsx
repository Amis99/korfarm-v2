import { useState } from "react";
import "../styles/study-plan.css";

const DAY_NAMES = ["일", "월", "화", "수", "목", "금", "토"];

function getMonthDays(year, month) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const days = [];
  const startDow = first.getDay();

  // 이전 달 빈칸
  for (let i = 0; i < startDow; i++) {
    const d = new Date(year, month, -startDow + i + 1);
    days.push({ date: d, otherMonth: true });
  }
  // 이번 달
  for (let i = 1; i <= last.getDate(); i++) {
    days.push({ date: new Date(year, month, i), otherMonth: false });
  }
  // 뒤쪽 빈칸 (6주 기준)
  while (days.length < 42) {
    const d = new Date(year, month + 1, days.length - last.getDate() - startDow + 1);
    days.push({ date: d, otherMonth: true });
  }
  return days;
}

function fmt(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

export default function StudyPlanCalendar({ schedules, startDate, endDate, admin, events, onMonthChange, onDateClick }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const days = getMonthDays(viewYear, viewMonth);
  const scheduleMap = {};
  (schedules || []).forEach((s) => {
    if (!scheduleMap[s.scheduledDate]) scheduleMap[s.scheduledDate] = [];
    scheduleMap[s.scheduledDate].push(s);
  });

  const rangeStart = startDate ? new Date(startDate + "T00:00:00") : null;
  const rangeEnd = endDate ? new Date(endDate + "T00:00:00") : null;

  // 이벤트 맵
  const eventMap = {};
  (events || []).forEach((ev) => {
    if (!eventMap[ev.eventDate]) eventMap[ev.eventDate] = [];
    eventMap[ev.eventDate].push(ev);
  });

  const changeMonth = (y, m) => {
    setViewYear(y);
    setViewMonth(m);
    if (onMonthChange) {
      const ym = `${y}-${String(m + 1).padStart(2, "0")}`;
      onMonthChange(ym);
    }
  };

  const prev = () => {
    if (viewMonth === 0) changeMonth(viewYear - 1, 11);
    else changeMonth(viewYear, viewMonth - 1);
  };
  const next = () => {
    if (viewMonth === 11) changeMonth(viewYear + 1, 0);
    else changeMonth(viewYear, viewMonth + 1);
  };

  return (
    <div className={`sp-calendar${admin ? " admin-theme" : ""}`}>
      <div className="sp-cal-header">
        <div className="sp-cal-nav">
          <button type="button" onClick={prev}>&lt;</button>
        </div>
        <h3>{viewYear}년 {viewMonth + 1}월</h3>
        <div className="sp-cal-nav">
          <button type="button" onClick={next}>&gt;</button>
        </div>
      </div>
      <div className="sp-cal-grid">
        {DAY_NAMES.map((n) => (
          <div key={n} className="sp-cal-day-name">{n}</div>
        ))}
        {days.map((d, i) => {
          const ds = fmt(d.date);
          const isToday = ds === fmt(today);
          const inRange = rangeStart && rangeEnd && d.date >= rangeStart && d.date <= rangeEnd;
          const scheds = scheduleMap[ds] || [];
          const dayEvents = eventMap[ds] || [];
          const hasEvents = dayEvents.length > 0;
          const cls = [
            "sp-cal-day",
            d.otherMonth && "other-month",
            isToday && "today",
            inRange && "in-range",
            hasEvents && "has-events",
          ].filter(Boolean).join(" ");

          return (
            <div
              key={i}
              className={cls}
              onClick={() => {
                if (hasEvents && onDateClick) onDateClick(ds, dayEvents);
              }}
              style={hasEvents ? { cursor: "pointer" } : undefined}
            >
              <div className="sp-cal-day-num">
                {d.date.getDate()}
                {hasEvents && <span className="sp-cal-event-dot" />}
              </div>
              {scheds.slice(0, 2).map((ev) => (
                <span key={ev.id} className="sp-cal-event" title={ev.memo || ""}>
                  {ev.label || "일정"}
                </span>
              ))}
              {scheds.length > 2 && (
                <span className="sp-cal-event">+{scheds.length - 2}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
