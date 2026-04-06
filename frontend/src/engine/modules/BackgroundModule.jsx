import { useEffect, useRef, useState } from "react";
import { useEngine } from "../core/EngineContext";
import QuestionModal from "../shared/QuestionModal";
import { FEEDBACK } from "../shared/feedbackTimings";
import RichText from "../../utils/RichText";
import "../../styles/background-module.css";

// 타이머 규칙
const DEFAULT_SCORING = { correctDeltaSec: 10, wrongDeltaSec: -10 };

const getScoring = (question) => {
  const s = question?.scoring;
  if (!s) return DEFAULT_SCORING;
  return {
    correctDeltaSec: s.correctDeltaSec ?? DEFAULT_SCORING.correctDeltaSec,
    wrongDeltaSec: s.wrongDeltaSec ?? DEFAULT_SCORING.wrongDeltaSec,
  };
};

function BackgroundModule({ content }) {
  const { status, start, adjustTime, recordAnswer, finish } = useEngine();
  const payload = content?.payload || {};
  const passages = payload.passages || [];
  const legacyQuestions = payload.questions || [];
  const hasPassages = passages.length > 0;

  // --- passages 모드 상태 ---
  const [currentPassageIndex, setCurrentPassageIndex] = useState(0);
  const [showingPassage, setShowingPassage] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [lastResult, setLastResult] = useState(null);
  const [feedbackDuration, setFeedbackDuration] = useState(FEEDBACK.A_CORRECT_ADVANCE_MS);
  const resultTimerRef = useRef(null);
  const advanceTimerRef = useRef(null);

  // --- 레거시 모드 (passages 없음 → WorksheetQuizModule 동일 동작) ---
  const [legacyIndex, setLegacyIndex] = useState(0);
  const [legacyResult, setLegacyResult] = useState(null);
  const [legacyDuration, setLegacyDuration] = useState(FEEDBACK.A_CORRECT_ADVANCE_MS);
  const [legacyStatusMap, setLegacyStatusMap] = useState({});
  const legacyTimerRef = useRef(null);
  const legacyAdvanceRef = useRef(null);

  const currentPassage = hasPassages ? passages[currentPassageIndex] : null;
  const passageQuestions = currentPassage?.questions || [];
  const currentQuestion = hasPassages
    ? passageQuestions[currentQuestionIndex]
    : legacyQuestions[legacyIndex];

  // 자동 시작
  useEffect(() => {
    if (status === "READY") {
      if (!hasPassages) {
        start();
      }
    }
  }, [status, start, hasPassages]);

  // 클린업
  useEffect(
    () => () => {
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      if (legacyTimerRef.current) clearTimeout(legacyTimerRef.current);
      if (legacyAdvanceRef.current) clearTimeout(legacyAdvanceRef.current);
    },
    []
  );

  // === passages 모드 핸들러 ===

  const handleDoneReading = () => {
    setShowingPassage(false);
    setCurrentQuestionIndex(0);
    if (status === "READY") start();
  };

  const handlePassageChoice = (choiceId) => {
    if (!currentQuestion) return;
    const scoring = getScoring(currentQuestion);
    const isCorrect = choiceId === currentQuestion.answerId;
    adjustTime(isCorrect ? scoring.correctDeltaSec : scoring.wrongDeltaSec);
    recordAnswer({ id: currentQuestion.id, correct: isCorrect });
    setLastResult(isCorrect ? "correct" : "wrong");

    // A 패턴: 정답 즉시 / 오답 3초
    const delay = isCorrect ? FEEDBACK.A_CORRECT_ADVANCE_MS : FEEDBACK.A_WRONG_ADVANCE_MS;
    setFeedbackDuration(delay);

    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = setTimeout(() => {
      setLastResult(null);
      // 현재 지문 내 다음 문제가 있는지
      if (currentQuestionIndex < passageQuestions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else if (currentPassageIndex < passages.length - 1) {
        // 다음 지문으로
        setCurrentPassageIndex((prev) => prev + 1);
        setShowingPassage(true);
        setCurrentQuestionIndex(0);
      } else {
        // 전체 완료
        finish(true);
      }
    }, delay);
  };

  // === 레거시 모드 핸들러 (WorksheetQuizModule과 동일) ===

  const handleLegacyChoice = (choiceId) => {
    const q = legacyQuestions[legacyIndex];
    if (!q) return;
    const scoring = getScoring(q);
    const isCorrect = choiceId === q.answerId;
    adjustTime(isCorrect ? scoring.correctDeltaSec : scoring.wrongDeltaSec);
    recordAnswer({ id: q.id, correct: isCorrect });
    setLegacyResult(isCorrect ? "correct" : "wrong");
    setLegacyStatusMap((prev) => ({
      ...prev,
      [q.id]: isCorrect ? "correct" : "wrong",
    }));

    // A 패턴: 정답 즉시 / 오답 3초
    const delay = isCorrect ? FEEDBACK.A_CORRECT_ADVANCE_MS : FEEDBACK.A_WRONG_ADVANCE_MS;
    setLegacyDuration(delay);

    if (legacyAdvanceRef.current) clearTimeout(legacyAdvanceRef.current);
    legacyAdvanceRef.current = setTimeout(() => {
      setLegacyResult(null);
      if (legacyIndex >= legacyQuestions.length - 1) {
        finish(true);
      } else {
        setLegacyIndex((prev) => prev + 1);
      }
    }, delay);
  };

  // === passages 모드: 지문 읽기 화면 ===

  if (hasPassages && showingPassage && currentPassage) {
    return (
      <div className="bg-module">
        <div className="bg-status-bar">
          <span className="bg-progress">
            지문 {currentPassageIndex + 1} / {passages.length}
          </span>
          <span className="bg-phase-label">지문 읽기</span>
        </div>
        <div className="bg-passage-area">
          <div className="bg-passage-title">{currentPassage.title || `지문 ${currentPassageIndex + 1}`}</div>
          <div className="bg-passage-text"><RichText>{currentPassage.text}</RichText></div>
        </div>
        <div className="bg-actions">
          <button type="button" className="bg-btn bg-btn-primary" onClick={handleDoneReading}>
            다 읽었습니다
          </button>
        </div>
      </div>
    );
  }

  // === passages 모드: 문제 풀기 화면 ===

  if (hasPassages && !showingPassage && currentQuestion) {
    return (
      <div className="bg-module">
        <div className="bg-status-bar">
          <span className="bg-progress">
            지문 {currentPassageIndex + 1} / {passages.length}
            {passageQuestions.length > 1
              ? ` · 문제 ${currentQuestionIndex + 1} / ${passageQuestions.length}`
              : null}
          </span>
          <span className="bg-phase-label">문제 풀기</span>
        </div>
        <QuestionModal
          title="배경지식 문제"
          prompt={currentQuestion.stem || currentQuestion.prompt}
          choices={currentQuestion.choices || []}
          onSelect={handlePassageChoice}
          mark={lastResult}
          shuffleKey={currentQuestion.id}
          correctChoiceId={currentQuestion.answerId}
          feedbackDuration={feedbackDuration}
        />
      </div>
    );
  }

  // === 레거시 모드 (questions만 있는 경우) ===

  if (!hasPassages && legacyQuestions.length > 0) {
    const q = legacyQuestions[legacyIndex];
    return (
      <div className="worksheet-module">
        <div className="worksheet-sheet">
          <div className="worksheet-stem">
            <div className="worksheet-pages">
              <div className="worksheet-page single">
                <div className="worksheet-page-inner">
                  <div className="worksheet-page-number">
                    1 / 1
                  </div>
                  <div className="worksheet-columns">
                    <ol className="worksheet-list">
                      {legacyQuestions.map((question, idx) => {
                        const qStatus = legacyStatusMap[question.id];
                        const isActive = idx === legacyIndex;
                        return (
                          <li
                            key={question.id}
                            className={`worksheet-item ${isActive ? "active" : ""} ${
                              qStatus ? `done ${qStatus}` : ""
                            }`}
                          >
                            <span className="worksheet-item-number">
                              {idx + 1}.
                              {qStatus ? (
                                <span className={`worksheet-number-mark ${qStatus}`}>
                                  {qStatus === "correct" ? "\u25CB" : "\uFF0F"}
                                </span>
                              ) : null}
                            </span>
                            <span className="worksheet-item-text">
                              {question.stem || question.prompt || ""}
                            </span>
                          </li>
                        );
                      })}
                    </ol>
                    <ol className="worksheet-list" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="worksheet-controls">
            <span>{legacyIndex + 1} / {legacyQuestions.length}</span>
          </div>
        </div>
        {q ? (
          <QuestionModal
            title="문제"
            prompt={q.prompt || q.stem}
            choices={q.choices || []}
            onSelect={handleLegacyChoice}
            mark={legacyResult}
            shuffleKey={q.id}
            correctChoiceId={q.answerId}
            feedbackDuration={legacyDuration}
          />
        ) : null}
      </div>
    );
  }

  return (
    <div className="bg-module">
      <p>배경지식 콘텐츠가 없습니다.</p>
    </div>
  );
}

export default BackgroundModule;
