import { useMemo } from "react";
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

/**
 * 10대 역량 레이더 차트 전용
 * props: competencyRadarData ({ labels: string[], scores: number[] })
 */
export default function ReportRadarChart({ competencyRadarData }) {
  if (!competencyRadarData) return null;

  const data = {
    labels: competencyRadarData.labels,
    datasets: [
      {
        label: "역량별 성취도",
        data: competencyRadarData.scores,
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

  // 강점/약점 계산
  const { strength, weakness } = useMemo(() => {
    const labels = competencyRadarData.labels || [];
    const scores = competencyRadarData.scores || [];
    if (labels.length === 0) return { strength: null, weakness: null };

    let maxIdx = 0;
    let minIdx = -1;
    let minScore = Infinity;

    for (let i = 0; i < scores.length; i++) {
      if (scores[i] > scores[maxIdx]) maxIdx = i;
      // 약점: 0이 아닌 것 중 가장 낮은 점수
      if (scores[i] > 0 && scores[i] < minScore) {
        minScore = scores[i];
        minIdx = i;
      }
    }

    return {
      strength: labels[maxIdx] ? { label: labels[maxIdx], score: scores[maxIdx] } : null,
      weakness: minIdx >= 0 ? { label: labels[minIdx], score: scores[minIdx] } : null,
    };
  }, [competencyRadarData]);

  return (
    <div className="ur-radar-wrap">
      <h3>역량별 성취도</h3>
      <Radar data={data} options={options} />
      <div className="ur-strength-weak">
        {strength && (
          <span className="ur-strength">
            강점: {strength.label} ({strength.score}%)
          </span>
        )}
        {weakness && (
          <span className="ur-weakness">
            약점: {weakness.label} ({weakness.score}%)
          </span>
        )}
      </div>
    </div>
  );
}
