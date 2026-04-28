import { useState } from "react";
import InlineEditable from "../dailyquiz/InlineEditable";
import EvidenceRangePicker from "../dailyquiz/EvidenceRangePicker";

/**
 * 일일독해 정독(intensive) 단계 편집.
 * payload.intensive.timeline[i] = { stepId, highlight: { ranges: [{paragraphId, start, end}] }, question: { prompt, choices, answerId } }
 *
 * 학생 흐름: timeline 순서대로
 *   1) highlight.ranges 가 표시됨
 *   2) 학생이 그 영역 클릭 → 모달
 *   3) 모달에 question.prompt + choices → 정답 선택해야 다음 step
 */
export default function IntensiveEditor({ intensive, passage, editor }) {
  const timeline = intensive?.timeline || [];
  const paragraphs = passage?.paragraphs || [];
  // 활성 step — 어느 step 의 highlight 를 편집 중인지
  const [activeStep, setActiveStep] = useState(null);

  const addStep = (atIdx = timeline.length) => {
    const newSid = `step-${Date.now().toString(36).slice(-4)}`;
    editor.addItem("intensive.timeline", atIdx, {
      stepId: newSid,
      highlight: { ranges: [] },
      question: {
        prompt: "",
        choices: [
          { id: "c1", text: "" },
          { id: "c2", text: "" },
          { id: "c3", text: "" },
          { id: "c4", text: "" },
        ],
        answerId: "",
        scoring: { correctDeltaSec: 20, wrongDeltaSec: -40 },
      },
    });
  };
  const removeStep = (i) => {
    if (!window.confirm(`정독 step ${i + 1} 삭제?`)) return;
    editor.removeItem("intensive.timeline", i);
  };
  const moveStep = (from, to) => {
    if (to < 0 || to >= timeline.length) return;
    editor.reorderItems("intensive.timeline", from, to);
  };

  const addHighlightRange = (i) => (r) => {
    const cur = timeline[i]?.highlight?.ranges || [];
    editor.addItem(`intensive.timeline[${i}].highlight.ranges`, cur.length, r);
  };
  const removeHighlightRange = (i) => (idx) => {
    editor.removeItem(`intensive.timeline[${i}].highlight.ranges`, idx);
  };

  const addChoice = (i) => {
    const cur = timeline[i]?.question?.choices || [];
    const newId = `c${cur.length + 1}-${Date.now().toString(36).slice(-3)}`;
    editor.addItem(`intensive.timeline[${i}].question.choices`, cur.length, { id: newId, text: "" });
  };
  const removeChoice = (i, ci) => {
    const cur = timeline[i]?.question?.choices || [];
    if (cur.length <= 2) return alert("최소 2개의 선택지가 필요합니다.");
    editor.removeItem(`intensive.timeline[${i}].question.choices`, ci);
  };
  const moveChoice = (i, from, to) => {
    const len = timeline[i]?.question?.choices?.length || 0;
    if (to < 0 || to >= len) return;
    editor.reorderItems(`intensive.timeline[${i}].question.choices`, from, to);
  };

  // 단락 id → 텍스트 매핑 (range.label 없을 때 fallback 추출용)
  const paraTextById = {};
  for (const p of paragraphs) paraTextById[p.id] = p.text || "";
  const rangeText = (r) => r?.label || paraTextById[r?.paragraphId]?.slice(r?.start, r?.end) || "";

  return (
    <div className="dq-card">
      <div className="dq-card-header">
        <div className="dq-card-num">🔍 정독 (intensive) — {timeline.length} step</div>
        <span style={{ flex: 1 }} />
      </div>
      <div className="dq-card-body">
        {timeline.length === 0 && (
          <div style={{ padding: 12, color: "#888", fontSize: 13 }}>
            정독 단계가 비어 있습니다. 아래 + 버튼으로 첫 step 을 추가하세요.
          </div>
        )}
        {timeline.map((step, i) => {
          const ranges = step?.highlight?.ranges || [];
          const q = step?.question || {};
          const choices = q.choices || [];
          const active = activeStep === i;
          return (
            <div key={step.stepId || i}>
              <button
                type="button"
                className="dr-step-insert"
                onClick={() => addStep(i)}
                title={`여기에 step 추가 (${i + 1}번째 자리)`}
              >+</button>
              <div className="dr-step">
              <div className="dr-step-head">
                <span className="dr-step-num">Step {i + 1}</span>
                <code className="dr-step-id">{step.stepId}</code>
                <div className="dq-fb-blank-move">
                  <button type="button" onClick={() => moveStep(i, i - 1)} disabled={i === 0}>▲</button>
                  <button type="button" onClick={() => moveStep(i, i + 1)} disabled={i >= timeline.length - 1}>▼</button>
                </div>
                <button
                  type="button"
                  className={`dq-cco-active-btn ${active ? "on" : ""}`}
                  onClick={() => setActiveStep(active ? null : i)}
                >{active ? "✓ 영역 편집 중" : "정독 영역 편집"}</button>
                <span style={{ flex: 1 }} />
                <span className="dr-step-ranges-count">하이라이트 {ranges.length}개</span>
                <button type="button" className="dq-mc-del" onClick={() => removeStep(i)}>×</button>
              </div>

              {active && (
                <div className="dq-cco-picker-inline">
                  <EvidenceRangePicker
                    paragraphs={paragraphs}
                    ranges={ranges}
                    onAdd={addHighlightRange(i)}
                    onRemoveRange={removeHighlightRange(i)}
                    highlightColor="rgba(255, 220, 100, 0.55)"
                  />
                </div>
              )}

              {ranges.length > 0 && (
                <div className="dr-step-hl-preview">
                  <div className="dr-step-hl-label">📌 하이라이트된 본문 ({ranges.length})</div>
                  <ol className="dr-step-hl-list">
                    {ranges.map((r, ri) => (
                      <li key={ri} className="dr-step-hl-item">
                        <span className="dr-step-hl-num">{ri + 1}.</span>
                        <span className="dr-step-hl-pid">{r.paragraphId}</span>
                        <span className="dr-step-hl-text">{rangeText(r)}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="dq-section-label">질문 (정답 선택지를 라디오로 지정)</div>
              <InlineEditable
                value={q.prompt || ""}
                onChange={(v) => editor.updateField(`intensive.timeline[${i}].question.prompt`, v)}
                placeholder="이 단락 정독 후 던질 질문"
                className="dq-stem"
              />
              <div className="dq-mc-list">
                {choices.map((c, ci) => (
                  <div key={c.id || ci} className={`dq-mc-row ${q.answerId === c.id ? "is-answer" : ""}`}>
                    <label className="dq-mc-radio" title="정답 지정">
                      <input
                        type="radio"
                        name={`intensive-${i}-answer`}
                        checked={q.answerId === c.id}
                        onChange={() => editor.updateField(`intensive.timeline[${i}].question.answerId`, c.id)}
                      />
                      <span className="dq-mc-num">{ci + 1}</span>
                    </label>
                    <InlineEditable
                      value={c.text}
                      onChange={(v) => editor.updateField(`intensive.timeline[${i}].question.choices[${ci}].text`, v)}
                      placeholder="선택지"
                      multiline={false}
                      className="dq-mc-text"
                    />
                    <div className="dq-fb-choice-move">
                      <button type="button" onClick={() => moveChoice(i, ci, ci - 1)} disabled={ci === 0}>▲</button>
                      <button type="button" onClick={() => moveChoice(i, ci, ci + 1)} disabled={ci >= choices.length - 1}>▼</button>
                    </div>
                    <button type="button" className="dq-mc-del" onClick={() => removeChoice(i, ci)}>×</button>
                  </div>
                ))}
              </div>
              <button type="button" className="dq-add-btn" onClick={() => addChoice(i)}>+ 선택지 추가</button>
              </div>
            </div>
          );
        })}
        <button
          type="button"
          className="dr-step-insert dr-step-insert-end"
          onClick={() => addStep(timeline.length)}
          title="마지막에 step 추가"
        >+ step 추가</button>
      </div>
    </div>
  );
}
