import { useState } from "react";
import ErrorPathChart from "./ErrorPathChart";

function CompetencyDetailSection({ details, statistics }) {
  const [openIdx, setOpenIdx] = useState(null);

  if (!details || details.length === 0) return null;

  const toggle = (idx) => setOpenIdx(openIdx === idx ? null : idx);
  const getGradeClass = (grade) => {
    if (grade === "상") return "high";
    if (grade === "중") return "mid";
    return "low";
  };

  return (
    <div className="diag-report-section">
      <h2>역량별 상세 분석</h2>
      <div className="competency-detail-list">
        {details.map((d, i) => {
          const avgScore = statistics?.competencyStats?.[d.name]?.average;
          return (
            <div key={d.name} className={`competency-detail-item ${openIdx === i ? "open" : ""}`}>
              <div className="competency-detail-header" onClick={() => toggle(i)}>
                <div className="cd-rank">#{d.rank}</div>
                <div className="cd-name">{d.name}</div>
                <div className="cd-score-bar-wrap">
                  <div className="cd-score-bar">
                    <div className={`cd-score-bar-fill ${getGradeClass(d.grade)}`} style={{ width: `${d.score}%` }} />
                    {avgScore != null && (
                      <div className="cd-avg-marker" style={{ left: `${avgScore}%` }} title={`평균: ${avgScore.toFixed(1)}`} />
                    )}
                  </div>
                </div>
                <div className="cd-score">{d.score.toFixed(1)}</div>
                <span className={`grade-badge ${getGradeClass(d.grade)}`}>{d.grade}</span>
                {d.percentile != null && (
                  <span className="cd-percentile">상위 {(100 - d.percentile).toFixed(0)}%</span>
                )}
                <span className="cd-arrow">{openIdx === i ? "▲" : "▼"}</span>
              </div>
              {openIdx === i && (
                <div className="competency-detail-body">
                  <p className="cd-description">{d.description}</p>
                  <p className="cd-narrative">{d.narrative}</p>
                  <div className="cd-meta">
                    <span>측정 횟수: {d.touchCount}회</span>
                    <span>관련 문항 정답률: {d.relatedAccuracy.toFixed(1)}%</span>
                  </div>
                  {d.topErrorPaths.length > 0 && (
                    <div className="cd-error-paths">
                      <div className="cd-error-title">주요 오류 경로:</div>
                      <ErrorPathChart paths={d.topErrorPaths} />
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default CompetencyDetailSection;
