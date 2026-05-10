import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { apiGet, apiPost, normalizeInventoryKeys } from "../utils/api";
import { playDuelHaptic } from "../utils/haptics";
import { useAuth } from "../hooks/useAuth";
import { DUEL_SEED_TYPES, formatSeedStakeBreakdown } from "../constants/duelSeeds";
import "../styles/duel.css";

const DUEL_ASSET_BASE = `${import.meta.env.BASE_URL}images/duel`;

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
  const [stakeSeedType, setStakeSeedType] = useState("");
  const [creating, setCreating] = useState(false);
  const [inventory, setInventory] = useState(null);
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [pendingAiRoom, setPendingAiRoom] = useState(null);
  const [joiningAi, setJoiningAi] = useState(false);

  const isTheme = isThemeServer(serverId);
  const serverName = isTheme ? "테마 대결" : (SERVER_NAMES[serverId] || serverId);

  const loadRooms = () => {
    apiGet(`/v1/duel/rooms?serverId=${serverId}`)
      .then((data) => setRooms(Array.isArray(data) ? data : []))
      .catch(() => setRooms([]))
      .finally(() => setLoading(false));
  };

  const loadInventory = () => {
    if (isTheme) return;
    setInventoryLoading(true);
    apiGet("/v1/inventory")
      .then((inv) => setInventory(normalizeInventoryKeys(inv)))
      .catch(() => setInventory(null))
      .finally(() => setInventoryLoading(false));
  };

  useEffect(() => {
    if (!isLoggedIn) { navigate("/login"); return; }
    loadRooms();
    const interval = setInterval(loadRooms, 5000);
    return () => clearInterval(interval);
  }, [serverId, isLoggedIn, navigate]);

  const handleCreateRoom = async () => {
    if (!roomName.trim()) return;
    if (!isTheme && !stakeSeedType) return;
    playDuelHaptic("start");
    setCreating(true);
    try {
      const data = await apiPost("/v1/duel/rooms", {
        server_id: serverId,
        room_name: roomName.trim(),
        stake_amount: Number(stakeAmount),
        stake_seed_type: isTheme ? null : stakeSeedType,
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
      playDuelHaptic("tap");
      if (isAiRoom(room)) {
        setStakeAmount(room.stakeAmount || 5);
        setStakeSeedType("");
        setPendingAiRoom(room);
        loadInventory();
        return;
      }
      await apiPost(`/v1/duel/rooms/${room.roomId}/join`);
      navigate(`/duel/room/${room.roomId}`);
    } catch (err) {
      alert(err.message || "입장 실패");
    }
  };

  const handleAiJoinConfirm = async () => {
    if (!stakeSeedType) return;
    playDuelHaptic("start");
    setJoiningAi(true);
    try {
      const data = await apiPost("/v1/duel/rooms/ai-join", {
        serverId,
        stakeSeedType,
      });
      const matchId = data?.matchId || data?.match_id;
      if (matchId) navigate(`/duel/match/${matchId}`);
    } catch (err) {
      alert(err.message || "AI 대결 입장 실패");
    } finally {
      setJoiningAi(false);
    }
  };

  const openCreateModal = () => {
    playDuelHaptic("select");
    setShowCreate(true);
    setStakeSeedType("");
    loadInventory();
  };

  const seeds = inventory?.seeds || {};
  const selectedSeedCount = stakeSeedType ? (seeds[stakeSeedType] ?? 0) : 0;
  const canPaySelectedSeed = isTheme || (stakeSeedType && selectedSeedCount >= Number(stakeAmount));

  return (
    <div className="duel-lobby">
      <div className="duel-lobby-header">
        <div>
          <h1>{serverName}{isTheme ? " (우리 기관 테마)" : " 서버"}</h1>
          <Link to={isTheme ? "/duel/theme" : "/duel"} style={{ fontSize: 13, color: "#8a7468" }}>
            ← {isTheme ? "테마 서버 목록" : "서버 목록"}으로
          </Link>
        </div>
        <button className="duel-create-btn" onClick={openCreateModal}>
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
                <img
                  className="duel-room-mini-art"
                  src={`${DUEL_ASSET_BASE}/${isAiRoom(room) ? "duel-versus-burst.png" : "duel-arena-badge.png"}`}
                  alt=""
                  aria-hidden="true"
                />
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
                  {!isAiRoom(room) && formatSeedStakeBreakdown(room.stakeSeedBreakdown).length > 0 && (
                    <div className="duel-pot-chips compact" aria-label="현재 모인 씨앗">
                      {formatSeedStakeBreakdown(room.stakeSeedBreakdown).map((seed) => (
                        <span key={seed.key} className={`duel-seed-chip ${seed.tone}`}>
                          <span>{seed.emoji}</span>{seed.label} {seed.amount}
                        </span>
                      ))}
                    </div>
                  )}
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
                <label>베팅할 씨앗 종류</label>
                <div className="duel-seed-picker">
                  {inventoryLoading && <div className="duel-seed-loading">씨앗 보유량 확인 중...</div>}
                  {DUEL_SEED_TYPES.map((seed) => {
                    const count = seeds[seed.key] ?? 0;
                    const enough = count >= Number(stakeAmount);
                    return (
                      <button
                        key={seed.key}
                        type="button"
                        className={`duel-seed-choice ${seed.tone}${stakeSeedType === seed.key ? " selected" : ""}${!enough ? " disabled" : ""}`}
                        onClick={() => {
                          if (!enough) return;
                          playDuelHaptic("select");
                          setStakeSeedType(seed.key);
                        }}
                        disabled={!enough}
                      >
                        <span className="seed-emoji">{seed.emoji}</span>
                        <span className="seed-label">{seed.label}</span>
                        <span className="seed-count">{count}개</span>
                      </button>
                    );
                  })}
                </div>
                {stakeSeedType && (
                  <p className="duel-seed-note">
                    이 방의 내 판돈: {DUEL_SEED_TYPES.find((s) => s.key === stakeSeedType)?.label} {stakeAmount}개
                  </p>
                )}
              </>
            )}
            {isTheme && (
              <p style={{ fontSize: 12, color: "#666" }}>테마 대결은 씨앗을 걸지 않습니다.</p>
            )}
            <div className="duel-modal-actions">
              <button className="cancel-btn" onClick={() => setShowCreate(false)}>취소</button>
              <button className="confirm-btn" onClick={handleCreateRoom} disabled={creating || !roomName.trim() || !canPaySelectedSeed}>
                {creating ? "생성 중..." : "만들기"}
              </button>
            </div>
          </div>
        </div>
      )}

      {pendingAiRoom && (
        <div className="duel-modal-overlay" onClick={() => setPendingAiRoom(null)}>
          <div className="duel-modal duel-seed-modal" onClick={(e) => e.stopPropagation()}>
            <h2>AI 즉시 대결</h2>
            <p className="duel-seed-note">베팅할 씨앗 종류를 고르면 바로 매치가 시작됩니다.</p>
            <div className="duel-seed-picker">
              {inventoryLoading && <div className="duel-seed-loading">씨앗 보유량 확인 중...</div>}
              {DUEL_SEED_TYPES.map((seed) => {
                const count = seeds[seed.key] ?? 0;
                const enough = count >= Number(stakeAmount);
                return (
                  <button
                    key={seed.key}
                    type="button"
                    className={`duel-seed-choice ${seed.tone}${stakeSeedType === seed.key ? " selected" : ""}${!enough ? " disabled" : ""}`}
                    onClick={() => {
                      if (!enough) return;
                      playDuelHaptic("select");
                      setStakeSeedType(seed.key);
                    }}
                    disabled={!enough}
                  >
                    <span className="seed-emoji">{seed.emoji}</span>
                    <span className="seed-label">{seed.label}</span>
                    <span className="seed-count">{count}개</span>
                  </button>
                );
              })}
            </div>
            <div className="duel-modal-actions">
              <button className="cancel-btn" onClick={() => setPendingAiRoom(null)}>취소</button>
              <button className="confirm-btn" onClick={handleAiJoinConfirm} disabled={joiningAi || !stakeSeedType || !canPaySelectedSeed}>
                {joiningAi ? "입장 중..." : `${stakeAmount}개 걸고 시작`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DuelLobbyPage;
