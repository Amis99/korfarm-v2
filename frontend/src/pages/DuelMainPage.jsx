import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiGet } from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import "../styles/duel.css";

const SERVERS = [
  { id: "saussure", name: "소쉬르", desc: "초등 저학년 수준", icon: "\uD83C\uDF31" },
  { id: "frege", name: "프레게", desc: "초등 고학년 수준", icon: "\uD83C\uDF3E" },
  { id: "russell", name: "러셀", desc: "중학교 수준", icon: "\uD83C\uDF3F" },
  { id: "wittgenstein", name: "비트겐슈타인", desc: "고등학교 수준", icon: "\uD83C\uDF33" },
];

function DuelMainPage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [serverStats, setServerStats] = useState({});
  const [myStats, setMyStats] = useState(null);
  const [error, setError] = useState(null);
  const [themeOrgId, setThemeOrgId] = useState(null);
  const [themeServerCount, setThemeServerCount] = useState(0);

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    // 본인 기관 ID 조회 + 활성 서브 서버 수
    apiGet("/v1/duel/me")
      .then((me) => setThemeOrgId(me?.themeOrgId || null))
      .catch((e) => console.error(e));

    apiGet("/v1/duel/theme-servers")
      .then((list) => setThemeServerCount(Array.isArray(list) ? list.length : 0))
      .catch(() => setThemeServerCount(0));

    SERVERS.forEach((server) => {
      apiGet(`/v1/duel/rooms?serverId=${server.id}`)
        .then((rooms) => {
          const list = Array.isArray(rooms) ? rooms : [];
          setServerStats((prev) => ({
            ...prev,
            [server.id]: { roomCount: list.length },
          }));
        })
        .catch((e) => {
          console.error(e);
          setError("대결 서버 정보를 불러오는 데 실패했습니다. 잠시 후 다시 시도해 주세요.");
        });
    });

    // 누적 전적 — 모든 시즌·모든 server 합산
    apiGet("/v1/duel/stats/cumulative")
      .then((stats) => setMyStats(stats))
      .catch((e) => console.error(e));
  }, [isLoggedIn, navigate]);

  return (
    <div className="duel-main">
      <h1>대결하기</h1>
      <p className="subtitle">서버를 선택하여 대결에 참가하세요</p>

      {error && (
        <div style={{ background: "#fff3e0", color: "#e65100", padding: "12px 16px", borderRadius: 8, margin: "0 16px 16px", textAlign: "center", fontSize: 14 }}>
          {error}
        </div>
      )}

      <div className="duel-servers">
        {SERVERS.map((server) => (
          <Link
            key={server.id}
            to={`/duel/lobby/${server.id}`}
            className="duel-server-card"
          >
            <div className="server-icon">{server.icon}</div>
            <div className="server-name">{server.name}</div>
            <div className="server-desc">{server.desc}</div>
            <div className="server-stats">
              <span>
                열린 방 {serverStats[server.id]?.roomCount ?? 0}개
              </span>
            </div>
          </Link>
        ))}
        {themeOrgId && (
          <Link
            to="/duel/theme"
            className="duel-server-card"
            style={{ borderColor: "#2d6a4f", background: "rgba(45,106,79,0.04)" }}
          >
            <div className="server-icon">🏫</div>
            <div className="server-name">테마 대결</div>
            <div className="server-desc">우리 기관 전용 (씨앗 X)</div>
            <div className="server-stats">
              <span>운영 중 {themeServerCount}개</span>
            </div>
          </Link>
        )}
      </div>

      {myStats && (
        <div className="duel-my-stats">
          <h3>내 전적</h3>
          <div className="duel-stats-row">
            <div className="duel-stat-item">
              <div className="value">{myStats.wins ?? 0}</div>
              <div className="label">승</div>
            </div>
            <div className="duel-stat-item">
              <div className="value">{myStats.losses ?? 0}</div>
              <div className="label">패</div>
            </div>
            <div className="duel-stat-item">
              <div className="value">
                {myStats.winRate != null
                  ? (myStats.winRate * 100).toFixed(0) + "%"
                  : "0%"}
              </div>
              <div className="label">승률</div>
            </div>
            <div className="duel-stat-item">
              <div className="value">{myStats.bestStreak ?? 0}</div>
              <div className="label">최고 연승</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: 24 }}>
        <Link to="/start" style={{ color: "#ff8f2b", fontWeight: 700 }}>
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  );
}

export default DuelMainPage;
