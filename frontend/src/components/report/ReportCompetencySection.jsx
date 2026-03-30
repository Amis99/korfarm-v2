export default function ReportCompetencySection({ competencyStats }) {
  if (!competencyStats || competencyStats.length === 0) return null;

  return (
    <div className="ur-competency-section">
      <h3>역량 분석</h3>
      <table>
        <thead>
          <tr>
            <th>역량</th>
            <th>정답률</th>
            <th>등급</th>
            <th>정답</th>
          </tr>
        </thead>
        <tbody>
          {competencyStats.map((cs) => (
            <tr key={cs.competencyKey}>
              <td style={{ fontWeight: 600 }}>{cs.competencyLabel}</td>
              <td>
                <div className="ur-score-bar-wrap">
                  <div
                    className="ur-score-bar"
                    style={{ width: `${Math.min(100, cs.accuracy)}%`, background: barColor(cs.grade) }}
                  />
                  <span className="ur-score-bar-text">{cs.accuracy?.toFixed(1)}%</span>
                </div>
              </td>
              <td>
                <span className={`ur-grade-badge ur-grade-${cs.grade}`}>{cs.grade}</span>
              </td>
              <td style={{ fontSize: 12, color: "#666" }}>{cs.correct}/{cs.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function barColor(grade) {
  switch (grade) {
    case "A": return "#2563eb";
    case "B": return "#16a34a";
    case "C": return "#f59e0b";
    case "D": return "#ea580c";
    default: return "#dc2626";
  }
}
