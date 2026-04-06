import { useEffect, useReducer, useRef } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { apiGet, apiPost } from "../utils/api";
import PassageRenderer from "../components/diagnostic/PassageRenderer";
import ChoiceSelector from "../components/diagnostic/ChoiceSelector";
import RichText from "../utils/RichText";
import "../styles/diagnostic-v2.css";

const TIME_LIMIT_SEC = 60 * 60; // 60분

const initialState = {
  questions: [],
  answers: {},
  currentIndex: 0,
  isSubmitting: false,
  error: "",
  timeLeft: TIME_LIMIT_SEC,
};

function reducer(state, action) {
  switch (action.type) {
    case "INIT":
      return { ...initialState, questions: action.questions };
    case "SELECT_CHOICE":
      return {
        ...state,
        answers: { ...state.answers, [action.questionId]: action.choice },
      };
    case "GO_INDEX":
      return { ...state, currentIndex: Math.max(0, Math.min(action.index, state.questions.length - 1)) };
    case "TICK":
      return { ...state, timeLeft: Math.max(0, state.timeLeft - 1) };
    case "SUBMITTING":
      return { ...state, isSubmitting: true, error: "" };
    case "ERROR":
      return { ...state, isSubmitting: false, error: action.message };
    default:
      return state;
  }
}

function formatTime(sec) {
  const m = Math.floor(sec / 60).toString().padStart(2, "0");
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function DiagnosticTestPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [state, dispatch] = useReducer(reducer, initialState);
  const submittingRef = useRef(false);

  useEffect(() => {
    const firstBatch = location.state?.firstBatch;
    if (firstBatch && firstBatch.length > 0) {
      dispatch({ type: "INIT", questions: firstBatch });
    } else {
      // 새로고침 등 → 세션 복원 불가, 목록으로
      apiGet(`/v1/diagnostic/sessions/${sessionId}`)
        .then(sess => {
          if (sess.status !== "active") {
            navigate(`/diagnostic/v2/report/${sessionId}`);
          } else {
            // 진행 중이지만 questions가 없으므로 다시 시작 안내
            navigate("/diagnostic/v2");
          }
        })
        .catch(() => navigate("/diagnostic/v2"));
    }
  }, [sessionId, navigate, location.state]);

  // 60분 카운트다운
  useEffect(() => {
    if (state.questions.length === 0) return;
    const timer = setInterval(() => dispatch({ type: "TICK" }), 1000);
    return () => clearInterval(timer);
  }, [state.questions.length]);

  // 시간 만료 시 자동 제출
  useEffect(() => {
    if (state.questions.length === 0) return;
    if (state.timeLeft <= 0 && !submittingRef.current) {
      submittingRef.current = true;
      handleSubmit(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.timeLeft, state.questions.length]);

  const handleSubmit = async (isAuto = false) => {
    if (state.isSubmitting) return;
    const unanswered = state.questions.filter(q => !state.answers[q.questionId]);
    if (!isAuto && unanswered.length > 0) {
      const ok = window.confirm(
        `${unanswered.length}문항이 미응답입니다.\n\n찍고 넘어간 문제는 풀이속도 측정 시 1문항당 3분이 가산됩니다. 그래도 제출하시겠습니까?`
      );
      if (!ok) return;
    }

    dispatch({ type: "SUBMITTING" });
    try {
      const responses = state.questions
        .filter(q => state.answers[q.questionId])
        .map(q => ({ questionId: q.questionId, choice: state.answers[q.questionId] }));

      await apiPost(`/v1/diagnostic/sessions/${sessionId}/respond`, { responses });
      await apiPost(`/v1/diagnostic/sessions/${sessionId}/complete`);
      navigate(`/diagnostic/v2/report/${sessionId}`);
    } catch (err) {
      submittingRef.current = false;
      dispatch({ type: "ERROR", message: err.message || "제출에 실패했습니다." });
    }
  };

  if (state.questions.length === 0) {
    return <div className="diag-v2-loading">불러오는 중...</div>;
  }

  const currentQ = state.questions[state.currentIndex];
  const showPassage = state.currentIndex === 0
    || state.questions[state.currentIndex - 1]?.passageId !== currentQ.passageId;

  const answeredCount = Object.keys(state.answers).length;
  const total = state.questions.length;
  const progressPct = (answeredCount / total) * 100;
  const timeWarn = state.timeLeft <= 5 * 60; // 5분 이하 경고

  return (
    <div className="diag-test-page">
      <div className="diag-test-topbar">
        <h2>역량 진단 ({total}문항)</h2>
        <span className={`diag-test-timer ${timeWarn ? "warn" : ""}`}>
          남은 시간 {formatTime(state.timeLeft)}
        </span>
      </div>

      <div className="diag-test-progress">
        <div className="diag-test-progress-fill" style={{ width: `${Math.min(progressPct, 100)}%` }} />
      </div>

      <div className="diag-test-batch-info">
        <span>{state.currentIndex + 1} / {total}</span>
        <span style={{ marginLeft: 12, color: "#8b7e74" }}>
          응답 {answeredCount} · 미응답 {total - answeredCount}
        </span>
      </div>

      <div className="diag-test-cat-notice">
        문제를 다 풀면 답안을 바로 제출하세요. 찍고 넘어간 문제는 풀이속도 측정 시 1문항당 3분이 가산됩니다.
      </div>

      {showPassage && currentQ.passageText && (
        <PassageRenderer text={currentQ.passageText} />
      )}

      <div className="diag-test-question">
        <div className="diag-test-stem"><RichText>{currentQ.stem}</RichText></div>
        {currentQ.boxContent && <div className="diag-test-box"><RichText>{currentQ.boxContent}</RichText></div>}
        <ChoiceSelector
          choices={currentQ.choices}
          selected={state.answers[currentQ.questionId]}
          onSelect={(choiceId) => dispatch({ type: "SELECT_CHOICE", questionId: currentQ.questionId, choice: choiceId })}
        />
      </div>

      {state.error && <p className="ts-error">{state.error}</p>}

      <div className="diag-test-nav">
        <button
          className="diag-test-nav-btn"
          onClick={() => dispatch({ type: "GO_INDEX", index: state.currentIndex - 1 })}
          disabled={state.currentIndex === 0}
        >
          이전
        </button>

        {state.currentIndex < total - 1 ? (
          <button
            className="diag-test-nav-btn primary"
            onClick={() => dispatch({ type: "GO_INDEX", index: state.currentIndex + 1 })}
          >
            다음
          </button>
        ) : (
          <button
            className="diag-test-nav-btn primary"
            onClick={() => handleSubmit(false)}
            disabled={state.isSubmitting}
          >
            {state.isSubmitting ? "제출 중..." : "답안 제출"}
          </button>
        )}
      </div>

      {/* 항상 노출되는 빠른 제출 버튼 (마지막 문항이 아니어도 제출 가능) */}
      {state.currentIndex < total - 1 && (
        <div style={{ textAlign: "center", marginTop: 12 }}>
          <button
            className="diag-test-nav-btn"
            onClick={() => handleSubmit(false)}
            disabled={state.isSubmitting}
            style={{ background: "#fff7e8", borderColor: "#d4b980" }}
          >
            지금 답안 제출
          </button>
        </div>
      )}
    </div>
  );
}

export default DiagnosticTestPage;
