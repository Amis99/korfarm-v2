import InlineEditable from "../dailyquiz/InlineEditable";
import MultiChoiceEditor from "../dailyquiz/MultiChoiceEditor";
import FillBlanksEditor from "../dailyquiz/FillBlanksEditor";

const TYPE_OPTIONS = [
  { value: "MULTI_CHOICE", label: "객관식 (MULTI_CHOICE)" },
  { value: "FILL_BLANKS", label: "빈칸 채우기 (FILL_BLANKS)" },
];

/**
 * 배경지식/추론용 문제 카드 편집기. 지문(passage) 또는 legacy 모드 둘 다에서 사용.
 *
 * props:
 *   question, idx, total, path, editor,
 *   onMoveUp, onMoveDown, onDelete, onDuplicate
 *   compact: 옅은 카드(지문 내부 문제용)
 */
export default function BackgroundQuestionEditor({
  question, idx, total, path, editor,
  onMoveUp, onMoveDown, onDelete, onDuplicate,
  compact = false,
}) {
  const t = question.type || "MULTI_CHOICE";

  const onTypeChange = (newType) => {
    if (newType === t) return;
    if (!window.confirm(`문제 유형 "${t}" → "${newType}" 로 변경합니다. 일부 필드는 초기화됩니다.`)) return;
    const base = { id: question.id, type: newType, stem: question.stem || "", explanation: question.explanation || "", scoring: question.scoring };
    let next = base;
    if (newType === "MULTI_CHOICE") {
      next = { ...base, choices: [
        { id: "c1", text: "" }, { id: "c2", text: "" }, { id: "c3", text: "" }, { id: "c4", text: "" },
      ], answerId: "" };
    } else if (newType === "FILL_BLANKS") {
      next = { ...base, template: "____", blanks: [
        { id: "b1", choices: [{ id: "b1-c1", text: "" }, { id: "b1-c2", text: "" }], answerId: "" },
      ] };
    }
    editor.updateField(path, next);
  };

  return (
    <div className={`dq-card ${compact ? "bg-q-card" : ""}`}>
      <div className="dq-card-header">
        <div className="dq-card-num">문제 {idx + 1} / {total}</div>
        <select className="dq-card-type" value={t} onChange={(e) => onTypeChange(e.target.value)}>
          {TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span style={{ flex: 1 }} />
        <div className="dq-card-actions">
          <button type="button" onClick={onMoveUp} disabled={idx === 0} title="위로">▲</button>
          <button type="button" onClick={onMoveDown} disabled={idx >= total - 1} title="아래로">▼</button>
          <button type="button" onClick={onDuplicate} title="복제">⧉</button>
          <button type="button" onClick={onDelete} title="삭제" className="danger">×</button>
        </div>
      </div>
      <div className="dq-card-body">
        <div className="dq-section-label">발문 (stem)</div>
        <InlineEditable
          value={question.stem || ""}
          onChange={(v) => editor.updateField(`${path}.stem`, v)}
          placeholder="문제 발문 (마크다운: **굵게**, ==하이라이트==, *기울이기*, <u>밑줄</u>)"
          className="dq-stem"
        />

        {t === "MULTI_CHOICE" && <MultiChoiceEditor question={question} path={path} editor={editor} />}
        {t === "FILL_BLANKS" && <FillBlanksEditor question={question} path={path} editor={editor} />}

        <div className="dq-section-label" style={{ marginTop: 14 }}>해설 (explanation)</div>
        <InlineEditable
          value={question.explanation || ""}
          onChange={(v) => editor.updateField(`${path}.explanation`, v)}
          placeholder="정답 해설"
          className="dq-explanation"
        />

        <div className="dq-section-label" style={{ marginTop: 12 }}>점수 (scoring)</div>
        <div className="dq-scoring-row">
          <label>
            정답 시간 가산
            <input
              type="number"
              value={question?.scoring?.correctDeltaSec ?? 10}
              onChange={(e) => editor.updateField(`${path}.scoring.correctDeltaSec`, Number(e.target.value))}
            />
            초
          </label>
          <label>
            오답 시간 차감
            <input
              type="number"
              value={question?.scoring?.wrongDeltaSec ?? -10}
              onChange={(e) => editor.updateField(`${path}.scoring.wrongDeltaSec`, Number(e.target.value))}
            />
            초
          </label>
        </div>
      </div>
    </div>
  );
}
