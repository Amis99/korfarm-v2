import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import "../styles/duel.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

function DuelWaitingRoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef(null);

  const userId = user?.id;

  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    let cancelled = false;

    apiGet(`/v1/duel/rooms/${roomId}`)
      .then((data) => {
        if (cancelled) return;
        setRoom(data?.room || data);
        setPlayers(data?.players || []);
        setLoading(false);
      })
      .catch(() => { if (!cancelled) setLoading(false); });

    const wsBase = API_BASE.replace(/^http/, "ws");
    const ws = new WebSocket(`${wsBase}/v1/duel/ws?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      if (cancelled) { ws.close(); return; }
      ws.send(JSON.stringify({ type: "room.join", payload: { roomId } }));
    };

    ws.onmessage = (event) => {
      if (cancelled) return;
      const msg = JSON.parse(event.data);
      const { type, payload } = msg;

      if (type === "room.state" || type === "room.update") {
        setRoom(payload?.room || payload);
        setPlayers(payload?.players || []);
        setLoading(false);
      }

      if (type === "room.matchStarted") {
        const matchId = payload?.match_id || payload?.matchId;
        if (matchId) navigate(`/duel/match/${matchId}`);
      }
    };

    ws.onclose = () => {};

    return () => {
      cancelled = true;
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [roomId, token, navigate]);

  const handleReady = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "room.ready", payload: { roomId } }));
    } else {
      apiPost(`/v1/duel/rooms/${roomId}/ready`).catch(() => {});
    }
  };

  const handleStart = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "room.start", payload: { roomId } }));
    } else {
      apiPost(`/v1/duel/rooms/${roomId}/start`)
        .then((data) => {
          const matchId = data?.matchId || data?.match_id;
          if (matchId) navigate(`/duel/match/${matchId}`);
        })
        .catch((err) => alert(err.message || "시작 실패"));
    }
  };

  const handleLeave = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "room.leave", payload: { roomId } }));
    }
    apiPost(`/v1/duel/rooms/${roomId}/leave`).catch(() => {});
    navigate(-1);
  };

  const isHost = room?.created_by === userId;
  const canStart = isHost && players.length >= 2;
  const myPlayer = players.find((p) => p.user_id === userId);
  const myReady = myPlayer?.is_ready ?? false;

  if (loading) {
    return <div className="duel-waiting"><div className="duel-empty-msg">불러오는 중...</div></div>;
  }

  return (
    <div className="duel-waiting">
      <div className="duel-waiting-header">
        <h1>{room?.room_name || "대기방"}</h1>
        <div className="room-info">
          베팅 {room?.stake_amount ?? 0}씨앗 | {players.length}/{room?.room_size ?? 10}명
        </div>
      </div>

      <div className="duel-players-list">
        {players.map((p) => (
          <div key={p.user_id} className="duel-player-row">
            <div>
              <span className="player-name">{p.user_name || "참가자"}</span>
              {p.user_id === room?.created_by && <span className="host-badge">방장</span>}
            </div>
            <span className={`ready-badge ${p.is_ready ? "ready" : "not-ready"}`}>
              {p.is_ready ? "준비 완료" : "대기 중"}
            </span>
          </div>
        ))}
      </div>

      <div className="duel-waiting-actions">
        <button className="duel-leave-btn" onClick={handleLeave}>나가기</button>
        {isHost ? (
          <button className="duel-start-btn" onClick={handleStart} disabled={!canStart}>
            {canStart ? "시작하기" : `${players.length}/2명 이상 필요`}
          </button>
        ) : (
          <button
            className={`duel-ready-btn ${myReady ? "" : "not-ready"}`}
            onClick={handleReady}
          >
            {myReady ? "준비 완료" : "준비하기"}
          </button>
        )}
      </div>
    </div>
  );
}

export default DuelWaitingRoomPage;
