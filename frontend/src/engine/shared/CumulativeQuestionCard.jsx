import RichText from "../../utils/RichText";

/**
 * 누적형(C형) 학습 모듈용 공통 문제 카드.
 *
 * Props:
 *   question: { id, stem|prompt, choices: [{id, text}], answerId, explanation }
 *   idx: 0부터 시작하는 인덱스
 *   total: 전체 문제 수
 *   completion: { selectedId, isCorrect } | undefined — 푼 문제는 정답·해설 표시
 *   isActive: 현재 활성 문제이면 클릭 가능
 *   onSelect(choiceId): 선택지 클릭 콜백
 *   variant: "default" | "wide" — wide는 지문이 큰 모듈용
 */
export default function CumulativeQuestionCard({
  question,
  idx,
  total,
  completion,
  isActive,
  onSelect,
  variant = "default",
}) {
  if (!question) return null;
  const choices = question.choices || [];
  const answerId = question.answerId;
  const stem = question.stem || question.prompt || "";

  return (
    <div
      className={`cum-card ${variant === "wide" ? "cum-card-wide" : ""} ${completion ? "completed" : ""} ${isActive ? "active" : ""} ${completion?.isCorrect ? "correct" : completion ? "wrong" : ""}`}
    >
      <div className="cum-card-header">
        <span className="cum-card-num">문제 {idx + 1}{total ? ` / ${total}` : ""}</span>
        {completion && (
          <span className={`cum-card-mark ${completion.isCorrect ? "correct" : "wrong"}`}>
            {completion.isCorrect ? "○ 정답" : "× 오답"}
          </span>
        )}
      </div>
      <div className="cum-card-stem">
        <RichText>{stem}</RichText>
      </div>
      <div className="cum-card-choices">
        {choices.map((c, ci) => {
          const cid = c.id || c.choiceId;
          const isCorrectChoice = cid === answerId;
          const isPicked = completion?.selectedId === cid;
          const showAsCorrect = completion && isCorrectChoice;
          const showAsWrong = completion && isPicked && !isCorrectChoice;
          return (
            <button
              key={cid || ci}
              type="button"
              className={`cum-choice ${showAsCorrect ? "is-correct" : ""} ${showAsWrong ? "is-wrong" : ""}`}
              onClick={() => isActive && onSelect && onSelect(cid)}
              disabled={!isActive || !!completion}
            >
              <span className="cum-choice-num">{ci + 1}</span>
              <span className="cum-choice-text">
                <RichText>{c.text}</RichText>
              </span>
              {showAsCorrect && <span className="cum-choice-tag">정답</span>}
              {showAsWrong && <span className="cum-choice-tag wrong">선택</span>}
            </button>
          );
        })}
      </div>
      {completion && question.explanation && (
        <div className="cum-card-explanation">
          <span className="cum-card-explanation-label">해설</span>
          <RichText>{question.explanation}</RichText>
        </div>
      )}
    </div>
  );
}
