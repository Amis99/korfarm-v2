import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler);

/**
 * 시험별 점수 추이 라인 차트
 * - 최고/최저 영역 밴드 + 평균 점선 + 내 점수 실선
 * @param {{ history: Array<{ testTitle: string, score: number, totalPoints: number, avgScore?: number, maxScore?: number, minScore?: number }> }} props
 */
export default function ScoreTrendChart({ history }) {
  if (!history || history.length < 1) return null;

  // 시간순 (오래된 것부터)
  const sorted = [...history].reverse();
  const labels = sorted.map((h, i) => h.testTitle?.length > 10 ? h.testTitle.slice(0, 10) + "…" : h.testTitle || `시험${i + 1}`);

  const maxTotal = Math.max(...sorted.map(h => h.totalPoints || 100));

  const data = {
    labels,
    datasets: [
      {
        label: "최고점",
        data: sorted.map(h => h.maxScore ?? h.score),
        borderColor: "rgba(34,197,94,0.4)",
        backgroundColor: "rgba(34,197,94,0.1)",
        borderWidth: 1,
        borderDash: [4, 4],
        pointRadius: 0,
        tension: 0.3,
        fill: "+1",
        order: 4,
      },
      {
        label: "최저점",
        data: sorted.map(h => h.minScore ?? h.score),
        borderColor: "rgba(239,68,68,0.4)",
        backgroundColor: "transparent",
        borderWidth: 1,
        borderDash: [4, 4],
        pointRadius: 0,
        tension: 0.3,
        fill: false,
        order: 3,
      },
      {
        label: "평균",
        data: sorted.map(h => h.avgScore ?? h.score),
        borderColor: "#f59e0b",
        backgroundColor: "transparent",
        borderWidth: 1.5,
        borderDash: [6, 3],
        pointRadius: 2,
        pointBackgroundColor: "#f59e0b",
        pointBorderColor: "#fff",
        pointBorderWidth: 1,
        tension: 0.3,
        fill: false,
        order: 2,
      },
      {
        label: "내 점수",
        data: sorted.map(h => h.score),
        borderColor: "#2563eb",
        backgroundColor: "rgba(37,99,235,0.08)",
        borderWidth: 2.5,
        pointRadius: 5,
        pointBackgroundColor: "#2563eb",
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
        tension: 0.3,
        fill: false,
        order: 1,
      },
    ],
  };

  // 5개 이상이면 가로 스크롤
  const scrollable = sorted.length >= 5;
  const chartWidth = scrollable ? Math.max(sorted.length * 120, 600) : undefined;

  const options = {
    responsive: !scrollable,
    maintainAspectRatio: !scrollable,
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
        title: { display: true, text: "점수", color: "#374151", font: { size: 12, weight: "600" } },
        ticks: { color: "#6b7280", font: { size: 10 } },
        grid: { color: "rgba(0,0,0,0.04)" },
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
          filter: (item) => item.text !== "최고점" && item.text !== "최저점",
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed.y;
            if (val == null) return null;
            if (ctx.dataset.label === "평균") return `평균: ${val}점`;
            if (ctx.dataset.label === "내 점수") return `내 점수: ${val}점`;
            if (ctx.dataset.label === "최고점") return `최고: ${val}점`;
            if (ctx.dataset.label === "최저점") return `최저: ${val}점`;
            return `${ctx.dataset.label}: ${val}`;
          },
          afterBody: (items) => {
            if (items.length > 0) {
              const h = sorted[items[0].dataIndex];
              return `(만점 ${h.totalPoints})`;
            }
            return "";
          },
        },
      },
      filler: {
        propagate: false,
      },
    },
  };

  return (
    <div className="ts-chart-wrap">
      <h3 className="ts-chart-title">점수 추이</h3>
      {scrollable ? (
        <div style={{ overflowX: "auto", overflowY: "hidden", WebkitOverflowScrolling: "touch" }}>
          <div style={{ width: chartWidth, height: 280 }}>
            <Line data={data} options={options} width={chartWidth} height={280} />
          </div>
        </div>
      ) : (
        <Line data={data} options={options} />
      )}
    </div>
  );
}
