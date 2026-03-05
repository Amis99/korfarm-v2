import { Radar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
} from "chart.js";

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip);

function CompetencyRadarChart({ scores, averageScores }) {
  if (!scores || Object.keys(scores).length < 3) return null;

  const keys = Object.keys(scores);
  const labels = keys.map(k => k.length > 8 ? k.slice(0, 7) + "…" : k);
  const values = Object.values(scores);

  const datasets = [
    {
      label: "내 점수",
      data: values,
      backgroundColor: "rgba(107, 91, 83, 0.15)",
      borderColor: "#6b5b53",
      borderWidth: 2,
      pointBackgroundColor: "#6b5b53",
      pointRadius: 3,
    },
    // 50점 기준선
    {
      label: "기준선 (50점)",
      data: keys.map(() => 50),
      backgroundColor: "transparent",
      borderColor: "rgba(200, 200, 200, 0.6)",
      borderWidth: 1,
      borderDash: [4, 4],
      pointRadius: 0,
      fill: false,
    },
  ];

  // 전체 평균 오버레이
  if (averageScores && Object.keys(averageScores).length > 0) {
    const avgValues = keys.map(k => averageScores[k]?.average ?? 50);
    datasets.splice(1, 0, {
      label: "전체 평균",
      data: avgValues,
      backgroundColor: "rgba(33, 150, 243, 0.08)",
      borderColor: "rgba(33, 150, 243, 0.5)",
      borderWidth: 1.5,
      borderDash: [6, 3],
      pointBackgroundColor: "rgba(33, 150, 243, 0.5)",
      pointRadius: 2,
    });
  }

  const data = { labels, datasets };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: { stepSize: 20, font: { size: 10 }, backdropColor: "transparent" },
        pointLabels: { font: { size: 11 } },
        grid: { color: "#e0d6ce" },
        angleLines: { color: "#e0d6ce" },
      },
    },
    plugins: {
      legend: { display: averageScores ? true : false, position: "bottom", labels: { font: { size: 11 } } },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const fullLabel = keys[ctx.dataIndex];
            return `${ctx.dataset.label} - ${fullLabel}: ${ctx.raw.toFixed(1)}`;
          },
        },
      },
    },
  };

  return <Radar data={data} options={options} />;
}

export default CompetencyRadarChart;
