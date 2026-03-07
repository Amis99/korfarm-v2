import { useEffect, useReducer } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { apiGet, apiPost } from "../utils/api";
import PassageRenderer from "../components/diagnostic/PassageRenderer";
import ChoiceSelector from "../components/diagnostic/ChoiceSelector";
import RichText from "../utils/RichText";
import "../styles/diagnostic-v2.css";

const initialState = {
  session: null,
  currentBatch: [],
  batchAnswers: {},
  currentIndex: 0,
  totalAnswered: 0,
  isSubmitting: false,
  error: "",
  mode: "cat",
};

function reducer(state, action) {
  switch (action.type) {
    case "INIT":
      return {
        ...state,
        session: action.session,
        currentBatch: action.batch,
        mode: action.mode || "cat",
        batchAnswers: {},
        currentIndex: 0,
      };
    case "SELECT_CHOICE":
      return {
        ...state,
        batchAnswers: { ...state.batchAnswers, [action.questionId]: action.choice },
      };
    case "NEXT_Q":
      return { ...state, currentIndex: Math.min(state.currentIndex + 1, state.currentBatch.length - 1) };
    case "PREV_Q":
      return { ...state, currentIndex: Math.max(state.currentIndex - 1, 0) };
    case "SUBMITTING":
      return { ...state, isSubmitting: true, error: "" };
    case "BATCH_RESULT":
      return {
        ...state,
        isSubmitting: false,
        currentBatch: action.nextBatch || [],
        batchAnswers: {},
        currentIndex: 0,
        totalAnswered: state.totalAnswered + Object.keys(state.batchAnswers).length,
      };
    case "ERROR":
      return { ...state, isSubmitting: false, error: action.message };
    default:
      return state;
  }
}

function DiagnosticTestPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const firstBatch = location.state?.firstBatch;
    const mode = location.state?.mode || "cat";
    if (firstBatch && firstBatch.length > 0) {
      // firstBatch가 있으면 불필요한 API 호출 없이 바로 초기화
      dispatch({
        type: "INIT",
        session: { sessionId, status: "active", answeredCount: 0 },
        batch: firstBatch,
        mode,
      });
    } else {
      // 세션 복원 (새로고침 등)
      apiGet(`/v1/diagnostic/sessions/${sessionId}`)
        .then(sess => {
          if (sess.status !== "active") {
            navigate(`/diagnostic/v2/report/${sessionId}`);
            return;
          }
          dispatch({ type: "INIT", session: sess, batch: sess.currentBatch || [], mode: sess.mode });
        })
        .catch(() => navigate("/diagnostic/v2"));
    }
  }, [sessionId, navigate, location.state]);

  const currentQ = state.currentBatch[state.currentIndex];

  // 같은 지문의 첫 문항인 경우만 지문 표시
  const showPassage = currentQ && (
    state.currentIndex === 0 ||
    state.currentBatch[state.currentIndex - 1]?.passageId !== currentQ.passageId
  );

  const handleSubmitBatch = async () => {
    const unanswered = state.currentBatch.filter(q => !state.batchAnswers[q.questionId]);
    if (unanswered.length > 0) {
      const ok = window.confirm(`${unanswered.length}문항이 미응답입니다. 제출하시겠습니까?`);
      if (!ok) return;
    }

    dispatch({ type: "SUBMITTING" });
    try {
      const responses = state.currentBatch
        .filter(q => state.batchAnswers[q.questionId])
        .map(q => ({ questionId: q.questionId, choice: state.batchAnswers[q.questionId] }));

      const res = await apiPost(`/v1/diagnostic/sessions/${sessionId}/respond`, { responses });

      if (res.shouldStop || !res.nextBatch || res.nextBatch.length === 0) {
        // 세션 완료
        await apiPost(`/v1/diagnostic/sessions/${sessionId}/complete`);
        navigate(`/diagnostic/v2/report/${sessionId}`);
      } else {
        dispatch({ type: "BATCH_RESULT", nextBatch: res.nextBatch });
      }
    } catch (err) {
      dispatch({ type: "ERROR", message: err.message || "제출에 실패했습니다." });
    }
  };

  if (!currentQ) {
    return <div className="diag-v2-loading">불러오는 중...</div>;
  }

  const totalQ = state.totalAnswered + state.currentBatch.length;
  const progressPct = totalQ > 0 ? ((state.totalAnswered + state.currentIndex + 1) / totalQ) * 100 : 0;

  return (
    <div className="diag-test-page">
      <div className="diag-test-topbar">
        <h2>역량 진단</h2>
        <span style={{ fontSize: 13, color: "#8b7e74" }}>
          {state.totalAnswered + state.currentIndex + 1}번째 문항
        </span>
      </div>

      <div className="diag-test-progress">
        <div className="diag-test-progress-fill" style={{ width: `${Math.min(progressPct, 100)}%` }} />
      </div>

      <div className="diag-test-batch-info">
        <span>{state.currentIndex + 1} / {state.currentBatch.length}</span>
      </div>

      {state.mode === "cat" && state.totalAnswered === 0 && state.currentIndex === 0 && (
        <div className="diag-test-cat-notice">
          적응형(CAT) 모드: 답변에 따라 다음 문항이 달라집니다. 이전 배치로 돌아갈 수 없습니다.
        </div>
      )}

      {showPassage && currentQ.passageText && (
        <PassageRenderer text={currentQ.passageText} />
      )}

      <div className="diag-test-question">
        <div className="diag-test-stem"><RichText>{currentQ.stem}</RichText></div>
        {currentQ.boxContent && <div className="diag-test-box"><RichText>{currentQ.boxContent}</RichText></div>}
        <ChoiceSelector
          choices={currentQ.choices}
          selected={state.batchAnswers[currentQ.questionId]}
          onSelect={(choiceId) => dispatch({ type: "SELECT_CHOICE", questionId: currentQ.questionId, choice: choiceId })}
        />
      </div>

      {state.error && <p className="ts-error">{state.error}</p>}

      <div className="diag-test-nav">
        <button
          className="diag-test-nav-btn"
          onClick={() => dispatch({ type: "PREV_Q" })}
          disabled={state.currentIndex === 0}
        >
          이전
        </button>

        {state.currentIndex < state.currentBatch.length - 1 ? (
          <button
            className="diag-test-nav-btn primary"
            onClick={() => dispatch({ type: "NEXT_Q" })}
          >
            다음
          </button>
        ) : (
          <button
            className="diag-test-nav-btn primary"
            onClick={handleSubmitBatch}
            disabled={state.isSubmitting}
          >
            {state.isSubmitting ? "제출 중..." : state.mode === "cat" ? "배치 제출" : "제출"}
          </button>
        )}
      </div>
    </div>
  );
}

export default DiagnosticTestPage;
