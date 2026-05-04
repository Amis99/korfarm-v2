import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useEngine } from "../core/EngineContext";
import { FEEDBACK } from "../shared/feedbackTimings";
import CumulativeQuestionCard from "../shared/CumulativeQuestionCard";
import ChoiceAnalysisCore from "../shared/ChoiceAnalysisCore";
import QuestionModal from "../shared/QuestionModal";
import RichText from "../../utils/RichText";
import PassageMarkdown from "../../utils/PassageMarkdown";
import { replaceChoiceLetters } from "../../utils/explanationLetters";

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
function FillBlanksCard({ question, idx, total, completion, isActive, blankIndex, onActivate }) {
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

  const handleCardClick = (event) => {
    if (!isActive || completion) return;
    if (event.target.closest?.(".worksheet-blank.active")) {
      onActivate?.();
    }
  };

  const handleCardKeyDown = (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (!isActive || completion) return;
    event.preventDefault();
    onActivate?.();
  };

  return (
    <div
      className={`cum-card ${completion ? "completed" : ""} ${isActive ? "active" : ""} ${
        completion?.isCorrect ? "correct" : completion ? "wrong" : ""
      } ${isActive && !completion ? "modal-trigger-ready" : ""}`}
      onClick={handleCardClick}
      onKeyDown={handleCardKeyDown}
      tabIndex={isActive && !completion ? 0 : undefined}
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
  currentClickRange,
  currentClickResult,
}) {
  const passage = question.passage || {};
  const paragraphs = passage.paragraphs || [];
  const answerRanges = useMemo(() => resolveAnswerRanges(question, passage), [question, passage]);
  // ALL/ANY 화이트리스트 — 그 외(placeholder, INCLUDES 등)는 ALL 로 fallback
  const rawMode = (question?.answerMatchMode || "").toString().toUpperCase();
  const matchMode = rawMode === "ANY" ? "ANY" : "ALL";
  const usesAllMatches = matchMode === "ALL" && answerRanges.length > 1;

  // 표시할 하이라이트 범위 (누적 X — 직전 클릭 1개 + reveal 만)
  const activeRanges = completion
    ? answerRanges
    : [
        ...(currentClickRange ? [currentClickRange] : []),
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
          // 오버레이 위치: 클릭한 range 의 시작 char 1개에만 O/X 표시
          const overlayIdx =
            currentClickRange && currentClickRange.paragraphId === paragraph.id && currentClickResult
              ? currentClickRange.start
              : -1;
          return (
            <p key={paragraph.id} className="confirm-paragraph">
              {Array.from(paragraph.text).map((char, ci) => {
                const isSpace = char === " " || char === "\n";
                const overlayCls =
                  ci === overlayIdx
                    ? currentClickResult === "correct"
                      ? "dq-overlay-correct"
                      : "dq-overlay-wrong"
                    : "";
                return (
                  <span
                    key={`${paragraph.id}-${ci}`}
                    className={`confirm-char ${mask.has(ci) ? "worksheet-highlight" : ""} ${overlayCls}`}
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
  // CHOICE_COMPLEX_OX 등 ChoiceAnalysisCore 가 셔플한 결과를 부모가 보관 — explanation 의 A/B/C/D 치환에 사용
  // shape: { [questionId]: [{ id }, ...]  ← 학생이 본 표시 순서대로 }
  const [choiceShuffleMap, setChoiceShuffleMap] = useState({});
  const [lastResult, setLastResult] = useState(null);

  // FILL_BLANKS 진행 상태
  const [blankIndex, setBlankIndex] = useState(0);
  const [blankAnswers, setBlankAnswers] = useState({});
  const [blankResultMap, setBlankResultMap] = useState({});
  const [fillModalKey, setFillModalKey] = useState(null);

  // TEXT_SELECT 진행 상태
  const [confirmedRangeKeys, setConfirmedRangeKeys] = useState([]);
  const [revealRanges, setRevealRanges] = useState([]);
  const [currentClickRange, setCurrentClickRange] = useState(null);     // 직전 클릭 1개 (중간 정답 + 오답 단일 표시용)
  const [currentClickResult, setCurrentClickResult] = useState(null);   // "correct" | "wrong" | null — 클릭 위치에 O/X 오버레이

  const advanceTimerRef = useRef(null);
  const confirmLockRef = useRef(false);
  const scrollRef = useRef(null);

  // 활성 카드 위치 추적 (모달 anchorRect 계산용)
  const [activeCardRect, setActiveCardRect] = useState(null);

  const currentQuestion = questions[currentIndex];
  const questionType = currentQuestion?.type;
  const activeFillModalKey = currentQuestion ? `${currentQuestion.id}-${blankIndex}` : null;
  const fillModalOpen = fillModalKey === activeFillModalKey;
  const modalInstruction =
    questionType === "FILL_BLANKS" || questionType === "TEXT_SELECT"
      ? "하이라이트된 부분을 다 읽고 난 후 클릭하여 질문에 답하세요."
      : "문제를 읽고 클릭하면 답안을 입력할 수 있습니다.";

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

  // 활성 카드 위치 측정 + 자동 스크롤 — 모달 anchorRect용 (viewport 기준).
  useLayoutEffect(() => {
    if (!scrollRef.current) {
      setActiveCardRect(null);
      return;
    }
    const activeEl =
      scrollRef.current.querySelector(".cum-card.active") ||
      scrollRef.current.querySelector(".cum-card:last-child");
    if (!activeEl) {
      setActiveCardRect(null);
      return;
    }
    // 새 활성 카드 상단을 화면 상단으로 자동 스크롤
    try {
      activeEl.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch {
      activeEl.scrollIntoView();
    }
    const measure = () => {
      const el =
        scrollRef.current?.querySelector(".cum-card.active") ||
        scrollRef.current?.querySelector(".cum-card:last-child");
      if (!el) return;
      const cardRect = el.getBoundingClientRect();
      setActiveCardRect({
        left: cardRect.left,
        right: cardRect.right,
        top: cardRect.top,
        height: cardRect.height,
      });
    };
    measure();
    const t = setTimeout(measure, 350);  // smooth scroll 완료 후 재측정
    return () => clearTimeout(t);
  }, [currentIndex, blankIndex]);

  // 상태 초기화 (문제 전환 시)
  const resetQuestionState = () => {
    setBlankIndex(0);
    setBlankAnswers({});
    setBlankResultMap({});
    setFillModalKey(null);
    setConfirmedRangeKeys([]);
    setRevealRanges([]);
    setCurrentClickRange(null);
    setCurrentClickResult(null);
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
      chosenChoiceId: selectedId,
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

    // 타이밍 (사용자 명시: 중간 0.5초 / 마지막 정답 1초 / 오답 3초)
    const TS_INTERIM_MS = 500;
    const TS_FINAL_CORRECT_MS = 1000;
    const TS_WRONG_MS = FEEDBACK.A_WRONG_ADVANCE_MS;  // 3000

    if (isCorrectClick) {
      if (usesAllMatches && matchedRange) {
        const key = toRangeKey(matchedRange);
        const nextKeys = [...confirmedRangeKeys, key];
        setConfirmedRangeKeys(nextKeys);
        setCurrentClickRange(matchedRange);
        setCurrentClickResult("correct");

        if (nextKeys.length >= textSelectAnswerRanges.length) {
          // 마지막 정답: 모든 정답 reveal + O 오버레이 + 1초
          setRevealRanges(textSelectAnswerRanges);
          setCompletedMap((prev) => ({
            ...prev,
            [currentQuestion.id]: { isCorrect: true },
          }));
          advanceTimerRef.current = setTimeout(() => {
            confirmLockRef.current = false;
            handleNext();
          }, TS_FINAL_CORRECT_MS);
        } else {
          // 중간 정답: 클릭한 1개만 0.5초 표시 + O 오버레이, 그 후 사라지고 다음 클릭 대기
          advanceTimerRef.current = setTimeout(() => {
            setCurrentClickRange(null);
            setCurrentClickResult(null);
            confirmLockRef.current = false;
          }, TS_INTERIM_MS);
        }
        return;
      }
      // ANY 모드 (단일 정답으로 카드 완료)
      setCurrentClickRange(matchedRange);
      setCurrentClickResult("correct");
      setRevealRanges(textSelectAnswerRanges);
      setCompletedMap((prev) => ({
        ...prev,
        [currentQuestion.id]: { isCorrect: true },
      }));
      advanceTimerRef.current = setTimeout(() => {
        confirmLockRef.current = false;
        handleNext();
      }, TS_FINAL_CORRECT_MS);
    } else {
      // 오답: 학생이 클릭한 위치에 X 오버레이 + 모든 정답 reveal + 3초
      setCurrentClickRange({ paragraphId, start: index, end: index + 1 });
      setCurrentClickResult("wrong");
      setRevealRanges(textSelectAnswerRanges);
      setCompletedMap((prev) => ({
        ...prev,
        [currentQuestion.id]: { isCorrect: false },
      }));
      advanceTimerRef.current = setTimeout(() => {
        confirmLockRef.current = false;
        handleNext();
      }, TS_WRONG_MS);
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

  // CHOICE_COMPLEX_OX 오답 시 즉시 학습 종료 (사용자 요구: 10번에서 오답 즉시 종료)
  const handleChoiceAnalysisFail = () => {
    if (!currentQuestion) return;
    setCompletedMap((prev) => ({
      ...prev,
      [currentQuestion.id]: { isCorrect: false },
    }));
    // 엔진 종료 — 누적 정답률 등 결과 표시
    setTimeout(() => finish(false), 200);
  };

  // ── 렌더링 ──

  if (!currentQuestion) return null;

  // 누적 모드: currentIndex까지의 문제 카드 스택 (10번 CHOICE_ANALYSIS도 같은 흐름 안에 inline)
  const visibleQuestions = questions.slice(0, currentIndex + 1);

  return (
    <div className="daily-quiz-module">
      <div className="learning-modal-instruction">{modalInstruction}</div>
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
                onActivate={() => setFillModalKey(activeFillModalKey)}
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
                currentClickRange={isActive ? currentClickRange : null}
                currentClickResult={isActive ? currentClickResult : null}
              />
            );
          }
          if (q.type === "CHOICE_COMPLEX_OX" || q.type === "CHOICE_OX" || q.type === "CHOICE_ANALYSIS") {
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
                    onFail={handleChoiceAnalysisFail}
                    adjustTime={adjustTime}
                    recordAnswer={recordAnswer}
                    onShuffle={(qid, shuffled) =>
                      setChoiceShuffleMap((prev) => ({ ...prev, [qid]: shuffled }))
                    }
                  />
                ) : (
                  // 완료된 카드 — stem만 표시 (전체 인터랙션은 풀이 끝나서 의미 없음)
                  <div className="cum-card-stem">
                    <RichText>{q.stem || ""}</RichText>
                  </div>
                )}
                {completion && q.explanation && (
                  <div className="cum-card-explanation">
                    <RichText>{replaceChoiceLetters(q.explanation, choiceShuffleMap[q.id])}</RichText>
                  </div>
                )}
              </div>
            );
          }
          // MULTI_CHOICE (default) — CumulativeQuestionCard 사용 (클릭 시 모달)
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
      {fillModalOpen && questionType === "FILL_BLANKS" && currentQuestion && !completedMap[currentQuestion.id] && (
        <QuestionModal
          title="빈칸 채우기"
          prompt={`${blankIndex + 1}번째 빈칸을 선택하세요.`}
          choices={blanks[blankIndex]?.choices || []}
          onSelect={handleBlankChoice}
          onClose={() => setFillModalKey(null)}
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
