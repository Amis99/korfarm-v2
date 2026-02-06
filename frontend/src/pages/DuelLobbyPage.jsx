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

  const serverName = SERVER_NAMES[serverId] || serverId;

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
      const roomId = data?.room?.room_id || data?.room_id;
      if (roomId) navigate(`/duel/room/${roomId}`);
    } catch (err) {
      alert(err.message || "방 생성 실패");
    } finally {
      setCreating(false);
    }
  };

  const handleJoinRoom = async (roomId) => {
    try {
      await apiPost(`/v1/duel/rooms/${roomId}/join`);
      navigate(`/duel/room/${roomId}`);
    } catch (err) {
      alert(err.message || "입장 실패");
    }
  };

  return (
    <div className="duel-lobby">
      <div className="duel-lobby-header">
        <div>
          <h1>{serverName} 서버</h1>
          <Link to="/duel" style={{ fontSize: 13, color: "#8a7468" }}>
            서버 목록으로
          </Link>
        </div>
        <button className="duel-create-btn" onClick={() => setShowCreate(true)}>
          방 만들기
        </button>
      </div>

      {loading ? (
        <div className="duel-empty-msg">불러오는 중...</div>
      ) : rooms.length === 0 ? (
        <div className="duel-empty-msg">열린 방이 없습니다. 새 방을 만들어보세요!</div>
      ) : (
        <div className="duel-room-list">
          {rooms.map((room) => (
            <div key={room.room_id} className="duel-room-item" onClick={() => handleJoinRoom(room.room_id)}>
              <div className="duel-room-info">
                <div className="room-name">{room.room_name || "대결방"}</div>
                <div className="room-meta">베팅 {room.stake_amount}씨앗 | 최대 {room.room_size}명</div>
              </div>
              <div className="duel-room-right">
                <div className="player-count">{room.player_count}/{room.room_size}</div>
                <div className="stake-info">참가자</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="duel-modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="duel-modal" onClick={(e) => e.stopPropagation()}>
            <h2>방 만들기</h2>
            <label>방 이름</label>
            <input value={roomName} onChange={(e) => setRoomName(e.target.value)} placeholder="방 이름을 입력하세요" maxLength={50} />
            <label>베팅 씨앗 (1~50)</label>
            <input type="number" min={1} max={50} value={stakeAmount} onChange={(e) => setStakeAmount(e.target.value)} />
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
