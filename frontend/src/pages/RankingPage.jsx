import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiGet } from "../utils/api";
import { FORMULA_TEXT } from "../utils/seasonScore";
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
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 20;

  const levelLabel = LEVEL_OPTIONS.find((item) => item.id === level)?.label ?? "";
  const seasonLabel = `${new Date().getFullYear()}년 ${new Date().getMonth() + 1}월 시즌`;

  // 부모가 자녀 순위를 볼 때 자녀 이름 가져오기
  useEffect(() => {
    if (isViewingChild) {
      apiGet(`/v1/parents/children/${studentId}/profile`)
        .then((profile) => setChildName(profile?.name || "자녀"))
        .catch((e) => console.error(e));
    }
  }, [isViewingChild, studentId]);

  useEffect(() => {
    setLoading(true);
    apiGet("/v1/seasons/current")
      .then((season) => {
        if (season?.id || season?.seasonId) {
          const sid = season.id || season.seasonId;
          const levelParam = scope === "level" ? `?level=${level}` : "";
          return apiGet(`/v1/seasons/${sid}/harvest-rankings${levelParam}`);
        }
        return [];
      })
      .then((data) => {
        const items = data?.items || data || [];
        setRankings(items);
      })
      .catch(() => setRankings([]))
      .finally(() => setLoading(false));
  }, [period, scope, level]);

  const rows = useMemo(() => {
    if (!rankings.length) return [];
    return rankings.map((r, i) => ({
      rank: r.rank ?? i + 1,
      name: r.userName || r.name || "?",
      score: r.value ?? r.totalCrops ?? r.score ?? 0,
      userId: r.userId,
      profileImageUrl: r.profileImageUrl || r.profile_image_url || "",
      isHighlighted: isViewingChild && r.userId === studentId,
      isMe: !isViewingChild && r.userId === user?.id,
    }));
  }, [rankings, isViewingChild, studentId, user]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return rows.slice(start, start + PAGE_SIZE);
  }, [rows, page]);

  // level/scope/period 변경 시 첫 페이지로
  useEffect(() => { setPage(1); }, [level, scope, period]);

  return (
    <div className="ranking-page">
      <div className="ranking-shell">
        <header className="ranking-header">
          <div>
            <h1>랭킹 확인</h1>
            <p className="ranking-subtitle">시즌 점수 = {FORMULA_TEXT}</p>
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
            <>
              <table className="ranking-table">
                <thead>
                  <tr>
                    <th className="col-rank">순위</th>
                    <th className="col-user">학생</th>
                    <th className="col-score">점수</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row) => (
                    <tr
                      key={row.userId || row.rank}
                      className={`${row.isHighlighted ? "row-highlight" : ""}${row.isMe ? " row-me" : ""}`}
                    >
                      <td className="col-rank">
                        {row.rank <= 3 ? ["🥇", "🥈", "🥉"][row.rank - 1] : `${row.rank}`}
                      </td>
                      <td className="col-user">
                        <span className="ranking-avatar">
                          {row.profileImageUrl ? (
                            <img src={row.profileImageUrl} alt="" />
                          ) : (
                            (row.name || "?").charAt(0)
                          )}
                        </span>
                        <span className="ranking-name-cell">
                          {row.name}
                          {row.isHighlighted && <span className="tag-child">(자녀)</span>}
                          {row.isMe && <span className="tag-me">나</span>}
                        </span>
                      </td>
                      <td className="col-score">
                        <strong>{formatNumber(row.score)}</strong>
                        <span className="unit">점</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {totalPages > 1 && (
                <nav className="ranking-pagination" aria-label="페이지">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                  >
                    ‹ 이전
                  </button>
                  <span className="page-info">
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                  >
                    다음 ›
                  </button>
                </nav>
              )}
            </>
          ) : (
            <p style={{ padding: 20, textAlign: "center", color: "#8a7468" }}>아직 랭킹 데이터가 없습니다.</p>
          )}
        </section>

        <p className="ranking-note">
          시즌 점수 = {FORMULA_TEXT}
        </p>
      </div>
    </div>
  );
}

export default RankingPage;
