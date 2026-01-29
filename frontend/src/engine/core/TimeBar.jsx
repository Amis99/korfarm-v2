function TimeBar({ timeLeft, timeLimit, className = "" }) {
  const ratio = timeLimit > 0 ? Math.max(0, Math.min(1, timeLeft / timeLimit)) : 0;
  return (
    <div
      className={`timebar ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={timeLimit}
    >
      <div className="timebar-track">
        <div className="timebar-fill" style={{ width: `${ratio * 100}%` }} />
      </div>
    </div>
  );
}

export default TimeBar;
