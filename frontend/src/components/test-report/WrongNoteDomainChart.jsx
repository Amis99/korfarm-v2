import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { getDomainColors } from "./domainColors";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

/**
 * 영역별 오답 분포 가로 막대 차트
 * @param {{ domainGroups: Record<string, number> }} props — { "문법": 3, "문학": 2, ... }
 */
export default function WrongNoteDomainChart({ domainGroups }) {
  const entries = Object.entries(domainGroups || {});
  if (entries.length === 0) return null;

  // 오답 수 내림차순 정렬
  entries.sort((a, b) => b[1] - a[1]);

  const labels = entries.map(([d]) => d);
  const counts = entries.map(([, c]) => c);
  const colors = getDomainColors(labels);

  const data = {
    labels,
    datasets: [
      {
        label: "오답 수",
        data: counts,
        backgroundColor: colors.map(c => c.bg),
        borderColor: colors.map(c => c.main),
        borderWidth: 2,
        borderRadius: 4,
        barThickness: 28,
      },
    ],
  };

  const options = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          color: "#9ca3af",
          font: { size: 11 },
        },
        grid: { color: "rgba(0,0,0,0.04)" },
      },
      y: {
        ticks: {
          color: "#374151",
          font: { size: 12, weight: "600" },
        },
        grid: { display: false },
      },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => ` ${ctx.parsed.x}문항`,
        },
      },
    },
  };

  const height = Math.max(entries.length * 48, 120);

  return (
    <div className="ts-chart-wrap">
      <h3 className="ts-chart-title">영역별 오답 분포</h3>
      <div style={{ height }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}
