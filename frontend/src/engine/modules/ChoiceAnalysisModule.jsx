import { useEffect, useState, useRef } from "react";
import { useEngine } from "../core/EngineContext";
import ChoiceAnalysisCore from "../shared/ChoiceAnalysisCore";

/**
 * 농장 모드 — 선택지 분석 학습 모듈
 *
 * 데이터 구조:
 *   content.payload.questions[] — 각 문항이 ChoiceAnalysisCore가 받는 신 양식
 *
 * 누적형(C형) 출력:
 *   푼 문제는 위에 결과 카드로 남고, 새 문제가 아래에 활성 카드로 등장.
 */
function ChoiceAnalysisModule({ content }) {
  const { status, start, adjustTime, recordAnswer, finish } = useEngine();
  const payload = content?.payload || {};
  const questions = payload.questions || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  /** completedMap: { [questionId]: { isCorrect: true } } — 통과 기록 */
  const [completedMap, setCompletedMap] = useState({});
  const stackRef = useRef(null);

  // 자동 시작
  useEffect(() => {
    if (status === "READY") start();
  }, [status, start]);

  // 자동 스크롤
  useEffect(() => {
    if (stackRef.current) {
      stackRef.current.scrollTop = stackRef.current.scrollHeight;
    }
  }, [currentIndex]);

  const handleQuestionComplete = () => {
    const q = questions[currentIndex];
    if (!q) return;
    setCompletedMap((prev) => ({
      ...prev,
      [q.id]: { isCorrect: true },
    }));
    setTimeout(() => {
      if (currentIndex >= questions.length - 1) {
        finish(true);
      } else {
        setCurrentIndex((p) => p + 1);
      }
    }, 600);
  };

  if (questions.length === 0) {
    return (
      <div className="ca-module">
        <p>선택지 분석 콘텐츠가 없습니다.</p>
      </div>
    );
  }

  const visibleQuestions = questions.slice(0, currentIndex + 1);

  return (
    <div className="ca-stack" ref={stackRef}>
      {visibleQuestions.map((q, idx) => {
        const isActive = idx === currentIndex && !completedMap[q.id];
        const completion = completedMap[q.id];
        return (
          <div key={q.id || idx} className={`ca-stack-item ${isActive ? "active" : "completed"}`}>
            <div className="ca-stack-header">
              <span className="ca-stack-num">문제 {idx + 1} / {questions.length}</span>
              {completion && (
                <span className="ca-stack-mark correct">○ 통과</span>
              )}
            </div>
            {isActive ? (
              <ChoiceAnalysisCore
                question={q}
                onComplete={handleQuestionComplete}
                adjustTime={adjustTime}
                recordAnswer={recordAnswer}
              />
            ) : (
              // 완료된 카드는 stem만 요약 표시
              <div className="ca-completed-summary">
                <div className="ca-completed-stem">{q.stem}</div>
                <div className="ca-completed-meta">
                  5개 선택지 모두 정답 처리 완료
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ChoiceAnalysisModule;
