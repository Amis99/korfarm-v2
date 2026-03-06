import { useState } from "react";
import "../styles/online-test-renderer.css";

/**
 * 온라인 풀기 모드: 문제를 화면에 직접 표시하고 답안 입력 받기.
 * Props:
 *  - questions: [{number, type, points, content, choices, passage}]
 *  - answers: {[qNum]: value}
 *  - onAnswer(qNum, value)
 *  - onSubmit()
 *  - submitting: boolean
 *  - remainingSec: number
 *  - formatTime: (sec) => string
 */
function OnlineTestRenderer({
  questions = [],
  answers = {},
  onAnswer,
  onSubmit,
  submitting = false,
  remainingSec = 0,
  formatTime,
}) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const totalQ = questions.length;
  const answeredCount = Object.keys(answers).length;

  const q = questions[currentIdx];
  if (!q) return null;

  const goTo = (idx) => {
    if (idx >= 0 && idx < totalQ) setCurrentIdx(idx);
  };

  return (
    <div className="otr">
      {/* 상단: 타이머 + 진행 */}
      <div className="otr-header">
        <div className={`otr-timer ${remainingSec < 300 ? "warning" : ""}`}>
          {formatTime ? formatTime(remainingSec) : `${Math.floor(remainingSec / 60)}분`}
        </div>
        <div className="otr-progress">
          {answeredCount} / {totalQ} 응답
        </div>
      </div>

      {/* 문항 네비게이션 */}
      <div className="otr-nav">
        {questions.map((item, i) => (
          <button
            key={item.number}
            className={`otr-nav-btn ${i === currentIdx ? "active" : ""} ${answers[String(item.number)] ? "answered" : ""}`}
            onClick={() => goTo(i)}
          >
            {item.number}
          </button>
        ))}
      </div>

      {/* 문제 표시 */}
      <div className="otr-question">
        <div className="otr-q-header">
          <span className="otr-q-num">{q.number}번</span>
          <span className="otr-q-type">{q.type}</span>
          <span className="otr-q-pts">{q.points}점</span>
        </div>

        {/* 지문 */}
        {q.passage && (
          <div className="otr-passage">{q.passage}</div>
        )}

        {/* 문제 텍스트 */}
        {q.content && (
          <div className="otr-q-content">{q.content}</div>
        )}

        {/* 객관식 선택지 */}
        {q.type === "객관식" && q.choices && (
          <div className="otr-choices">
            {q.choices.map((choice, ci) => {
              const val = String(ci + 1);
              const selected = answers[String(q.number)] === val;
              return (
                <button
                  key={ci}
                  className={`otr-choice ${selected ? "selected" : ""}`}
                  onClick={() => onAnswer(q.number, selected ? null : val)}
                >
                  <span className="otr-choice-num">{ci + 1}</span>
                  <span className="otr-choice-text">{choice}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* 서술형 답안 */}
        {q.type === "서술형" && (
          <div className="otr-essay">
            <textarea
              className="otr-essay-input"
              placeholder="답안을 입력하세요..."
              value={answers[String(q.number)] || ""}
              onChange={(e) => onAnswer(q.number, e.target.value || null)}
              rows={6}
            />
          </div>
        )}
      </div>

      {/* 하단: 이전/다음 + 제출 */}
      <div className="otr-footer">
        <button
          className="otr-btn secondary"
          onClick={() => goTo(currentIdx - 1)}
          disabled={currentIdx === 0}
        >
          이전
        </button>

        <div className="otr-footer-center">
          {currentIdx === totalQ - 1 ? (
            <button
              className="otr-btn primary"
              onClick={onSubmit}
              disabled={submitting}
            >
              {submitting ? "제출 중..." : "제출하기"}
            </button>
          ) : (
            <button
              className="otr-btn primary"
              onClick={() => goTo(currentIdx + 1)}
            >
              다음
            </button>
          )}
        </div>

        <span className="otr-page-info">
          {currentIdx + 1} / {totalQ}
        </span>
      </div>
    </div>
  );
}

export default OnlineTestRenderer;
