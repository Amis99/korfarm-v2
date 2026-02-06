import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import "../styles/duel.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

const LEVEL_LABELS = {
  saussure1: "소쉬르 1", saussure2: "소쉬르 2", saussure3: "소쉬르 3",
  frege1: "프레게 1", frege2: "프레게 2", frege3: "프레게 3",
  russell1: "러셀 1", russell2: "러셀 2", russell3: "러셀 3",
  wittgenstein1: "비트겐슈타인 1", wittgenstein2: "비트겐슈타인 2", wittgenstein3: "비트겐슈타인 3",
};

const SEED_TYPES = [
  { key: "seed_wheat", label: "밀" },
  { key: "seed_rice", label: "쌀" },
  { key: "seed_corn", label: "옥수수" },
  { key: "seed_grape", label: "포도" },
  { key: "seed_apple", label: "사과" },
];

function DuelWaitingRoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef(null);

  // 씨앗 선택 모달 상태
  const [showSeedModal, setShowSeedModal] = useState(false);
  const [myInventory, setMyInventory] = useState(null);
  const [selectedSeedType, setSelectedSeedType] = useState(null);

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

      if (type === "room.closed") {
        alert("방이 닫혔습니다.");
        navigate(-1);
        return;
      }

      if (type === "room.matchStarted") {
        const matchId = payload?.match_id || payload?.matchId;
        if (matchId) navigate(`/duel/match/${matchId}`);
      }
    };

    ws.onclose = () => {};

    return () => {
      cancelled = true;
      // StrictMode double-invoke 대응: OPEN 상태일 때만 닫기
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      } else if (ws.readyState === WebSocket.CONNECTING) {
        ws.addEventListener("open", () => ws.close(), { once: true });
      }
    };
  }, [roomId, token, navigate]);

  // 준비하기 클릭 → 모달 열기 (인벤토리 조회)
  const handleReadyClick = () => {
    if (myReady) {
      // 이미 준비 상태면 준비 해제
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "room.ready", payload: { roomId } }));
      }
      return;
    }
    // 인벤토리 조회 후 모달 표시
    apiGet("/v1/inventory")
      .then((inv) => {
        setMyInventory(inv);
        setSelectedSeedType(null);
        setShowSeedModal(true);
      })
      .catch(() => {
        setMyInventory(null);
        setShowSeedModal(true);
      });
  };

  // 모달에서 확인 → 준비 메시지 전송
  const handleSeedConfirm = () => {
    if (!selectedSeedType) return;
    setShowSeedModal(false);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "room.ready",
        payload: { roomId, stakeSeedType: selectedSeedType },
      }));
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
  const stakeAmount = room?.stake_amount ?? 0;

  const seeds = myInventory?.seeds || {};

  if (loading) {
    return <div className="duel-waiting"><div className="duel-empty-msg">불러오는 중...</div></div>;
  }

  return (
    <div className="duel-waiting">
      <div className="duel-waiting-header">
        <h1>{room?.room_name || "대기방"}</h1>
        <div className="room-info">
          베팅 {stakeAmount}씨앗 | {players.length}/{room?.room_size ?? 10}명
        </div>
      </div>

      <div className="duel-players-list">
        {players.map((p) => {
          const profileImg = p.profile_image_url || p.profileImageUrl;
          const levelId = p.level_id || p.levelId;
          const wins = p.wins ?? 0;
          const losses = p.losses ?? 0;
          const winRate = p.win_rate ?? p.winRate ?? 0;
          const isReady = p.is_ready ?? p.isReady;
          const levelLabel = levelId ? (LEVEL_LABELS[levelId] || levelId) : null;

          return (
            <div key={p.user_id} className={`duel-player-row${isReady ? " is-ready" : ""}`}>
              <div
                className="player-avatar"
                style={profileImg ? { backgroundImage: `url(${profileImg})` } : undefined}
              >
                {!profileImg && (
                  <span className="material-symbols-outlined avatar-fallback">person</span>
                )}
              </div>

              <div className="player-info">
                <div className="player-name-row">
                  <span className="player-name">{p.user_name || "참가자"}</span>
                  {p.user_id === room?.created_by && <span className="host-badge">방장</span>}
                </div>
                {levelLabel && <span className="player-level">{levelLabel}</span>}
                <span className="player-record">
                  <span className="wins">{wins}승</span>{" "}
                  <span className="losses">{losses}패</span>{" "}
                  <span className="win-rate">({(winRate * 100).toFixed(0)}%)</span>
                </span>
              </div>

              <div className="player-status">
                <span className={`ready-badge ${isReady ? "ready" : "not-ready"}`}>
                  {isReady ? "준비 완료" : "대기 중"}
                </span>
              </div>
            </div>
          );
        })}
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
            onClick={handleReadyClick}
          >
            {myReady ? "준비 완료" : "준비하기"}
          </button>
        )}
      </div>

      {/* 씨앗 종류 선택 모달 */}
      {showSeedModal && (
        <div
          className="result-overlay"
          onClick={() => setShowSeedModal(false)}
        >
          <div
            className="result-card"
            style={{ padding: 24, background: "#fff", maxWidth: 380, width: "90%", textAlign: "center" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginBottom: 12, fontSize: 18 }}>베팅할 씨앗 종류 선택</h2>
            <p style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
              베팅: {stakeAmount}개
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 20 }}>
              {SEED_TYPES.map((s) => {
                const count = seeds[s.key] ?? 0;
                const enough = count >= stakeAmount;
                const isSelected = selectedSeedType === s.key;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => enough && setSelectedSeedType(s.key)}
                    style={{
                      padding: "10px 16px",
                      borderRadius: 10,
                      border: isSelected ? "2px solid #ff8f2b" : "1px solid #ddd",
                      background: isSelected ? "#fff5eb" : enough ? "#fff" : "#f5f5f5",
                      color: enough ? "#333" : "#bbb",
                      cursor: enough ? "pointer" : "not-allowed",
                      fontWeight: isSelected ? 700 : 400,
                      fontSize: 14,
                      minWidth: 80,
                    }}
                  >
                    {s.label} {count}개
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button
                type="button"
                onClick={handleSeedConfirm}
                disabled={!selectedSeedType}
                style={{
                  border: "none",
                  background: selectedSeedType ? "#ff8f2b" : "#ccc",
                  color: "#fff",
                  padding: "10px 24px",
                  borderRadius: 10,
                  cursor: selectedSeedType ? "pointer" : "not-allowed",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                확인
              </button>
              <button
                type="button"
                onClick={() => setShowSeedModal(false)}
                style={{
                  border: "none",
                  background: "#aaa",
                  color: "#fff",
                  padding: "10px 24px",
                  borderRadius: 10,
                  cursor: "pointer",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DuelWaitingRoomPage;
