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

  useEffect(() => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }

    SERVERS.forEach((server) => {
      apiGet(`/v1/duel/rooms?serverId=${server.id}`)
        .then((rooms) => {
          const list = Array.isArray(rooms) ? rooms : [];
          setServerStats((prev) => ({
            ...prev,
            [server.id]: { roomCount: list.length },
          }));
        })
        .catch(() => {});
    });

    apiGet("/v1/duel/stats?serverId=frege")
      .then((stats) => setMyStats(stats))
      .catch(() => {});
  }, [isLoggedIn, navigate]);

  return (
    <div className="duel-main">
      <h1>대결하기</h1>
      <p className="subtitle">서버를 선택하여 대결에 참가하세요</p>

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
                {myStats.win_rate != null
                  ? (myStats.win_rate * 100).toFixed(0) + "%"
                  : "0%"}
              </div>
              <div className="label">승률</div>
            </div>
            <div className="duel-stat-item">
              <div className="value">{myStats.best_streak ?? 0}</div>
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
