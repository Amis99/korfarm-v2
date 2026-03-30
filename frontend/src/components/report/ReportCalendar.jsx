import { useState, useMemo } from "react";

/**
 * 월간 캘린더 히트맵 컴포넌트
 * props:
 *   calendar: Array<{ date: string, totalCount: number, activities: [{typeLabel, count}] }>
 *   startDate: string (yyyy-MM-dd)
 *   endDate: string (yyyy-MM-dd)
 */
export default function ReportCalendar({ calendar, startDate, endDate }) {
  // 날짜별 데이터 맵 구성
  const calendarMap = useMemo(() => {
    const map = {};
    if (calendar) {
      calendar.forEach((entry) => {
        map[entry.date] = entry;
      });
    }
    return map;
  }, [calendar]);

  // 현재 표시 월 (startDate 기준 초기화)
  const initialDate = startDate ? new Date(startDate) : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth()); // 0-based

  // 선택된 날짜
  const [selectedDate, setSelectedDate] = useState(null);

  const today = new Date().toISOString().slice(0, 10);

  // 이전/다음 월
  const goPrev = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
    setSelectedDate(null);
  };

  const goNext = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
    setSelectedDate(null);
  };

  // 6주 그리드 계산
  const weeks = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    const startDow = firstDay.getDay(); // 0=일
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const cells = [];

    // 이전 달 채우기
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

    // 현재 달
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        day: d,
        dateStr: `${viewYear}-${String(viewMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
        outside: false,
      });
    }

    // 다음 달 채우기 (6주 = 42칸)
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

  // 활동량에 따른 배경색
  const getBgColor = (count) => {
    if (!count || count === 0) return "transparent";
    if (count <= 2) return "rgba(240,108,36,0.15)";
    if (count <= 5) return "rgba(240,108,36,0.35)";
    return "rgba(240,108,36,0.6)";
  };

  const monthLabel = `${viewYear}년 ${viewMonth + 1}월`;
  const dayHeaders = ["일", "월", "화", "수", "목", "금", "토"];

  // 선택된 날짜의 활동 정보
  const selectedEntry = selectedDate ? calendarMap[selectedDate] : null;

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
          const hasActivity = count > 0;
          const isToday = cell.dateStr === today;
          const isSelected = cell.dateStr === selectedDate;

          const classes = [
            "ur-cal-day",
            cell.outside ? "outside" : "",
            hasActivity ? "has-activity" : "",
            isToday ? "today" : "",
            isSelected ? "selected" : "",
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
                  setSelectedDate(isSelected ? null : cell.dateStr);
                }
              }}
            >
              <span>{cell.day}</span>
              {hasActivity && !cell.outside && (
                <span className="ur-cal-day-count">{count}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* 선택된 날짜의 활동 상세 */}
      {selectedEntry && (
        <div className="ur-cal-detail">
          <strong>{selectedDate} 활동 ({selectedEntry.totalCount}건)</strong>
          {selectedEntry.activities?.map((act, i) => (
            <div key={i} className="ur-cal-detail-item">
              <span>{act.typeLabel}</span>
              <span>{act.count}건</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
