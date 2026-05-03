import MarkdownEditField from "../MarkdownEditField";

/**
 * MULTI_CHOICE 인라인 편집기.
 * - choices[] (마크다운/이미지 지원 텍스트 + 정답 라디오)
 * - 추가/삭제
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
      <div className="dq-section-label">선택지 <span style={{ fontSize: 11, color: "#888", fontWeight: 400 }}>(마크다운·이미지 지원)</span></div>
      <div className="dq-mc-list" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {choices.map((c, i) => (
          <div key={c.id || i} className={`dq-mc-row ${answerId === c.id ? "is-answer" : ""}`}
            style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
            <label className="dq-mc-radio" title="정답으로 지정"
              style={{ display: "flex", alignItems: "center", gap: 4, paddingTop: 8, flexShrink: 0 }}>
              <input
                type="radio"
                name={`${path}-answer`}
                checked={answerId === c.id}
                onChange={() => editor.updateField(`${path}.answerId`, c.id)}
              />
              <span className="dq-mc-num" style={{ fontWeight: 600 }}>{i + 1}</span>
            </label>
            <div style={{ flex: 1, minWidth: 0 }}>
              <MarkdownEditField
                value={c.text || ""}
                onChange={(v) => editor.updateField(`${path}.choices[${i}].text`, v)}
                placeholder={`${i + 1}번 선택지 텍스트`}
                minHeight={60}
              />
            </div>
            <button
              type="button"
              className="dq-mc-del"
              onClick={() => removeChoice(i)}
              title="삭제"
              style={{ flexShrink: 0, paddingTop: 4 }}
            >×</button>
          </div>
        ))}
      </div>
      <button type="button" className="dq-add-btn" onClick={addChoice} style={{ marginTop: 8 }}>+ 선택지 추가</button>
    </div>
  );
}
