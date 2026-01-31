import { useMemo } from "react";

const formatDuration = (seconds) => {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
};

function ResultSummary({ summary, onExit }) {
  const accuracy = useMemo(() => {
    if (!summary.total) return 0;
    return Math.round((summary.correct / summary.total) * 100);
  }, [summary]);
  const solved = summary.progressSolved ?? summary.total ?? 0;
  const total = summary.progressTotal ?? summary.total ?? 0;
  const earnedSeed = summary.earnedSeed ?? 0;
  const seedIcons = Array.from({ length: Math.min(earnedSeed, 12) }, (_, idx) => (
    <span key={`seed-${idx}`} className="seed-icon" />
  ));

  return (
    <div className="result-overlay">
      <div className="result-card">
        <div className="result-top" aria-hidden="true" />
        <div className="result-content">
          <div className="result-grid">
            <div>
              <span>진행도</span>
              <strong>{solved}/{total}</strong>
            </div>
            <div>
              <span>정답 수</span>
              <strong>{summary.correct}</strong>
            </div>
            <div>
              <span>오답 수</span>
              <strong>{summary.wrong}</strong>
            </div>
            <div>
              <span>정확도</span>
              <strong>{accuracy}%</strong>
            </div>
            <div>
              <span>소요 시간</span>
              <strong>{formatDuration(summary.timeSpent)}</strong>
            </div>
            <div>
              <span>획득 씨앗</span>
              <div className="result-seeds">
                {seedIcons.length ? seedIcons : <span className="result-seed-empty">-</span>}
              </div>
              <strong>{earnedSeed}</strong>
            </div>
          </div>
          <div className="result-actions">
            <button type="button" onClick={onExit}>
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultSummary;
