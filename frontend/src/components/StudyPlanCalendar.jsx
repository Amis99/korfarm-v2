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

export default function StudyPlanCalendar({ schedules, startDate, endDate, admin, events, cells, assets, onMonthChange, onDateClick }) {
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

  // ─ 캘린더 데이터 소스 우선순위 ─
  // 1) cells (가장 정확) — assigned~dueAt 범위 매일 active, status 기반 진행률
  // 2) events (fallback)
  const dayActions = {}; // date -> [{ cellId, label, status, isDone }]
  const isDoneStatus = (s) =>
    s === "completed" || s === "reviewed" || s === "passed";

  if (Array.isArray(cells) && cells.length > 0) {
    const assetMap = {};
    (assets || []).forEach((a) => { assetMap[a.id] = a; });
    cells.forEach((c) => {
      if (c.status === "unassigned" || !c.dueAt) return;
      const due = new Date(String(c.dueAt).slice(0, 10) + "T00:00:00");
      // 배정일 — 백엔드가 cell.updated_at 기반 assignedAt 제공.
      // 안 오면 due 당일만 표시 (이전 7일 fallback 은 잘못된 미션 배포 표시 야기)
      const start = c.assignedAt
        ? new Date(String(c.assignedAt).slice(0, 10) + "T00:00:00")
        : due;
      // start 가 due 보다 늦으면 (재배정 후 due 가 더 빠른 경우 등) due 로 보정
      if (start > due) start.setTime(due.getTime());
      // 범위 매일에 추가
      for (let t = new Date(start); t <= due; t.setDate(t.getDate() + 1)) {
        const ds = fmt(t);
        if (!dayActions[ds]) dayActions[ds] = [];
        const asset = assetMap[c.assetId];
        dayActions[ds].push({
          cellId: c.cellId,
          label: c.assignedLabel || asset?.label || "액션",
          status: c.status,
          isDone: isDoneStatus(c.status),
        });
      }
    });
  } else if (Array.isArray(events)) {
    // fallback: events 기반 (cellId 별 dedup)
    const STATUS_PRIORITY = {
      assigned: 1, in_progress: 1,
      submitted: 2, scored: 2, retry: 2, partial: 2,
      completed: 3, reviewed: 3, passed: 3,
    };
    const dedupedByCell = new Map();
    events.forEach((ev) => {
      if (!ev.cellId) return;
      const cur = dedupedByCell.get(ev.cellId);
      const np = STATUS_PRIORITY[ev.eventType] || 0;
      const cp = cur ? STATUS_PRIORITY[cur.eventType] || 0 : -1;
      if (np >= cp) dedupedByCell.set(ev.cellId, ev);
    });
    for (const ev of dedupedByCell.values()) {
      const ds = ev.eventDate;
      if (!dayActions[ds]) dayActions[ds] = [];
      dayActions[ds].push({
        cellId: ev.cellId,
        label: ev.refLabel || "액션",
        status: ev.eventType,
        isDone: isDoneStatus(ev.eventType),
      });
    }
  }

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
          const acts = dayActions[ds] || [];
          const hasEvents = acts.length > 0 || scheds.length > 0;
          // 진행률: 셀 이벤트 기준 (완료/총)
          const total = acts.length;
          const done = acts.filter((a) => a.isDone).length;
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
                if (hasEvents && onDateClick) onDateClick(ds, acts);
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
