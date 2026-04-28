import InlineEditable from "./InlineEditable";
import EvidenceRangePicker from "./EvidenceRangePicker";

/**
 * TEXT_SELECT 인라인 편집기.
 * - passage.paragraphs[].text 인라인 편집
 * - answerRanges 드래그로 등록 (paragraphId/start/end/label)
 * - answerMatchMode: ALL / ANY
 */
export default function TextSelectEditor({ question, path, editor }) {
  const paragraphs = question?.passage?.paragraphs || [];
  const answerRanges = question?.answerRanges || [];
  const matchMode = (question?.answerMatchMode || "ALL").toUpperCase();

  const addParagraph = () => {
    const newId = `p${(paragraphs.length || 0) + 1}`;
    editor.addItem(`${path}.passage.paragraphs`, paragraphs.length, { id: newId, text: "" });
  };
  const removeParagraph = (idx) => {
    if (!window.confirm(`단락 ${idx + 1} 삭제? (이 단락의 정답 영역도 함께 무효화됩니다)`)) return;
    editor.removeItem(`${path}.passage.paragraphs`, idx);
  };

  const addRange = (r) => {
    editor.addItem(`${path}.answerRanges`, answerRanges.length, r);
  };
  const removeRange = (idx) => {
    editor.removeItem(`${path}.answerRanges`, idx);
  };

  return (
    <div className="dq-ts">
      <div className="dq-section-label">지문 (단락별 편집)</div>
      {paragraphs.map((p, i) => (
        <div key={p.id || i} className="dq-ts-para-edit">
          <div className="dq-ts-para-head">
            <span className="dq-ts-para-id">{p.id || `p${i + 1}`}</span>
            <button type="button" className="dq-mc-del" onClick={() => removeParagraph(i)}>×</button>
          </div>
          <InlineEditable
            value={p.text || ""}
            onChange={(v) => editor.updateField(`${path}.passage.paragraphs[${i}].text`, v)}
            placeholder="단락 텍스트"
            className="dq-ts-para-input"
          />
        </div>
      ))}
      <button type="button" className="dq-add-btn" onClick={addParagraph}>+ 단락 추가</button>

      <div className="dq-section-label" style={{ marginTop: 14 }}>
        정답 영역
        <span className="dq-mode-toggle" style={{ marginLeft: 12 }}>
          매칭 모드:
          {["ALL", "ANY"].map((m) => (
            <label key={m} style={{ marginLeft: 8 }}>
              <input
                type="radio"
                name={`${path}-mode`}
                checked={matchMode === m}
                onChange={() => editor.updateField(`${path}.answerMatchMode`, m)}
              />
              <span style={{ marginLeft: 4, fontSize: 12 }}>
                {m} ({m === "ALL" ? "모든 영역 클릭" : "한 영역만 클릭"})
              </span>
            </label>
          ))}
        </span>
      </div>
      <EvidenceRangePicker
        paragraphs={paragraphs}
        ranges={answerRanges}
        onAdd={addRange}
        onRemoveRange={removeRange}
      />
    </div>
  );
}
