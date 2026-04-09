import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useEngine } from "../core/EngineContext";
import { FEEDBACK } from "../shared/feedbackTimings";
import CumulativeQuestionCard from "../shared/CumulativeQuestionCard";
import ChoiceAnalysisCore from "../shared/ChoiceAnalysisCore";
import QuestionModal from "../shared/QuestionModal";
import RichText from "../../utils/RichText";
import PassageMarkdown from "../../utils/PassageMarkdown";

// 타이머 규칙 (정답 +20초, 오답 -40초)
const DEFAULT_SCORING = { correctDeltaSec: 20, wrongDeltaSec: -40 };

const getScoring = (question) => {
  const s = question?.scoring;
  if (!s) return DEFAULT_SCORING;
  return {
    correctDeltaSec: s.correctDeltaSec ?? DEFAULT_SCORING.correctDeltaSec,
    wrongDeltaSec: s.wrongDeltaSec ?? DEFAULT_SCORING.wrongDeltaSec,
  };
};

// TEXT_SELECT 유틸
const buildHighlightMask = (length, ranges) => {
  const mask = new Set();
  ranges.forEach((range) => {
    const start = Math.max(0, Math.min(length, range.start));
    const end = Math.max(start, Math.min(length, range.end));
    for (let idx = start; idx < end; idx += 1) mask.add(idx);
  });
  return mask;
};

const toRangeKey = (range) => `${range.paragraphId}:${range.start}-${range.end}`;

const resolveAnswerRanges = (question, passage) => {
  if (Array.isArray(question?.answerRanges) && question.answerRanges.length > 0) {
    return question.answerRanges.map((range) => ({
      paragraphId: range.paragraphId,
      start: range.start,
      end: range.end,
    }));
  }
  if (!question?.answerText) return [];
  const ranges = [];
  (passage?.paragraphs || []).forEach((paragraph) => {
    const text = paragraph.text || "";
    let cursor = text.indexOf(question.answerText);
    while (cursor >= 0) {
      ranges.push({
        paragraphId: paragraph.id,
        start: cursor,
        end: cursor + question.answerText.length,
      });
      cursor = text.indexOf(question.answerText, cursor + 1);
    }
  });
  return ranges;
};

/* ──────────── FILL_BLANKS 카드 (시험지 스타일) ──────────── */

/** FILL_BLANKS: 발문 + 지문 + template(빈칸) — 활성 시 모달에서 선택, 완료 후 첨삭 */
function FillBlanksCard({ question, idx, total, completion, isActive, blankIndex, blankAnswers }) {
  const blanks = question.blanks || [];
  const template = question.template || "";
  const parts = template.split("____");
  const passage = question.passage;
  const stem = question.stem || "";
  const allCorrect = completion?.isCorrect;

  const renderBlank = (blank, partIdx) => {
    if (completion) {
      // 완료: 정답을 빨간 첨삭으로
      const correctChoice = blank.choices?.find((c) => c.id === blank.answerId);
      return (
        <span className="worksheet-handwriting" style={{ display: "inline" }}>
          {correctChoice?.text || "____"}
        </span>
      );
    }
    if (isActive && partIdx < blankIndex) {
      // 이미 답한 빈칸 (이번 회차) — 정답을 채워서
      const correctChoice = blank.choices?.find((c) => c.id === blank.answerId);
      return (
        <span className="worksheet-handwriting" style={{ display: "inline" }}>
          {correctChoice?.text || "____"}
        </span>
      );
    }
    return (
      <span className={`worksheet-blank ${isActive && partIdx === blankIndex ? "active" : ""}`}>
        ____
      </span>
    );
  };

  return (
    <div
      className={`cum-card ${completion ? "completed" : ""} ${isActive ? "active" : ""} ${
        completion?.isCorrect ? "correct" : completion ? "wrong" : ""
      }`}
    >
      <div className="cum-card-header">
        <span className="cum-card-num">
          문제 {idx + 1} / {total}
        </span>
        {completion && (
          <span
            className={`cum-card-mark ${allCorrect ? "correct" : "wrong"}`}
            aria-label={allCorrect ? "정답" : "오답"}
          >
            {allCorrect ? "정답" : "오답"}
          </span>
        )}
      </div>
      <div className="cum-card-stem">
        <RichText>{stem}</RichText>
      </div>
      {passage && typeof passage === "string" && passage.length > 0 && (
        <div className="cum-card-passage">
          <PassageMarkdown>{passage}</PassageMarkdown>
        </div>
      )}
      <div className="cum-card-prompt">
        {parts.map((part, partIdx) => (
          <span key={`part-${partIdx}`}>
            <RichText>{part}</RichText>
            {partIdx < blanks.length && renderBlank(blanks[partIdx], partIdx)}
          </span>
        ))}
      </div>
      {completion && question.explanation && (
        <div className="cum-card-explanation">
          <RichText>{question.explanation}</RichText>
        </div>
      )}
    </div>
  );
}

/* ──────────── TEXT_SELECT 카드 (시험지 스타일) ──────────── */

/** TEXT_SELECT: 글자 단위 클릭 카드 — 모달 X (인터랙션이 다름) */
function TextSelectCard({
  question,
  idx,
  total,
  completion,
  isActive,
  onClickChar,
  confirmedRangeKeys,
  revealRanges,
}) {
  const passage = question.passage || {};
  const paragraphs = passage.paragraphs || [];
  const answerRanges = useMemo(() => resolveAnswerRanges(question, passage), [question, passage]);
  const matchMode = (question?.answerMatchMode || "ALL").toUpperCase();
  const usesAllMatches = matchMode === "ALL" && answerRanges.length > 1;
  const confirmedKeySet = useMemo(() => new Set(confirmedRangeKeys || []), [confirmedRangeKeys]);

  // 표시할 하이라이트 범위
  const activeRanges = completion
    ? answerRanges
    : [
        ...answerRanges.filter((r) => confirmedKeySet.has(toRangeKey(r))),
        ...(revealRanges || []),
      ];

  return (
    <div
      className={`cum-card ${completion ? "completed" : ""} ${isActive ? "active" : ""} ${
        completion?.isCorrect ? "correct" : completion ? "wrong" : ""
      }`}
    >
      <div className="cum-card-header">
        <span className="cum-card-num">
          문제 {idx + 1} / {total}
        </span>
        {completion && (
          <span
            className={`cum-card-mark ${completion.isCorrect ? "correct" : "wrong"}`}
            aria-label={completion.isCorrect ? "정답" : "오답"}
          >
            {completion.isCorrect ? "정답" : "오답"}
          </span>
        )}
      </div>
      <div className="cum-card-stem">
        <RichText>{question.stem || ""}</RichText>
        {usesAllMatches && isActive && !completion && (
          <span className="dq-select-progress">
            {" "}
            ({(confirmedRangeKeys || []).length} / {answerRanges.length})
          </span>
        )}
      </div>
      <div className="cum-card-passage dq-text-select-passage">
        {paragraphs.map((paragraph) => {
          const pRanges = activeRanges.filter((r) => r.paragraphId === paragraph.id);
          const mask = buildHighlightMask(paragraph.text.length, pRanges);
          return (
            <p key={paragraph.id} className="confirm-paragraph">
              {Array.from(paragraph.text).map((char, ci) => {
                const isSpace = char === " " || char === "\n";
                return (
                  <span
                    key={`${paragraph.id}-${ci}`}
                    className={`confirm-char ${mask.has(ci) ? "worksheet-highlight" : ""}`}
                    onClick={
                      isSpace || !isActive || completion ? undefined : () => onClickChar(paragraph.id, ci)
                    }
                  >
                    {isSpace ? "\u00A0" : char}
                  </span>
                );
              })}
            </p>
          );
        })}
      </div>
      {completion && question.explanation && (
        <div className="cum-card-explanation">
          <RichText>{question.explanation}</RichText>
        </div>
      )}
    </div>
  );
}

/* ──────────── 메인 모듈 ──────────── */

function DailyQuizModule({ content }) {
  const { status, start, adjustTime, recordAnswer, finish } = useEngine();
  const payload = content?.payload || {};
  const questions = payload.questions || [];

  // 공통 상태
  const [currentIndex, setCurrentIndex] = useState(0);
  /** completedMap: { [questionId]: { selectedId/filled/..., isCorrect } } */
  const [completedMap, setCompletedMap] = useState({});
  const [lastResult, setLastResult] = useState(null);

  // FILL_BLANKS 진행 상태
  const [blankIndex, setBlankIndex] = useState(0);
  const [blankAnswers, setBlankAnswers] = useState({});
  const [blankResultMap, setBlankResultMap] = useState({});

  // TEXT_SELECT 진행 상태
  const [confirmedRangeKeys, setConfirmedRangeKeys] = useState([]);
  const [revealRanges, setRevealRanges] = useState([]);

  const advanceTimerRef = useRef(null);
  const confirmLockRef = useRef(false);
  const scrollRef = useRef(null);

  // 활성 카드 위치 추적 (모달 anchorRect 계산용)
  const [activeCardRect, setActiveCardRect] = useState(null);

  const currentQuestion = questions[currentIndex];
  const questionType = currentQuestion?.type;

  // FILL_BLANKS 파생
  const blanks = currentQuestion?.blanks || [];

  // TEXT_SELECT 파생
  const textSelectPassage = currentQuestion?.passage;
  const textSelectAnswerRanges = useMemo(
    () => resolveAnswerRanges(currentQuestion, textSelectPassage),
    [currentQuestion, textSelectPassage]
  );
  const matchMode = (currentQuestion?.answerMatchMode || "ALL").toUpperCase();
  const usesAllMatches = matchMode === "ALL" && textSelectAnswerRanges.length > 1;

  // 자동 시작
  useEffect(() => {
    if (status === "READY") start();
  }, [status, start]);

  // 타이머 정리
  useEffect(
    () => () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    },
    []
  );

  // 문제 이동 시 자동 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [currentIndex]);

  // 활성 카드 위치 측정 — 모달 anchorRect용. 문제 전환마다 한 번씩.
  useLayoutEffect(() => {
    if (!scrollRef.current) {
      setActiveCardRect(null);
      return;
    }
    // cum-stack 안에서 활성 카드 찾기 (selector 또는 마지막 카드)
    const activeEl =
      scrollRef.current.querySelector(".cum-card.active") ||
      scrollRef.current.querySelector(".cum-card:last-child");
    if (!activeEl) {
      setActiveCardRect(null);
      return;
    }
    const engineBody = activeEl.closest(".engine-body");
    if (!engineBody) return;
    const containerRect = engineBody.getBoundingClientRect();
    const scale = containerRect.width / engineBody.offsetWidth || 1;
    const cardRect = activeEl.getBoundingClientRect();
    setActiveCardRect({
      left: (cardRect.left - containerRect.left) / (scale || 1),
      right: (cardRect.right - containerRect.left) / (scale || 1),
      top: (cardRect.top - containerRect.top) / (scale || 1),
      height: cardRect.height / (scale || 1),
    });
    // currentIndex / blankIndex 변경 시 재측정
  }, [currentIndex, blankIndex]);

  // 상태 초기화 (문제 전환 시)
  const resetQuestionState = () => {
    setBlankIndex(0);
    setBlankAnswers({});
    setBlankResultMap({});
    setConfirmedRangeKeys([]);
    setRevealRanges([]);
    setLastResult(null);
    confirmLockRef.current = false;
  };

  const handleNext = () => {
    if (currentIndex >= questions.length - 1) {
      finish(true);
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    resetQuestionState();
  };

  const scheduleAdvance = (delay, nextAction) => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = setTimeout(nextAction, delay);
  };

  // ── MULTI_CHOICE 핸들러 ──
  const handleMultiChoice = (selectedId) => {
    if (!currentQuestion) return;
    const scoring = getScoring(currentQuestion);
    const isCorrect = selectedId === currentQuestion.answerId;
    adjustTime(isCorrect ? scoring.correctDeltaSec : scoring.wrongDeltaSec);
    recordAnswer({
      id: currentQuestion.id,
      correct: isCorrect,
      questionKind: currentQuestion.questionKind,
    });
    setCompletedMap((prev) => ({
      ...prev,
      [currentQuestion.id]: { selectedId, isCorrect },
    }));
    setLastResult(isCorrect ? "correct" : "wrong");
    const delay = isCorrect ? FEEDBACK.A_CORRECT_ADVANCE_MS : FEEDBACK.A_WRONG_ADVANCE_MS;
    scheduleAdvance(delay, handleNext);
  };

  // ── FILL_BLANKS 핸들러 ──
  const handleBlankChoice = (selectedId) => {
    if (!currentQuestion) return;
    const blank = blanks[blankIndex];
    const scoring = getScoring(currentQuestion);
    const isCorrect = selectedId === blank.answerId;
    const correctChoice = blank.choices?.find((c) => c.id === blank.answerId);
    adjustTime(isCorrect ? scoring.correctDeltaSec : scoring.wrongDeltaSec);
    recordAnswer({
      id: `${currentQuestion.id}-${blank.id}`,
      correct: isCorrect,
      questionKind: currentQuestion.questionKind,
    });
    const newFilled = { ...blankAnswers, [blank.id]: correctChoice?.text || "" };
    const newResults = { ...blankResultMap, [blank.id]: isCorrect };
    setBlankAnswers(newFilled);
    setBlankResultMap(newResults);
    setLastResult(isCorrect ? "correct" : "wrong");

    const delay = isCorrect ? FEEDBACK.A_CORRECT_ADVANCE_MS : FEEDBACK.A_WRONG_ADVANCE_MS;
    if (blankIndex >= blanks.length - 1) {
      // 마지막 빈칸 → 카드 완료
      const allCorrect = blanks.every((item) => newResults[item.id]);
      setCompletedMap((prev) => ({
        ...prev,
        [currentQuestion.id]: { isCorrect: allCorrect, filled: newFilled, results: newResults },
      }));
      scheduleAdvance(delay, handleNext);
    } else {
      // 다음 빈칸으로
      scheduleAdvance(delay, () => {
        setBlankIndex((prev) => prev + 1);
        setLastResult(null);
      });
    }
  };

  // ── TEXT_SELECT 핸들러 ──
  const handleTextSelectClick = (paragraphId, index) => {
    if (!currentQuestion || questionType !== "TEXT_SELECT") return;
    if (confirmLockRef.current) return;
    const scoring = getScoring(currentQuestion);
    const matchedRange = textSelectAnswerRanges.find(
      (range) => range.paragraphId === paragraphId && index >= range.start && index < range.end
    );
    const isCorrectClick = Boolean(matchedRange);

    if (usesAllMatches && matchedRange) {
      const key = toRangeKey(matchedRange);
      if (confirmedRangeKeys.includes(key)) return;
    }

    adjustTime(isCorrectClick ? scoring.correctDeltaSec : scoring.wrongDeltaSec);
    recordAnswer({
      id: currentQuestion.id || `ts-${currentIndex}`,
      correct: isCorrectClick,
      rangeKey: matchedRange ? toRangeKey(matchedRange) : null,
    });

    confirmLockRef.current = true;
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);

    if (isCorrectClick) {
      if (usesAllMatches && matchedRange) {
        const key = toRangeKey(matchedRange);
        const nextKeys = [...confirmedRangeKeys, key];
        setConfirmedRangeKeys(nextKeys);
        setRevealRanges(textSelectAnswerRanges);
        if (nextKeys.length >= textSelectAnswerRanges.length) {
          setCompletedMap((prev) => ({
            ...prev,
            [currentQuestion.id]: { isCorrect: true },
          }));
          advanceTimerRef.current = setTimeout(() => {
            confirmLockRef.current = false;
            handleNext();
          }, FEEDBACK.A_CORRECT_ADVANCE_MS);
        } else {
          confirmLockRef.current = false;
          setTimeout(() => setRevealRanges([]), 600);
        }
        return;
      }
      setRevealRanges(textSelectAnswerRanges);
      setCompletedMap((prev) => ({
        ...prev,
        [currentQuestion.id]: { isCorrect: true },
      }));
      advanceTimerRef.current = setTimeout(() => {
        confirmLockRef.current = false;
        handleNext();
      }, FEEDBACK.A_CORRECT_ADVANCE_MS);
    } else {
      setRevealRanges(textSelectAnswerRanges);
      setCompletedMap((prev) => ({
        ...prev,
        [currentQuestion.id]: { isCorrect: false },
      }));
      advanceTimerRef.current = setTimeout(() => {
        confirmLockRef.current = false;
        handleNext();
      }, FEEDBACK.A_WRONG_ADVANCE_MS);
    }
  };

  // ── CHOICE_ANALYSIS 완료 콜백 ──
  const handleChoiceAnalysisComplete = () => {
    if (!currentQuestion) return;
    setCompletedMap((prev) => ({
      ...prev,
      [currentQuestion.id]: { isCorrect: true },
    }));
    setTimeout(() => handleNext(), 400);
  };

  // ── 렌더링 ──

  if (!currentQuestion) return null;

  // 누적 모드: currentIndex까지의 문제 카드 스택 (10번 CHOICE_ANALYSIS도 같은 흐름 안에 inline)
  const visibleQuestions = questions.slice(0, currentIndex + 1);

  return (
    <div className="daily-quiz-module">
      <div className="cum-stack" ref={scrollRef}>
        {visibleQuestions.map((q, idx) => {
          const completion = completedMap[q.id];
          const isActive = idx === currentIndex && !completion;
          if (q.type === "FILL_BLANKS") {
            return (
              <FillBlanksCard
                key={q.id}
                question={q}
                idx={idx}
                total={questions.length}
                completion={completion}
                isActive={isActive}
                blankIndex={blankIndex}
                blankAnswers={blankAnswers}
              />
            );
          }
          if (q.type === "TEXT_SELECT") {
            return (
              <TextSelectCard
                key={q.id}
                question={q}
                idx={idx}
                total={questions.length}
                completion={completion}
                isActive={isActive}
                onClickChar={handleTextSelectClick}
                confirmedRangeKeys={isActive ? confirmedRangeKeys : []}
                revealRanges={isActive ? revealRanges : []}
              />
            );
          }
          if (q.type === "CHOICE_OX" || q.type === "CHOICE_ANALYSIS") {
            // 10번 등 선택지 분석 — cum-card 안에 inline 렌더
            return (
              <div
                key={q.id}
                className={`cum-card ${completion ? "completed" : ""} ${isActive ? "active" : ""} ${
                  completion?.isCorrect ? "correct" : completion ? "wrong" : ""
                }`}
              >
                <div className="cum-card-header">
                  <span className="cum-card-num">
                    문제 {idx + 1} / {questions.length}
                  </span>
                  {completion && (
                    <span
                      className={`cum-card-mark ${completion.isCorrect ? "correct" : "wrong"}`}
                      aria-label={completion.isCorrect ? "정답" : "오답"}
                    >
                      {completion.isCorrect ? "정답" : "오답"}
                    </span>
                  )}
                </div>
                {isActive ? (
                  <ChoiceAnalysisCore
                    question={q}
                    onComplete={handleChoiceAnalysisComplete}
                    adjustTime={adjustTime}
                    recordAnswer={recordAnswer}
                  />
                ) : (
                  // 완료된 카드 — stem만 표시 (전체 인터랙션은 풀이 끝나서 의미 없음)
                  <div className="cum-card-stem">
                    <RichText>{q.stem || ""}</RichText>
                  </div>
                )}
                {completion && q.explanation && (
                  <div className="cum-card-explanation">
                    <RichText>{q.explanation}</RichText>
                  </div>
                )}
              </div>
            );
          }
          // MULTI_CHOICE (default) — CumulativeQuestionCard 사용 (자동 모달)
          return (
            <CumulativeQuestionCard
              key={q.id}
              question={q}
              idx={idx}
              total={questions.length}
              completion={completion}
              isActive={isActive}
              onSelect={handleMultiChoice}
              lastResult={isActive ? lastResult : null}
              modalTitle="문제"
            />
          );
        })}
      </div>
      {/* FILL_BLANKS 활성 시 빈칸 모달 — 활성 카드 옆/아래에 떠있는 포스트잇 */}
      {questionType === "FILL_BLANKS" && currentQuestion && !completedMap[currentQuestion.id] && (
        <QuestionModal
          title="빈칸 채우기"
          prompt={`${blankIndex + 1}번째 빈칸을 선택하세요.`}
          choices={blanks[blankIndex]?.choices || []}
          onSelect={handleBlankChoice}
          mark={lastResult}
          shuffleKey={`${currentQuestion.id}-${blankIndex}`}
          correctChoiceId={blanks[blankIndex]?.answerId}
          feedbackDuration={
            lastResult === "wrong" ? FEEDBACK.A_WRONG_ADVANCE_MS : FEEDBACK.A_CORRECT_ADVANCE_MS
          }
          anchorRect={activeCardRect}
        />
      )}
    </div>
  );
}

export default DailyQuizModule;
