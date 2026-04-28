import InlineEditable from "../dailyquiz/InlineEditable";

/**
 * 일일독해 지문 단락 편집.
 * payload.passage.paragraphs[].text
 */
export default function PassageEditor({ passage, editor }) {
  const paragraphs = passage?.paragraphs || [];

  const addParagraph = () => {
    const newId = `p${paragraphs.length + 1}`;
    editor.addItem("passage.paragraphs", paragraphs.length, { id: newId, text: "" });
  };
  const removeParagraph = (i) => {
    if (paragraphs.length <= 1) return alert("지문에 최소 1개 단락이 필요합니다.");
    if (!window.confirm(`단락 ${i + 1} 삭제?`)) return;
    editor.removeItem("passage.paragraphs", i);
  };
  const move = (from, to) => {
    if (to < 0 || to >= paragraphs.length) return;
    editor.reorderItems("passage.paragraphs", from, to);
  };

  return (
    <div className="dq-card">
      <div className="dq-card-header">
        <div className="dq-card-num">📖 지문 (passage)</div>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 11, color: "#888" }}>{paragraphs.length}단락</span>
      </div>
      <div className="dq-card-body">
        {paragraphs.map((p, i) => (
          <div key={p.id || i} className="dq-ts-para-edit">
            <div className="dq-ts-para-head">
              <span className="dq-ts-para-id">{p.id || `p${i + 1}`}</span>
              <div className="dq-fb-blank-move">
                <button type="button" onClick={() => move(i, i - 1)} disabled={i === 0}>▲</button>
                <button type="button" onClick={() => move(i, i + 1)} disabled={i >= paragraphs.length - 1}>▼</button>
              </div>
              <span style={{ flex: 1 }} />
              <button type="button" className="dq-mc-del" onClick={() => removeParagraph(i)}>×</button>
            </div>
            <InlineEditable
              value={p.text || ""}
              onChange={(v) => editor.updateField(`passage.paragraphs[${i}].text`, v)}
              placeholder="단락 본문"
              className="dq-ts-para-input"
            />
          </div>
        ))}
        <button type="button" className="dq-add-btn" onClick={addParagraph}>+ 단락 추가</button>
      </div>
    </div>
  );
}
