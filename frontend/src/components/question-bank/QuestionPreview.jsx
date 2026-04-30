function QuestionPreview({ question, index }) {
  const choices = Array.isArray(question.choices) ? question.choices : [];
  const correct = question.correct_answer || "";

  return (
    <div className="qb-card">
      <div className="qb-card-title">
        <span className="material-symbols-outlined">help_outline</span>
        문제 {question.question_number ?? index + 1}
        {question.question_format && (
          <span className="qb-tag" style={{ marginLeft: 8 }}>
            {question.question_format === "MCQ" ? "객관식" :
             question.question_format === "SA" ? "단답형" :
             question.question_format === "ESSAY" ? "서술형" : question.question_format}
          </span>
        )}
        {question.points && (
          <span className="qb-tag" style={{ marginLeft: 4 }}>{question.points}점</span>
        )}
      </div>

      <div className="qb-question-stem">{question.stem}</div>

      {question.box_items?.length > 0 && (
        <div style={{ margin: "8px 0", padding: "8px 12px", background: "#18201a", borderRadius: 6, border: "1px solid var(--stroke)" }}>
          <div style={{ fontSize: "0.75rem", color: "#8a9a8e", marginBottom: 4 }}>&lt;보기&gt;</div>
          {question.box_items.map((bi, i) => (
            <div key={i} style={{ fontSize: "0.83rem", color: "#b0a8a0", padding: "2px 0" }}>
              {typeof bi === "string" ? bi : (bi.기호 ? `${bi.기호} ${bi.내용 || bi.content || ""}` : JSON.stringify(bi))}
            </div>
          ))}
        </div>
      )}

      {choices.length > 0 && (
        <ul className="qb-choice-list">
          {choices.map((c, i) => {
            const symbol = c.기호 || c.symbol || `${i + 1}`;
            const text = c.선택지 || c.text || c.content || (typeof c === "string" ? c : "");
            const isCorrect = correct === symbol || correct === String(i + 1);
            return (
              <li key={i} className={isCorrect ? "correct" : ""}>
                {symbol} {text}
              </li>
            );
          })}
        </ul>
      )}

      {correct && (
        <div className="qb-answer-box">
          정답: {correct}
        </div>
      )}

      {question.explanation && (
        <div className="qb-explanation-box">
          {question.explanation}
        </div>
      )}

      {question.applied_concepts?.length > 0 && (
        <div className="qb-tags" style={{ marginTop: 8 }}>
          {(Array.isArray(question.applied_concepts) ? question.applied_concepts : []).map((c, i) => (
            <span key={i} className="qb-tag">{c}</span>
          ))}
        </div>
      )}
    </div>
  );
}

export default QuestionPreview;
