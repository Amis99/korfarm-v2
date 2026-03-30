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

ChartJS.register(RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

export default function ReportRadarChart({ radarData, competencyRadarData }) {
  if (!radarData && !competencyRadarData) return null;

  const activeData = competencyRadarData || radarData;
  const chartLabel = competencyRadarData ? "역량별 성취도" : "영역별 성취도";
  const titleLabel = competencyRadarData ? "역량별 성취도" : "영역별 성취도";

  const data = {
    labels: activeData.labels,
    datasets: [
      {
        label: chartLabel,
        data: activeData.scores,
        backgroundColor: "rgba(240, 108, 36, 0.2)",
        borderColor: "rgba(240, 108, 36, 0.8)",
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: "rgba(240, 108, 36, 1)",
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
          color: "#888",
          backdropColor: "transparent",
          font: { size: 10 },
        },
        grid: { color: "rgba(0, 0, 0, 0.1)" },
        angleLines: { color: "rgba(0, 0, 0, 0.1)" },
        pointLabels: { color: "#333", font: { size: 12, weight: "bold" } },
      },
    },
    plugins: {
      legend: { display: false },
    },
  };

  return (
    <div className="ur-radar-wrap">
      <h3>{titleLabel}</h3>
      <Radar data={data} options={options} />
    </div>
  );
}
