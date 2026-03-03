import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FARM_LIST, getLearningItemsByFarm } from "../data/learning/learningCatalog";
import { apiGet } from "../utils/api";
import "../styles/farm-mode.css";

function FarmModePage() {
  // DB 카탈로그에서 농장별 추가 콘텐츠 수 조회
  const [dbCounts, setDbCounts] = useState({});

  useEffect(() => {
    apiGet("/v1/learning/catalog")
      .then((data) => {
        if (data?.farms) {
          const counts = {};
          data.farms.forEach((f) => { counts[f.area] = f.totalCount || 0; });
          setDbCounts(counts);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="farm">
      {/* 상단바 */}
      <div className="farm-topbar">
        <div className="farm-topbar-inner">
          <Link to="/start" className="farm-back">
            <span className="material-symbols-outlined">arrow_back</span>
            돌아가기
          </Link>
          <h1 className="farm-topbar-title">농장별 모드</h1>
        </div>
      </div>

      {/* 히어로 */}
      <div className="farm-hero">
        <h2>나의 농장을 선택하세요</h2>
        <p>영역별로 분류된 학습 콘텐츠를 탐색합니다</p>
      </div>

      {/* 3×3 그리드 */}
      <div className="farm-grid">
        {FARM_LIST.map((farm) => {
          const staticCount = getLearningItemsByFarm(farm.id).length;
          const dbCount = dbCounts[farm.id] || 0;
          const count = staticCount + dbCount;
          return (
            <Link
              key={farm.id}
              to={`/farm-mode/${farm.id}`}
              className="farm-card"
            >
              <div className="farm-card-icon">{farm.emoji}</div>
              <div className="farm-card-body">
                <p className="farm-card-name">{farm.name}</p>
                <p className="farm-card-desc">{farm.description}</p>
                <span
                  className="farm-card-count"
                  style={{ background: farm.color }}
                >
                  학습 {count}개
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default FarmModePage;
