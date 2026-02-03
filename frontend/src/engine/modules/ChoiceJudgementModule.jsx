import { useEffect, useMemo, useState } from "react";
import { useEngine } from "../core/EngineContext";
import TokenPassage from "../shared/TokenPassage";

function ChoiceJudgementModule({ content }) {
  const { adjustTime, recordAnswer, finish, start, status } = useEngine();
  const payload = content?.payload || {};
  const items = payload.items || [];
  const [itemIndex, setItemIndex] = useState(0);
  const [choiceId, setChoiceId] = useState(null);
  const [propIndex, setPropIndex] = useState(0);
  const [choiceMarks, setChoiceMarks] = useState({});
  const [propMarks, setPropMarks] = useState({});
  const [lastResult, setLastResult] = useState(null);

  const currentItem = items[itemIndex];
  const currentChoice = currentItem?.choices?.find((choice) => choice.choiceId === choiceId);
  const currentProp = currentChoice?.propositions?.[propIndex];

  const isNegativeStem = useMemo(
    () => (currentItem?.stem || "").includes("적절하지"),
    [currentItem]
  );

  const handleChoiceSelect = (id) => {
    setChoiceId(id);
    setPropIndex(0);
    setLastResult(null);
  };

  const handleTokenClick = (token) => {
    if (!currentProp) return;
    const correct = currentProp.evidenceTokens?.includes(token.tokenId);
    adjustTime(correct ? 20 : -20);
    recordAnswer({ id: currentProp.propId, correct });
    setLastResult(correct ? "correct" : "wrong");
    if (!correct) return;
    setPropMarks((prev) => ({ ...prev, [currentProp.propId]: currentProp.oxAnswer }));
    const nextIndex = propIndex + 1;
    if (nextIndex < currentChoice.propositions.length) {
      setPropIndex(nextIndex);
      return;
    }
    const isCorrectChoice = currentChoice.finalIsCorrectChoice;
    setChoiceMarks((prev) => ({
      ...prev,
      [currentChoice.choiceId]: isCorrectChoice
        ? "정답"
        : isNegativeStem
          ? "O"
          : "X",
    }));
    if (isCorrectChoice) {
      if (itemIndex >= items.length - 1) {
        finish(true);
        return;
      }
      setItemIndex((prev) => prev + 1);
      setChoiceId(null);
      setPropIndex(0);
      setLastResult(null);
    } else {
      setChoiceId(null);
      setPropIndex(0);
    }
  };

  useEffect(() => {
    if (status === "READY") {
      start();
    }
  }, [status, start]);

  useEffect(() => {
    setLastResult(null);
  }, [itemIndex]);

  return (
    <div className="choice-module">
      {status === "READY" ? (
        <div className="worksheet-start">
          <div className="worksheet-empty">선택지 판별 학습을 시작합니다.</div>
          <button type="button" className="worksheet-start-btn" onClick={start}>
            학습 시작
          </button>
        </div>
      ) : (
        <>
          <div className="choice-header">
            <h3>{currentItem?.stem}</h3>
            {currentProp ? (
              <p>
                명제: {currentProp.text} ({currentProp.oxAnswer})
              </p>
            ) : (
              <p>선택지를 클릭해 명제를 확인하세요.</p>
            )}
            {lastResult ? (
              <span className={`worksheet-feedback ${lastResult}`}>
                {lastResult === "correct" ? "정답입니다!" : "오답입니다."}
              </span>
            ) : null}
          </div>
          <div className="choice-body">
            <div className="choice-list">
              {(currentItem?.choices || []).map((choice) => (
                <button
                  key={choice.choiceId}
                  type="button"
                  className={`choice-item ${choiceId === choice.choiceId ? "active" : ""}`}
                  onClick={() => handleChoiceSelect(choice.choiceId)}
                >
                  <span className="choice-label">{choice.choiceId}</span>
                  <span>{choice.text}</span>
                  {choiceMarks[choice.choiceId] ? (
                    <span className="choice-mark">{choiceMarks[choice.choiceId]}</span>
                  ) : null}
                </button>
              ))}
            </div>
            <div className="choice-passage">
              <TokenPassage passage={payload.passage} onTokenClick={handleTokenClick} />
              {currentChoice ? (
                <div className="choice-props">
                  {currentChoice.propositions.map((prop) => (
                    <div key={prop.propId} className="choice-prop">
                      <span>{prop.text}</span>
                      {propMarks[prop.propId] ? (
                        <span className="choice-prop-mark">{propMarks[prop.propId]}</span>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default ChoiceJudgementModule;
