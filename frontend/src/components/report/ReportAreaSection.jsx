import { useMemo } from "react";

/**
 * 영역 분석 (V0100 분류 마스터 — 6대 영역 + 세부영역)
 * - V2: weightedScore (시간 decay × 소스 가중) 우선 표시, rawAverage 보조
 */
export default function ReportAreaSection({ areaStats }) {
  if (!areaStats || areaStats.length === 0) {
    return (
      <div className="ur-area-section">
        <h3>영역별 성취 분석</h3>
        <p className="ur-empty">아직 영역별 데이터가 충분하지 않습니다.</p>
      </div>
    );
  }

  const { strength, weakness } = useMemo(() => {
    if (!areaStats || areaStats.length === 0) return { strength: null, weakness: null };
    let bestArea = null;
    let worstArea = null;
    let maxScore = -1;
    let minScore = Infinity;
    areaStats.forEach((area) => {
      const score = area.weightedScore ?? area.averageScore ?? 0;
      if (area.activityCount < 3) return;
      if (score > maxScore) { maxScore = score; bestArea = area; }
      if (score > 0 && score < minScore) { minScore = score; worstArea = area; }
    });
    return {
      strength: bestArea ? { label: bestArea.areaLabel, score: maxScore } : null,
      weakness: worstArea && worstArea !== bestArea ? { label: worstArea.areaLabel, score: minScore } : null,
    };
  }, [areaStats]);

  return (
    <div className="ur-area-section">
      <h3>영역별 · 세부영역별 성취</h3>
      <p className="ur-algo-hint">
        최근 200건 활동 + 30일 시간 가중 + 시험 10·일일 3·학습 1 가중 평균
      </p>

      <div className="ur-strength-weak">
        {strength && (
          <span className="ur-strength">강점 — {strength.label} ({strength.score?.toFixed(1)}점)</span>
        )}
        {weakness && (
          <span className="ur-weakness">약점 — {weakness.label} ({weakness.score?.toFixed(1)}점)</span>
        )}
      </div>

      <table>
        <thead>
          <tr>
            <th>영역</th>
            <th>학습 수</th>
            <th>가중 점수</th>
            <th>단순 평균</th>
          </tr>
        </thead>
        <tbody>
          {areaStats.map((area) => (
            <AreaRow key={area.areaKey} area={area} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AreaRow({ area }) {
  const hasSubs = area.subAreas?.length > 0;
  const weighted = area.weightedScore ?? area.averageScore ?? 0;
  const raw = area.rawAverage ?? area.averageScore ?? 0;

  return (
    <>
      <tr>
        <td style={{ fontWeight: 600 }}>{area.areaLabel}</td>
        <td>{area.activityCount}회</td>
        <td style={{ fontWeight: 700 }}>{weighted.toFixed(1)}점</td>
        <td style={{ color: "#666" }}>{raw.toFixed(1)}점</td>
      </tr>
      {hasSubs &&
        area.subAreas.map((sub) => (
          <tr key={`${area.areaKey}-${sub.subAreaLabel}`} className="ur-sub-area-row">
            <td style={{ paddingLeft: 28, fontSize: 12, color: "#555" }}>
              ↳ {sub.subAreaLabel}
            </td>
            <td style={{ fontSize: 12, color: "#555" }}>{sub.activityCount}회</td>
            <td style={{ fontSize: 12, color: "#555" }}>
              {(sub.weightedScore ?? sub.averageScore ?? 0).toFixed(1)}점
            </td>
            <td style={{ fontSize: 12, color: "#888" }}>
              {(sub.averageScore ?? 0).toFixed(1)}점
            </td>
          </tr>
        ))}
    </>
  );
}
