import { useEffect, useRef, useState } from "react";
import { useEngine } from "../core/EngineContext";
import { FEEDBACK } from "../shared/feedbackTimings";
import CumulativeQuestionCard from "../shared/CumulativeQuestionCard";
import PassageMarkdown from "../../utils/PassageMarkdown";
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
    if (status === "READY" && !hasPassages) {
      start();
    }
  }, [status, start, hasPassages]);

  // 클린업
  useEffect(
    () => () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      if (legacyAdvanceRef.current) clearTimeout(legacyAdvanceRef.current);
    },
    []
  );

  // 문제 풀 때마다 화면 자동 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentQuestionIndex]);
  useEffect(() => {
    if (legacyScrollRef.current) {
      legacyScrollRef.current.scrollTop = legacyScrollRef.current.scrollHeight;
    }
  }, [legacyIndex]);

  // === passages 모드 핸들러 ===

  const handleDoneReading = () => {
    setShowingPassage(false);
    setCurrentQuestionIndex(0);
    setCompletedMap({});
    if (status === "READY") start();
  };

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
        setShowingPassage(true);
        setCurrentQuestionIndex(0);
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
          <PassageMarkdown className="bg-passage-text">{currentPassage.text}</PassageMarkdown>
        </div>
        <div className="bg-actions">
          <button type="button" className="bg-btn bg-btn-primary" onClick={handleDoneReading}>
            다 읽었습니다
          </button>
        </div>
      </div>
    );
  }

  // === passages 모드: 누적 문제 화면 ===

  if (hasPassages && !showingPassage && passageQuestions.length > 0) {
    const visibleQuestions = passageQuestions.slice(0, currentQuestionIndex + 1);
    return (
      <div className="bg-module">
        <div className="bg-status-bar">
          <span className="bg-progress">
            지문 {currentPassageIndex + 1} / {passages.length} · 문제 {currentQuestionIndex + 1} / {passageQuestions.length}
          </span>
          <span className="bg-phase-label">문제 풀기</span>
        </div>
        {/* 지문 요약 — 접힌 상태로 위에 둠 */}
        <div className="learning-modal-instruction">문제를 읽고 클릭하면 답안을 입력할 수 있습니다.</div>
        <details className="bg-passage-collapse">
          <summary>지문 다시 보기</summary>
          <div className="bg-passage-collapse-body">
            <PassageMarkdown className="bg-passage-text">{currentPassage.text}</PassageMarkdown>
          </div>
        </details>
        <div className="cum-stack" ref={scrollRef}>
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

  // === 레거시 모드 (passages 없음, questions만 있음) ===

  if (!hasPassages && legacyQuestions.length > 0) {
    const visibleQuestions = legacyQuestions.slice(0, legacyIndex + 1);
    return (
      <div className="bg-module">
        <div className="bg-status-bar">
          <span className="bg-progress">
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
    <div className="bg-module">
      <p>배경지식 콘텐츠가 없습니다.</p>
      <p style={{ fontSize: 12, color: "#888", marginTop: 8 }}>
        디버그: payload에 passages 또는 questions 배열이 필요합니다.
        (passages={passages.length}, questions={legacyQuestions.length})
      </p>
    </div>
  );
}

export default BackgroundModule;
