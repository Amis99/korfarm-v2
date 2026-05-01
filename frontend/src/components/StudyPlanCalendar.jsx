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

  // 이벤트 맵 — cellId 별 가장 최신 단계 이벤트만 유지 (중복 제거)
  const STATUS_PRIORITY = {
    assigned: 1, in_progress: 1,
    submitted: 2, scored: 2, retry: 2, partial: 2,
    completed: 3, reviewed: 3, passed: 3,
  };
  const dedupedByCell = new Map();
  (events || []).forEach((ev) => {
    if (!ev.cellId) {
      // cellId 없는 이벤트는 그대로 유지
      const key = `${ev.eventDate}-${ev.id}`;
      dedupedByCell.set(key, ev);
      return;
    }
    const cur = dedupedByCell.get(ev.cellId);
    const np = STATUS_PRIORITY[ev.eventType] || 0;
    const cp = cur ? STATUS_PRIORITY[cur.eventType] || 0 : -1;
    if (np >= cp) dedupedByCell.set(ev.cellId, ev);
  });
  const eventMap = {};
  for (const ev of dedupedByCell.values()) {
    if (!eventMap[ev.eventDate]) eventMap[ev.eventDate] = [];
    eventMap[ev.eventDate].push(ev);
  }
  const isDoneEvent = (ev) =>
    ev.eventType === "completed" || ev.eventType === "reviewed" || ev.eventType === "passed";

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
          const hasEvents = dayEvents.length > 0 || scheds.length > 0;
          // 진행률: 셀 이벤트 기준 (completed / total)
          const total = dayEvents.length;
          const done = dayEvents.filter(isDoneEvent).length;
          const pct = total > 0 ? Math.round((done * 100) / total) : 0;
          const fillColor = pct >= 100 ? "#2e7d32" : pct >= 50 ? "#f57c00" : "#9e9e9e";
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
              </div>
              {/* 진행률 게이지 — 액션이 있는 날만 노출 */}
              {total > 0 && (
                <div style={{ marginTop: "auto", paddingTop: 4 }}>
                  <div style={{
                    height: 8,
                    background: "rgba(0,0,0,0.06)",
                    borderRadius: 3,
                    overflow: "hidden",
                    border: "1px solid rgba(0,0,0,0.12)",
                  }}>
                    <div style={{
                      width: `${pct}%`,
                      height: "100%",
                      background: fillColor,
                      transition: "width 0.3s",
                    }} />
                  </div>
                  <div style={{
                    fontSize: 10,
                    color: "#7b6a62",
                    marginTop: 2,
                    display: "flex",
                    justifyContent: "space-between",
                  }}>
                    <span>{total}건</span>
                    <span>{done}/{total}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
