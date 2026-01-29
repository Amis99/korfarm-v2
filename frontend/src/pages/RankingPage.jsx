import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/ranking.css";

const LEVEL_OPTIONS = [
  { id: "saussure1", label: "소쉬르1", grade: "초1" },
  { id: "saussure2", label: "소쉬르2", grade: "초2" },
  { id: "saussure3", label: "소쉬르3", grade: "초3" },
  { id: "frege1", label: "프레게1", grade: "초4" },
  { id: "frege2", label: "프레게2", grade: "초5" },
  { id: "frege3", label: "프레게3", grade: "초6" },
  { id: "russell1", label: "러셀1", grade: "중1" },
  { id: "russell2", label: "러셀2", grade: "중2" },
  { id: "russell3", label: "러셀3", grade: "중3" },
  { id: "wittgenstein1", label: "비트겐슈타인1", grade: "고1" },
  { id: "wittgenstein2", label: "비트겐슈타인2", grade: "고2" },
  { id: "wittgenstein3", label: "비트겐슈타인3", grade: "고3" },
];

const SAMPLE_NAMES = [
  "수민",
  "준호",
  "지윤",
  "현우",
  "예린",
  "도윤",
  "서윤",
  "민재",
  "하린",
  "예준",
];

const formatNumber = (value) => value.toLocaleString("ko-KR");

const buildRankingRows = (period, scope, levelIndex) => {
  const base = period === "season" ? 5240 : 38240;
  const step = period === "season" ? 420 : 3200;
  const scopeBoost = scope === "all" ? 860 : 0;
  const levelBoost = scope === "level" ? levelIndex * 120 : 0;

  return SAMPLE_NAMES.map((name, index) => ({
    rank: index + 1,
    name,
    harvest: Math.max(0, base - step * index + scopeBoost + levelBoost),
    trend: index === 0 ? "▲2" : index % 2 === 0 ? "▲1" : "▼1",
  }));
};

function RankingPage() {
  const [period, setPeriod] = useState("season");
  const [scope, setScope] = useState("level");
  const [level, setLevel] = useState(LEVEL_OPTIONS[0].id);

  const levelIndex = LEVEL_OPTIONS.findIndex((item) => item.id === level);
  const levelLabel = LEVEL_OPTIONS.find((item) => item.id === level)?.label ?? "";
  const seasonLabel = `${new Date().getFullYear()}년 ${
    new Date().getMonth() + 1
  }월 시즌`;

  const rows = useMemo(
    () => buildRankingRows(period, scope, Math.max(levelIndex, 0)),
    [period, scope, levelIndex]
  );

  return (
    <div className="ranking-page">
      <div className="ranking-shell">
        <header className="ranking-header">
          <div>
            <h1>랭킹 확인</h1>
            <p className="ranking-subtitle">한 시즌은 한 달로 설정됩니다.</p>
          </div>
          <Link className="ranking-back" to="/start">
            스타트로
          </Link>
        </header>

        <section className="ranking-controls">
          <div className="ranking-toggle">
            <button
              type="button"
              className={period === "season" ? "active" : ""}
              onClick={() => setPeriod("season")}
            >
              시즌 랭킹
            </button>
            <button
              type="button"
              className={period === "cumulative" ? "active" : ""}
              onClick={() => setPeriod("cumulative")}
            >
              누적 랭킹
            </button>
          </div>
          <div className="ranking-toggle">
            <button
              type="button"
              className={scope === "level" ? "active" : ""}
              onClick={() => setScope("level")}
            >
              레벨별
            </button>
            <button
              type="button"
              className={scope === "all" ? "active" : ""}
              onClick={() => setScope("all")}
            >
              레벨 통합
            </button>
          </div>
          {scope === "level" && (
            <div className="ranking-select">
              <label htmlFor="ranking-level">레벨</label>
              <select
                id="ranking-level"
                value={level}
                onChange={(event) => setLevel(event.target.value)}
              >
                {LEVEL_OPTIONS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label} ({item.grade})
                  </option>
                ))}
              </select>
            </div>
          )}
        </section>

        <section className="ranking-meta">
          <span className="ranking-chip">랭킹 기준: 수확물</span>
          {period === "season" && <span className="ranking-chip">{seasonLabel}</span>}
          {scope === "level" && (
            <span className="ranking-chip">레벨: {levelLabel}</span>
          )}
          {scope === "all" && <span className="ranking-chip">레벨 통합</span>}
        </section>

        <section className="ranking-card">
          <div className="ranking-head">
            <div>
              <h2>{period === "season" ? "시즌 랭킹" : "누적 랭킹"}</h2>
              <p>{scope === "level" ? "레벨별 랭킹" : "레벨 통합 랭킹"}</p>
            </div>
            <span className="ranking-basis">수확물 기준</span>
          </div>
          <ul className="ranking-list">
            {rows.map((row) => (
              <li key={row.rank} className="ranking-item">
                <span className="ranking-badge">#{row.rank}</span>
                <div className="ranking-name">
                  <strong>{row.name}</strong>
                  <span>{scope === "level" ? levelLabel : "전체 레벨"}</span>
                </div>
                <div className="ranking-score">
                  <strong>{formatNumber(row.harvest)}</strong>
                  <span>수확물</span>
                </div>
                <span className="ranking-trend">{row.trend}</span>
              </li>
            ))}
          </ul>
        </section>

        <p className="ranking-note">
          수확물은 씨앗을 모아 교환한 수확물 합계입니다.
        </p>
      </div>
    </div>
  );
}

export default RankingPage;
