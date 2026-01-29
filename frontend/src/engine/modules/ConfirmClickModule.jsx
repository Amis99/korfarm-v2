import { useEffect, useState } from "react";
import { useEngine } from "../core/EngineContext";
import TokenPassage from "../shared/TokenPassage";

function ConfirmClickModule({ content }) {
  const { adjustTime, recordAnswer, finish, start, status } = useEngine();
  const payload = content?.payload || {};
  const questions = payload.questions || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [highlightTokens, setHighlightTokens] = useState([]);
  const [activeTokens, setActiveTokens] = useState([]);
  const [pendingNext, setPendingNext] = useState(false);

  const current = questions[currentIndex];

  const handleTokenClick = (token) => {
    if (!current) return;
    if (pendingNext) return;
    const correct = current.answerTokenRefs?.includes(token.tokenId);
    adjustTime(correct ? current.scoring?.correctDeltaSec || 0 : current.scoring?.wrongDeltaSec || 0);
    recordAnswer({ id: current.id, correct });
    if (!correct && current.revealOnWrong) {
      setHighlightTokens(current.answerTokenRefs || []);
      setPendingNext(true);
      return;
    }
    if (correct) {
      setActiveTokens([token.tokenId]);
    }
    if (currentIndex >= questions.length - 1) {
      finish(correct);
      return;
    }
    setCurrentIndex((prev) => prev + 1);
  };

  const handleNext = () => {
    setHighlightTokens([]);
    setActiveTokens([]);
    setPendingNext(false);
    if (currentIndex >= questions.length - 1) {
      finish(false);
      return;
    }
    setCurrentIndex((prev) => prev + 1);
  };

  useEffect(() => {
    if (status === "READY") {
      start();
    }
  }, [status, start]);

  return (
    <div className="confirm-module">
      {status === "READY" ? (
        <div className="worksheet-start">
          <div className="worksheet-empty">확인 학습을 시작합니다.</div>
          <button type="button" className="worksheet-start-btn" onClick={start}>
            학습 시작
          </button>
        </div>
      ) : (
        <>
          <div className="confirm-header">
            <h3 className="confirm-prompt">{current?.prompt}</h3>
            <span>
              {currentIndex + 1}/{questions.length}
            </span>
          </div>
          <TokenPassage
            passage={payload.passage}
            highlightTokens={highlightTokens}
            activeTokenIds={activeTokens}
            onTokenClick={handleTokenClick}
          />
          {pendingNext ? (
            <div className="confirm-next">
              <button type="button" onClick={handleNext}>
                다음 문제
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

export default ConfirmClickModule;
