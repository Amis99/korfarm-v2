import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { WS_BASE } from "../utils/api";
import PassageMarkdown from "../components/PassageMarkdown";
import "../styles/duel.css";

function DuelMatchPage() {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const wsRef = useRef(null);
  const timerRef = useRef(null);
  const eliminatedRef = useRef(false);

  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(10);
  const [timeLimitSec, setTimeLimitSec] = useState(30);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(30);

  // phase: loading | answering | waiting | roundResult | eliminated | spectating | finished
  const [phase, setPhase] = useState("loading");
  const [answers, setAnswers] = useState({});
  const [answerResult, setAnswerResult] = useState(null);
  const [roundResult, setRoundResult] = useState(null);
  const [players, setPlayers] = useState([]);
  const [eliminated, setEliminated] = useState(false);
  const [remainingCount, setRemainingCount] = useState(0);
  const [visibleMark, setVisibleMark] = useState(null); // "correct" | "wrong" | null
  const [wsError, setWsError] = useState(false);

  const userId = user?.id;

  // 문제별 카운트다운 타이머
  useEffect(() => {
    if (phase !== "answering" && phase !== "waiting") {
      clearInterval(timerRef.current);
      return;
    }

    clearInterval(timerRef.current);
    setQuestionTimeLeft(timeLimitSec);

    timerRef.current = setInterval(() => {
      setQuestionTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [currentQuestion?.question_id, timeLimitSec]);

  // 정답/오답 O/X 마크 표시
  useEffect(() => {
    if (!answerResult) { setVisibleMark(null); return; }
    setVisibleMark(answerResult.isCorrect ? "correct" : "wrong");
    const timer = setTimeout(() => setVisibleMark(null), 1000);
    return () => clearTimeout(timer);
  }, [answerResult]);

  // WebSocket 연결
  useEffect(() => {
    if (!token) { navigate("/login"); return; }
    let cancelled = false;

    const ws = new WebSocket(`${WS_BASE}/v1/duel/ws?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      if (cancelled) { ws.close(); return; }
      ws.send(JSON.stringify({ type: "match.join", payload: { matchId } }));
    };

    ws.onmessage = (event) => {
      if (cancelled) return;
      const msg = JSON.parse(event.data);
      const { type, payload } = msg;

      // 서버에서 문제 1개 전송 (문제별 동기 진행)
      if (type === "match.question") {
        const q = payload.question;
        const idx = payload.questionIndex ?? payload.question_index ?? 0;
        const tl = payload.timeLimitSec ?? payload.time_limit_sec ?? 30;
        const tq = payload.totalQuestions ?? payload.total_questions ?? 10;
        const rp = payload.remainingPlayers ?? payload.remaining_players ?? 0;

        setCurrentQuestion(q);
        setQuestionIndex(idx);
        setTotalQuestions(tq);
        setTimeLimitSec(tl);
        setRemainingCount(rp);
        setAnswerResult(null);
        setRoundResult(null);
        if (!eliminatedRef.current) {
          setPhase("answering");
        }
      }

      // 내 답변 결과 (정답/오답)
      if (type === "match.answerResult") {
        const isCorrect = payload.is_correct ?? payload.isCorrect;
        setAnswerResult({ isCorrect });
        setPhase("waiting");
      }

      // 참가자 상태 업데이트
      if (type === "match.state") {
        setPlayers(payload?.players || []);
      }

      // 라운드 결과 (탈락자 발표)
      if (type === "match.roundResult") {
        const eliminatedList = payload.eliminated || [];
        const correctId = payload.correctAnswerId ?? payload.correct_answer_id ?? "";
        const remaining = payload.remainingCount ?? payload.remaining_count ?? 0;

        setRoundResult({
          eliminated: eliminatedList,
          correctAnswerId: correctId,
          remainingCount: remaining,
        });
        setRemainingCount(remaining);

        if (Array.isArray(eliminatedList) && eliminatedList.includes(userId)) {
          setEliminated(true);
          eliminatedRef.current = true;
          setPhase("eliminated");
        } else if (!eliminatedRef.current) {
          setPhase("roundResult");
        }
      }

      // 매치 종료
      if (type === "match.finish") {
        setPhase("finished");
        clearInterval(timerRef.current);
        setTimeout(() => navigate(`/duel/result/${matchId}`), 2000);
      }
    };

    ws.onerror = () => {
      setWsError(true);
    };

    ws.onclose = () => {};

    return () => {
      cancelled = true;
      clearInterval(timerRef.current);
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      } else if (ws.readyState === WebSocket.CONNECTING) {
        ws.addEventListener("open", () => ws.close(), { once: true });
      }
    };
  }, [matchId, token, navigate]);

  const handleAnswer = (choiceId) => {
    const qId = currentQuestion?.question_id;
    if (!currentQuestion || answers[qId] || phase !== "answering") return;

    setAnswers((prev) => ({ ...prev, [qId]: choiceId }));

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: "match.answer",
        payload: { matchId, questionId: qId, answer: choiceId },
      }));
    }
  };

  const timerPercent = timeLimitSec > 0 ? (questionTimeLeft / timeLimitSec) * 100 : 0;
  const timerColorClass = timerPercent > 50 ? "safe" : timerPercent > 20 ? "warning" : "danger";

  // 연결 오류
  if (wsError && phase === "loading") {
    return (
      <div className="duel-match">
        <div className="duel-empty-msg">
          <p>서버 연결에 실패했습니다.</p>
          <button className="duel-create-btn" onClick={() => navigate(-1)}>돌아가기</button>
        </div>
      </div>
    );
  }

  // 로딩
  if (phase === "loading" && !currentQuestion) {
    return (
      <div className="duel-match">
        <div className="duel-empty-msg">문제를 불러오는 중...</div>
      </div>
    );
  }

  // 종료 화면
  if (phase === "finished") {
    return (
      <div className="duel-match">
        <div className="duel-empty-msg">
          <h2>대결 종료!</h2>
          <p>결과를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const qId = currentQuestion?.question_id;
  const myAnswer = answers[qId];
  const isRoundResult = phase === "roundResult";
  const answeredCount = players.filter((p) => p.answered_current ?? p.answeredCurrent).length;
  const activeCount = players.filter((p) => p.active !== false).length;

  return (
    <div className="duel-match">
      {/* 문제별 타이머 바 */}
      <div className="duel-question-timer-bar">
        <div
          className={`timer-fill ${timerColorClass}`}
          style={{ width: `${timerPercent}%`, transition: "width 1s linear" }}
        />
      </div>

      <div className="duel-match-header">
        <div className="duel-timer-text">{questionTimeLeft}초</div>
        <div className="duel-progress-indicator">
          라운드 {questionIndex + 1}
        </div>
      </div>

      {/* 참가자 프로필 스트립 */}
      <div className="duel-player-strip">
        {players.map((p) => {
          const pid = p.user_id ?? p.userId;
          const name = pid === userId ? "나" : (p.user_name ?? p.userName ?? "?");
          const isActive = p.active !== false;
          const answeredCurrent = p.answered_current ?? p.answeredCurrent;
          const isMe = pid === userId;
          const isAi = pid?.startsWith("ai_player_");
          return (
            <div
              key={pid}
              className={`duel-player-avatar${!isActive ? " eliminated" : ""}${answeredCurrent ? " answered" : ""}${isMe ? " me" : ""}${isAi ? " ai" : ""}`}
              title={name}
            >
              <span className="avatar-letter">{isAi ? "\uD83E\uDD16" : name.charAt(0)}</span>
              {answeredCurrent && isActive && <span className="avatar-check">✓</span>}
            </div>
          );
        })}
      </div>

      {/* 관전 모드 배너 */}
      {phase === "spectating" && (
        <div className="duel-spectating-banner">
          <span>탈락 - 관전 중</span>
          <button onClick={() => navigate(`/duel/result/${matchId}`)}>나가기</button>
        </div>
      )}

      {currentQuestion && (
        <div className="duel-question-area">
          <span className={`duel-question-type-badge ${currentQuestion.question_type === "READING" ? "reading" : "quiz"}`}>
            {currentQuestion.question_type === "READING" ? "독해" : "퀴즈"} - {currentQuestion.category}
          </span>

          {currentQuestion.passage && currentQuestion.passage !== "null" && (
            <PassageMarkdown className="duel-passage">{currentQuestion.passage}</PassageMarkdown>
          )}

          <PassageMarkdown className="duel-stem">{currentQuestion.stem}</PassageMarkdown>

          <div className="duel-choices">
            {currentQuestion.choices?.map((choice) => {
              const selected = myAnswer === choice.id;
              let cls = "duel-choice-btn";

              if (isRoundResult && roundResult) {
                if (choice.id === roundResult.correctAnswerId) {
                  cls += " correct";
                } else if (selected) {
                  cls += " wrong";
                }
              } else if (selected && answerResult) {
                cls += answerResult.isCorrect ? " correct" : " wrong";
              } else if (selected) {
                cls += " selected";
              }

              return (
                <button
                  key={choice.id}
                  className={cls}
                  onClick={() => handleAnswer(choice.id)}
                  disabled={!!myAnswer || phase !== "answering"}
                >
                  <RichText>{choice.text}</RichText>
                </button>
              );
            })}
          </div>

          {/* O/X 마크 오버레이 */}
          {visibleMark && (
            <div className={`duel-answer-mark ${visibleMark}`} />
          )}
        </div>
      )}

      {/* 대기 중 오버레이 */}
      {phase === "waiting" && (
        <div className="duel-waiting-overlay">
          <div className="waiting-spinner" />
          <p>다른 참가자를 기다리는 중...</p>
          <div className="duel-waiting-progress">
            {answeredCount} / {activeCount} 답변 완료
          </div>
        </div>
      )}

      {/* 라운드 결과 (탈락자 발표) */}
      {isRoundResult && roundResult && (
        <div className="duel-round-result">
          {roundResult.eliminated.length > 0 ? (
            <p className="eliminated-info">
              💥 {roundResult.eliminated.length}명 탈락! 남은 참가자: {roundResult.remainingCount}명
            </p>
          ) : answerResult?.isCorrect ? (
            <p className="all-correct">전원 정답! 다음 문제로 진행합니다.</p>
          ) : (
            <p className="no-eliminated">전원 오답! 탈락 없이 다음 문제로 진행합니다.</p>
          )}
        </div>
      )}

      {/* 탈락 오버레이 */}
      {phase === "eliminated" && (
        <div className="duel-eliminated-overlay">
          <div className="eliminated-card">
            <div className="eliminated-icon">💥</div>
            <h2>탈락!</h2>
            <p>아쉽지만 오답으로 탈락했습니다.</p>
            <p className="remaining-info">남은 참가자: {remainingCount}명</p>
            <div className="eliminated-actions">
              <button className="spectate-btn" onClick={() => setPhase("spectating")}>관전하기</button>
              <button className="leave-btn" onClick={() => navigate(`/duel/result/${matchId}`)}>나가기</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default DuelMatchPage;
