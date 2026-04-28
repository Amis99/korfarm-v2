import { useState } from "react";
import InlineEditable from "./InlineEditable";
import EvidenceRangePicker from "./EvidenceRangePicker";

/**
 * CHOICE_COMPLEX_OX 인라인 편집기.
 * - 지문 paragraphs[].text 편집
 * - choices[] : 각 선지에 propositions[] (명제)
 * - 명제마다 oxAnswer (O/X), matchMode (ANY/ALL), evidenceRanges (드래그 등록)
 */
export default function ChoiceComplexOxEditor({ question, path, editor }) {
  const paragraphs = question?.passage?.paragraphs || [];
  const choices = question?.choices || [];

  // 활성 명제 — 지문 드래그로 영역 등록할 때 어느 명제에 추가할지
  // key: "ci-pi" (choice index, prop index)
  const [activeKey, setActiveKey] = useState(null);

  const addParagraph = () => {
    const newId = `p${(paragraphs.length || 0) + 1}`;
    editor.addItem(`${path}.passage.paragraphs`, paragraphs.length, { id: newId, text: "" });
  };
  const removeParagraph = (idx) => {
    if (!window.confirm(`단락 ${idx + 1} 삭제? (해당 단락의 evidenceRanges 도 무효화됩니다)`)) return;
    editor.removeItem(`${path}.passage.paragraphs`, idx);
  };

  const addChoice = () => {
    const newCid = String.fromCharCode(65 + choices.length); // A, B, C…
    editor.addItem(`${path}.choices`, choices.length, {
      choiceId: newCid,
      text: "",
      propositions: [
        { propId: `${newCid}1`, text: "", oxAnswer: "O", matchMode: "ALL", evidenceRanges: [] },
      ],
    });
  };
  const removeChoice = (ci) => {
    if (choices.length <= 2) return alert("최소 2개의 선택지가 필요합니다.");
    if (!window.confirm(`선택지 ${ci + 1} 삭제?`)) return;
    editor.removeItem(`${path}.choices`, ci);
  };

  const addProp = (ci) => {
    const c = choices[ci];
    const propId = `${c.choiceId}${(c.propositions?.length || 0) + 1}`;
    editor.addItem(`${path}.choices[${ci}].propositions`, c.propositions?.length || 0, {
      propId,
      text: "",
      oxAnswer: "O",
      matchMode: "ALL",
      evidenceRanges: [],
    });
  };
  const removeProp = (ci, pi) => {
    const c = choices[ci];
    if ((c.propositions?.length || 0) <= 1) return alert("최소 1개 명제가 필요합니다.");
    if (!window.confirm(`명제 ${pi + 1} 삭제?`)) return;
    editor.removeItem(`${path}.choices[${ci}].propositions`, pi);
  };

  // 활성 명제에 evidence range 추가/삭제
  const addEvidence = (r) => {
    if (!activeKey) return;
    const [ci, pi] = activeKey.split("-").map(Number);
    const cur = choices[ci]?.propositions?.[pi]?.evidenceRanges || [];
    editor.addItem(`${path}.choices[${ci}].propositions[${pi}].evidenceRanges`, cur.length, r);
  };
  const removeEvidence = (idx) => {
    if (!activeKey) return;
    const [ci, pi] = activeKey.split("-").map(Number);
    editor.removeItem(`${path}.choices[${ci}].propositions[${pi}].evidenceRanges`, idx);
  };

  // 활성 명제의 evidenceRanges (지문 표시용)
  const activeRangesFor = (ci, pi) => choices[ci]?.propositions?.[pi]?.evidenceRanges || [];

  return (
    <div className="dq-cco">
      <div className="dq-section-label">지문</div>
      {paragraphs.map((p, i) => (
        <div key={p.id || i} className="dq-ts-para-edit">
          <div className="dq-ts-para-head">
            <span className="dq-ts-para-id">{p.id || `p${i + 1}`}</span>
            <button type="button" className="dq-mc-del" onClick={() => removeParagraph(i)}>×</button>
          </div>
          <InlineEditable
            value={p.text || ""}
            onChange={(v) => editor.updateField(`${path}.passage.paragraphs[${i}].text`, v)}
            placeholder="지문 단락"
            className="dq-ts-para-input"
          />
        </div>
      ))}
      <button type="button" className="dq-add-btn" onClick={addParagraph}>+ 단락 추가</button>

      <div className="dq-section-label" style={{ marginTop: 16 }}>
        선택지 ({choices.length}개)
      </div>
      {choices.map((c, ci) => (
        <div key={c.choiceId || ci} className="dq-cco-choice">
          <div className="dq-cco-choice-head">
            <span className="dq-cco-choice-num">{ci + 1}</span>
            <InlineEditable
              value={c.text}
              onChange={(v) => editor.updateField(`${path}.choices[${ci}].text`, v)}
              placeholder="선택지 본문"
              className="dq-cco-choice-text"
            />
            <button type="button" className="dq-mc-del" onClick={() => removeChoice(ci)}>×</button>
          </div>
          <div className="dq-cco-props">
            {(c.propositions || []).map((p, pi) => {
              const key = `${ci}-${pi}`;
              const active = activeKey === key;
              return (
                <div key={p.propId || pi} className={`dq-cco-prop ${active ? "active" : ""}`}>
                  <div className="dq-cco-prop-head">
                    <span className="dq-cco-prop-num">명제 {pi + 1}</span>
                    <div className="dq-cco-ox-toggle">
                      {["O", "X"].map((ox) => (
                        <label key={ox} className={`dq-cco-ox-${ox} ${p.oxAnswer === ox ? "on" : ""}`}>
                          <input
                            type="radio"
                            name={`${path}-${ci}-${pi}-ox`}
                            checked={p.oxAnswer === ox}
                            onChange={() => editor.updateField(`${path}.choices[${ci}].propositions[${pi}].oxAnswer`, ox)}
                          />
                          {ox}
                        </label>
                      ))}
                    </div>
                    <div className="dq-cco-mode-toggle">
                      {["ALL", "ANY"].map((m) => (
                        <label key={m} className={p.matchMode === m ? "on" : ""}>
                          <input
                            type="radio"
                            name={`${path}-${ci}-${pi}-mode`}
                            checked={p.matchMode === m}
                            onChange={() => editor.updateField(`${path}.choices[${ci}].propositions[${pi}].matchMode`, m)}
                          />
                          {m}
                        </label>
                      ))}
                    </div>
                    <button
                      type="button"
                      className={`dq-cco-active-btn ${active ? "on" : ""}`}
                      onClick={() => setActiveKey(active ? null : key)}
                      title="이 명제의 근거 영역 편집"
                    >
                      {active ? "✓ 근거 편집 중" : "근거 영역 편집"}
                    </button>
                    <button type="button" className="dq-mc-del" onClick={() => removeProp(ci, pi)}>×</button>
                  </div>
                  <InlineEditable
                    value={p.text}
                    onChange={(v) => editor.updateField(`${path}.choices[${ci}].propositions[${pi}].text`, v)}
                    placeholder="검증 명제 (예: 'X는 Y이다.')"
                    className="dq-cco-prop-text"
                  />
                  <div className="dq-cco-evidence-summary">
                    근거 영역: {(p.evidenceRanges || []).length}개
                    {(p.evidenceRanges || []).length > 0 && (
                      <span style={{ marginLeft: 8, color: "#888", fontSize: 11 }}>
                        ({(p.evidenceRanges || []).map((r, i) => `${i + 1}: ${(r.label || "").slice(0, 20)}`).join(" · ")})
                      </span>
                    )}
                  </div>
                  {/* 활성 명제 — 근거 영역 picker 를 명제 바로 아래에 인라인 표시 */}
                  {active && (
                    <div className="dq-cco-picker-inline">
                      <EvidenceRangePicker
                        paragraphs={paragraphs}
                        ranges={activeRangesFor(ci, pi)}
                        onAdd={addEvidence}
                        onRemoveRange={removeEvidence}
                        highlightColor="rgba(120, 200, 255, 0.55)"
                      />
                    </div>
                  )}
                </div>
              );
            })}
            <button type="button" className="dq-add-btn" onClick={() => addProp(ci)}>+ 명제 추가</button>
          </div>
        </div>
      ))}
      <button type="button" className="dq-add-btn" onClick={addChoice}>+ 선택지 추가</button>
    </div>
  );
}
