import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiGet } from "../utils/api";
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

const formatNumber = (value) => value.toLocaleString("ko-KR");

function RankingPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("studentId");
  const isParent = user?.roles?.includes("PARENT");
  const isViewingChild = isParent && studentId;

  const [period, setPeriod] = useState("season");
  const [scope, setScope] = useState("level");
  const [level, setLevel] = useState(LEVEL_OPTIONS[0].id);
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [childName, setChildName] = useState("");

  const levelLabel = LEVEL_OPTIONS.find((item) => item.id === level)?.label ?? "";
  const seasonLabel = `${new Date().getFullYear()}년 ${new Date().getMonth() + 1}월 시즌`;

  // 부모가 자녀 순위를 볼 때 자녀 이름 가져오기
  useEffect(() => {
    if (isViewingChild) {
      apiGet(`/v1/parents/children/${studentId}/profile`)
        .then((profile) => setChildName(profile?.name || "자녀"))
        .catch(() => {});
    }
  }, [isViewingChild, studentId]);

  useEffect(() => {
    setLoading(true);
    apiGet("/v1/seasons/current")
      .then((season) => {
        if (season?.id || season?.seasonId) {
          const sid = season.id || season.seasonId;
          return apiGet(`/v1/seasons/${sid}/harvest-rankings`);
        }
        return [];
      })
      .then((data) => {
        const items = data?.items || data || [];
        setRankings(items);
      })
      .catch(() => setRankings([]))
      .finally(() => setLoading(false));
  }, []);

  const rows = useMemo(() => {
    if (!rankings.length) return [];
    return rankings.map((r, i) => ({
      rank: r.rank ?? i + 1,
      name: r.userName || r.name || "?",
      score: r.value ?? r.totalCrops ?? r.score ?? 0,
      userId: r.userId,
      isHighlighted: isViewingChild && r.userId === studentId,
    }));
  }, [rankings, isViewingChild, studentId]);

  return (
    <div className="ranking-page">
      <div className="ranking-shell">
        <header className="ranking-header">
          <div>
            <h1>랭킹 확인</h1>
            <p className="ranking-subtitle">시즌 점수 = 밀 × 귀리 × 쌀 × 포도 × 10 + 씨앗</p>
          </div>
          <Link className="ranking-back" to="/start">
            홈으로
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
          <span className="ranking-chip">랭킹 기준: 시즌 점수</span>
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
            <span className="ranking-basis">시즌 점수 기준</span>
          </div>
          {loading ? (
            <p style={{ padding: 20, textAlign: "center", color: "#8a7468" }}>불러오는 중...</p>
          ) : rows.length > 0 ? (
            <ul className="ranking-list">
              {rows.map((row) => (
                <li
                  key={row.rank}
                  className={`ranking-item${row.isHighlighted ? " ranking-item-highlight" : ""}`}
                  style={row.isHighlighted ? {
                    background: "linear-gradient(135deg, #fff5eb 0%, #ffe8d6 100%)",
                    border: "2px solid #f06c24",
                    borderRadius: 12,
                  } : undefined}
                >
                  <span className="ranking-avatar">
                    {(row.name || "?").charAt(0)}
                  </span>
                  <span className="ranking-badge">#{row.rank}</span>
                  <div className="ranking-name">
                    <strong>
                      {row.name}
                      {row.isHighlighted && <span style={{ marginLeft: 6, fontSize: 12, color: "#f06c24" }}>(자녀)</span>}
                    </strong>
                    <span>{scope === "level" ? levelLabel : "전체 레벨"}</span>
                  </div>
                  <div className="ranking-score">
                    <strong>{formatNumber(row.score)}</strong>
                    <span>점</span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p style={{ padding: 20, textAlign: "center", color: "#8a7468" }}>아직 랭킹 데이터가 없습니다.</p>
          )}
        </section>

        <p className="ranking-note">
          시즌 점수 = 밀 × 귀리 × 쌀 × 포도 × 10 + 총 씨앗 수
        </p>
      </div>
    </div>
  );
}

export default RankingPage;
