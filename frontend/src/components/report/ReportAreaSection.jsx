import { useState } from "react";

export default function ReportAreaSection({ areaStats }) {
  if (!areaStats || areaStats.length === 0) return null;

  const [expandedArea, setExpandedArea] = useState(null);

  return (
    <div className="ur-area-section">
      <h3>영역 분석</h3>
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
            <>
              <tr
                key={area.areaKey}
                style={{ cursor: area.subAreas?.length > 0 ? "pointer" : "default" }}
                onClick={() => area.subAreas?.length > 0 && setExpandedArea(expandedArea === area.areaKey ? null : area.areaKey)}
              >
                <td style={{ fontWeight: 600 }}>{area.areaLabel}</td>
                <td>{area.activityCount}회</td>
                <td style={{ fontWeight: 700 }}>{area.averageScore?.toFixed(1)}%</td>
                <td style={{ width: 30 }}>
                  {area.subAreas?.length > 0 && (
                    <span
                      className={`material-symbols-outlined`}
                      style={{ fontSize: 16, color: "#999", transition: "transform 0.2s", transform: expandedArea === area.areaKey ? "rotate(180deg)" : "" }}
                    >expand_more</span>
                  )}
                </td>
              </tr>
              {expandedArea === area.areaKey && area.subAreas?.map((sub) => (
                <tr key={`${area.areaKey}-${sub.subAreaLabel}`} className="ur-sub-area-row">
                  <td style={{ paddingLeft: 28, fontSize: 12, color: "#555" }}>{sub.subAreaLabel}</td>
                  <td style={{ fontSize: 12, color: "#555" }}>{sub.activityCount}회</td>
                  <td style={{ fontSize: 12, color: "#555" }}>{sub.averageScore?.toFixed(1)}%</td>
                  <td></td>
                </tr>
              ))}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
