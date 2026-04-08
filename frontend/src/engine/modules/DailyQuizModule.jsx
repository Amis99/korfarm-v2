import { useEffect, useMemo, useRef, useState } from "react";
import { useEngine } from "../core/EngineContext";
import { FEEDBACK } from "../shared/feedbackTimings";
import TokenPassage from "../shared/TokenPassage";
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

// 하이라이트 텍스트
const renderHighlightedText = (text, highlight) => {
  if (!highlight || !highlight.text) return <RichText>{text}</RichText>;
  const parts = text.split(highlight.text);
  if (parts.length === 1) return <RichText>{text}</RichText>;
  return parts.reduce((acc, part, idx) => {
    acc.push(<RichText key={`t-${idx}`}>{part}</RichText>);
    if (idx < parts.length - 1) {
      acc.push(
        <span key={`hl-${idx}`} className="worksheet-highlight">
          <RichText>{highlight.text}</RichText>
        </span>
      );
    }
    return acc;
  }, []);
};

/* ──────────── 카드 컴포넌트 (각 type별) ──────────── */

/** MULTI_CHOICE: 발문 + 지문(있으면) + 선택지 4지 (활성 시 클릭, 푼 후 정답 + 해설) */
function MultiChoiceCard({ question, idx, total, completion, isActive, onSelect }) {
  const choices = question.choices || [];
  const passage = question.passage;
  const stem = question.stem || question.prompt || "";
  return (
    <div className={`cum-card ${completion ? "completed" : ""} ${isActive ? "active" : ""} ${completion?.isCorrect ? "correct" : completion ? "wrong" : ""}`}>
      <div className="cum-card-header">
        <span className="cum-card-num">문제 {idx + 1} / {total}</span>
        {question.competency && <span className="dq-competency-tag">{question.competency}</span>}
        {completion && (
          <span className={`cum-card-mark ${completion.isCorrect ? "correct" : "wrong"}`}>
            {completion.isCorrect ? "○ 정답" : "× 오답"}
          </span>
        )}
      </div>
      {passage && typeof passage === "string" && passage.length > 0 && (
        <div className="cum-card-passage">
          {question.highlight ? renderHighlightedText(passage, question.highlight) : <PassageMarkdown>{passage}</PassageMarkdown>}
        </div>
      )}
      <div className="cum-card-stem"><RichText>{stem}</RichText></div>
      <div className="cum-card-choices">
        {choices.map((c, ci) => {
          const isCorrectChoice = c.id === question.answerId;
          const isPicked = completion?.selectedId === c.id;
          const showAsCorrect = completion && isCorrectChoice;
          const showAsWrong = completion && isPicked && !isCorrectChoice;
          return (
            <button
              key={c.id || ci}
              type="button"
              className={`cum-choice ${showAsCorrect ? "is-correct" : ""} ${showAsWrong ? "is-wrong" : ""}`}
              onClick={() => isActive && onSelect(c.id)}
              disabled={!isActive || !!completion}
            >
              <span className="cum-choice-num">{ci + 1}</span>
              <span className="cum-choice-text"><RichText>{c.text}</RichText></span>
              {showAsCorrect && <span className="cum-choice-tag">정답</span>}
              {showAsWrong && <span className="cum-choice-tag wrong">선택</span>}
            </button>
          );
        })}
      </div>
      {completion && question.explanation && (
        <div className="cum-card-explanation">
          <span className="cum-card-explanation-label">해설</span>
          <RichText>{question.explanation}</RichText>
        </div>
      )}
    </div>
  );
}

/** FILL_BLANKS: 모범답안 template + 빈칸을 순차적으로 채움 */
function FillBlanksCard({ question, idx, total, completion, isActive, onSelectBlank, blankIndex }) {
  const blanks = question.blanks || [];
  const template = question.template || "";
  const parts = template.split("____");
  const filled = completion?.filled || (isActive ? blanks.map((b) => completion?.filled?.[b.id] || "") : []);
  const passage = question.passage;
  const allCorrect = completion?.isCorrect;

  return (
    <div className={`cum-card ${completion ? "completed" : ""} ${isActive ? "active" : ""} ${completion?.isCorrect ? "correct" : completion ? "wrong" : ""}`}>
      <div className="cum-card-header">
        <span className="cum-card-num">문제 {idx + 1} / {total}</span>
        {question.competency && <span className="dq-competency-tag">{question.competency}</span>}
        {completion && (
          <span className={`cum-card-mark ${allCorrect ? "correct" : "wrong"}`}>
            {allCorrect ? "○ 정답" : "× 오답"}
          </span>
        )}
      </div>
      {passage && typeof passage === "string" && passage.length > 0 && (
        <div className="cum-card-passage"><PassageMarkdown>{passage}</PassageMarkdown></div>
      )}
      <div className="cum-card-stem"><RichText>{question.stem || ""}</RichText></div>
      {/* template + 빈칸 */}
      <div className="cum-card-template">
        {parts.map((part, partIdx) => (
          <span key={`part-${partIdx}`}>
            <RichText>{part}</RichText>
            {partIdx < blanks.length && (
              <span className={`worksheet-blank ${isActive && partIdx === blankIndex ? "active" : ""}`}>
                {(completion?.filled?.[blanks[partIdx].id]) ||
                  (isActive && partIdx < blankIndex
                    ? (blanks[partIdx].choices?.find((c) => c.id === blanks[partIdx].answerId)?.text || "____")
                    : "____")}
              </span>
            )}
          </span>
        ))}
      </div>
      {/* 활성: 현재 빈칸에 대한 선택지 */}
      {isActive && !completion && blanks[blankIndex] && (
        <div className="cum-card-choices">
          <div className="cum-card-blank-prompt">
            {blankIndex + 1}번째 빈칸을 선택하세요.
          </div>
          {(blanks[blankIndex].choices || []).map((c, ci) => (
            <button
              key={c.id || ci}
              type="button"
              className="cum-choice"
              onClick={() => onSelectBlank(c.id)}
            >
              <span className="cum-choice-num">{ci + 1}</span>
              <span className="cum-choice-text"><RichText>{c.text}</RichText></span>
            </button>
          ))}
        </div>
      )}
      {completion && question.explanation && (
        <div className="cum-card-explanation">
          <span className="cum-card-explanation-label">해설</span>
          <RichText>{question.explanation}</RichText>
        </div>
      )}
    </div>
  );
}

/** TEXT_SELECT: 글자 단위 클릭 카드 */
function TextSelectCard({ question, idx, total, completion, isActive, onClickChar, confirmedRangeKeys, revealRanges }) {
  const passage = question.passage || {};
  const paragraphs = passage.paragraphs || [];
  const answerRanges = useMemo(() => resolveAnswerRanges(question, passage), [question, passage]);
  const matchMode = (question?.answerMatchMode || "ALL").toUpperCase();
  const usesAllMatches = matchMode === "ALL" && answerRanges.length > 1;
  const confirmedKeySet = useMemo(() => new Set(confirmedRangeKeys || []), [confirmedRangeKeys]);

  // 표시할 하이라이트 범위:
  //   완료된 카드 → 항상 모든 정답 범위 표시
  //   활성 카드 → confirmed + reveal
  const activeRanges = completion
    ? answerRanges
    : [
        ...answerRanges.filter((r) => confirmedKeySet.has(toRangeKey(r))),
        ...(revealRanges || []),
      ];

  return (
    <div className={`cum-card ${completion ? "completed" : ""} ${isActive ? "active" : ""} ${completion?.isCorrect ? "correct" : completion ? "wrong" : ""}`}>
      <div className="cum-card-header">
        <span className="cum-card-num">문제 {idx + 1} / {total}</span>
        {question.competency && <span className="dq-competency-tag">{question.competency}</span>}
        {completion && (
          <span className={`cum-card-mark ${completion.isCorrect ? "correct" : "wrong"}`}>
            {completion.isCorrect ? "○ 정답" : "× 오답"}
          </span>
        )}
      </div>
      <div className="cum-card-stem">
        <RichText>{question.stem || ""}</RichText>
        {usesAllMatches && isActive && !completion && (
          <span className="dq-select-progress">
            {" "}({(confirmedRangeKeys || []).length} / {answerRanges.length})
          </span>
        )}
      </div>
      <div className="dq-text-select-passage">
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
                    onClick={isSpace || !isActive || completion ? undefined : () => onClickChar(paragraph.id, ci)}
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
          <span className="cum-card-explanation-label">해설</span>
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

  // FILL_BLANKS 진행 상태 (현재 활성 문제만)
  const [blankIndex, setBlankIndex] = useState(0);
  const [blankAnswers, setBlankAnswers] = useState({});
  const [blankResultMap, setBlankResultMap] = useState({});

  // TEXT_SELECT 진행 상태
  const [confirmedRangeKeys, setConfirmedRangeKeys] = useState([]);
  const [revealRanges, setRevealRanges] = useState([]);

  // CHOICE_OX 상태 (Q10) — 사용자 추후 작업, 손대지 말기
  const [choiceId, setChoiceId] = useState(null);
  const [propIndex, setPropIndex] = useState(0);
  const [choiceMarks, setChoiceMarks] = useState({});
  const [propMarks, setPropMarks] = useState({});
  const [completedChoices, setCompletedChoices] = useState(new Set());

  const advanceTimerRef = useRef(null);
  const confirmLockRef = useRef(false);
  const scrollRef = useRef(null);

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

  // CHOICE_OX 파생
  const oxChoices = currentQuestion?.choices || [];
  const currentOxChoice = oxChoices.find((c) => c.choiceId === choiceId);
  const currentProp = currentOxChoice?.propositions?.[propIndex];
  const isNegativeStem = useMemo(
    () => (currentQuestion?.stem || "").includes("않는"),
    [currentQuestion]
  );
  const [lastResult, setLastResult] = useState(null);

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

  // 상태 초기화 (문제 전환 시)
  const resetQuestionState = () => {
    setBlankIndex(0);
    setBlankAnswers({});
    setBlankResultMap({});
    setConfirmedRangeKeys([]);
    setRevealRanges([]);
    setChoiceId(null);
    setPropIndex(0);
    setChoiceMarks({});
    setPropMarks({});
    setCompletedChoices(new Set());
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
    recordAnswer({ id: currentQuestion.id, correct: isCorrect, questionKind: currentQuestion.questionKind });
    setCompletedMap((prev) => ({
      ...prev,
      [currentQuestion.id]: { selectedId, isCorrect },
    }));
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
    recordAnswer({ id: `${currentQuestion.id}-${blank.id}`, correct: isCorrect, questionKind: currentQuestion.questionKind });
    const newFilled = { ...blankAnswers, [blank.id]: correctChoice?.text || "" };
    const newResults = { ...blankResultMap, [blank.id]: isCorrect };
    setBlankAnswers(newFilled);
    setBlankResultMap(newResults);

    if (blankIndex >= blanks.length - 1) {
      // 마지막 빈칸 → 카드 완료
      const allCorrect = blanks.every((item) => newResults[item.id]);
      setCompletedMap((prev) => ({
        ...prev,
        [currentQuestion.id]: { isCorrect: allCorrect, filled: newFilled, results: newResults },
      }));
      const delay = allCorrect ? FEEDBACK.A_CORRECT_ADVANCE_MS : FEEDBACK.A_WRONG_ADVANCE_MS;
      scheduleAdvance(delay, handleNext);
    } else {
      // 다음 빈칸으로
      setTimeout(() => setBlankIndex((prev) => prev + 1), FEEDBACK.A_CORRECT_ADVANCE_MS);
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
          // 모든 범위 찾음 → 완료
          setCompletedMap((prev) => ({
            ...prev,
            [currentQuestion.id]: { isCorrect: true },
          }));
          advanceTimerRef.current = setTimeout(() => {
            confirmLockRef.current = false;
            handleNext();
          }, FEEDBACK.A_CORRECT_ADVANCE_MS);
        } else {
          // 아직 남음 — 계속
          confirmLockRef.current = false;
          setTimeout(() => setRevealRanges([]), 600);
        }
        return;
      }
      // 단일 정답 또는 ANY 모드
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
      // 오답 → 정답 위치 표시 후 3초
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

  // ── CHOICE_OX 핸들러 (사용자 추후 작업, 손대지 말기) ──
  const handleOxChoiceSelect = (id) => {
    if (completedChoices.has(id)) return;
    setChoiceId(id);
    setPropIndex(0);
    setLastResult(null);
  };

  const handleOxTokenClick = (token) => {
    if (!currentProp) return;
    const scoring = getScoring(currentQuestion);
    const correct = currentProp.evidenceTokens?.includes(token.tokenId);
    adjustTime(correct ? scoring.correctDeltaSec : scoring.wrongDeltaSec);
    recordAnswer({ id: currentProp.propId, correct });
    setLastResult(correct ? "correct" : "wrong");
    if (!correct) return;

    setPropMarks((prev) => ({ ...prev, [currentProp.propId]: currentProp.oxAnswer }));
    const nextPropIdx = propIndex + 1;
    if (nextPropIdx < currentOxChoice.propositions.length) {
      setPropIndex(nextPropIdx);
      return;
    }

    const isCorrectChoice = currentOxChoice.finalIsCorrectChoice;
    setChoiceMarks((prev) => ({
      ...prev,
      [currentOxChoice.choiceId]: isCorrectChoice ? "정답" : isNegativeStem ? "O" : "X",
    }));
    const nextCompleted = new Set(completedChoices);
    nextCompleted.add(currentOxChoice.choiceId);
    setCompletedChoices(nextCompleted);

    if (nextCompleted.size >= oxChoices.length || isCorrectChoice) {
      setCompletedMap((prev) => ({
        ...prev,
        [currentQuestion.id]: { isCorrect: true },
      }));
      scheduleAdvance(FEEDBACK.B_CORRECT_FINAL_MS, handleNext);
    } else {
      setChoiceId(null);
      setPropIndex(0);
    }
  };

  // ── 렌더링 ──

  if (!currentQuestion) return null;

  const progressPercent = ((currentIndex + 1) / questions.length) * 100;

  // CHOICE_OX는 단일 화면 (사용자 추후 작업) — 누적 변환에서 제외
  if (questionType === "CHOICE_OX") {
    const passage = currentQuestion.passage;
    const highlightTokens = currentProp?.evidenceTokens || [];
    return (
      <div className="daily-quiz-module">
        <div className="dq-progress">
          <div className="dq-progress-bar">
            <div className="dq-progress-fill" style={{ width: `${progressPercent}%` }} />
          </div>
          <div className="dq-progress-text">
            <span>{currentIndex + 1} / {questions.length}</span>
          </div>
        </div>
        <div className="dq-question-area dq-choice-ox">
          <div className="dq-stem"><RichText>{currentQuestion.stem || ""}</RichText></div>
          {currentProp ? (
            <div className="dq-prop-banner">
              명제: <RichText>{currentProp.text}</RichText>
              <span className="dq-prop-ox">({currentProp.oxAnswer})</span>
              {lastResult && (
                <span className={`worksheet-feedback ${lastResult}`}>
                  {lastResult === "correct" ? " 정답!" : " 오답"}
                </span>
              )}
            </div>
          ) : (
            <div className="dq-prop-banner">선택지를 클릭해 분석을 시작하세요.</div>
          )}
          <div className="dq-choice-ox-body">
            <div className="choice-list">
              {oxChoices.map((choice) => (
                <button
                  key={choice.choiceId}
                  type="button"
                  className={`choice-item ${choiceId === choice.choiceId ? "active" : ""} ${completedChoices.has(choice.choiceId) ? "done" : ""}`}
                  onClick={() => handleOxChoiceSelect(choice.choiceId)}
                  disabled={completedChoices.has(choice.choiceId)}
                >
                  <span className="choice-label">{choice.choiceId}</span>
                  <span><RichText>{choice.text}</RichText></span>
                  {choiceMarks[choice.choiceId] && (
                    <span
                      className={`choice-mark ${choiceMarks[choice.choiceId] === "X" ? "wrong" : "correct"}`}
                    >
                      {choiceMarks[choice.choiceId]}
                    </span>
                  )}
                </button>
              ))}
            </div>
            <div className="dq-choice-ox-passage">
              <TokenPassage
                passage={passage}
                highlightTokens={highlightTokens}
                onTokenClick={handleOxTokenClick}
              />
              {currentOxChoice && (
                <div className="choice-props">
                  {currentOxChoice.propositions.map((prop) => (
                    <div key={prop.propId} className="choice-prop">
                      <span><RichText>{prop.text}</RichText></span>
                      {propMarks[prop.propId] && (
                        <span
                          className={`choice-prop-mark ${propMarks[prop.propId] === "X" ? "wrong" : "correct"}`}
                        >
                          {propMarks[prop.propId]}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 누적 모드: currentIndex까지의 문제 카드 스택
  const visibleQuestions = questions.slice(0, currentIndex + 1);

  return (
    <div className="daily-quiz-module">
      <div className="dq-progress">
        <div className="dq-progress-bar">
          <div className="dq-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>
        <div className="dq-progress-text">
          <span>{currentIndex + 1} / {questions.length}</span>
        </div>
      </div>
      <div className="dq-tabs">
        {questions.map((q, idx) => {
          const c = completedMap[q.id];
          return (
            <span
              key={q.id}
              className={`dq-tab ${idx === currentIndex ? "active" : ""} ${c ? (c.isCorrect ? "correct" : "wrong") : ""}`}
            >
              {idx + 1}
            </span>
          );
        })}
      </div>
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
                onSelectBlank={handleBlankChoice}
                blankIndex={blankIndex}
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
          // MULTI_CHOICE (default)
          return (
            <MultiChoiceCard
              key={q.id}
              question={q}
              idx={idx}
              total={questions.length}
              completion={completion}
              isActive={isActive}
              onSelect={handleMultiChoice}
            />
          );
        })}
      </div>
    </div>
  );
}

export default DailyQuizModule;
