import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";
import { QUESTION_TYPE_LABELS } from "../../constants/questionBankCodes";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

function QuestionTypeChart({ analysis }) {
  if (!analysis || analysis.length === 0) return null;

  const labels = analysis.map((a) => a.questionType);
  const values = analysis.map((a) => a.accuracyRate);
  const colors = values.map((v) => {
    if (v >= 70) return "#4caf50";
    if (v >= 50) return "#ff9800";
    return "#ef5350";
  });

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors,
        borderRadius: 4,
        barThickness: 28,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { min: 0, max: 100, ticks: { callback: (v) => v + "%" } },
      x: { ticks: { font: { size: 11 } } },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `정답률: ${ctx.raw.toFixed(1)}%`,
        },
      },
    },
  };

  return (
    <div className="diag-report-section">
      <h2>문항 유형별 정답률</h2>
      <div style={{ height: 220 }}>
        <Bar data={data} options={options} />
      </div>
      <table className="type-stats-table">
        <thead>
          <tr>
            <th>유형</th>
            <th>문항수</th>
            <th>정답</th>
            <th>정답률</th>
          </tr>
        </thead>
        <tbody>
          {analysis.map((a) => {
            const fullLabel = QUESTION_TYPE_LABELS[a.questionType];
            return (
              <tr key={a.questionType}>
                <td>
                  <span style={{ fontWeight: 600 }}>{a.questionType}</span>
                  {fullLabel && (
                    <span style={{ marginLeft: 8, color: "#666", fontSize: "0.9em" }}>
                      {fullLabel}
                    </span>
                  )}
                </td>
                <td>{a.totalCount}</td>
                <td>{a.correctCount}</td>
                <td>{a.accuracyRate.toFixed(1)}%</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default QuestionTypeChart;
