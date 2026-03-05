function PassageAnalysisSection({ analysis }) {
  if (!analysis || analysis.length === 0) return null;

  const getAccColor = (rate) => {
    if (rate >= 70) return "#4caf50";
    if (rate >= 50) return "#ff9800";
    return "#ef5350";
  };

  return (
    <div className="diag-report-section">
      <h2>지문별 성적</h2>
      <div className="passage-analysis-list">
        {analysis.map((p) => (
          <div key={p.passageId} className="passage-card">
            <div className="passage-card-header">
              <span className="passage-genre-badge">{p.genre}</span>
              <span className="passage-level">Lv.{p.level}</span>
              <span className="passage-accuracy" style={{ color: getAccColor(p.accuracyRate) }}>
                {p.accuracyRate.toFixed(0)}%
              </span>
              <span className="passage-count">{p.correctCount}/{p.totalQuestions}</span>
            </div>
            <div className="passage-preview">{p.preview}</div>
            <div className="passage-bar">
              <div
                className="passage-bar-fill"
                style={{ width: `${p.accuracyRate}%`, background: getAccColor(p.accuracyRate) }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PassageAnalysisSection;
