import InlineEditable from "./InlineEditable";

/**
 * FILL_BLANKS 인라인 편집기.
 * - template: 텍스트(`____` 마커가 빈칸 자리)
 * - blanks[]: 각 빈칸의 choices + answerId
 */
export default function FillBlanksEditor({ question, path, editor }) {
  const template = question.template || "";
  const blanks = question.blanks || [];

  const addBlank = () => {
    const newId = `b${Date.now().toString(36).slice(-4)}`;
    editor.addItem(`${path}.blanks`, blanks.length, {
      id: newId,
      choices: [
        { id: `${newId}-c1`, text: "" },
        { id: `${newId}-c2`, text: "" },
      ],
      answerId: "",
    });
  };
  const removeBlank = (idx) => {
    if (!window.confirm(`빈칸 ${idx + 1} 을 삭제할까요?`)) return;
    editor.removeItem(`${path}.blanks`, idx);
  };
  const addChoice = (bi) => {
    const blank = blanks[bi];
    const newId = `${blank.id}-c${(blank.choices?.length || 0) + 1}`;
    editor.addItem(`${path}.blanks[${bi}].choices`, blank.choices?.length || 0, { id: newId, text: "" });
  };
  const removeChoice = (bi, ci) => {
    const blank = blanks[bi];
    if ((blank.choices?.length || 0) <= 2) return alert("최소 2개 선택지가 필요합니다.");
    editor.removeItem(`${path}.blanks[${bi}].choices`, ci);
  };
  const moveBlank = (from, to) => {
    if (to < 0 || to >= blanks.length) return;
    editor.reorderItems(`${path}.blanks`, from, to);
  };
  const moveChoice = (bi, from, to) => {
    const len = blanks[bi]?.choices?.length || 0;
    if (to < 0 || to >= len) return;
    editor.reorderItems(`${path}.blanks[${bi}].choices`, from, to);
  };

  return (
    <div className="dq-fb">
      <div className="dq-section-label">템플릿 (빈칸 자리에 ____ 입력)</div>
      <InlineEditable
        value={template}
        onChange={(v) => editor.updateField(`${path}.template`, v)}
        placeholder="예) ____는 ____에 의해 작용한다."
        className="dq-fb-template"
      />

      <div className="dq-section-label" style={{ marginTop: 12 }}>빈칸 ({blanks.length}개)</div>
      {blanks.map((b, bi) => (
        <div key={b.id || bi} className="dq-fb-blank">
          <div className="dq-fb-blank-header">
            <span className="dq-fb-blank-num">빈칸 {bi + 1}</span>
            <div className="dq-fb-blank-move">
              <button type="button" onClick={() => moveBlank(bi, bi - 1)} disabled={bi === 0} title="위로">▲</button>
              <button type="button" onClick={() => moveBlank(bi, bi + 1)} disabled={bi >= blanks.length - 1} title="아래로">▼</button>
            </div>
            <span style={{ flex: 1 }} />
            <button type="button" className="dq-mc-del" onClick={() => removeBlank(bi)} title="빈칸 삭제">×</button>
          </div>
          <div className="dq-mc-list">
            {(b.choices || []).map((c, ci) => (
              <div key={c.id || ci} className={`dq-mc-row ${b.answerId === c.id ? "is-answer" : ""}`}>
                <label className="dq-mc-radio" title="정답으로 지정">
                  <input
                    type="radio"
                    name={`${path}-blank-${bi}-answer`}
                    checked={b.answerId === c.id}
                    onChange={() => editor.updateField(`${path}.blanks[${bi}].answerId`, c.id)}
                  />
                  <span className="dq-mc-num">{ci + 1}</span>
                </label>
                <InlineEditable
                  value={c.text}
                  onChange={(v) => editor.updateField(`${path}.blanks[${bi}].choices[${ci}].text`, v)}
                  placeholder="선택지"
                  multiline={false}
                  className="dq-mc-text"
                />
                <div className="dq-fb-choice-move">
                  <button type="button" onClick={() => moveChoice(bi, ci, ci - 1)} disabled={ci === 0} title="위로">▲</button>
                  <button type="button" onClick={() => moveChoice(bi, ci, ci + 1)} disabled={ci >= (b.choices?.length || 0) - 1} title="아래로">▼</button>
                </div>
                <button type="button" className="dq-mc-del" onClick={() => removeChoice(bi, ci)}>×</button>
              </div>
            ))}
          </div>
          <button type="button" className="dq-add-btn" onClick={() => addChoice(bi)}>+ 선택지 추가</button>
        </div>
      ))}
      <button type="button" className="dq-add-btn" onClick={addBlank}>+ 빈칸 추가</button>
    </div>
  );
}
