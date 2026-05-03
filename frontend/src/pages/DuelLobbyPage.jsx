import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiGet, apiPost } from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import "../styles/duel.css";

const SERVER_NAMES = {
  saussure: "소쉬르",
  frege: "프레게",
  russell: "러셀",
  wittgenstein: "비트겐슈타인",
};

const isThemeServer = (sid) => typeof sid === "string" && sid.startsWith("theme_");

function DuelLobbyPage() {
  const { serverId } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [stakeAmount, setStakeAmount] = useState(5);
  const [creating, setCreating] = useState(false);

  const isTheme = isThemeServer(serverId);
  const serverName = isTheme ? "테마 대결" : (SERVER_NAMES[serverId] || serverId);

  const loadRooms = () => {
    apiGet(`/v1/duel/rooms?serverId=${serverId}`)
      .then((data) => setRooms(Array.isArray(data) ? data : []))
      .catch(() => setRooms([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isLoggedIn) { navigate("/login"); return; }
    loadRooms();
    const interval = setInterval(loadRooms, 5000);
    return () => clearInterval(interval);
  }, [serverId, isLoggedIn, navigate]);

  const handleCreateRoom = async () => {
    if (!roomName.trim()) return;
    setCreating(true);
    try {
      const data = await apiPost("/v1/duel/rooms", {
        server_id: serverId,
        room_name: roomName.trim(),
        stake_amount: Number(stakeAmount),
      });
      const roomId = data?.room?.roomId || data?.roomId;
      if (roomId) navigate(`/duel/room/${roomId}`);
    } catch (err) {
      alert(err.message || "방 생성 실패");
    } finally {
      setCreating(false);
    }
  };

  const isAiRoom = (room) => room.roomId?.startsWith("ai-room-");

  const handleJoinRoom = async (room) => {
    try {
      if (isAiRoom(room)) {
        const data = await apiPost("/v1/duel/rooms/ai-join", { serverId });
        const matchId = data?.matchId || data?.match_id;
        if (matchId) navigate(`/duel/match/${matchId}`);
        return;
      }
      await apiPost(`/v1/duel/rooms/${room.roomId}/join`);
      navigate(`/duel/room/${room.roomId}`);
    } catch (err) {
      alert(err.message || "입장 실패");
    }
  };

  return (
    <div className="duel-lobby">
      <div className="duel-lobby-header">
        <div>
          <h1>{serverName}{isTheme ? " (우리 기관 테마)" : " 서버"}</h1>
          <Link to={isTheme ? "/duel/theme" : "/duel"} style={{ fontSize: 13, color: "#8a7468" }}>
            ← {isTheme ? "테마 서버 목록" : "서버 목록"}으로
          </Link>
        </div>
        <button className="duel-create-btn" onClick={() => setShowCreate(true)}>
          방 만들기
        </button>
      </div>

      {isTheme && (
        <div style={{ background: "rgba(45,106,79,0.08)", padding: "10px 14px", borderRadius: 8, fontSize: 13, color: "#1a3a2c", marginBottom: 12 }}>
          🏫 테마 대결은 우리 기관 관리자가 만든 방에만 입장할 수 있어요. 씨앗 X · 정해진 기한까지만 운영
        </div>
      )}

      {loading ? (
        <div className="duel-empty-msg">불러오는 중...</div>
      ) : rooms.length === 0 ? (
        <div className="duel-empty-msg">
          {isTheme
            ? "현재 열린 테마 방이 없습니다. 기관 관리자에게 문의하세요."
            : "열린 방이 없습니다. 새 방을 만들어보세요!"}
        </div>
      ) : (
        <div className="duel-room-list">
          {rooms.map((room) => {
            const expired = room.expireAt && new Date(room.expireAt) < new Date();
            return (
              <div
                key={room.roomId}
                className={`duel-room-item${isAiRoom(room) ? " ai-room" : ""}`}
                onClick={expired ? undefined : () => handleJoinRoom(room)}
                style={expired ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
              >
                <div className="duel-room-info">
                  <div className="room-name">
                    {isAiRoom(room) && <span className="ai-badge">AI</span>}
                    {room.roomName || "대결방"}
                    {expired && <span style={{ marginLeft: 6, fontSize: 11, color: "#c0392b" }}>· 기한 만료</span>}
                  </div>
                  <div className="room-meta">
                    {isTheme
                      ? `씨앗 X · 최대 ${room.roomSize}명${room.expireAt ? ` · 기한 ${String(room.expireAt).substring(0, 16)}` : ""}`
                      : `베팅 ${room.stakeAmount}씨앗 | 최대 ${room.roomSize}명${isAiRoom(room) ? " | 즉시 시작" : ""}`
                    }
                  </div>
                </div>
                <div className="duel-room-right">
                  <div className="player-count">{room.playerCount}/{room.roomSize}</div>
                  <div className="stake-info">참가자</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <div className="duel-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="duel-modal" onClick={(e) => e.stopPropagation()}>
            <h2>방 만들기</h2>
            <label>방 이름</label>
            <input value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="방 이름을 입력하세요" maxLength={50} />
            {!isTheme && (
              <>
                <label>베팅 씨앗 (1~50)</label>
                <input type="number" min={1} max={50} value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} />
              </>
            )}
            {isTheme && (
              <p style={{ fontSize: 12, color: "#666" }}>테마 대결은 씨앗을 걸지 않습니다.</p>
            )}
            <div className="duel-modal-actions">
              <button className="cancel-btn" onClick={() => setShowCreate(false)}>취소</button>
              <button className="confirm-btn" onClick={handleCreateRoom} disabled={creating || !roomName.trim()}>
                {creating ? "생성 중..." : "만들기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DuelLobbyPage;
