import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { apiGet } from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import "../styles/duel.css";

function DuelResultPage() {
  const { matchId } = useParams();
  const { user } = useAuth();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);

  const userId = user?.id;

  useEffect(() => {
    apiGet(`/v1/duel/matches/${matchId}/results`)
      .then((data) => setResult(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [matchId]);

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
  const serverId = result.server_id;

  const formatTime = (ms) => {
    if (!ms) return "0.0초";
    return (ms / 1000).toFixed(1) + "초";
  };

  return (
    <div className="duel-result">
      <h1>대결 결과</h1>

      <div className="duel-result-card">
        {results.map((r, idx) => {
          const isMe = r.user_id === userId;
          const isWinner = r.rank_position === 1;
          return (
            <div
              key={r.user_id}
              className={`duel-result-row ${isWinner ? "winner" : ""} ${isMe ? "me" : ""}`}
            >
              <div className={`duel-result-rank ${isWinner ? "first" : ""}`}>
                {r.rank_position ?? idx + 1}
              </div>
              <div className="duel-result-player">
                <div className="name">
                  {r.user_name || "참가자"}
                  {isMe && " (나)"}
                </div>
                <div className="score-detail">
                  정답 {r.correct_count}/10 | 시간 {formatTime(r.total_time_ms)}
                </div>
              </div>
              <div className="duel-result-reward">
                {r.reward_amount > 0 ? (
                  <>
                    <div className="reward-amount">+{r.reward_amount}</div>
                    <div className="reward-label">씨앗 획득</div>
                  </>
                ) : (
                  <div className="reward-label" style={{ color: "#a08878" }}>-</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {result.total_escrow > 0 && (
        <div style={{ textAlign: "center", fontSize: 13, color: "#8a7468", marginBottom: 20 }}>
          총 에스크로: {result.total_escrow}씨앗 | 수수료: {result.system_fee}씨앗
        </div>
      )}

      <div className="duel-result-actions">
        <Link to={serverId ? `/duel/lobby/${serverId}` : "/duel"} className="primary-btn">
          다시 대결
        </Link>
        <Link to="/start" className="secondary-btn">홈으로</Link>
      </div>
    </div>
  );
}

export default DuelResultPage;
