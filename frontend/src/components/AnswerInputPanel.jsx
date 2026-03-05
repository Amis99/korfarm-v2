import { useState } from "react";
import "../styles/test-online.css";

/**
 * 재사용 가능한 답안 입력 패널.
 * Props:
 *  - questions: [{number, type, points}]
 *  - answers: {[qNum]: value}
 *  - onAnswer(qNum, value): 답안 변경 콜백
 *  - onSubmit(): 제출 콜백
 *  - readOnly: boolean
 *  - submitting: boolean
 *  - label: 상단 라벨 (기본: "답안 입력")
 */
function AnswerInputPanel({ questions = [], answers = {}, onAnswer, onSubmit, readOnly = false, submitting = false, label = "답안 입력" }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const answeredCount = Object.keys(answers).length;

  const handleBubble = (qNum, choice) => {
    if (readOnly) return;
    const key = String(qNum);
    const val = String(choice);
    onAnswer(qNum, answers[key] === val ? null : val);
  };

  const rows = [];
  for (let i = 0; i < questions.length; i += 5) {
    rows.push(questions.slice(i, i + 5));
  }

  const panel = (
    <div className="answer-panel-inner">
      <div className="answer-panel-header">
        <span className="answer-panel-label">{label}</span>
        <span className="answer-panel-count">{answeredCount} / {questions.length}</span>
      </div>
      <div className="answer-panel-grid">
        {rows.map((row, ri) => (
          <div key={ri} className="ts-omr-row">
            {row.map(q => (
              <div key={q.number} className="ts-omr-cell">
                <div className="ts-omr-qnum">
                  <span className="ts-omr-num">{q.number}</span>
                  <span className="ts-omr-type">{q.type === "서술형" ? "서" : ""}</span>
                  <span className="ts-omr-pts">{q.points}점</span>
                </div>
                {q.type === "객관식" ? (
                  <div className="ts-omr-bubbles">
                    {[1, 2, 3, 4, 5].map(c => (
                      <button
                        key={c}
                        className={`ts-omr-bubble ${answers[String(q.number)] === String(c) ? "selected" : ""}`}
                        onClick={() => handleBubble(q.number, c)}
                        disabled={readOnly}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="ts-omr-essay">
                    <input
                      type="text"
                      placeholder="서술형"
                      value={answers[String(q.number)] || ""}
                      onChange={e => onAnswer(q.number, e.target.value || null)}
                      className="ts-omr-essay-input"
                      disabled={readOnly}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
      {!readOnly && onSubmit && (
        <div className="answer-panel-footer">
          <button
            className="ts-btn ts-btn-primary ts-btn-lg"
            onClick={onSubmit}
            disabled={submitting}
          >
            {submitting ? "제출 중..." : "제출하기"}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* 데스크톱: 사이드 패널 */}
      <div className="answer-panel-desktop">
        {panel}
      </div>
      {/* 모바일: 하단 드로어 */}
      <div className="answer-panel-mobile">
        <button
          className="answer-drawer-toggle"
          onClick={() => setDrawerOpen(!drawerOpen)}
        >
          <span className="material-symbols-outlined">
            {drawerOpen ? "expand_more" : "expand_less"}
          </span>
          답안 입력 ({answeredCount}/{questions.length})
        </button>
        {drawerOpen && (
          <div className="answer-drawer-content">
            {panel}
          </div>
        )}
      </div>
    </>
  );
}

export default AnswerInputPanel;
