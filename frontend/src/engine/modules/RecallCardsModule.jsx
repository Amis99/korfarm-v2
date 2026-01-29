import { useEffect, useMemo, useState } from "react";
import { useEngine } from "../core/EngineContext";

function RecallCardsModule({ content }) {
  const { finish, adjustTime, start, status } = useEngine();
  const payload = content?.payload || {};
  const cards = payload.cards || [];
  const initialOrder = useMemo(() => cards.map((card) => card.id), [cards]);
  const [order, setOrder] = useState(initialOrder);
  const [seed, setSeed] = useState(payload.seedPool?.initial ?? 3);
  const [feedback, setFeedback] = useState("");
  const [dragId, setDragId] = useState(null);
  const [showAnswer, setShowAnswer] = useState(false);

  const moveCard = (id, direction) => {
    setOrder((prev) => {
      const idx = prev.indexOf(id);
      if (idx < 0) return prev;
      const next = [...prev];
      const target = direction === "up" ? idx - 1 : idx + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  };

  const handleSubmit = () => {
    const correctOrder = payload.correctOrder || [];
    const isCorrect = correctOrder.join("|") === order.join("|");
    if (isCorrect) {
      setFeedback("정확한 순서입니다!");
      setShowAnswer(false);
      finish(true);
      return;
    }
    adjustTime(-20);
    const penalty = payload.seedPool?.wrongPenaltySeed ?? 1;
    const nextSeed = Math.max(0, seed - penalty);
    setSeed(nextSeed);
    setFeedback("순서가 틀렸습니다. 다시 정렬해 주세요.");
    setShowAnswer(true);
    if (nextSeed === 0) {
      finish(false);
    }
  };

  const handleDrop = (targetId) => {
    if (!dragId || dragId === targetId) return;
    setOrder((prev) => {
      const next = [...prev];
      const from = next.indexOf(dragId);
      const to = next.indexOf(targetId);
      if (from < 0 || to < 0) return prev;
      next.splice(from, 1);
      next.splice(to, 0, dragId);
      return next;
    });
    setDragId(null);
  };

  useEffect(() => {
    if (status === "READY") {
      start();
    }
  }, [status, start]);

  return (
    <div className="recall-module">
      {status === "READY" ? (
        <div className="worksheet-start">
          <div className="worksheet-empty">복기 학습을 시작합니다.</div>
          <button type="button" className="worksheet-start-btn" onClick={start}>
            학습 시작
          </button>
        </div>
      ) : (
        <>
          <div className="recall-dropzone">지문 요약 카드 정렬</div>
          <div className="recall-cards">
            {order.map((cardId, idx) => {
              const card = cards.find((item) => item.id === cardId);
              return (
                <div
                  key={cardId}
                  className="recall-card"
                  draggable
                  onDragStart={() => setDragId(cardId)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => handleDrop(cardId)}
                >
                  <span className="recall-index">{idx + 1}</span>
                  <p>{card?.text}</p>
                  <div className="recall-actions">
                    <button type="button" onClick={() => moveCard(cardId, "up")}>
                      위로
                    </button>
                    <button type="button" onClick={() => moveCard(cardId, "down")}>
                      아래로
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          {showAnswer ? (
            <div className="recall-answer">
              <strong>정답 순서</strong>
              <ol>
                {(payload.correctOrder || []).map((id) => (
                  <li key={id}>{cards.find((item) => item.id === id)?.text}</li>
                ))}
              </ol>
            </div>
          ) : null}
          <div className="recall-footer">
            <span>남은 씨앗: {seed}</span>
            <button type="button" onClick={handleSubmit}>
              제출하기
            </button>
          </div>
          {feedback ? <p className="recall-feedback">{feedback}</p> : null}
        </>
      )}
    </div>
  );
}

export default RecallCardsModule;
