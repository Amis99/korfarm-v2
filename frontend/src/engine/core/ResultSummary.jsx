import { useMemo } from "react";

const formatDuration = (seconds) => {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
};

const SEED_DISPLAY = {
  seed_wheat: { name: "밀", color: "#e8b84b", gradient: ["%23ffd27f", "%23e8a020"], stroke: "%23c48a18" },
  seed_oat:   { name: "귀리", color: "#c4a55a", gradient: ["%23e8d4a8", "%23b89840"], stroke: "%239a7a28" },
  seed_rice:  { name: "쌀", color: "#d4d4c0", gradient: ["%23f0efe4", "%23c8c4a8"], stroke: "%23a8a488" },
  seed_grape: { name: "포도", color: "#9b6bb0", gradient: ["%23d4b8e8", "%238a50a8"], stroke: "%236a3888" },
};

function seedSvgUrl(seedType) {
  const info = SEED_DISPLAY[seedType];
  if (!info) return null;
  return `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 28'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${info.gradient[0]}'/><stop offset='1' stop-color='${info.gradient[1]}'/></linearGradient></defs><ellipse cx='20' cy='14' rx='18' ry='10' fill='url(%23g)' stroke='${info.stroke}' stroke-width='2'/></svg>")`;
}

function ResultSummary({ summary, onExit }) {
  const accuracy = useMemo(() => {
    if (!summary.total) return 0;
    return Math.round((summary.correct / summary.total) * 100);
  }, [summary]);
  const summaryAccuracy = summary.accuracy ?? accuracy;
  const solved = summary.progressSolved ?? summary.total ?? 0;
  const total = summary.progressTotal ?? summary.total ?? 0;
  const earnedSeed = summary.earnedSeed ?? 0;
  const timeLimit = summary.timeLimit ?? 0;
  const progressPercent = total ? Math.min(100, Math.round((solved / total) * 100)) : 0;
  const correctPercent = total ? Math.min(100, Math.round((summary.correct / total) * 100)) : 0;
  const wrongPercent = total ? Math.min(100, Math.round((summary.wrong / total) * 100)) : 0;
  const accuracyPercent = Math.min(100, Math.max(0, summaryAccuracy));
  const timePercent = timeLimit
    ? Math.min(100, Math.round((summary.timeSpent / timeLimit) * 100))
    : 0;
  const clockSize = useMemo(() => {
    const min = 18;
    const max = 34;
    const seconds = Math.max(0, summary.timeSpent ?? 0);
    if (seconds <= 30) return min;
    if (seconds >= 60) return max;
    const ratio = (seconds - 30) / 30;
    return Math.round(min + (max - min) * ratio);
  }, [summary.timeSpent]);
  const seedType = summary.seedType || null;
  const seedInfo = SEED_DISPLAY[seedType] || null;
  const customSeedBg = seedType ? seedSvgUrl(seedType) : null;
  const seedIconStyle = customSeedBg ? { backgroundImage: customSeedBg } : {};
  const seedIcons = Array.from({ length: Math.min(earnedSeed, 12) }, (_, idx) => (
    <span key={`seed-${idx}`} className="seed-icon" style={seedIconStyle} />
  ));
  const seedLabel = seedInfo ? `${seedInfo.name} 씨앗` : "획득 씨앗";
  const progressLabel = total ? `${solved}/${total}` : "-";
  const accuracyClass =
    accuracyPercent === 100 ? "perfect" : accuracyPercent >= 70 ? "pass" : "fail";

  const isPerfect = earnedSeed > 0 && accuracyPercent === 100;
  const resultClass = isPerfect
    ? "result-card perfect"
    : earnedSeed > 0
      ? "result-card earned"
      : "result-card empty";

  return (
    <div className="result-overlay">
      <div className={resultClass}>
        <button type="button" className="result-close" onClick={onExit}>
          닫기
        </button>
        <div className="result-top" aria-hidden="true" />
        <div className="result-content">
          <div className="result-grid">
            <div className="result-row">
              <div className="result-row-label">
                <span>진행도</span>
                <span className="result-value">{progressLabel}</span>
              </div>
              <div className="result-bar" aria-label={progressLabel}>
                <div className="result-bar-fill" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
            <div className="result-row">
              <div className="result-row-label">
                <span>정답 수</span>
                <span className="result-value">{summary.correct}</span>
              </div>
              <div className="result-bar" aria-label={`${summary.correct}`}>
                <div className="result-bar-fill correct" style={{ width: `${correctPercent}%` }} />
              </div>
            </div>
            <div className="result-row">
              <div className="result-row-label">
                <span>오답 수</span>
                <span className="result-value">{summary.wrong}</span>
              </div>
              <div className="result-bar" aria-label={`${summary.wrong}`}>
                <div className="result-bar-fill wrong" style={{ width: `${wrongPercent}%` }} />
              </div>
            </div>
            <div className="result-row">
              <div className="result-row-label">
                <span>정확도</span>
                <span className="result-value">{accuracyPercent}%</span>
              </div>
              <div className="result-bar" aria-label={`${accuracyPercent}%`}>
                <div
                  className={`result-bar-fill ${accuracyClass}`}
                  style={{ width: `${accuracyPercent}%` }}
                />
              </div>
            </div>
            <div className="result-row">
              <div className="result-row-label">
                <span>소요 시간</span>
                <span className="result-value">{formatDuration(summary.timeSpent)}</span>
              </div>
              <div className="result-clock" aria-label={formatDuration(summary.timeSpent)} style={{ width: `${clockSize}px`, height: `${clockSize}px` }}>
                <span className="clock-hand hour" />
                <span className="clock-hand minute" />
              </div>
            </div>
            <div className="result-row">
              <div className="result-row-label">
                <span>{seedLabel}</span>
                {earnedSeed > 0 && <span className="result-value">{earnedSeed}개</span>}
              </div>
              <div className="result-seeds" aria-label={`${earnedSeed}`}>
                {seedIcons.length ? seedIcons : <span className="result-seed-empty">-</span>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResultSummary;
