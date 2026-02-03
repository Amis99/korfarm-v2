import { useEffect, useRef, useState } from "react";
import { useEngine } from "../core/EngineContext";
import QuestionModal from "../shared/QuestionModal";

function PhonemeChangeModule({ content }) {
  const { adjustTime, recordAnswer, finish, start, status } = useEngine();
  const payload = content?.payload || {};
  const words = payload.words || [];
  const [wordIndex, setWordIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [cellsState, setCellsState] = useState(() => words.map((word) => word.cells));
  const [lastResult, setLastResult] = useState(null);
  const advanceTimerRef = useRef(null);
  const resultTimerRef = useRef(null);
  const feedbackDelay = 420;

  const word = words[wordIndex];
  const step = word?.steps?.[stepIndex];

  const handleAnswer = (choiceId) => {
    if (!step) return;
    const isCorrect = choiceId === step.answerId;
    const delta = isCorrect ? step.onCorrect?.deltaSec || 0 : step.onWrong?.deltaSec || 0;
    adjustTime(delta);
    recordAnswer({ id: step.stepId, correct: isCorrect });
    setLastResult(isCorrect ? "correct" : "wrong");
    if (resultTimerRef.current) {
      clearTimeout(resultTimerRef.current);
    }
    resultTimerRef.current = setTimeout(() => {
      setLastResult(null);
    }, feedbackDelay);
    if (!isCorrect && step.onWrong?.retry) return;
    if (isCorrect && step.onCorrect?.applyCellText) {
      const { cellNo, newText } = step.onCorrect.applyCellText;
      setCellsState((prev) =>
        prev.map((cellList, idx) => {
          if (idx !== wordIndex) return cellList;
          return cellList.map((cell) =>
            cell.cellNo === cellNo ? { ...cell, text: newText } : cell
          );
        })
      );
    }
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
    }
    advanceTimerRef.current = setTimeout(() => {
      if (stepIndex < word.steps.length - 1) {
        setStepIndex((prev) => prev + 1);
        return;
      }
      if (wordIndex < words.length - 1) {
        setWordIndex((prev) => prev + 1);
        setStepIndex(0);
        return;
      }
      finish(true);
    }, feedbackDelay);
  };

  useEffect(() => {
    if (status === "READY") {
      start();
    }
  }, [status, start]);

  useEffect(
    () => () => {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
      }
      if (resultTimerRef.current) {
        clearTimeout(resultTimerRef.current);
      }
    },
    []
  );

  return (
    <div className="phoneme-module">
      {status === "READY" ? (
        <div className="worksheet-start">
          <div className="worksheet-empty">음운 변동 분석을 시작합니다.</div>
          <button type="button" className="worksheet-start-btn" onClick={start}>
            학습 시작
          </button>
        </div>
      ) : (
        <>
          <div className="phoneme-header">
            <h3>{word?.surface}</h3>
            <span>
              {wordIndex + 1}/{words.length} · {stepIndex + 1}/{word?.steps?.length || 0}
            </span>
          </div>
          <div className="phoneme-cells">
            {cellsState[wordIndex]?.map((cell) => {
              const isEnv = step?.envCellNos?.includes(cell.cellNo);
              const isTarget = step?.targetCellNo === cell.cellNo;
              return (
                <div
                  key={cell.cellNo}
                  className={`phoneme-cell ${isEnv ? "env" : ""} ${
                    isTarget ? "target" : ""
                  }`}
                >
                  {cell.text}
                </div>
              );
            })}
          </div>
          {lastResult ? (
            <div className={`worksheet-feedback ${lastResult}`}>
              {lastResult === "correct" ? "정답입니다!" : "오답입니다."}
            </div>
          ) : null}
          {step ? (
            <QuestionModal
              title="음운 변동"
              prompt={step.questionType === "RULE_EXPLANATION" ? "규칙을 고르세요." : "변동 결과를 고르세요."}
              choices={step.choices || []}
              onSelect={handleAnswer}
              mark={lastResult}
              shuffleKey={step.stepId}
            />
          ) : null}
        </>
      )}
    </div>
  );
}

export default PhonemeChangeModule;
