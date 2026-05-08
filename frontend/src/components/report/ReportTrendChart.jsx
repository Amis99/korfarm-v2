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

const SECTION_COLORS = {
  examOmr: { border: "#2563eb", bg: "rgba(37, 99, 235, 0.15)" },
  farmMode: { border: "#4caf50", bg: "rgba(76, 175, 80, 0.15)" },
  dailyQuiz: { border: "#2196f3", bg: "rgba(33, 150, 243, 0.15)" },
  dailyReading: { border: "#9c27b0", bg: "rgba(156, 39, 176, 0.15)" },
  proMode: { border: "#ff9800", bg: "rgba(255, 152, 0, 0.15)" },
};

const SECTION_LABELS = {
  examOmr: "시험 OMR",
  farmMode: "농장 모드",
  dailyQuiz: "일일 퀴즈",
  dailyReading: "일일 독해",
  proMode: "프로 모드",
};

export default function ReportTrendChart({ trend }) {
  if (!trend || trend.length === 0) {
    return (
      <div className="ur-trend-wrap">
        <h3>학습 추이</h3>
        <p style={{ color: "#888", fontSize: 13, textAlign: "center" }}>데이터가 없습니다.</p>
      </div>
    );
  }

  const labels = trend.map((t) => t.date?.slice(5) || "");

  const datasets = Object.entries(SECTION_COLORS).map(([key, color]) => ({
    label: SECTION_LABELS[key],
    data: trend.map((t) => t[key]),
    borderColor: color.border,
    backgroundColor: color.bg,
    tension: 0.3,
    spanGaps: true,
    pointRadius: 3,
    borderWidth: 2,
  }));

  const data = { labels, datasets };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "index", intersect: false },
    scales: {
      x: {
        ticks: { color: "#888", font: { size: 10 } },
        grid: { color: "rgba(0, 0, 0, 0.08)" },
      },
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { color: "#888", stepSize: 20, font: { size: 10 } },
        grid: { color: "rgba(0, 0, 0, 0.08)" },
      },
    },
    plugins: {
      legend: {
        labels: { color: "#333", font: { size: 11 }, usePointStyle: true, pointStyle: "circle" },
      },
    },
  };

  return (
    <div className="ur-trend-wrap">
      <h3>학습 추이</h3>
      <div style={{ position: "relative", height: 240 }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
