import { useMemo } from "react";

function ResultSummary({ summary, onExit }) {
  const accuracy = useMemo(() => {
    if (!summary.total) return 0;
    return Math.round((summary.correct / summary.total) * 100);
  }, [summary]);

  return (
    <div className="result-overlay">
      <div className="result-card">
        <h2>{summary.success ? "학습 완료" : "학습 종료"}</h2>
        <div className="result-grid">
          <div>
            <span>정답</span>
            <strong>{summary.correct}</strong>
          </div>
          <div>
            <span>오답</span>
            <strong>{summary.wrong}</strong>
          </div>
          <div>
            <span>정확도</span>
            <strong>{accuracy}%</strong>
          </div>
          <div>
            <span>소요 시간</span>
            <strong>{summary.timeSpent}s</strong>
          </div>
          <div>
            <span>남은 씨앗</span>
            <strong>{summary.seed}</strong>
          </div>
          <div>
            <span>획득 씨앗</span>
            <strong>{summary.earnedSeed}</strong>
          </div>
        </div>
        <div className="result-actions">
          <button type="button" onClick={onExit}>
            나가기
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResultSummary;
