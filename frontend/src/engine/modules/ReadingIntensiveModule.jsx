import { useEffect, useMemo, useRef, useState } from "react";
import { useEngine } from "../core/EngineContext";
import QuestionModal from "../shared/QuestionModal";

const highlightText = (text, range) => {
  if (!range || range.start == null || range.end == null) return text;
  const before = text.slice(0, range.start);
  const target = text.slice(range.start, range.end);
  const after = text.slice(range.end);
  return (
    <>
      {before}
      <span className="worksheet-highlight">{target}</span>
      {after}
    </>
  );
};

function ReadingIntensiveModule({ content }) {
  const { adjustTime, recordAnswer, finish, start, status } = useEngine();
  const payload = content?.payload || {};
  const [stepIndex, setStepIndex] = useState(0);
  const [removedChoices, setRemovedChoices] = useState({});
  const [lastResult, setLastResult] = useState(null);
  const advanceTimerRef = useRef(null);
  const resultTimerRef = useRef(null);
  const feedbackDelay = 420;

  const step = payload.timeline?.[stepIndex];
  const paragraph = useMemo(() => {
    if (!step || !payload.passage?.paragraphs) return null;
    return payload.passage.paragraphs.find((item) => item.id === step.highlight?.paragraphId);
  }, [step, payload]);

  const choices = useMemo(() => {
    const removed = removedChoices[step?.stepId] || [];
    return (step?.question?.choices || []).filter((choice) => !removed.includes(choice.id));
  }, [step, removedChoices]);

  const handleAnswer = (choiceId) => {
    if (!step?.question) return;
    const scoring = step.question.scoring || {};
    const isCorrect = choiceId === step.question.answerId;
    adjustTime(isCorrect ? scoring.correctDeltaSec : scoring.wrongDeltaSec);
    recordAnswer({ id: step.stepId, correct: isCorrect });
    setLastResult(isCorrect ? "correct" : "wrong");
    if (resultTimerRef.current) {
      clearTimeout(resultTimerRef.current);
    }
    resultTimerRef.current = setTimeout(() => {
      setLastResult(null);
    }, feedbackDelay);
    if (isCorrect) {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
      }
      advanceTimerRef.current = setTimeout(() => {
        if (stepIndex >= payload.timeline.length - 1) {
          finish(true);
          return;
        }
        setStepIndex((prev) => prev + 1);
      }, feedbackDelay);
      return;
    }
    if (scoring.eliminateWrongChoice) {
      setRemovedChoices((prev) => ({
        ...prev,
        [step.stepId]: [...(prev[step.stepId] || []), choiceId],
      }));
    }
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
    <div className="reading-module">
      {status === "READY" ? (
        <div className="worksheet-start">
          <div className="worksheet-empty">정독 훈련을 시작합니다.</div>
          <button type="button" className="worksheet-start-btn" onClick={start}>
            학습 시작
          </button>
        </div>
      ) : (
        <>
          <div className="reading-passage">
            {payload.passage?.paragraphs?.map((item) => (
              <p key={item.id}>
                {item.id === paragraph?.id ? highlightText(item.text, step?.highlight?.range) : item.text}
              </p>
            ))}
          </div>
          <div className="reading-meta">
            <span>{stepIndex + 1} / {payload.timeline?.length || 0}</span>
          </div>
          {lastResult ? (
            <div className={`worksheet-feedback ${lastResult}`}>
              {lastResult === "correct" ? "정답입니다!" : "오답입니다."}
            </div>
          ) : null}
          {step?.question ? (
            <QuestionModal
              title="정독 질문"
              prompt={step.question.prompt}
              choices={choices}
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

export default ReadingIntensiveModule;
