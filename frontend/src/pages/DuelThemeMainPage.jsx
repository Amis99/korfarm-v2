import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiGet } from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import "../styles/duel.css";

/**
 * 학생 — 테마 대결 메인.
 * 본인 기관(/v1/duel/me) 의 활성 서브 서버 목록 카드. 클릭 시 그 서브 서버의 lobby.
 */
function DuelThemeMainPage() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [me, setMe] = useState(null);
  const [servers, setServers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) { navigate("/login"); return; }
    apiGet("/v1/duel/me").then(setMe).catch(() => setMe(null));
    apiGet("/v1/duel/theme-servers")
      .then((list) => setServers(Array.isArray(list) ? list : []))
      .catch(() => setServers([]))
      .finally(() => setLoading(false));
  }, [isLoggedIn, navigate]);

  return (
    <div className="duel-main">
      <h1>테마 대결{me?.orgName ? ` — ${me.orgName}` : ""}</h1>
      <p className="subtitle">우리 기관에서 운영 중인 서브 서버를 골라 입장하세요</p>

      <div style={{ textAlign: "center", marginBottom: 16 }}>
        <Link to="/duel" style={{ fontSize: 13, color: "#8a7468" }}>← 일반 대결로 돌아가기</Link>
      </div>

      {loading && <div className="duel-empty-msg">불러오는 중...</div>}
      {!loading && servers.length === 0 && (
        <div className="duel-empty-msg">
          현재 열린 테마 서버가 없습니다.<br />
          기관 관리자에게 문의하세요.
        </div>
      )}

      <div className="duel-servers">
        {servers.map((s) => {
          const expireText = s.expireAt
            ? `~ ${String(s.expireAt).substring(0, 16).replace("T", " ")}`
            : "기한 없음";
          return (
            <Link key={s.serverId} to={`/duel/lobby/${s.serverId}`} className="duel-server-card">
              <div className="server-icon">🏫</div>
              <div className="server-name">{s.subName}</div>
              <div className="server-desc">씨앗 X · {expireText}</div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default DuelThemeMainPage;
