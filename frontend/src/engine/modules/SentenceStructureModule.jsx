import { useEffect, useMemo, useState } from "react";
import { useEngine } from "../core/EngineContext";

function SentenceStructureModule({ content }) {
  const { adjustTime, recordAnswer, finish, start, status } = useEngine();
  const payload = content?.payload || {};
  const sentences = payload.sentences || [];
  const [sentenceIndex, setSentenceIndex] = useState(0);
  const [queryIndex, setQueryIndex] = useState(0);
  const [selected, setSelected] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [showCorrect, setShowCorrect] = useState(false);

  const sentence = sentences[sentenceIndex];
  const query = sentence?.roleQueryOrder?.[queryIndex];
  const predicateToken = sentence?.tokens?.find((token) => token.tokenId === query?.predicate);

  const handleTokenClick = (tokenId) => {
    setSelected((prev) =>
      prev.includes(tokenId) ? prev.filter((id) => id !== tokenId) : [...prev, tokenId]
    );
  };

  const handleSubmit = () => {
    if (!query) return;
    const targetRoles = query.targetRoles || [];
    const correctTokens = sentence.tokens.filter((token) => targetRoles.includes(token.role));
    const correctIds = correctTokens.map((token) => token.tokenId).sort();
    const selectedSorted = [...selected].sort();
    const correct =
      correctIds.length === selectedSorted.length &&
      correctIds.every((id, idx) => id === selectedSorted[idx]);

    adjustTime(correct ? 20 : -20);
    recordAnswer({ id: `${sentence.sentenceId}-${queryIndex}`, correct });
    if (!correct) {
      setFeedback("오답입니다. 다시 선택해 주세요.");
      setShowCorrect(true);
      setSelected([]);
      return;
    }
    setFeedback("정답입니다!");
    setShowCorrect(false);
    setSelected([]);
    if (queryIndex < sentence.roleQueryOrder.length - 1) {
      setQueryIndex((prev) => prev + 1);
      return;
    }
    if (sentenceIndex < sentences.length - 1) {
      setSentenceIndex((prev) => prev + 1);
      setQueryIndex(0);
      return;
    }
    finish(true);
  };

  const tokens = useMemo(() => sentence?.tokens || [], [sentence]);

  useEffect(() => {
    if (status === "READY") {
      start();
    }
  }, [status, start]);

  return (
    <div className="sentence-structure-module">
      {status === "READY" ? (
        <div className="worksheet-start">
          <div className="worksheet-empty">문장의 짜임 분석을 시작합니다.</div>
          <button type="button" className="worksheet-start-btn" onClick={start}>
            학습 시작
          </button>
        </div>
      ) : (
        <>
          <div className="sentence-instruction">
            {predicateToken ? (
              <p>
                서술어 <strong>{predicateToken.text}</strong>에 호응하는 성분을 모두 선택하세요.
              </p>
            ) : (
              <p>문장 성분을 선택하세요.</p>
            )}
            <span>
              {sentenceIndex + 1}/{sentences.length} · {queryIndex + 1}/
              {sentence?.roleQueryOrder?.length || 0}
            </span>
          </div>
          {feedback ? <div className="worksheet-feedback">{feedback}</div> : null}
          <div className="sentence-tokens">
            {tokens.map((token) => (
              <button
                key={token.tokenId}
                type="button"
                className={`token-chip role-${token.role?.split("_")[1] || "1"} ${
                  selected.includes(token.tokenId) ? "active" : ""
                } ${showCorrect && query?.targetRoles?.includes(token.role) ? "highlight" : ""}`}
                onClick={() => handleTokenClick(token.tokenId)}
              >
                {token.text}
              </button>
            ))}
          </div>
          <div className="sentence-actions">
            <button type="button" onClick={handleSubmit}>
              제출
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default SentenceStructureModule;
