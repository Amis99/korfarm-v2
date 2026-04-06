function ReportSummaryCards({ report }) {
  const total = report.totalQuestions ?? 48;
  const incomplete = report.answeredCount < total;
  // 점수: correct / 48 × 100 (미응답을 오답으로 가산)
  const score = ((report.correctCount / total) * 100).toFixed(1);
  // 정답률: correct / answered × 100 (응답한 문항 대비)
  const accuracy = report.answeredCount > 0
    ? ((report.correctCount / report.answeredCount) * 100).toFixed(1)
    : "0.0";

  const cards = [
    { label: "점수", value: score, unit: "점", note: `정답 ${report.correctCount} / ${total}` },
    { label: "정답률", value: accuracy, unit: "%", note: `응답 ${report.answeredCount}문항` },
    { label: "추천 레벨", value: report.recommendedLevel?.label ?? "-", unit: "" },
  ];

  // 미완료 응시일 때만 TCI 카드 노출 (다 푼 경우 점수와 동일)
  if (incomplete && report.adjustedTci != null) {
    cards.splice(2, 0, {
      label: "TCI (미완료 보정)",
      value: report.adjustedTci.toFixed(1),
      unit: "점",
      note: `${total}문항 기준`,
    });
  }

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
