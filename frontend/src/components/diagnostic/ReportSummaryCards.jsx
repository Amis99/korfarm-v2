function ReportSummaryCards({ report }) {
  const total = report.totalQuestions ?? 48;
  // 점수 — 벡터합 기준 raw_tci (2026-05-18). 큰 게이지(TCI) 값과 통일.
  const score = (report.rawTci ?? report.adjustedTci ?? 0).toFixed(1);
  // 정답률 — 정답 수 / 응답 수 × 100 (응답한 문항 대비)
  const accuracy = report.answeredCount > 0
    ? ((report.correctCount / report.answeredCount) * 100).toFixed(1)
    : "0.0";

  const cards = [
    { label: "점수", value: score, unit: "점", note: `정답 ${report.correctCount} / ${total}` },
    { label: "정답률", value: accuracy, unit: "%", note: `응답 ${report.answeredCount}문항` },
    { label: "추천 레벨", value: report.recommendedLevel?.label ?? "-", unit: "" },
  ];

  if (report.percentiles?.tciPercentile != null) {
    cards.push({
      label: "성적 백분위",
      value: `상위 ${report.percentiles.tciPercentile.toFixed(1)}`,
      unit: "%",
    });
  }

  return (
    <div className="report-summary-cards">
      {cards.map((c, i) => (
        <div key={i} className="summary-card">
          <div className="summary-card-label">{c.label}</div>
          <div className="summary-card-value">
            {c.value}<span className="summary-card-unit">{c.unit}</span>
          </div>
          {c.note && <div className="summary-card-note">{c.note}</div>}
        </div>
      ))}
    </div>
  );
}

export default ReportSummaryCards;
