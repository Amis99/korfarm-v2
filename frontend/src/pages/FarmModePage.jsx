import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FARM_LIST,
  getLearningItemsByFarm,
  LEVELS,
  LEVEL_LABELS,
  profileLevelToUpper,
} from "../data/learning/learningCatalog";
import { apiGet } from "../utils/api";
import "../styles/farm-mode.css";

function FarmModePage() {
  const [dbCounts, setDbCounts] = useState({});
  const [selectedLevel, setSelectedLevel] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);

  // 프로필에서 레벨 가져오기
  useEffect(() => {
    apiGet("/v1/auth/me")
      .then((profile) => {
        const raw = profile.level_id || profile.levelId || "";
        const upper = profileLevelToUpper(raw);
        if (LEVELS.includes(upper)) setSelectedLevel(upper);
        setProfileLoaded(true);
      })
      .catch(() => setProfileLoaded(true));
  }, []);

  // DB 카탈로그에서 농장별 콘텐츠 수 조회
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

  // 레벨 필터된 정적 카운트 계산
  const getFilteredCount = (farmId) => {
    const items = getLearningItemsByFarm(farmId);
    if (!selectedLevel) return items.length;
    return items.filter((item) => item.targetLevel === selectedLevel).length;
  };

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

      {/* 레벨 선택 */}
      <div className="farm-level-selector">
        <label className="farm-level-label">레벨</label>
        <select
          className="farm-filter-select"
          value={selectedLevel}
          onChange={(e) => setSelectedLevel(e.target.value)}
        >
          <option value="">전체 레벨</option>
          {LEVELS.map((lv) => (
            <option key={lv} value={lv}>
              {LEVEL_LABELS[lv] || lv}
            </option>
          ))}
        </select>
      </div>

      {/* 3x3 그리드 */}
      <div className="farm-grid">
        {FARM_LIST.map((farm) => {
          const staticCount = getFilteredCount(farm.id);
          const dbCount = dbCounts[farm.id] || 0;
          const count = selectedLevel ? staticCount : staticCount + dbCount;
          const levelParam = selectedLevel ? `?level=${selectedLevel}` : "";
          return (
            <Link
              key={farm.id}
              to={`/farm-mode/${farm.id}${levelParam}`}
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
