import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiGet, apiPost, WS_BASE, camelize, normalizeInventoryKeys } from "../utils/api";
import { playDuelHaptic } from "../utils/haptics";
import { useAuth } from "../hooks/useAuth";
import { DUEL_SEED_TYPES, DUEL_SEED_LABELS, formatSeedStakeBreakdown } from "../constants/duelSeeds";
import "../styles/duel.css";

const DUEL_ASSET_BASE = `${import.meta.env.BASE_URL}images/duel`;

const LEVEL_LABELS = {
  saussure1: "소쉬르 1", saussure2: "소쉬르 2", saussure3: "소쉬르 3",
  frege1: "프레게 1", frege2: "프레게 2", frege3: "프레게 3",
  russell1: "러셀 1", russell2: "러셀 2", russell3: "러셀 3",
  wittgenstein1: "비트겐슈타인 1", wittgenstein2: "비트겐슈타인 2", wittgenstein3: "비트겐슈타인 3",
};

function DuelWaitingRoomPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [room, setRoom] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const wsRef = useRef(null);

  const [wsError, setWsError] = useState(false);

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

    const ws = new WebSocket(`${WS_BASE}/v1/duel/ws?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      if (cancelled) { ws.close(); return; }
      ws.send(JSON.stringify({ type: "room.join", payload: { roomId } }));
    };

    ws.onmessage = (event) => {
      if (cancelled) return;
      const raw = JSON.parse(event.data);
      const { type, payload } = camelize(raw);

      if (type === "room.state" || type === "room.update") {
        setRoom(payload?.room || payload);
        setPlayers(payload?.players || []);
        setLoading(false);
      }

      if (type === "room.closed") {
        alert(payload?.reason || "방이 닫혔습니다.");
        navigate("/duel");
        return;
      }

      if (type === "room.matchStarted") {
        const matchId = payload?.matchId;
        if (matchId) navigate(`/duel/match/${matchId}`);
      }
    };

    ws.onerror = () => {
      setWsError(true);
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
      playDuelHaptic("tap");
      // 이미 준비 상태면 준비 해제
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "room.ready", payload: { roomId } }));
      } else {
        apiPost(`/v1/duel/rooms/${roomId}/ready`).catch((e) => console.error(e));
      }
      return;
    }
    if (isTheme) {
      playDuelHaptic("ready");
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "room.ready", payload: { roomId } }));
      } else {
        apiPost(`/v1/duel/rooms/${roomId}/ready`).catch((e) => console.error(e));
      }
      return;
    }
    // 인벤토리 조회 후 모달 표시
    playDuelHaptic("select");
    apiGet("/v1/inventory")
      .then((inv) => {
        setMyInventory(normalizeInventoryKeys(inv));
        setSelectedSeedType(myPlayer?.stakeSeedType || null);
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
    playDuelHaptic("ready");
    setShowSeedModal(false);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "room.ready",
        payload: { roomId, stakeSeedType: selectedSeedType },
      }));
    } else {
      apiPost(`/v1/duel/rooms/${roomId}/ready`, { stake_seed_type: selectedSeedType }).catch((e) => console.error(e));
    }
  };

  const handleHostSeedClick = () => {
    playDuelHaptic("select");
    apiGet("/v1/inventory")
      .then((inv) => {
        setMyInventory(normalizeInventoryKeys(inv));
        setSelectedSeedType(myPlayer?.stakeSeedType || null);
        setShowSeedModal(true);
      })
      .catch(() => {
        setMyInventory(null);
        setSelectedSeedType(myPlayer?.stakeSeedType || null);
        setShowSeedModal(true);
      });
  };

  const handleStart = () => {
    playDuelHaptic("start");
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "room.start", payload: { roomId } }));
    } else {
      apiPost(`/v1/duel/rooms/${roomId}/start`)
        .then((data) => {
          const matchId = data?.matchId;
          if (matchId) navigate(`/duel/match/${matchId}`);
        })
        .catch((err) => alert(err.message || "시작 실패"));
    }
  };

  const handleLeave = () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "room.leave", payload: { roomId } }));
    }
    apiPost(`/v1/duel/rooms/${roomId}/leave`).catch((e) => console.error(e));
    navigate(-1);
  };

  const isHost = room?.createdBy === userId;
  const myPlayer = players.find((p) => p.userId === userId);
  const myReady = myPlayer?.isReady ?? false;
  const stakeAmount = room?.stakeAmount ?? 0;
  const isTheme = room?.serverId?.startsWith("theme_");
  const humanPlayers = players.filter((p) => !String(p.userId || "").startsWith("ai_player_"));
  const allHumansReady = isTheme || humanPlayers.every((p) => p.isReady && p.stakeSeedType);
  const canStart = isHost && players.length >= 2 && allHumansReady;
  const potBreakdown = formatSeedStakeBreakdown(room?.stakeSeedBreakdown);

  const seeds = myInventory?.seeds || {};

  if (wsError && loading) {
    return (
      <div className="duel-waiting">
        <div className="duel-empty-msg">
          <p>서버 연결에 실패했습니다.</p>
          <button className="duel-create-btn" onClick={() => navigate(-1)}>돌아가기</button>
        </div>
      </div>
    );
  }

  if (loading) {
    return <div className="duel-waiting"><div className="duel-empty-msg">불러오는 중...</div></div>;
  }

  return (
    <div className="duel-waiting">
      <div className="duel-waiting-header">
        <img className="duel-room-emblem" src={`${DUEL_ASSET_BASE}/duel-arena-badge.png`} alt="" aria-hidden="true" />
        <h1>{room?.roomName || "대기방"}</h1>
        <div className="room-info">
          {isTheme ? "씨앗 없는 테마전" : `베팅 ${stakeAmount}씨앗`} | {players.length}/{room?.roomSize ?? 10}명
        </div>
      </div>

      {!isTheme && (
        <div className="duel-pot-panel">
          <div>
            <strong>승리자가 가져갈 씨앗 풀</strong>
            <p>{potBreakdown.length > 0 ? "준비 완료한 참가자의 판돈이 모이고 있어요." : "아직 모인 씨앗이 없습니다."}</p>
          </div>
          {potBreakdown.length > 0 && (
            <div className="duel-pot-chips">
              {potBreakdown.map((seed) => (
                <span key={seed.key} className={`duel-seed-chip ${seed.tone}`}>
                  <span>{seed.emoji}</span>{seed.label} {seed.amount}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="duel-players-list">
        {players.map((p) => {
          const profileImg = p.profileImageUrl;
          const levelId = p.levelId;
          const wins = p.wins ?? 0;
          const losses = p.losses ?? 0;
          const winRate = p.winRate ?? 0;
          const isReady = p.isReady;
          const levelLabel = levelId ? (LEVEL_LABELS[levelId] || levelId) : null;

          return (
            <div key={p.userId} className={`duel-player-row${isReady ? " is-ready" : ""}`}>
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
                  <span className="player-name">{p.userName || "참가자"}</span>
                  {p.userId === room?.createdBy && <span className="host-badge">방장</span>}
                </div>
                {levelLabel && <span className="player-level">{levelLabel}</span>}
                <span className="player-record">
                  <span className="wins">{wins}승</span>{" "}
                  <span className="losses">{losses}패</span>{" "}
                  <span className="win-rate">({(winRate * 100).toFixed(0)}%)</span>
                </span>
                {!isTheme && p.stakeSeedType && (
                  <span className="player-stake-seed">
                    판돈: {DUEL_SEED_LABELS[p.stakeSeedType] || "씨앗"} {stakeAmount}개
                  </span>
                )}
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
          <>
            {!isTheme && (
              <button className="duel-ready-btn not-ready" onClick={handleHostSeedClick}>
                {myPlayer?.stakeSeedType ? `내 판돈: ${DUEL_SEED_LABELS[myPlayer.stakeSeedType]}` : "내 씨앗 선택"}
              </button>
            )}
            <button className="duel-start-btn" onClick={handleStart} disabled={!canStart}>
              {players.length < 2 ? `${players.length}/2명 이상 필요` : canStart ? "시작하기" : "참가자 준비 대기"}
            </button>
          </>
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
            className="result-card duel-seed-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h2>베팅할 씨앗 종류 선택</h2>
            <p style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
              베팅: {stakeAmount}개
            </p>

            <div className="seed-grid">
              {DUEL_SEED_TYPES.map((s) => {
                const count = seeds[s.key] ?? 0;
                const enough = count >= stakeAmount;
                const isSelected = selectedSeedType === s.key;
                return (
                  <button
                    key={s.key}
                    type="button"
                    className={`duel-seed-btn ${s.tone} ${isSelected ? "selected" : enough ? "available" : "unavailable"}`}
                    onClick={() => {
                      if (!enough) return;
                      playDuelHaptic("select");
                      setSelectedSeedType(s.key);
                    }}
                  >
                    <span>{s.emoji}</span> {s.label} {count}개
                  </button>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button
                type="button"
                className="duel-confirm-btn"
                onClick={handleSeedConfirm}
                disabled={!selectedSeedType}
              >
                확인
              </button>
              <button
                type="button"
                className="duel-cancel-btn"
                onClick={() => setShowSeedModal(false)}
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
