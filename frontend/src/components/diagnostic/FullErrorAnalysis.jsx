import ErrorPathChart from "./ErrorPathChart";

function FullErrorAnalysis({ analysis }) {
  if (!analysis || analysis.length === 0) return null;

  const getGradeClass = (score) => {
    if (score >= 65) return "high";
    if (score >= 40) return "mid";
    return "low";
  };

  return (
    <div className="diag-report-section">
      <h2>오류 경로 종합 분석</h2>
      <p className="section-subtitle">10대 역량 전체의 주요 오류 패턴입니다.</p>
      <div className="full-error-list">
        {analysis.map((b) => (
          <div key={b.competency} className="bottleneck-card">
            <div className="comp-name">
              {b.competency}
              <span className={`grade-badge ${getGradeClass(b.score)}`} style={{ marginLeft: 8 }}>
                {b.score.toFixed(1)}점
              </span>
            </div>
            {b.topErrorPaths.length > 0 ? (
              <ErrorPathChart paths={b.topErrorPaths} />
            ) : (
              <div className="no-error">오류 없음</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default FullErrorAnalysis;
