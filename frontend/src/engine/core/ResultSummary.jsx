import { useMemo, useState, useEffect, useRef, useCallback } from "react";

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

const formatDuration = (seconds) => {
  const safe = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
};

const SEED_DISPLAY = {
  seed_wheat: { name: "밀", color: "#e8b84b", gradient: ["%23ffd27f", "%23e8a020"], stroke: "%23c48a18" },
  seed_rice:  { name: "쌀", color: "#d4d4c0", gradient: ["%23f0efe4", "%23c8c4a8"], stroke: "%23a8a488" },
  seed_corn:  { name: "옥수수", color: "#f5c542", gradient: ["%23ffe066", "%23e8b020"], stroke: "%23c49518" },
  seed_grape: { name: "포도", color: "#9b6bb0", gradient: ["%23d4b8e8", "%238a50a8"], stroke: "%236a3888" },
  seed_apple: { name: "사과", color: "#e85050", gradient: ["%23ff7070", "%23d03030"], stroke: "%23a82020" },
};

function seedSvgUrl(seedType) {
  const info = SEED_DISPLAY[seedType];
  if (!info) return null;
  return `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 28'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='${info.gradient[0]}'/><stop offset='1' stop-color='${info.gradient[1]}'/></linearGradient></defs><ellipse cx='20' cy='14' rx='18' ry='10' fill='url(%23g)' stroke='${info.stroke}' stroke-width='2'/></svg>")`;
}

function ResultSummary({ summary, onExit, moduleKey, onPrint }) {
  // 학습용 모듈만 인쇄 (study_content/answer_key는 인쇄 비대상)
  const showPrintBtn = moduleKey !== "study_content" && moduleKey !== "answer_key";
  const handlePrintClick = onPrint || (() => window.print());
  const cardRef = useRef(null);
  const dragState = useRef(null);
  const [position, setPosition] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const accuracy = useMemo(() => {
    if (!summary.total) return 0;
    return Math.round((summary.correct / summary.total) * 100);
  }, [summary]);
  const summaryAccuracy = summary.accuracy ?? accuracy;
  const solved = summary.progressSolved ?? summary.total ?? 0;
  const total = summary.progressTotal || summary.total || 0;
  const earnedSeed = summary.earnedSeed ?? 0;
  const timeLimit = summary.timeLimit ?? 0;
  const progressPercent = total ? Math.min(100, Math.round((solved / total) * 100)) : 0;
  const correctPercent = total ? Math.min(100, Math.round((summary.correct / total) * 100)) : 0;
  const wrongPercent = total ? Math.min(100, Math.round((summary.wrong / total) * 100)) : 0;
  const accuracyPercent = Math.min(100, Math.max(0, summaryAccuracy));
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

  const handleDragStart = useCallback((event) => {
    const card = cardRef.current;
    if (!card) return;
    event.preventDefault();
    const overlay = card.parentElement;
    const overlayRect = overlay.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const offsetX = event.clientX - cardRect.left;
    const offsetY = event.clientY - cardRect.top;
    dragState.current = {
      overlayLeft: overlayRect.left,
      overlayTop: overlayRect.top,
      overlayWidth: overlayRect.width,
      overlayHeight: overlayRect.height,
      cardWidth: cardRect.width,
      cardHeight: cardRect.height,
      offsetX,
      offsetY,
    };
    if (!position) {
      setPosition({
        x: cardRect.left - overlayRect.left,
        y: cardRect.top - overlayRect.top,
      });
    }
    setIsDragging(true);
  }, [position]);

  useEffect(() => {
    if (!isDragging) return undefined;
    const handleMove = (event) => {
      if (!dragState.current) return;
      const {
        overlayLeft, overlayTop,
        overlayWidth, overlayHeight,
        cardWidth, cardHeight,
        offsetX, offsetY,
      } = dragState.current;
      const maxX = Math.max(0, overlayWidth - cardWidth);
      const maxY = Math.max(0, overlayHeight - cardHeight);
      const nextX = clamp(event.clientX - overlayLeft - offsetX, 0, maxX);
      const nextY = clamp(event.clientY - overlayTop - offsetY, 0, maxY);
      setPosition({ x: nextX, y: nextY });
    };
    const handleUp = () => {
      dragState.current = null;
      setIsDragging(false);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [isDragging]);

  const cardStyle = position
    ? { position: "absolute", left: position.x, top: position.y, cursor: isDragging ? "grabbing" : "grab" }
    : { cursor: "grab" };

  return (
    <div className="result-overlay">
      <div
        ref={cardRef}
        className={resultClass}
        style={cardStyle}
      >
        <div className="result-drag-handle" onPointerDown={handleDragStart}>
          <span className="result-drag-hint">⠿</span>
        </div>
        {showPrintBtn && (
          <button
            type="button"
            className="result-print"
            onClick={handlePrintClick}
          >
            학습지 인쇄
          </button>
        )}
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
