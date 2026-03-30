import { useState, useMemo } from "react";

/**
 * 월간 캘린더 히트맵 컴포넌트 (컴팩트 + 모달)
 * props:
 *   calendar: Array<{ date: string, totalCount: number, activities: [{typeLabel, count}], averageAccuracy: number? }>
 *   startDate: string (yyyy-MM-dd)
 *   endDate: string (yyyy-MM-dd)
 */
export default function ReportCalendar({ calendar, startDate, endDate }) {
  const calendarMap = useMemo(() => {
    const map = {};
    if (calendar) {
      calendar.forEach((entry) => {
        map[entry.date] = entry;
      });
    }
    return map;
  }, [calendar]);

  const initialDate = startDate ? new Date(startDate) : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth());

  // 모달용 상태
  const [modalDate, setModalDate] = useState(null);

  const today = new Date().toISOString().slice(0, 10);

  const goPrev = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goNext = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const weeks = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const startDow = firstDay.getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const cells = [];

    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();
    for (let i = startDow - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const m = viewMonth === 0 ? 11 : viewMonth - 1;
      const y = viewMonth === 0 ? viewYear - 1 : viewYear;
      cells.push({
        day: d,
        dateStr: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        outside: true,
      });
    }

    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        day: d,
        dateStr: `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        outside: false,
      });
    }

    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      const m = viewMonth === 11 ? 0 : viewMonth + 1;
      const y = viewMonth === 11 ? viewYear + 1 : viewYear;
      cells.push({
        day: d,
        dateStr: `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        outside: true,
      });
    }

    return cells;
  }, [viewYear, viewMonth]);

  const getBgColor = (count) => {
    if (!count || count === 0) return "transparent";
    if (count <= 2) return "rgba(240,108,36,0.15)";
    if (count <= 5) return "rgba(240,108,36,0.35)";
    return "rgba(240,108,36,0.6)";
  };

  const monthLabel = `${viewYear}년 ${viewMonth + 1}월`;
  const dayHeaders = ["일", "월", "화", "수", "목", "금", "토"];

  const modalEntry = modalDate ? calendarMap[modalDate] : null;

  return (
    <div className="ur-calendar-wrap">
      <h3>학습 캘린더</h3>
      <div className="ur-cal-nav">
        <button onClick={goPrev}>&lt;</button>
        <span>{monthLabel}</span>
        <button onClick={goNext}>&gt;</button>
      </div>
      <div className="ur-cal-header">
        {dayHeaders.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>
      <div className="ur-cal-grid">
        {weeks.map((cell, idx) => {
          const entry = calendarMap[cell.dateStr];
          const count = entry?.totalCount || 0;
          const accuracy = entry?.averageAccuracy;
          const hasActivity = count > 0;
          const isToday = cell.dateStr === today;

          const classes = [
            "ur-cal-day ur-cal-day--compact",
            cell.outside ? "outside" : "",
            hasActivity ? "has-activity" : "",
            isToday ? "today" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <div
              key={idx}
              className={classes}
              style={{ background: cell.outside ? "transparent" : getBgColor(count) }}
              onClick={() => {
                if (hasActivity && !cell.outside) {
                  setModalDate(cell.dateStr);
                }
              }}
            >
              <span className="ur-cal-day-num">{cell.day}</span>
              {hasActivity && !cell.outside && (
                <span className="ur-cal-day-info">
                  {count}건
                  {accuracy != null && <br />}
                  {accuracy != null && `${Math.round(accuracy)}%`}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* 모달 */}
      {modalEntry && (
        <div className="ur-cal-modal-overlay" onClick={() => setModalDate(null)}>
          <div className="ur-cal-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ur-cal-modal-header">
              <strong>{modalDate} 활동 ({modalEntry.totalCount}건)</strong>
              <button onClick={() => setModalDate(null)}>&times;</button>
            </div>
            {modalEntry.averageAccuracy != null && (
              <div className="ur-cal-modal-accuracy">
                평균 정답률: {Math.round(modalEntry.averageAccuracy)}%
              </div>
            )}
            <div className="ur-cal-modal-body">
              {modalEntry.activities?.map((act, i) => (
                <div key={i} className="ur-cal-detail-item">
                  <span>{act.typeLabel}</span>
                  <span>{act.count}건</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
