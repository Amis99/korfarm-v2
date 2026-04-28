import InlineEditable from "./InlineEditable";

/**
 * MULTI_CHOICE 인라인 편집기.
 * - choices[] 인라인 (텍스트 + 정답 라디오)
 * - 추가/삭제
 *
 * props:
 *   question: { id, choices:[{id, text}], answerId, ... }
 *   path: 이 문제 question 의 path prefix (예: "questions[0]")
 *   editor: useContentEditor 반환 (updateField/addItem/removeItem)
 */
export default function MultiChoiceEditor({ question, path, editor }) {
  const choices = question.choices || [];
  const answerId = question.answerId || "";

  const addChoice = () => {
    const newId = `c${Date.now().toString(36).slice(-4)}`;
    editor.addItem(`${path}.choices`, choices.length, { id: newId, text: "" });
  };
  const removeChoice = (idx) => {
    if (choices.length <= 2) return alert("최소 2개의 선택지가 필요합니다.");
    if (!window.confirm(`${idx + 1}번 선택지를 삭제할까요?`)) return;
    editor.removeItem(`${path}.choices`, idx);
  };

  return (
    <div className="dq-mc">
      <div className="dq-section-label">선택지</div>
      <div className="dq-mc-list">
        {choices.map((c, i) => (
          <div key={c.id || i} className={`dq-mc-row ${answerId === c.id ? "is-answer" : ""}`}>
            <label className="dq-mc-radio" title="정답으로 지정">
              <input
                type="radio"
                name={`${path}-answer`}
                checked={answerId === c.id}
                onChange={() => editor.updateField(`${path}.answerId`, c.id)}
              />
              <span className="dq-mc-num">{i + 1}</span>
            </label>
            <InlineEditable
              value={c.text}
              onChange={(v) => editor.updateField(`${path}.choices[${i}].text`, v)}
              placeholder="선택지 텍스트"
              multiline={false}
              className="dq-mc-text"
            />
            <button
              type="button"
              className="dq-mc-del"
              onClick={() => removeChoice(i)}
              title="삭제"
            >×</button>
          </div>
        ))}
      </div>
      <button type="button" className="dq-add-btn" onClick={addChoice}>+ 선택지 추가</button>
    </div>
  );
}
