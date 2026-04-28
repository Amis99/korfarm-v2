import { useState } from "react";
import InlineEditable from "../dailyquiz/InlineEditable";
import EvidenceRangePicker from "../dailyquiz/EvidenceRangePicker";

/**
 * 일일독해 확인학습(confirm) 편집.
 * payload.confirm.questions[] = { prompt, answerRanges:[], answerMatchMode: ALL|ANY, revealOnWrong: bool, scoring }
 *
 * 학생 흐름: 각 question 마다 prompt 보여주고, 지문에서 answerRanges 영역 클릭하면 통과
 */
export default function ConfirmEditor({ confirm, passage, editor }) {
  const questions = confirm?.questions || [];
  const paragraphs = passage?.paragraphs || [];
  const [activeIdx, setActiveIdx] = useState(null);

  const addQuestion = () => {
    editor.addItem("confirm.questions", questions.length, {
      prompt: "",
      answerRanges: [],
      answerMatchMode: "ALL",
      revealOnWrong: true,
      scoring: { correctDeltaSec: 20, wrongDeltaSec: -40 },
    });
  };
  const removeQuestion = (i) => {
    if (!window.confirm(`확인 질문 ${i + 1} 삭제?`)) return;
    editor.removeItem("confirm.questions", i);
  };
  const moveQuestion = (from, to) => {
    if (to < 0 || to >= questions.length) return;
    editor.reorderItems("confirm.questions", from, to);
  };

  const addRange = (i) => (r) => {
    const cur = questions[i]?.answerRanges || [];
    editor.addItem(`confirm.questions[${i}].answerRanges`, cur.length, r);
  };
  const removeRange = (i) => (idx) => {
    editor.removeItem(`confirm.questions[${i}].answerRanges`, idx);
  };

  return (
    <div className="dq-card">
      <div className="dq-card-header">
        <div className="dq-card-num">✅ 확인학습 (confirm) — {questions.length} 질문</div>
        <span style={{ flex: 1 }} />
        <button type="button" className="dq-add-btn" onClick={addQuestion}>+ 질문 추가</button>
      </div>
      <div className="dq-card-body">
        {questions.map((q, i) => {
          const active = activeIdx === i;
          const matchMode = (q.answerMatchMode || "ALL").toUpperCase();
          return (
            <div key={i} className="dr-confirm-q">
              <div className="dr-confirm-head">
                <span className="dr-step-num">질문 {i + 1}</span>
                <div className="dq-fb-blank-move">
                  <button type="button" onClick={() => moveQuestion(i, i - 1)} disabled={i === 0}>▲</button>
                  <button type="button" onClick={() => moveQuestion(i, i + 1)} disabled={i >= questions.length - 1}>▼</button>
                </div>
                <span className="dq-mode-toggle">
                  매칭:
                  {["ALL", "ANY"].map((m) => (
                    <label key={m} style={{ marginLeft: 8 }}>
                      <input
                        type="radio"
                        name={`confirm-${i}-mode`}
                        checked={matchMode === m}
                        onChange={() => editor.updateField(`confirm.questions[${i}].answerMatchMode`, m)}
                      />
                      <span style={{ marginLeft: 4, fontSize: 11 }}>{m}</span>
                    </label>
                  ))}
                </span>
                <label style={{ fontSize: 11, color: "#5b4d2e" }}>
                  <input
                    type="checkbox"
                    checked={q.revealOnWrong !== false}
                    onChange={(e) => editor.updateField(`confirm.questions[${i}].revealOnWrong`, e.target.checked)}
                  />
                  오답 시 답 공개
                </label>
                <button
                  type="button"
                  className={`dq-cco-active-btn ${active ? "on" : ""}`}
                  onClick={() => setActiveIdx(active ? null : i)}
                >{active ? "✓ 정답 영역 편집 중" : "정답 영역 편집"}</button>
                <span style={{ flex: 1 }} />
                <span style={{ fontSize: 11, color: "#888" }}>{(q.answerRanges || []).length}개 영역</span>
                <button type="button" className="dq-mc-del" onClick={() => removeQuestion(i)}>×</button>
              </div>
              <InlineEditable
                value={q.prompt || ""}
                onChange={(v) => editor.updateField(`confirm.questions[${i}].prompt`, v)}
                placeholder="질문 (예: 글쓴이가 가장 강조한 단어를 찾으시오)"
                className="dq-stem"
              />
              {active && (
                <div className="dq-cco-picker-inline">
                  <EvidenceRangePicker
                    paragraphs={paragraphs}
                    ranges={q.answerRanges || []}
                    onAdd={addRange(i)}
                    onRemoveRange={removeRange(i)}
                    highlightColor="rgba(120, 200, 120, 0.55)"
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
