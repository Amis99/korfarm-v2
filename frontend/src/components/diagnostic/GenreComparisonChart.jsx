import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

function GenreComparisonChart({ analysis }) {
  if (!analysis || analysis.length === 0) return null;

  const labels = analysis.map((a) => a.genre);
  const values = analysis.map((a) => a.accuracyRate);

  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: ["#6b5b53", "#a09588", "#c4b8ae", "#e0d6ce"],
        borderRadius: 4,
        barThickness: 40,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { min: 0, max: 100, ticks: { callback: (v) => v + "%" } },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const item = analysis[ctx.dataIndex];
            return `${item.genre}: ${item.accuracyRate.toFixed(1)}% (${item.correctCount}/${item.totalCount})`;
          },
        },
      },
    },
  };

  return (
    <div className="diag-report-section">
      <h2>장르별 정답률</h2>
      <div style={{ height: 200 }}>
        <Bar data={data} options={options} />
      </div>
      <div className="genre-cards">
        {analysis.map((a) => (
          <div key={a.genre} className="genre-card">
            <div className="genre-card-name">{a.genre}</div>
            <div className="genre-card-rate">{a.accuracyRate.toFixed(1)}%</div>
            <div className="genre-card-count">{a.correctCount}/{a.totalCount}문항</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default GenreComparisonChart;
