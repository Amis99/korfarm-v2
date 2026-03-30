export default function ReportSummaryCards({ summary }) {
  if (!summary) return null;
  const cards = [
    { label: "총 활동", value: summary.totalActivities, sub: "회" },
    { label: "평균 점수", value: summary.averageScore?.toFixed(1), sub: "점" },
    { label: "학습 일수", value: summary.totalStudyDays, sub: "일" },
    { label: "최강 역량", value: summary.bestCompetency || summary.bestSection || "-", sub: "" },
    { label: "최약 역량", value: summary.weakestCompetency || summary.weakestSection || "-", sub: "" },
  ];
  return (
    <div className="ur-summary-row">
      {cards.map((c) => (
        <div key={c.label} className="ur-summary-card">
          <div className="ur-card-label">{c.label}</div>
          <div className="ur-card-value">{c.value}</div>
          {c.sub && <div className="ur-card-sub">{c.sub}</div>}
        </div>
      ))}
    </div>
  );
}
