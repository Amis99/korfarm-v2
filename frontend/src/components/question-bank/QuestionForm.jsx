import { useState } from "react";

function QuestionForm({ question, index, codes, onChange }) {
  const [open, setOpen] = useState(false);

  const getValues = (groupKey) => {
    const group = codes.find((g) => g.group_key === groupKey);
    return (group?.values || []).filter((v) => v.is_active);
  };

  const formats = getValues("question_format");
  const answerTypes = getValues("answer_type");
  const questionTypes = getValues("question_type");
  const choicePatterns = getValues("choice_pattern");

  return (
    <div className="qb-accordion">
      <div className="qb-accordion-header" onClick={() => setOpen(!open)}>
        <span>
          문제 {question.question_number || index + 1}
          {question.question_format && (
            <span className="qb-tag" style={{ marginLeft: 8 }}>
              {question.question_format === "MCQ" ? "객관식" :
               question.question_format === "SA" ? "단답형" :
               question.question_format === "ESSAY" ? "서술형" : question.question_format}
            </span>
          )}
        </span>
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
          {open ? "expand_less" : "expand_more"}
        </span>
      </div>
      {open && (
        <div className="qb-accordion-body">
          <div className="qb-meta-grid" style={{ marginBottom: 12 }}>
            <div className="qb-meta-field">
              <label>문제 번호</label>
              <input
                className="qb-inline-input"
                type="number"
                value={question.question_number}
                onChange={(e) => onChange(index, "question_number", Number(e.target.value))}
              />
            </div>
            <div className="qb-meta-field">
              <label>문항 형식</label>
              <select className="qb-select" style={{ width: "100%" }} value={question.question_format} onChange={(e) => onChange(index, "question_format", e.target.value)}>
                <option value="">선택</option>
                {formats.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
              </select>
            </div>
            <div className="qb-meta-field">
              <label>정답 유형</label>
              <select className="qb-select" style={{ width: "100%" }} value={question.answer_type} onChange={(e) => onChange(index, "answer_type", e.target.value)}>
                <option value="">선택</option>
                {answerTypes.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
              </select>
            </div>
            <div className="qb-meta-field">
              <label>문제 유형</label>
              <select className="qb-select" style={{ width: "100%" }} value={question.question_type} onChange={(e) => onChange(index, "question_type", e.target.value)}>
                <option value="">선택</option>
                {questionTypes.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
              </select>
            </div>
            <div className="qb-meta-field">
              <label>선택지 패턴</label>
              <select className="qb-select" style={{ width: "100%" }} value={question.choice_pattern} onChange={(e) => onChange(index, "choice_pattern", e.target.value)}>
                <option value="">선택</option>
                {choicePatterns.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
              </select>
            </div>
            <div className="qb-meta-field">
              <label>정답</label>
              <input
                className="qb-inline-input"
                value={question.correct_answer}
                onChange={(e) => onChange(index, "correct_answer", e.target.value)}
              />
            </div>
            <div className="qb-meta-field">
              <label>난이도 (1~5)</label>
              <input
                className="qb-inline-input"
                type="number"
                min="1"
                max="5"
                value={question.difficulty}
                onChange={(e) => onChange(index, "difficulty", e.target.value)}
              />
            </div>
            <div className="qb-meta-field">
              <label>배점</label>
              <input
                className="qb-inline-input"
                type="number"
                value={question.points}
                onChange={(e) => onChange(index, "points", e.target.value)}
              />
            </div>
          </div>

          <div className="qb-meta-field" style={{ marginBottom: 12 }}>
            <label>발문 (stem)</label>
            <textarea
              className="qb-json-area"
              style={{ minHeight: 80 }}
              value={question.stem}
              onChange={(e) => onChange(index, "stem", e.target.value)}
            />
          </div>

          <div className="qb-meta-field" style={{ marginBottom: 12 }}>
            <label>해설</label>
            <textarea
              className="qb-json-area"
              style={{ minHeight: 80 }}
              value={question.explanation}
              onChange={(e) => onChange(index, "explanation", e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default QuestionForm;
