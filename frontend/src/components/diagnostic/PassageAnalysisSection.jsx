// 지문 미리보기 정리 — 마크다운/HTML 태그 모두 제거 (짝 안 맞아도)
const cleanPreview = (s) => {
  if (!s) return "";
  return String(s)
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/?[a-zA-Z][^>]*>/g, "")     // 모든 HTML 태그
    .replace(/\*\*+/g, "")                  // ** 또는 그 이상 (bold 표시)
    .replace(/__+/g, "")                    // __ 또는 그 이상 (underline 표시)
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
};

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
            <div className="passage-preview">{cleanPreview(p.preview)}</div>
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
