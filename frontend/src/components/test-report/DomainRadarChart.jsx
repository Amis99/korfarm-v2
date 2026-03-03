import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from "chart.js";
import { getDomainColors } from "./domainColors";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

/**
 * 영역별 정답률 레이더 차트
 * @param {{ domainScores: Record<string, { correct: number, total: number }> }} props
 */
export default function DomainRadarChart({ domainScores }) {
  const entries = Object.entries(domainScores || {});
  if (entries.length < 2) return null;

  const labels = entries.map(([d]) => d);
  const rates = entries.map(([, ds]) =>
    ds.total > 0 ? Math.round((ds.correct / ds.total) * 100) : 0
  );
  const colors = getDomainColors(labels);

  const data = {
    labels,
    datasets: [
      {
        label: "정답률",
        data: rates,
        backgroundColor: "rgba(240,127,26,0.20)",
        borderColor: "rgba(240,127,26,0.85)",
        borderWidth: 2,
        pointRadius: 5,
        pointBackgroundColor: colors.map(c => c.main),
        pointBorderColor: "#fff",
        pointBorderWidth: 1,
        fill: true,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: {
          stepSize: 20,
          color: "#9ca3af",
          backdropColor: "transparent",
          font: { size: 10 },
        },
        grid: { color: "rgba(0,0,0,0.06)" },
        angleLines: { color: "rgba(0,0,0,0.06)" },
        pointLabels: {
          color: "#374151",
          font: { size: 12, weight: "600" },
        },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => `정답률 ${ctx.parsed.r}%`,
        },
      },
    },
  };

  return (
    <div className="ts-chart-wrap">
      <h3 className="ts-chart-title">영역별 정답률</h3>
      <Radar data={data} options={options} />
    </div>
  );
}
