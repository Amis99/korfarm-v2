import { useEffect, useMemo, useState } from "react";
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
      <mark className="highlight">{target}</mark>
      {after}
    </>
  );
};

function ReadingIntensiveModule({ content }) {
  const { adjustTime, recordAnswer, finish, start, status } = useEngine();
  const payload = content?.payload || {};
  const [stepIndex, setStepIndex] = useState(0);
  const [removedChoices, setRemovedChoices] = useState({});
  const [feedback, setFeedback] = useState("");

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
    setFeedback(isCorrect ? "정답입니다!" : "오답입니다.");
    if (isCorrect) {
      if (stepIndex >= payload.timeline.length - 1) {
        finish(true);
        return;
      }
      setStepIndex((prev) => prev + 1);
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
            {feedback ? <span className="reading-feedback">{feedback}</span> : null}
          </div>
          {step?.question ? (
            <QuestionModal
              title="정독 질문"
              prompt={step.question.prompt}
              choices={choices}
              onSelect={handleAnswer}
            />
          ) : null}
        </>
      )}
    </div>
  );
}

export default ReadingIntensiveModule;
