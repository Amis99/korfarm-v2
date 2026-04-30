import { useMemo, useState } from "react";

/**
 * 단답형 음절 카드 모달.
 * 정답 글자수 × 2 카드 풀에서 정답 글자 순서대로 클릭.
 *
 * props:
 *  - question: { stem, answerLength, syllableCards }
 *  - onSubmit(userAnswer)  // 학생이 클릭한 글자들을 순서대로 이은 문자열
 *  - onClose()
 */
export default function SyllableCardModal({ question, onSubmit, onClose, busy }) {
  const [picked, setPicked] = useState([]); // [{ char, srcIdx }]
  const cards = question?.syllableCards || [];
  const targetLen = question?.answerLength || 0;

  const usedSrc = useMemo(() => new Set(picked.map(p => p.srcIdx)), [picked]);

  const pick = (char, srcIdx) => {
    if (busy) return;
    if (picked.length >= targetLen) return;
    if (usedSrc.has(srcIdx)) return;
    setPicked([...picked, { char, srcIdx }]);
  };

  const undo = () => {
    if (busy) return;
    setPicked(picked.slice(0, -1));
  };

  const reset = () => {
    if (busy) return;
    setPicked([]);
  };

  const submit = () => {
    if (picked.length !== targetLen) return;
    const answer = picked.map(p => p.char).join("");
    onSubmit(answer);
  };

  return (
    <div className="ssm-overlay" onClick={onClose}>
      <div className="ssm-modal" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: 0, fontSize: 16, color: "#1f4a37" }}>{question.questionNo || "?"}번 단답형</h3>
        <p style={{ margin: "8px 0 16px", fontSize: 14, color: "#1a2920", whiteSpace: "pre-wrap" }}>{question.stem}</p>

        {/* 입력 슬롯 */}
        <div className="ssm-slots">
          {Array.from({ length: targetLen }).map((_, i) => (
            <div key={i} className="ssm-slot">
              {picked[i]?.char || ""}
            </div>
          ))}
        </div>
        <p style={{ fontSize: 12, color: "#3a4a3e", textAlign: "center", margin: "6px 0 14px" }}>
          정답 글자를 순서대로 클릭하세요 ({picked.length}/{targetLen})
        </p>

        {/* 음절 카드 풀 */}
        <div className="ssm-pool">
          {cards.map((c, i) => (
            <button
              key={i}
              type="button"
              className={`ssm-card ${usedSrc.has(i) ? "used" : ""}`}
              onClick={() => pick(c, i)}
              disabled={usedSrc.has(i) || busy}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="ssm-actions">
          <button type="button" className="ssm-btn ssm-btn-ghost" onClick={undo} disabled={picked.length === 0 || busy}>
            ⌫ 한 글자 지우기
          </button>
          <button type="button" className="ssm-btn ssm-btn-ghost" onClick={reset} disabled={picked.length === 0 || busy}>
            ↺ 초기화
          </button>
          <button
            type="button"
            className="ssm-btn ssm-btn-primary"
            onClick={submit}
            disabled={picked.length !== targetLen || busy}
          >
            {busy ? "채점 중..." : "제출"}
          </button>
        </div>
      </div>
    </div>
  );
}
