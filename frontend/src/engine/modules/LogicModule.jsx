import { useEffect, useRef, useState } from "react";
import { useEngine } from "../core/EngineContext";
import { FEEDBACK } from "../shared/feedbackTimings";
import CumulativeQuestionCard from "../shared/CumulativeQuestionCard";
import PassageMarkdown from "../../utils/PassageMarkdown";
import "../../styles/logic-module.css";

const DEFAULT_SCORING = { correctDeltaSec: 15, wrongDeltaSec: -15 };

const getScoring = (question) => {
  const s = question?.scoring;
  if (!s) return DEFAULT_SCORING;
  return {
    correctDeltaSec: s.correctDeltaSec ?? DEFAULT_SCORING.correctDeltaSec,
    wrongDeltaSec: s.wrongDeltaSec ?? DEFAULT_SCORING.wrongDeltaSec,
  };
};

function LogicModule({ content }) {
  const { status, start, adjustTime, recordAnswer, finish } = useEngine();
  const payload = content?.payload || {};
  const passages = payload.passages || [];
  const legacyQuestions = payload.questions || [];
  const hasPassages = passages.length > 0;

  // --- passages 모드 상태 ---
  const [currentPassageIndex, setCurrentPassageIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  /** completedMap: { [questionId]: { selectedId, isCorrect } } */
  const [completedMap, setCompletedMap] = useState({});
  const [lastResult, setLastResult] = useState(null);
  const advanceTimerRef = useRef(null);
  const scrollRef = useRef(null);

  // --- 레거시 모드 상태 ---
  const [legacyIndex, setLegacyIndex] = useState(0);
  const [legacyCompletedMap, setLegacyCompletedMap] = useState({});
  const [legacyLastResult, setLegacyLastResult] = useState(null);
  const legacyAdvanceRef = useRef(null);
  const legacyScrollRef = useRef(null);

  const currentPassage = hasPassages ? passages[currentPassageIndex] : null;
  const passageQuestions = currentPassage?.questions || [];

  // 자동 시작
  useEffect(() => {
    if (status === "READY") start();
  }, [status, start]);

  // 클린업
  useEffect(
    () => () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      if (legacyAdvanceRef.current) clearTimeout(legacyAdvanceRef.current);
    },
    []
  );

  // 문제 변경 시 자동 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentQuestionIndex, currentPassageIndex]);
  useEffect(() => {
    if (legacyScrollRef.current) {
      legacyScrollRef.current.scrollTop = legacyScrollRef.current.scrollHeight;
    }
  }, [legacyIndex]);

  // === passages 모드 핸들러 ===

  const handlePassageChoice = (choiceId) => {
    const question = passageQuestions[currentQuestionIndex];
    if (!question) return;
    const scoring = getScoring(question);
    const isCorrect = choiceId === question.answerId;
    adjustTime(isCorrect ? scoring.correctDeltaSec : scoring.wrongDeltaSec);
    recordAnswer({ id: question.id, correct: isCorrect });
    setCompletedMap((prev) => ({
      ...prev,
      [question.id]: { selectedId: choiceId, isCorrect },
    }));
    setLastResult(isCorrect ? "correct" : "wrong");

    const delay = isCorrect ? FEEDBACK.A_CORRECT_ADVANCE_MS : FEEDBACK.A_WRONG_ADVANCE_MS;
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = setTimeout(() => {
      setLastResult(null);
      if (currentQuestionIndex < passageQuestions.length - 1) {
        setCurrentQuestionIndex((prev) => prev + 1);
      } else if (currentPassageIndex < passages.length - 1) {
        setCurrentPassageIndex((prev) => prev + 1);
        setCurrentQuestionIndex(0);
        setCompletedMap({});
      } else {
        finish(true);
      }
    }, delay);
  };

  // === 레거시 모드 핸들러 ===

  const handleLegacyChoice = (choiceId) => {
    const q = legacyQuestions[legacyIndex];
    if (!q) return;
    const scoring = getScoring(q);
    const isCorrect = choiceId === q.answerId;
    adjustTime(isCorrect ? scoring.correctDeltaSec : scoring.wrongDeltaSec);
    recordAnswer({ id: q.id, correct: isCorrect });
    setLegacyCompletedMap((prev) => ({
      ...prev,
      [q.id]: { selectedId: choiceId, isCorrect },
    }));
    setLegacyLastResult(isCorrect ? "correct" : "wrong");

    const delay = isCorrect ? FEEDBACK.A_CORRECT_ADVANCE_MS : FEEDBACK.A_WRONG_ADVANCE_MS;
    if (legacyAdvanceRef.current) clearTimeout(legacyAdvanceRef.current);
    legacyAdvanceRef.current = setTimeout(() => {
      setLegacyLastResult(null);
      if (legacyIndex >= legacyQuestions.length - 1) {
        finish(true);
      } else {
        setLegacyIndex((prev) => prev + 1);
      }
    }, delay);
  };

  // === passages 모드: 지문 + 누적 문제 ===

  if (hasPassages && currentPassage && passageQuestions.length > 0) {
    const visibleQuestions = passageQuestions.slice(0, currentQuestionIndex + 1);
    return (
      <div className="logic-module">
        <div className="logic-status-bar">
          <span className="logic-progress">
            지문 {currentPassageIndex + 1} / {passages.length} · 문제 {currentQuestionIndex + 1} / {passageQuestions.length}
          </span>
          <span className="logic-phase-label">논리 추론</span>
        </div>
        <div className="logic-passage-area">
          <div className="logic-passage-title">
            {currentPassage.title || `지문 ${currentPassageIndex + 1}`}
          </div>
          <PassageMarkdown className="logic-passage-text">{currentPassage.text}</PassageMarkdown>
        </div>
        <div className="learning-modal-instruction">문제를 읽고 클릭하면 답안을 입력할 수 있습니다.</div>
        <div className="logic-question-area cum-stack" ref={scrollRef}>
          {visibleQuestions.map((q, idx) => (
            <CumulativeQuestionCard
              key={q.id}
              question={q}
              idx={idx}
              total={passageQuestions.length}
              completion={completedMap[q.id]}
              isActive={idx === currentQuestionIndex && !completedMap[q.id]}
              onSelect={handlePassageChoice}
              lastResult={idx === currentQuestionIndex ? lastResult : null}
            />
          ))}
        </div>
      </div>
    );
  }

  // === 레거시 모드 ===

  if (!hasPassages && legacyQuestions.length > 0) {
    const visibleQuestions = legacyQuestions.slice(0, legacyIndex + 1);
    return (
      <div className="logic-module">
        <div className="logic-status-bar">
          <span className="logic-progress">
            문제 {legacyIndex + 1} / {legacyQuestions.length}
          </span>
        </div>
        <div className="learning-modal-instruction">문제를 읽고 클릭하면 답안을 입력할 수 있습니다.</div>
        <div className="cum-stack" ref={legacyScrollRef}>
          {visibleQuestions.map((q, idx) => (
            <CumulativeQuestionCard
              key={q.id}
              question={q}
              idx={idx}
              total={legacyQuestions.length}
              completion={legacyCompletedMap[q.id]}
              isActive={idx === legacyIndex && !legacyCompletedMap[q.id]}
              onSelect={handleLegacyChoice}
              lastResult={idx === legacyIndex ? legacyLastResult : null}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="logic-module">
      <p>논리사고력 콘텐츠가 없습니다.</p>
    </div>
  );
}

export default LogicModule;
