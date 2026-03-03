import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

/**
 * 시험별 점수 추이 라인 차트 (점수 좌축 + 정답률 우축)
 * @param {{ history: Array<{ testTitle: string, score: number, totalPoints: number, accuracy: number }> }} props
 */
export default function ScoreTrendChart({ history }) {
  if (!history || history.length < 2) return null;

  // 시간순 (오래된 것부터)
  const sorted = [...history].reverse();
  const labels = sorted.map((h, i) => h.testTitle?.length > 10 ? h.testTitle.slice(0, 10) + "…" : h.testTitle || `시험${i + 1}`);

  const maxTotal = Math.max(...sorted.map(h => h.totalPoints || 100));

  const data = {
    labels,
    datasets: [
      {
        label: "점수",
        data: sorted.map(h => h.score),
        borderColor: "#f07f1a",
        backgroundColor: "rgba(240,127,26,0.12)",
        tension: 0.3,
        pointRadius: 5,
        pointBackgroundColor: "#f07f1a",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        borderWidth: 2.5,
        fill: true,
        yAxisID: "y",
      },
      {
        label: "정답률(%)",
        data: sorted.map(h => h.accuracy),
        borderColor: "#3b82f6",
        backgroundColor: "rgba(59,130,246,0.08)",
        tension: 0.3,
        pointRadius: 4,
        pointBackgroundColor: "#3b82f6",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        borderWidth: 2,
        borderDash: [6, 3],
        fill: false,
        yAxisID: "y1",
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    interaction: { mode: "index", intersect: false },
    scales: {
      x: {
        ticks: { color: "#9ca3af", font: { size: 11 }, maxRotation: 30 },
        grid: { color: "rgba(0,0,0,0.04)" },
      },
      y: {
        type: "linear",
        position: "left",
        beginAtZero: true,
        max: maxTotal,
        title: { display: true, text: "점수", color: "#f07f1a", font: { size: 12, weight: "600" } },
        ticks: { color: "#f07f1a", font: { size: 10 } },
        grid: { color: "rgba(0,0,0,0.04)" },
      },
      y1: {
        type: "linear",
        position: "right",
        beginAtZero: true,
        max: 100,
        title: { display: true, text: "정답률(%)", color: "#3b82f6", font: { size: 12, weight: "600" } },
        ticks: { color: "#3b82f6", stepSize: 20, font: { size: 10 } },
        grid: { drawOnChartArea: false },
      },
    },
    plugins: {
      legend: {
        labels: {
          color: "#374151",
          font: { size: 12 },
          usePointStyle: true,
          pointStyle: "circle",
          padding: 16,
        },
      },
      tooltip: {
        callbacks: {
          afterLabel: (ctx) => {
            if (ctx.datasetIndex === 0) {
              const h = sorted[ctx.dataIndex];
              return `(만점 ${h.totalPoints})`;
            }
            return "";
          },
        },
      },
    },
  };

  return (
    <div className="ts-chart-wrap">
      <h3 className="ts-chart-title">점수 추이</h3>
      <Line data={data} options={options} />
    </div>
  );
}
