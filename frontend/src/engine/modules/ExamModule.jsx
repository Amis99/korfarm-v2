import { useEffect, useRef, useState } from "react";
import { useEngine } from "../core/EngineContext";
import RichText from "../../utils/RichText";
import PassageMarkdown from "../../utils/PassageMarkdown";

/**
 * 시험용 모듈 — 시험지 스타일.
 *
 * - 모든 문제가 처음부터 전부 표시 (스크롤)
 * - 모달 없음: 선택지를 직접 클릭/터치
 * - 원문자(①②③…) 번호 + 빨간 동그라미 마크
 * - 최종 제출 전까지 언제든 선택 변경 가능
 * - 문항별 풀이 시간 추적
 */

const CIRCLE_NUMS = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];

function ExamModule({ content }) {
  const { status, start, recordAnswer, finish } = useEngine();
  const payload = content?.payload || {};
  const questions = payload.questions || [];

  // { [questionId]: selectedChoiceId }
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 문항별 풀이 시간 추적
  // { [questionId]: { totalMs, deselectTs } }
  const timeRef = useRef({});

  const scrollRef = useRef(null);
  const answersRef = useRef(answers);
  answersRef.current = answers;

  // 자동 시작
  useEffect(() => {
    if (status === "READY") start();
  }, [status, start]);

  // 선택지 토글
  const toggleChoice = (questionId, choiceId) => {
    if (isSubmitting) return;
    const current = answers[questionId];
    const now = Date.now();
    const tData = timeRef.current[questionId] || { totalMs: 0, deselectTs: null };

    if (current === choiceId) {
      // 선택 취소 — 취소 시점 기록
      tData.deselectTs = now;
      timeRef.current[questionId] = tData;
      setAnswers((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
    } else {
      // 선택 (또는 재선택)
      if (tData.deselectTs) {
        // 취소 후 재선택: 경과 시간 추가
        tData.totalMs += now - tData.deselectTs;
        tData.deselectTs = null;
      }
      timeRef.current[questionId] = tData;
      setAnswers((prev) => ({ ...prev, [questionId]: choiceId }));
    }
  };

  // 제출
  const handleSubmit = () => {
    if (isSubmitting) return;
    const answeredCount = Object.keys(answers).length;
    const totalCount = questions.length;
    if (answeredCount < totalCount) {
      const ok = window.confirm(
        `${totalCount - answeredCount}문항이 미응답입니다. 제출하시겠습니까?`,
      );
      if (!ok) return;
    }
    setIsSubmitting(true);

    // 최종 답안을 records로 기록
    const finalAnswers = answersRef.current;
    questions.forEach((q) => {
      if (finalAnswers[q.id]) {
        recordAnswer({
          id: q.id,
          selectedId: finalAnswers[q.id],
          questionKind: q.questionKind,
          timeSpentMs: timeRef.current[q.id]?.totalMs || 0,
        });
      }
    });
    finish(true);
  };

  if (questions.length === 0) return null;

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="exam-module" ref={scrollRef}>
      {questions.map((q, idx) => {
        const selectedId = answers[q.id];
        const hasPassage = typeof q.passage === "string" && q.passage.trim().length > 0;
        const hasBoxContent = typeof q.boxContent === "string" && q.boxContent.trim().length > 0;

        return (
          <div key={q.id} className={`exam-q ${selectedId ? "answered" : ""}`}>
            {/* 지문 (해당 그룹 첫 문제에만 표시) */}
            {hasPassage && (
              <div className="exam-passage">
                <PassageMarkdown>{q.passage}</PassageMarkdown>
              </div>
            )}

            {/* 문제 헤더 */}
            <div className="exam-q-header">
              <span className="exam-q-num">{idx + 1}.</span>
              <span className="exam-q-stem"><RichText>{q.stem || ""}</RichText></span>
            </div>

            {/* 보기 (boxContent) */}
            {hasBoxContent && (
              <div className="exam-box-content">
                <RichText>{q.boxContent}</RichText>
              </div>
            )}

            {/* 선택지 */}
            <div className="exam-choices">
              {(q.choices || []).map((c, ci) => {
                const isSelected = selectedId === c.id;
                return (
                  <div
                    key={c.id}
                    className={`exam-choice ${isSelected ? "selected" : ""}`}
                    onClick={() => toggleChoice(q.id, c.id)}
                  >
                    <span className="exam-choice-num">
                      {CIRCLE_NUMS[ci] || `(${ci + 1})`}
                      {isSelected && (
                        <img
                          src="/정답 동그라미.png"
                          alt=""
                          className="exam-choice-mark"
                          draggable={false}
                        />
                      )}
                    </span>
                    <span className="exam-choice-text">
                      <RichText>{c.text}</RichText>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* 제출 바 (항상 표시) */}
      <div className="exam-submit-bar">
        <p className="exam-submit-info">
          {questions.length}문항 중 {answeredCount}문항 응답 완료
        </p>
        <button
          className="exam-submit-btn"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "제출 중..." : "답안 제출"}
        </button>
      </div>
    </div>
  );
}

export default ExamModule;
