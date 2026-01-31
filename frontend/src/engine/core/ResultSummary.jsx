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
  const timeLimit = summary.timeLimit ?? 0;
  const progressPercent = total ? Math.min(100, Math.round((solved / total) * 100)) : 0;
  const correctPercent = total ? Math.min(100, Math.round((summary.correct / total) * 100)) : 0;
  const wrongPercent = total ? Math.min(100, Math.round((summary.wrong / total) * 100)) : 0;
  const accuracyPercent = Math.min(100, Math.max(0, accuracy));
  const timePercent = timeLimit
    ? Math.min(100, Math.round((summary.timeSpent / timeLimit) * 100))
    : 0;
  const seedIcons = Array.from({ length: Math.min(earnedSeed, 12) }, (_, idx) => (
    <span key={`seed-${idx}`} className="seed-icon" />
  ));

  return (
    <div className="result-overlay">
      <div className="result-card">
        <div className="result-top" aria-hidden="true" />
        <div className="result-content">
          <div className="result-grid">
            <div className="result-row">
              <span>진행도</span>
              <div className="result-bar" aria-label={`${solved}/${total}`}>
                <div className="result-bar-fill" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
            <div className="result-row">
              <span>정답 수</span>
              <div className="result-bar" aria-label={`${summary.correct}`}>
                <div className="result-bar-fill correct" style={{ width: `${correctPercent}%` }} />
              </div>
            </div>
            <div className="result-row">
              <span>오답 수</span>
              <div className="result-bar" aria-label={`${summary.wrong}`}>
                <div className="result-bar-fill wrong" style={{ width: `${wrongPercent}%` }} />
              </div>
            </div>
            <div className="result-row">
              <span>정확도</span>
              <div className="result-bar" aria-label={`${accuracyPercent}%`}>
                <div className="result-bar-fill" style={{ width: `${accuracyPercent}%` }} />
              </div>
            </div>
            <div className="result-row">
              <span>소요 시간</span>
              <div className="result-bar" aria-label={formatDuration(summary.timeSpent)}>
                <div className="result-bar-fill time" style={{ width: `${timePercent}%` }} />
              </div>
            </div>
            <div className="result-row">
              <span>획득 씨앗</span>
              <div className="result-seeds" aria-label={`${earnedSeed}`}>
                {seedIcons.length ? seedIcons : <span className="result-seed-empty">-</span>}
              </div>
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
