import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useEngine } from "../core/EngineContext";
import CumulativeQuestionCard from "../shared/CumulativeQuestionCard";
import RichText from "../../utils/RichText";
import PassageMarkdown from "../../utils/PassageMarkdown";

/**
 * 시험용 누적 카드 모듈 — DailyQuizModule의 MULTI_CHOICE 로직 기반.
 *
 * DailyQuiz와의 차이:
 *  - 즉시 피드백 없음 (정답/오답 표시 X)
 *  - 타이머 조정 없음 (정답 +20초 / 오답 -40초 X)
 *  - 마지막 문제 완료 후 "제출하기" 버튼 표시
 *  - answerId = null (정답 모름)
 *  - completion에 isCorrect 없음 (미채점)
 */
function ExamModule({ content }) {
  const { status, start, recordAnswer, finish } = useEngine();
  const payload = content?.payload || {};
  const questions = payload.questions || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedMap, setCompletedMap] = useState({});
  const [showSubmit, setShowSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const advanceTimerRef = useRef(null);
  const scrollRef = useRef(null);

  const currentQuestion = questions[currentIndex];

  // 자동 시작
  useEffect(() => {
    if (status === "READY") start();
  }, [status, start]);

  // 타이머 정리
  useEffect(
    () => () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    },
    [],
  );

  // 활성 카드 자동 스크롤
  useLayoutEffect(() => {
    if (!scrollRef.current) return;
    const activeEl =
      scrollRef.current.querySelector(".cum-card.active") ||
      scrollRef.current.querySelector(".cum-card:last-child");
    if (activeEl) {
      try {
        activeEl.scrollIntoView({ behavior: "smooth", block: "start" });
      } catch {
        activeEl.scrollIntoView();
      }
    }
  }, [currentIndex, showSubmit]);

  const handleNext = () => {
    if (currentIndex >= questions.length - 1) {
      setShowSubmit(true);
      return;
    }
    setCurrentIndex((prev) => prev + 1);
  };

  // 선택지 클릭 핸들러 — 채점 없이 기록만
  const handleSelect = (selectedId) => {
    if (!currentQuestion) return;
    recordAnswer({
      id: currentQuestion.id,
      selectedId,
      questionKind: currentQuestion.questionKind,
    });
    setCompletedMap((prev) => ({
      ...prev,
      [currentQuestion.id]: { selectedId },
    }));
    // 300ms 후 다음 문제로
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = setTimeout(handleNext, 300);
  };

  // 제출 버튼 클릭
  const handleSubmit = () => {
    if (isSubmitting) return;
    const answeredCount = Object.keys(completedMap).length;
    const totalCount = questions.length;
    if (answeredCount < totalCount) {
      const ok = window.confirm(
        `${totalCount - answeredCount}문항이 미응답입니다. 제출하시겠습니까?`,
      );
      if (!ok) return;
    }
    setIsSubmitting(true);
    finish(true);
  };

  if (!currentQuestion && !showSubmit) return null;

  const visibleQuestions = questions.slice(0, currentIndex + 1);
  const answeredCount = Object.keys(completedMap).length;

  return (
    <div className="daily-quiz-module">
      <div className="cum-stack" ref={scrollRef}>
        {visibleQuestions.map((q, idx) => {
          const completion = completedMap[q.id];
          const isActive = idx === currentIndex && !completion && !showSubmit;
          return (
            <CumulativeQuestionCard
              key={q.id}
              question={q}
              idx={idx}
              total={questions.length}
              completion={completion}
              isActive={isActive}
              onSelect={handleSelect}
              modalTitle="문제"
              lastResult={null}
              showModal
            />
          );
        })}

        {/* 제출 바 */}
        {showSubmit && (
          <div className="exam-submit-bar">
            <p className="exam-submit-info">
              {questions.length}문항 중 {answeredCount}문항 응답 완료
            </p>
            <button
              className="exam-submit-btn"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? "제출 중..." : "제출하기"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ExamModule;
