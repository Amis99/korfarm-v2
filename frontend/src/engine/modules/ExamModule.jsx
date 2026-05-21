import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useEngine } from "../core/EngineContext";
import RichText from "../../utils/RichText";
import PassageMarkdown from "../../utils/PassageMarkdown";

/**
 * 시험용 모듈 — 누적 카드 + 인라인 선택지.
 *
 * - 문제가 하나씩 나타남 (풀면 다음 문제 등장)
 * - 모달 없음: 선택지를 카드에서 직접 클릭
 * - 원문자(①②③…) + 빨간 동그라미 마크
 * - 이전 문제로 스크롤해서 답 변경 가능 (제출 전까지)
 * - 마지막 문제 풀면 제출 버튼 표시
 */

const CIRCLE_NUMS = ["①", "②", "③", "④", "⑤", "⑥", "⑦", "⑧", "⑨", "⑩"];

function ExamModule({ content }) {
  const { status, start, recordAnswer, finish } = useEngine();
  const payload = content?.payload || {};
  const questions = payload.questions || [];

  const [currentIndex, setCurrentIndex] = useState(0);
  // { [questionId]: choiceId }
  const [answers, setAnswers] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 문항별 풀이 시간 추적
  const timeRef = useRef({});
  const answersRef = useRef(answers);
  answersRef.current = answers;

  const scrollRef = useRef(null);
  const advanceRef = useRef(null);

  // 자동 시작
  useEffect(() => {
    if (status === "READY") start();
  }, [status, start]);

  // 타이머 정리
  useEffect(() => () => {
    if (advanceRef.current) clearTimeout(advanceRef.current);
  }, []);

  // 새 문제 등장 시 자동 스크롤
  useLayoutEffect(() => {
    if (!scrollRef.current) return;
    const cards = scrollRef.current.querySelectorAll(".exam-q");
    const last = cards[cards.length - 1];
    if (last) {
      try { last.scrollIntoView({ behavior: "smooth", block: "start" }); }
      catch { last.scrollIntoView(); }
    }
  }, [currentIndex]);

  // 선택지 클릭
  const handleChoice = (questionId, choiceId, questionIdx) => {
    if (isSubmitting) return;
    const current = answers[questionId];
    const now = Date.now();
    const tData = timeRef.current[questionId] || { totalMs: 0, deselectTs: null };

    if (current === choiceId) {
      // 같은 선택지 다시 클릭 → 선택 취소
      tData.deselectTs = now;
      timeRef.current[questionId] = tData;
      setAnswers((prev) => {
        const next = { ...prev };
        delete next[questionId];
        return next;
      });
      return;
    }

    // 선택 (또는 다른 선택지로 변경)
    if (tData.deselectTs) {
      tData.totalMs += now - tData.deselectTs;
      tData.deselectTs = null;
    }
    timeRef.current[questionId] = tData;
    setAnswers((prev) => ({ ...prev, [questionId]: choiceId }));

    // 현재 활성 문제에서 선택한 경우 → 다음 문제 등장
    if (questionIdx === currentIndex && currentIndex < questions.length - 1) {
      if (advanceRef.current) clearTimeout(advanceRef.current);
      advanceRef.current = setTimeout(() => {
        setCurrentIndex((prev) => Math.max(prev, questionIdx + 1));
      }, 350);
    }
  };

  // 서술형 입력 (N-21, 2026-05-21)
  // N-25 (2026-05-21) — 자동 다음 문제 노출 제거. Enter 키로 명시적 제출.
  const handleEssayChange = (questionId, text) => {
    if (isSubmitting) return;
    setAnswers((prev) => {
      const next = { ...prev };
      if (text === "") delete next[questionId];
      else next[questionId] = text;
      return next;
    });
  };

  // Enter = 제출(다음 문제 노출). Shift+Enter = 줄바꿈(기본 동작 유지).
  const handleEssayKeyDown = (e, questionIdx) => {
    if (e.key !== "Enter" || e.shiftKey) return;
    if (isSubmitting) return;
    e.preventDefault();
    if (questionIdx === currentIndex && currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => Math.max(prev, questionIdx + 1));
    }
  };

  // 제출
  const handleSubmit = () => {
    if (isSubmitting) return;
    const answeredCount = Object.keys(answers).length;
    if (answeredCount < questions.length) {
      const ok = window.confirm(
        `${questions.length - answeredCount}문항이 미응답입니다. 제출하시겠습니까?`,
      );
      if (!ok) return;
    }
    setIsSubmitting(true);
    const finalAnswers = answersRef.current;
    // setRecords 는 비동기 batch — 같은 함수 내에서 finish 즉시 호출 시 ref 가 stale 이라
    // collected 배열을 직접 모아 finish 에 인자로 전달 (records 누락 버그 방지)
    const collected = [];
    questions.forEach((q) => {
      const v = finalAnswers[q.id];
      if (v != null && v !== "") {
        const isEssay = q.type === "서술형";
        const entry = {
          id: q.id,
          // 객관식: selectedId(choiceId). 서술형: essayText(answer text).
          selectedId: isEssay ? null : v,
          essayText: isEssay ? v : null,
          questionKind: q.questionKind,
          timeSpentMs: timeRef.current[q.id]?.totalMs || 0,
        };
        collected.push(entry);
        recordAnswer(entry);
      }
    });
    finish(true, { records: collected });
  };

  if (questions.length === 0) return null;

  const visibleQuestions = questions.slice(0, currentIndex + 1);
  const answeredCount = Object.keys(answers).length;
  const allRevealed = currentIndex >= questions.length - 1;

  return (
    <div className="exam-module" ref={scrollRef}>
      {visibleQuestions.map((q, idx) => {
        const selectedId = answers[q.id];
        const hasPassage = typeof q.passage === "string" && q.passage.trim().length > 0;
        const hasBoxContent = typeof q.boxContent === "string" && q.boxContent.trim().length > 0;
        const isLatest = idx === currentIndex;

        return (
          <div key={q.id} className={`exam-q ${selectedId ? "answered" : ""} ${isLatest ? "latest" : ""}`}>
            {/* 지문 */}
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

            {/* 선택지 (객관식) 또는 서술형 입력 */}
            {q.type === "서술형" ? (
              <div className="exam-essay">
                <textarea
                  className="exam-essay-input"
                  rows={4}
                  placeholder="답안을 입력한 뒤 Enter — 줄바꿈은 Shift + Enter"
                  value={selectedId || ""}
                  onChange={(e) => handleEssayChange(q.id, e.target.value)}
                  onKeyDown={(e) => handleEssayKeyDown(e, idx)}
                  disabled={isSubmitting}
                />
              </div>
            ) : (
              <div className="exam-choices">
                {(q.choices || []).map((c, ci) => {
                  const isSelected = selectedId === c.id;
                  return (
                    <div
                      key={c.id}
                      className={`exam-choice ${isSelected ? "selected" : ""}`}
                      onClick={() => handleChoice(q.id, c.id, idx)}
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
            )}
          </div>
        );
      })}

      {/* 제출 바 — 마지막 문제가 나타난 후 표시 */}
      {allRevealed && (
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
      )}
    </div>
  );
}

export default ExamModule;
