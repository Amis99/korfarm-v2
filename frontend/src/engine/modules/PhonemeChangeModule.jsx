import { useEffect, useRef, useState } from "react";
import { useEngine } from "../core/EngineContext";
import QuestionModal from "../shared/QuestionModal";
import useHighlightAnchor from "../shared/useHighlightAnchor";

function PhonemeChangeModule({ content }) {
  const { adjustTime, recordAnswer, finish, start, status } = useEngine();
  const payload = content?.payload || {};
  const words = payload.words || [];
  const [wordIndex, setWordIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [pRowState, setPRowState] = useState(() => words.map((w) => [...(w.pRow || [])]));
  const [lastResult, setLastResult] = useState(null);
  const advanceTimerRef = useRef(null);
  const resultTimerRef = useRef(null);
  const feedbackDelay = 420;
  const moduleRef = useRef(null);

  useEffect(() => {
    if (words.length > 0) {
      setPRowState(words.map((w) => [...(w.pRow || [])]));
      setWordIndex(0);
      setStepIndex(0);
    }
  }, [content]);

  const word = words[wordIndex];
  const step = word?.steps?.[stepIndex];
  const anchorRect = useHighlightAnchor(moduleRef, ".phoneme-box.target", [wordIndex, stepIndex]);

  const handleAnswer = (choiceId) => {
    if (!step) return;
    const isCorrect = choiceId === step.answerId;
    const delta = isCorrect ? step.onCorrect?.deltaSec || 0 : step.onWrong?.deltaSec || 0;
    adjustTime(delta);
    recordAnswer({ id: step.stepId, correct: isCorrect });
    setLastResult(isCorrect ? "correct" : "wrong");
    if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    resultTimerRef.current = setTimeout(() => setLastResult(null), feedbackDelay);

    if (!isCorrect && step.onWrong?.retry) return;

    if (isCorrect) {
      const updates = step.onCorrect?.apply || [];
      if (updates.length > 0) {
        setPRowState((prev) =>
          prev.map((row, idx) => {
            if (idx !== wordIndex) return row;
            const newRow = [...row];
            updates.forEach((u) => { newRow[u.pos - 1] = u.val; });
            return newRow;
          })
        );
      }
    }

    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
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
    if (status === "READY") start();
  }, [status, start]);

  useEffect(
    () => () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    },
    []
  );

  const renderSBox = (val, idx) => {
    const isSep = val === ",";
    let cls = "phoneme-box original";
    if (isSep) cls += " sep";
    return (
      <div key={`s-${idx}`} className={cls}>
        {val}
      </div>
    );
  };

  const renderPBox = (val, idx, step) => {
    const pos = idx + 1;
    const isSpace = val === "_";
    const isEnv = step?.envCells?.includes(pos);
    const isTarget = step?.targetCell === pos;

    let cls = "phoneme-box";
    if (isSpace) cls += " space";
    if (isEnv) cls += " env";
    if (isTarget) cls += " target";

    return (
      <div key={`p-${idx}`} className={cls}>
        {isSpace ? "" : val}
      </div>
    );
  };

  return (
    <div className="phoneme-module" ref={moduleRef}>
      {status === "READY" ? (
        <div className="worksheet-start">
          <div className="worksheet-empty">음운 변동 분석을 시작합니다.</div>
          <button type="button" className="worksheet-start-btn" onClick={start}>
            학습 시작
          </button>
        </div>
      ) : words.length === 0 ? (
        <div className="worksheet-empty">
          학습 데이터를 불러오는 중...
        </div>
      ) : (
        <>
          <div className="phoneme-change-header">
            <h3>{word?.surface}</h3>
            {word?.pronunciation && (
              <span className="phoneme-change-pronunciation">{word.pronunciation}</span>
            )}
            <span className="phoneme-change-progress">
              {wordIndex + 1}/{words.length} · {stepIndex + 1}/{word?.steps?.length || 0}
            </span>
          </div>
          <div className="phoneme-change-rows">
            <div className="phoneme-change-row">
              <span className="phoneme-change-row-label">원형</span>
              {word?.sRow?.map((val, idx) => renderSBox(val, idx))}
            </div>
            <div className="phoneme-change-row">
              <span className="phoneme-change-row-label">작업</span>
              {pRowState[wordIndex]?.map((val, idx) => renderPBox(val, idx, step))}
            </div>
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
              anchorRect={anchorRect}
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
