import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";
import { getDomainColors } from "./domainColors";

ChartJS.register(ArcElement, Tooltip, Legend);

/**
 * 영역별 득점 비율 도넛 차트
 * @param {{ domainScores: Record<string, { score: number, maxScore: number }> }} props
 */
export default function DomainDoughnutChart({ domainScores }) {
  const entries = Object.entries(domainScores || {});
  if (entries.length < 2) return null;

  const labels = entries.map(([d]) => d);
  const scores = entries.map(([, ds]) => ds.score);
  const colors = getDomainColors(labels);

  const data = {
    labels,
    datasets: [
      {
        data: scores,
        backgroundColor: colors.map(c => c.bg),
        borderColor: colors.map(c => c.main),
        borderWidth: 2,
        hoverOffset: 6,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: "55%",
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          color: "#374151",
          font: { size: 12 },
          usePointStyle: true,
          pointStyle: "circle",
          padding: 12,
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const ds = entries[ctx.dataIndex][1];
            return ` ${ctx.label}: ${ds.score}/${ds.maxScore}점`;
          },
        },
      },
    },
  };

  return (
    <div className="ts-chart-wrap">
      <h3 className="ts-chart-title">영역별 득점 비율</h3>
      <Doughnut data={data} options={options} />
    </div>
  );
}
