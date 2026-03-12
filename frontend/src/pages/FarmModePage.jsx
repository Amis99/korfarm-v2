import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  FARM_LIST,
  getLearningItemsByFarm,
  SERVERS,
  SERVER_LABELS,
  profileLevelToServer,
  levelBelongsToServer,
} from "../data/learning/learningCatalog";
import { apiGet } from "../utils/api";
import "../styles/farm-mode.css";

function FarmModePage() {
  const [dbItemsByFarm, setDbItemsByFarm] = useState({});
  const [selectedServer, setSelectedServer] = useState("");
  const [profileLoaded, setProfileLoaded] = useState(false);

  // 프로필에서 서버 가져오기
  useEffect(() => {
    apiGet("/v1/auth/me")
      .then((profile) => {
        const raw = profile.level_id || profile.levelId || "";
        const server = profileLevelToServer(raw);
        if (SERVERS.includes(server)) setSelectedServer(server);
        setProfileLoaded(true);
      })
      .catch(() => setProfileLoaded(true));
  }, []);

  // DB 카탈로그에서 농장별 콘텐츠 items 조회
  useEffect(() => {
    apiGet("/v1/learning/catalog")
      .then((data) => {
        if (data?.farms) {
          const itemsMap = {};
          data.farms.forEach((f) => { itemsMap[f.area] = f.items || []; });
          setDbItemsByFarm(itemsMap);
        }
      })
      .catch(() => {});
  }, []);

  // 서버 필터된 카운트 계산
  const getCount = (farmId) => {
    const staticItems = getLearningItemsByFarm(farmId);
    const dbFarmItems = dbItemsByFarm[farmId] || [];
    const staticIds = new Set(staticItems.map((i) => i.contentId));
    const allItems = [
      ...staticItems,
      ...dbFarmItems.filter((i) => !staticIds.has(i.contentId)),
    ];
    if (!selectedServer) return allItems.length;
    return allItems.filter((item) => {
      const level = item.targetLevel || item.levelId;
      return levelBelongsToServer(level, selectedServer);
    }).length;
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

      {/* 서버 선택 */}
      <div className="farm-level-selector">
        <label className="farm-level-label">서버</label>
        <select
          className="farm-filter-select"
          value={selectedServer}
          onChange={(e) => setSelectedServer(e.target.value)}
        >
          <option value="">전체</option>
          {SERVERS.map((sv) => (
            <option key={sv} value={sv}>
              {SERVER_LABELS[sv]}
            </option>
          ))}
        </select>
      </div>

      {/* 3x3 그리드 */}
      <div className="farm-grid">
        {FARM_LIST.map((farm) => {
          const count = getCount(farm.id);
          if (selectedServer && count === 0) return null;
          const serverParam = selectedServer ? `?server=${selectedServer}` : "";
          return (
            <Link
              key={farm.id}
              to={`/farm-mode/${farm.id}${serverParam}`}
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
