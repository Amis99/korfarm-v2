import { useState, useMemo } from "react";

/**
 * 영역 분석 (4분류: 비문학/문학/문법/기타)
 * - 각 영역의 학습수, 평균 정답률
 * - 세부영역 행 (영역 행 클릭으로 토글)
 * - 강점/약점 영역 표시
 */
export default function ReportAreaSection({ areaStats }) {
  if (!areaStats || areaStats.length === 0) return null;

  const [expandedArea, setExpandedArea] = useState(null);

  // 강점/약점 계산
  const { strength, weakness } = useMemo(() => {
    if (!areaStats || areaStats.length === 0) return { strength: null, weakness: null };

    let bestArea = null;
    let worstArea = null;
    let maxScore = -1;
    let minScore = Infinity;

    areaStats.forEach((area) => {
      const score = area.averageScore ?? 0;
      if (score > maxScore) {
        maxScore = score;
        bestArea = area;
      }
      if (score > 0 && score < minScore) {
        minScore = score;
        worstArea = area;
      }
    });

    return {
      strength: bestArea ? { label: bestArea.areaLabel, score: maxScore } : null,
      weakness: worstArea ? { label: worstArea.areaLabel, score: minScore } : null,
    };
  }, [areaStats]);

  return (
    <div className="ur-area-section">
      <h3>영역 분석</h3>

      <div className="ur-strength-weak">
        {strength && (
          <span className="ur-strength">
            강점 영역: {strength.label} ({strength.score?.toFixed(1)}%)
          </span>
        )}
        {weakness && (
          <span className="ur-weakness">
            약점 영역: {weakness.label} ({weakness.score?.toFixed(1)}%)
          </span>
        )}
      </div>

      <table>
        <thead>
          <tr>
            <th>영역</th>
            <th>학습 수</th>
            <th>평균 정답률</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {areaStats.map((area) => (
            <AreaRow
              key={area.areaKey}
              area={area}
              expanded={expandedArea === area.areaKey}
              onToggle={() =>
                setExpandedArea(expandedArea === area.areaKey ? null : area.areaKey)
              }
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function AreaRow({ area, expanded, onToggle }) {
  const hasSubs = area.subAreas?.length > 0;

  return (
    <>
      <tr
        style={{ cursor: hasSubs ? "pointer" : "default" }}
        onClick={() => hasSubs && onToggle()}
      >
        <td style={{ fontWeight: 600 }}>{area.areaLabel}</td>
        <td>{area.activityCount}회</td>
        <td style={{ fontWeight: 700 }}>{area.averageScore?.toFixed(1)}%</td>
        <td style={{ width: 30 }}>
          {hasSubs && (
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 16,
                color: "#999",
                transition: "transform 0.2s",
                transform: expanded ? "rotate(180deg)" : "",
              }}
            >
              expand_more
            </span>
          )}
        </td>
      </tr>
      {expanded &&
        area.subAreas?.map((sub) => (
          <tr key={`${area.areaKey}-${sub.subAreaLabel}`} className="ur-sub-area-row">
            <td style={{ paddingLeft: 28, fontSize: 12, color: "#555" }}>
              {sub.subAreaLabel}
            </td>
            <td style={{ fontSize: 12, color: "#555" }}>{sub.activityCount}회</td>
            <td style={{ fontSize: 12, color: "#555" }}>
              {sub.averageScore?.toFixed(1)}%
            </td>
            <td></td>
          </tr>
        ))}
    </>
  );
}
