function ReportSummaryCards({ report }) {
  const cards = [
    { label: "TCI (종합 역량)", value: report.adjustedTci?.toFixed(1), unit: "점" },
    { label: "정답률", value: report.accuracyRate?.toFixed(1) ?? ((report.correctCount / report.answeredCount * 100).toFixed(1)), unit: "%" },
    { label: "응답 문항수", value: report.answeredCount, unit: "문항" },
    { label: "신뢰도", value: ((report.confidence ?? 0) * 100).toFixed(0), unit: "%" },
    { label: "추천 레벨", value: report.recommendedLevel?.label ?? "-", unit: "" },
  ];

  if (report.percentiles?.tciPercentile != null) {
    cards.push({ label: "TCI 백분위", value: `상위 ${(100 - report.percentiles.tciPercentile).toFixed(1)}`, unit: "%" });
  }

  return (
    <div className="report-summary-cards">
      {cards.map((c, i) => (
        <div key={i} className="summary-card">
          <div className="summary-card-label">{c.label}</div>
          <div className="summary-card-value">
            {c.value}<span className="summary-card-unit">{c.unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ReportSummaryCards;
