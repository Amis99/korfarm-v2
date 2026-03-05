import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

function CompetencyBarChart({ scores }) {
  if (!scores || Object.keys(scores).length === 0) return null;

  const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const labels = sorted.map(([k]) => k.length > 10 ? k.slice(0, 9) + "…" : k);
  const values = sorted.map(([, v]) => v);

  const colors = values.map(v => {
    if (v >= 65) return "#4caf50";
    if (v >= 40) return "#ff9800";
    return "#ef5350";
  });

  const data = {
    labels,
    datasets: [{
      data: values,
      backgroundColor: colors,
      borderRadius: 4,
      barThickness: 20,
    }],
  };

  const options = {
    indexAxis: "y",
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: { min: 0, max: 100, ticks: { stepSize: 20 } },
      y: { ticks: { font: { size: 11 } } },
    },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const fullLabel = sorted[ctx.dataIndex][0];
            return `${fullLabel}: ${ctx.raw.toFixed(1)}`;
          },
        },
      },
    },
  };

  return (
    <div style={{ height: Math.max(Object.keys(scores).length * 36, 200) }}>
      <Bar data={data} options={options} />
    </div>
  );
}

export default CompetencyBarChart;
