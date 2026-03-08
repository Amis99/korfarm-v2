/**
 * 선택지 편집 + 정답 라디오
 * @param {Object} props
 * @param {Array} props.choices - [{ id, text }, ...]
 * @param {string} props.answerId - 현재 정답 id
 * @param {string} props.pathPrefix - 필드 경로 접두사 (예: 'questions[0]')
 * @param {Function} props.updateField
 * @param {Function} props.addItem
 * @param {Function} props.removeItem
 */
export default function ChoiceEditor({ choices = [], answerId, pathPrefix, updateField, addItem, removeItem }) {
  const choicesPath = `${pathPrefix}.choices`;

  const handleTextChange = (idx, value) => {
    updateField(`${choicesPath}[${idx}].text`, value);
  };

  const handleAnswerChange = (choiceId) => {
    updateField(`${pathPrefix}.answerId`, choiceId);
  };

  const handleAdd = () => {
    const newId = `c${Date.now()}`;
    addItem(choicesPath, choices.length, { id: newId, text: "" });
  };

  const handleRemove = (idx) => {
    removeItem(choicesPath, idx);
  };

  return (
    <div data-field-path={choicesPath}>
      {choices.map((c, i) => (
        <div key={c.id || i} className="ce-choice-row">
          <input
            type="radio"
            className="ce-choice-radio"
            name={`answer-${pathPrefix}`}
            checked={answerId === c.id}
            onChange={() => handleAnswerChange(c.id)}
            title="정답 설정"
          />
          <span className="ce-choice-num">{i + 1}</span>
          <input
            className="ce-form-input ce-choice-input"
            value={c.text || ""}
            onChange={(e) => handleTextChange(i, e.target.value)}
            placeholder={`선택지 ${i + 1}`}
          />
          {choices.length > 2 && (
            <button className="ce-choice-del" onClick={() => handleRemove(i)} title="삭제">×</button>
          )}
        </div>
      ))}
      <button className="ce-add-btn" onClick={handleAdd}>+ 선택지 추가</button>
    </div>
  );
}
