import { useMemo, useState } from "react";
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
 * 역량별 시계열 변화 추이 차트.
 * props:
 *   trend: [{ date: "yyyy-MM-dd", competency: string, ratioScore: 0~100 }]
 *
 * 사용자가 기본 1~3개 역량 토글로 보기 (전체 10개는 가독성 떨어짐).
 */

const PALETTE = [
  "#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6",
  "#1abc9c", "#e67e22", "#34495e", "#16a085", "#c0392b",
];

export default function ReportCompetencyTrendChart({ trend }) {
  const allCompetencies = useMemo(() => {
    const set = new Set();
    (trend || []).forEach((t) => set.add(t.competency));
    return Array.from(set);
  }, [trend]);

  const allDates = useMemo(() => {
    const set = new Set();
    (trend || []).forEach((t) => set.add(t.date));
    return Array.from(set).sort();
  }, [trend]);

  // 기본: 첫 3개 역량 선택 (가독성)
  const [selected, setSelected] = useState(() => new Set(allCompetencies.slice(0, 3)));

  // selected 가 빈 set 이면 첫 3개 자동 추가 (allCompetencies 가 늦게 도착하는 경우)
  const effectiveSelected = useMemo(() => {
    if (selected.size > 0) return selected;
    return new Set(allCompetencies.slice(0, 3));
  }, [selected, allCompetencies]);

  const datasets = useMemo(() => {
    return allCompetencies
      .filter((c) => effectiveSelected.has(c))
      .map((c, idx) => {
        const colorIdx = allCompetencies.indexOf(c) % PALETTE.length;
        const color = PALETTE[colorIdx];
        const data = allDates.map((d) => {
          const point = (trend || []).find((t) => t.date === d && t.competency === c);
          return point ? Math.round(point.ratioScore * 10) / 10 : null;
        });
        return {
          label: c,
          data,
          borderColor: color,
          backgroundColor: color + "20",
          spanGaps: true,
          tension: 0.3,
          pointRadius: 3,
        };
      });
  }, [allCompetencies, allDates, effectiveSelected, trend]);

  const data = { labels: allDates, datasets };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: "nearest", intersect: false },
    scales: {
      y: { beginAtZero: true, max: 100, ticks: { stepSize: 20, color: "#888" } },
      x: { ticks: { color: "#888", maxRotation: 0, autoSkip: true, maxTicksLimit: 10 } },
    },
    plugins: {
      legend: { display: true, position: "bottom", labels: { font: { size: 11 } } },
    },
  };

  if (!trend || trend.length === 0) {
    return (
      <div className="ur-card ur-trend-chart">
        <h3>역량별 변화 추이</h3>
        <div className="ur-empty" style={{ padding: 20 }}>
          기간 내 학습 누적 데이터가 없습니다.
        </div>
      </div>
    );
  }

  const toggle = (c) => {
    const next = new Set(effectiveSelected);
    if (next.has(c)) next.delete(c);
    else next.add(c);
    setSelected(next);
  };

  return (
    <div className="ur-card ur-trend-chart">
      <div className="ur-trend-head">
        <h3>역량별 변화 추이</h3>
        <span className="ur-muted" style={{ fontSize: 12 }}>일자별 가중 평균 — 표시할 역량 토글</span>
      </div>
      <div className="ur-trend-toggles">
        {allCompetencies.map((c, i) => {
          const colorIdx = i % PALETTE.length;
          const on = effectiveSelected.has(c);
          return (
            <button
              key={c}
              type="button"
              className={`ur-trend-toggle ${on ? "on" : ""}`}
              onClick={() => toggle(c)}
              style={on ? { borderColor: PALETTE[colorIdx], color: PALETTE[colorIdx] } : undefined}
              title={c}
            >
              <span className="ur-trend-dot" style={{ background: PALETTE[colorIdx] }} />
              {c}
            </button>
          );
        })}
      </div>
      <div className="ur-trend-canvas" style={{ height: 240 }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
}
