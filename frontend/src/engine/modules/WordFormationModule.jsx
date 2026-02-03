import { useEffect, useRef, useState } from "react";
import { useEngine } from "../core/EngineContext";
import QuestionModal from "../shared/QuestionModal";

function WordFormationModule({ content }) {
  const { adjustTime, recordAnswer, finish, start, status } = useEngine();
  const payload = content?.payload || {};
  const items = payload.items || [];
  const [itemIndex, setItemIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [mergeIndex, setMergeIndex] = useState(0);
  const [lastResult, setLastResult] = useState(null);
  const advanceTimerRef = useRef(null);
  const resultTimerRef = useRef(null);
  const feedbackDelay = 420;

  const item = items[itemIndex];
  const steps = item?.steps || [];
  const step = steps[stepIndex];
  const mergeQuestions = item?.formationGame?.mergeQuestions || [];
  const inMerge = stepIndex >= steps.length && mergeQuestions.length > 0;

  const handleAnswer = (choiceId) => {
    if (!item) return;
    if (inMerge) {
      const question = mergeQuestions[mergeIndex];
      const correct = choiceId === question.answer;
      adjustTime(correct ? 20 : -20);
      recordAnswer({ id: `merge-${mergeIndex}`, correct });
      setLastResult(correct ? "correct" : "wrong");
      if (resultTimerRef.current) {
        clearTimeout(resultTimerRef.current);
      }
      resultTimerRef.current = setTimeout(() => {
        setLastResult(null);
      }, feedbackDelay);
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
      }
      advanceTimerRef.current = setTimeout(() => {
        if (mergeIndex < mergeQuestions.length - 1) {
          setMergeIndex((prev) => prev + 1);
          return;
        }
        finish(true);
      }, feedbackDelay);
      return;
    }

    if (!step) return;
    let correct = false;
    if (step.type === "COUNT") {
      correct = choiceId === String(step.answer);
    } else {
      correct = choiceId === step.answer;
    }
    const delta = correct ? step.delta?.correct || 20 : step.delta?.wrong || -20;
    adjustTime(delta);
    recordAnswer({ id: `${item.word}-${step.type}-${step.index ?? stepIndex}`, correct });
    setLastResult(correct ? "correct" : "wrong");
    if (resultTimerRef.current) {
      clearTimeout(resultTimerRef.current);
    }
    resultTimerRef.current = setTimeout(() => {
      setLastResult(null);
    }, feedbackDelay);
    if (!correct) {
      return;
    }
    if (correct) {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
      }
      advanceTimerRef.current = setTimeout(() => {
        if (stepIndex < steps.length - 1) {
          setStepIndex((prev) => prev + 1);
        } else if (mergeQuestions.length > 0) {
          setStepIndex(steps.length);
        } else if (itemIndex < items.length - 1) {
          setItemIndex((prev) => prev + 1);
          setStepIndex(0);
        } else {
          finish(true);
        }
      }, feedbackDelay);
    }
  };

  const modalConfig = () => {
    if (inMerge) {
      return {
        title: "결합 질문",
        prompt: mergeQuestions[mergeIndex]?.ask,
        choices: [
          { id: "LEFT", text: "왼쪽" },
          { id: "RIGHT", text: "오른쪽" },
        ],
      };
    }
    if (!step) return null;
    if (step.type === "COUNT") {
      return {
        title: "형태소 개수",
        prompt: "형태소 개수를 고르세요.",
        choices: step.choices.map((choice) => ({ id: String(choice), text: `${choice}` })),
      };
    }
    return {
      title: "형태소 분석",
      prompt: "정답을 고르세요.",
      choices: step.choices.map((choice) => ({ id: choice, text: choice })),
    };
  };

  const modalShuffleKey = inMerge ? `merge-${itemIndex}-${mergeIndex}` : `step-${itemIndex}-${stepIndex}`;
  const config = modalConfig();

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
    <div className="word-formation-module">
      {status === "READY" ? (
        <div className="worksheet-start">
          <div className="worksheet-empty">단어 형성 분석을 시작합니다.</div>
          <button type="button" className="worksheet-start-btn" onClick={start}>
            학습 시작
          </button>
        </div>
      ) : (
        <>
          <h3>{item?.word}</h3>
          <div className="morpheme-strip">
            {(item?.morphemes || []).map((morpheme, idx) => (
              <span
                key={`${item?.word}-${idx}`}
                className={`morpheme-chip ${step?.index === idx ? "active" : ""}`}
              >
                {morpheme}
              </span>
            ))}
          </div>
          {lastResult ? (
            <div className={`worksheet-feedback ${lastResult}`}>
              {lastResult === "correct" ? "정답입니다!" : "오답입니다."}
            </div>
          ) : null}
          {config ? (
            <QuestionModal
              title={config.title}
              prompt={config.prompt}
              choices={config.choices}
              onSelect={handleAnswer}
              mark={lastResult}
              shuffleKey={modalShuffleKey}
            />
          ) : null}
        </>
      )}
    </div>
  );
}

export default WordFormationModule;
