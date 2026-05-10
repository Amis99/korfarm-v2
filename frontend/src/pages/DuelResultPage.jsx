import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiGet } from "../utils/api";
import { playDuelHaptic } from "../utils/haptics";
import { useAuth } from "../hooks/useAuth";
import EmoticonImage from "../components/chat/EmoticonImage";
import { DUEL_SEED_LABELS, formatSeedStakeBreakdown } from "../constants/duelSeeds";
import "../styles/duel.css";

const DUEL_ASSET_BASE = `${import.meta.env.BASE_URL}images/duel`;

function DuelResultPage() {
  const { matchId } = useParams();
  const { user } = useAuth();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const userId = user?.id;

  useEffect(() => {
    apiGet(`/v1/duel/matches/${matchId}/results`)
      .then((data) => setResult(data))
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [matchId]);

  useEffect(() => {
    const mine = result?.results?.find((r) => r.userId === userId);
    if (mine?.rankPosition === 1) playDuelHaptic("win");
  }, [result, userId]);

  if (loading) {
    return <div className="duel-result"><div className="duel-empty-msg">결과를 불러오는 중...</div></div>;
  }

  if (!result) {
    return (
      <div className="duel-result">
        <div className="duel-empty-msg">
          결과를 찾을 수 없습니다.
          <br />
          <Link to="/duel" style={{ color: "#ff8f2b", fontWeight: 700, marginTop: 16, display: "inline-block" }}>
            대결 메인으로
          </Link>
        </div>
      </div>
    );
  }

  const results = result.results || [];
  const roomId = result.roomId;
  const serverId = result.serverId;
  const escrowBreakdown = formatSeedStakeBreakdown(result.escrowBreakdown);

  // "다시 대결" 목적지: AI 방이거나 방 없으면 로비, 그 외 대기실
  const isAiMatch = results.some((r) => r.userId?.startsWith("ai_player_"));
  const rematchTo = isAiMatch
    ? (serverId ? `/duel/lobby/${serverId}` : "/duel")
    : roomId
      ? `/duel/room/${roomId}`
      : serverId ? `/duel/lobby/${serverId}` : "/duel";

  return (
    <div className="duel-result">
      <img className="duel-result-trophy" src={`${DUEL_ASSET_BASE}/duel-victory-ribbon.png`} alt="" aria-hidden="true" />
      <h1>대결 결과</h1>

      {escrowBreakdown.length > 0 && (
        <div className="duel-pot-panel result-pot">
          <div>
            <strong>이번 경기 씨앗 풀</strong>
            <p>승리 보상은 걸린 씨앗 종류 비율대로 지급됩니다.</p>
          </div>
          <div className="duel-pot-chips">
            {escrowBreakdown.map((seed) => (
              <span key={seed.key} className={`duel-seed-chip ${seed.tone}`}>
                <span>{seed.emoji}</span>{seed.label} {seed.amount}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="duel-result-card">
        {results.map((r, idx) => {
          const isMe = r.userId === userId;
          const isWinner = r.rankPosition === 1;
          const isAi = r.userId?.startsWith("ai_player_");
          const aiAvatarFileId = r.ai_avatar_file_id ?? r.aiAvatarFileId;
          const answered = r.answeredCount ?? 0;
          return (
            <div
              key={r.userId}
              className={`duel-result-row ${isWinner ? "winner" : ""} ${isMe ? "me" : ""}`}
            >
              <div className={`duel-result-rank ${isWinner ? "first" : ""}`}>
                {r.rankPosition ?? idx + 1}
              </div>
              <div className="duel-result-player">
                <div className="name">
                  {isAi && (aiAvatarFileId ? (
                    <EmoticonImage fileId={aiAvatarFileId} alt={r.userName || "AI"} className="result-ai-avatar" />
                  ) : (
                    <span style={{ marginRight: 4 }}>{"\uD83E\uDD16"}</span>
                  ))}
                  {r.userName || "참가자"}
                  {isMe && " (나)"}
                </div>
                <div className="score-detail">
                  {answered}문제 중 {r.correctCount}문제 정답
                </div>
                {formatSeedStakeBreakdown(r.stakeBreakdown).length > 0 && (
                  <div className="score-detail seed-detail">
                    판돈 {formatSeedStakeBreakdown(r.stakeBreakdown).map((seed) => `${seed.emoji}${seed.label} ${seed.amount}`).join(" · ")}
                  </div>
                )}
              </div>
              <div className="duel-result-reward">
                {!isAi && r.rewardAmount > 0 ? (
                  <>
                    <div className="reward-amount">+{r.rewardAmount}</div>
                    <div className="reward-label">
                      {formatSeedStakeBreakdown(r.rewardBreakdown).length > 0
                        ? formatSeedStakeBreakdown(r.rewardBreakdown).map((seed) => `${DUEL_SEED_LABELS[seed.key] || seed.label} ${seed.amount}`).join(" · ")
                        : "씨앗 획득"}
                    </div>
                  </>
                ) : (
                  <div className="reward-label" style={{ color: "#a08878" }}>-</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {result.totalEscrow > 0 && result.systemFee > 0 && (
        <div style={{ textAlign: "center", fontSize: 13, color: "#8a7468", marginBottom: 20 }}>
          총 에스크로: {result.totalEscrow}씨앗 | 수수료: {result.systemFee}씨앗
        </div>
      )}

      <div className="duel-result-actions">
        <Link to={rematchTo} className="primary-btn">
          다시 대결
        </Link>
        <Link to="/start" className="secondary-btn">홈으로</Link>
      </div>
    </div>
  );
}

export default DuelResultPage;
