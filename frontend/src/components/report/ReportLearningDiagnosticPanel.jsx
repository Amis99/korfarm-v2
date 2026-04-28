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
 * 10대 역량 — 학습 누적 + 진단 측정 동시 표시 패널
 *
 * props:
 *   learningCompetency: { items:[{competency, ratioScore, sampleCount}], totalSamples, updatedAt, windowSize }
 *   diagnosticCompetency: { items:[{competency, score, touchCount}], tier, measuredAt } | null
 */
export default function ReportLearningDiagnosticPanel({ learningCompetency, diagnosticCompetency }) {
  if (!learningCompetency && !diagnosticCompetency) return null;

  const labels = useMemo(() => {
    if (learningCompetency?.items?.length) return learningCompetency.items.map((i) => i.competency);
    if (diagnosticCompetency?.items?.length) return diagnosticCompetency.items.map((i) => i.competency);
    return [];
  }, [learningCompetency, diagnosticCompetency]);

  const data = useMemo(() => {
    const datasets = [];
    if (learningCompetency?.items?.length) {
      datasets.push({
        label: "학습 누적 (최근 100건 가중평균)",
        data: learningCompetency.items.map((i) => Math.round(i.ratioScore * 10) / 10),
        backgroundColor: "rgba(240, 108, 36, 0.18)",
        borderColor: "rgba(240, 108, 36, 0.85)",
        borderWidth: 2,
        pointRadius: 4,
        pointBackgroundColor: "rgba(240, 108, 36, 1)",
      });
    }
    if (diagnosticCompetency?.items?.length) {
      datasets.push({
        label: "진단 측정값 (1회 응시)",
        data: diagnosticCompetency.items.map((i) => Math.round(i.score * 10) / 10),
        backgroundColor: "rgba(40, 130, 200, 0.10)",
        borderColor: "rgba(40, 130, 200, 0.75)",
        borderWidth: 2,
        borderDash: [6, 4],
        pointRadius: 3,
        pointBackgroundColor: "rgba(40, 130, 200, 1)",
      });
    }
    return { labels, datasets };
  }, [learningCompetency, diagnosticCompetency, labels]);

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: { stepSize: 20, color: "#888", backdropColor: "transparent", font: { size: 10 } },
        grid: { color: "rgba(0, 0, 0, 0.1)" },
        angleLines: { color: "rgba(0, 0, 0, 0.1)" },
        pointLabels: { color: "#333", font: { size: 11, weight: "bold" } },
      },
    },
    plugins: {
      legend: { display: true, position: "bottom", labels: { font: { size: 11 } } },
    },
  };

  const learningMap = useMemo(
    () => new Map((learningCompetency?.items || []).map((i) => [i.competency, i])),
    [learningCompetency],
  );
  const diagMap = useMemo(
    () => new Map((diagnosticCompetency?.items || []).map((i) => [i.competency, i])),
    [diagnosticCompetency],
  );

  return (
    <div className="ur-card ur-comp-panel">
      <div className="ur-comp-panel-head">
        <h3>10대 역량 — 학습 누적 vs 진단 측정</h3>
        <div className="ur-comp-panel-meta">
          {learningCompetency && (
            <span className="ur-comp-tag ur-tag-learning">
              학습 누적 — {learningCompetency.totalSamples}건 / 윈도우 {learningCompetency.windowSize}
            </span>
          )}
          {diagnosticCompetency && (
            <span className="ur-comp-tag ur-tag-diag">
              진단 — {diagnosticCompetency.tier || "?"} tier
              {diagnosticCompetency.measuredAt ? ` · ${diagnosticCompetency.measuredAt.slice(0, 10)}` : ""}
            </span>
          )}
        </div>
      </div>

      <div className="ur-comp-panel-body">
        <div className="ur-comp-radar">
          <Radar data={data} options={options} />
        </div>

        <div className="ur-comp-table-wrap">
          <table className="ur-comp-table">
            <thead>
              <tr>
                <th>역량</th>
                <th>학습 누적</th>
                <th>측정 횟수</th>
                <th>진단</th>
                <th>진단 측정수</th>
              </tr>
            </thead>
            <tbody>
              {labels.map((c) => {
                const l = learningMap.get(c);
                const d = diagMap.get(c);
                const lr = l ? Math.round(l.ratioScore * 10) / 10 : null;
                const ds = d ? Math.round(d.score * 10) / 10 : null;
                const diff = lr != null && ds != null ? Math.round((lr - ds) * 10) / 10 : null;
                return (
                  <tr key={c}>
                    <td className="ur-comp-name">{c}</td>
                    <td className={`ur-comp-val ${barClass(lr)}`}>{lr != null ? `${lr}%` : "—"}</td>
                    <td className="ur-comp-meta">{l?.sampleCount ?? 0}</td>
                    <td className={`ur-comp-val ${barClass(ds)}`}>{ds != null ? `${ds}%` : "—"}</td>
                    <td className="ur-comp-meta">{d?.touchCount ?? 0}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function barClass(v) {
  if (v == null) return "ur-comp-na";
  if (v >= 75) return "ur-comp-a";
  if (v >= 60) return "ur-comp-b";
  if (v >= 45) return "ur-comp-c";
  if (v >= 30) return "ur-comp-d";
  return "ur-comp-f";
}
