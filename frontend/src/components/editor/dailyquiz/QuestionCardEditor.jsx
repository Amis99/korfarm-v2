import InlineEditable from "./InlineEditable";
import MultiChoiceEditor from "./MultiChoiceEditor";
import FillBlanksEditor from "./FillBlanksEditor";
import TextSelectEditor from "./TextSelectEditor";
import ChoiceComplexOxEditor from "./ChoiceComplexOxEditor";

const TYPE_OPTIONS = [
  { value: "MULTI_CHOICE", label: "객관식 (MULTI_CHOICE)" },
  { value: "FILL_BLANKS", label: "빈칸 채우기 (FILL_BLANKS)" },
  { value: "TEXT_SELECT", label: "지문 영역 클릭 (TEXT_SELECT)" },
  { value: "CHOICE_COMPLEX_OX", label: "선지 분석 (CHOICE_COMPLEX_OX)" },
];

/**
 * 한 문제 카드의 인라인 편집기. 학생 화면 cum-card 와 비슷한 레이아웃.
 *
 * props:
 *   question, idx, total, path("questions[idx]"), editor,
 *   onMoveUp, onMoveDown, onDelete, onDuplicate
 */
export default function QuestionCardEditor({
  question, idx, total, path, editor,
  onMoveUp, onMoveDown, onDelete, onDuplicate,
}) {
  const t = question.type || "MULTI_CHOICE";

  const onTypeChange = (newType) => {
    if (newType === t) return;
    if (!window.confirm(`문제 유형을 "${t}" → "${newType}" 로 변경합니다. 일부 필드는 초기화됩니다. 진행할까요?`)) return;
    // 최소 필드만 보존
    const base = { id: question.id, type: newType, stem: question.stem || "", explanation: question.explanation || "", scoring: question.scoring };
    let next = base;
    if (newType === "MULTI_CHOICE") {
      next = { ...base, passage: typeof question.passage === "string" ? question.passage : "", choices: [
        { id: "c1", text: "" }, { id: "c2", text: "" }, { id: "c3", text: "" }, { id: "c4", text: "" },
      ], answerId: "" };
    } else if (newType === "FILL_BLANKS") {
      next = { ...base, passage: typeof question.passage === "string" ? question.passage : "", template: "____", blanks: [
        { id: "b1", choices: [{ id: "b1-c1", text: "" }, { id: "b1-c2", text: "" }], answerId: "" },
      ] };
    } else if (newType === "TEXT_SELECT") {
      next = { ...base, passage: { paragraphs: [{ id: "p1", text: "" }] }, answerRanges: [], answerMatchMode: "ALL" };
    } else if (newType === "CHOICE_COMPLEX_OX") {
      next = {
        ...base, questionKind: "CHOICE_ANALYSIS",
        passage: { paragraphs: [{ id: "p1", text: "" }] },
        choices: [
          { choiceId: "A", text: "", propositions: [{ propId: "A1", text: "", oxAnswer: "O", matchMode: "ALL", evidenceRanges: [] }] },
          { choiceId: "B", text: "", propositions: [{ propId: "B1", text: "", oxAnswer: "O", matchMode: "ALL", evidenceRanges: [] }] },
        ],
      };
    }
    editor.updateField(path, next);
  };

  // passage 가 string 인 type (MULTI_CHOICE, FILL_BLANKS) 와 객체인 type (TEXT_SELECT, CHOICE_COMPLEX_OX) 분리
  const passageIsString = t === "MULTI_CHOICE" || t === "FILL_BLANKS";

  return (
    <div className="dq-card">
      <div className="dq-card-header">
        <div className="dq-card-num">문제 {idx + 1} / {total}</div>
        <select
          className="dq-card-type"
          value={t}
          onChange={(e) => onTypeChange(e.target.value)}
        >
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

        {passageIsString && (
          <>
            <div className="dq-section-label">지문 (선택)</div>
            <InlineEditable
              value={typeof question.passage === "string" ? question.passage : ""}
              onChange={(v) => editor.updateField(`${path}.passage`, v)}
              placeholder="지문이 없으면 비워두세요."
              className="dq-passage"
            />
          </>
        )}

        {t === "MULTI_CHOICE" && <MultiChoiceEditor question={question} path={path} editor={editor} />}
        {t === "FILL_BLANKS" && <FillBlanksEditor question={question} path={path} editor={editor} />}
        {t === "TEXT_SELECT" && <TextSelectEditor question={question} path={path} editor={editor} />}
        {t === "CHOICE_COMPLEX_OX" && <ChoiceComplexOxEditor question={question} path={path} editor={editor} />}

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
              value={question?.scoring?.correctDeltaSec ?? 20}
              onChange={(e) => editor.updateField(`${path}.scoring.correctDeltaSec`, Number(e.target.value))}
            />
            초
          </label>
          <label>
            오답 시간 차감
            <input
              type="number"
              value={question?.scoring?.wrongDeltaSec ?? -40}
              onChange={(e) => editor.updateField(`${path}.scoring.wrongDeltaSec`, Number(e.target.value))}
            />
            초
          </label>
        </div>
      </div>
    </div>
  );
}
