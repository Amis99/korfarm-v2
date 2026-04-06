import { useEffect, useMemo, useRef, useState } from "react";
import { useEngine } from "../core/EngineContext";
import QuestionModal from "../shared/QuestionModal";
import { FEEDBACK } from "../shared/feedbackTimings";
import TokenPassage from "../shared/TokenPassage";
import RichText from "../../utils/RichText";

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

// TEXT_SELECT 유틸: 글자 범위 → Set 마스크
const buildHighlightMask = (length, ranges) => {
  const mask = new Set();
  ranges.forEach((range) => {
    const start = Math.max(0, Math.min(length, range.start));
    const end = Math.max(start, Math.min(length, range.end));
    for (let idx = start; idx < end; idx += 1) {
      mask.add(idx);
    }
  });
  return mask;
};

const toRangeKey = (range) => `${range.paragraphId}:${range.start}-${range.end}`;

// TEXT_SELECT: answerRanges 또는 answerText로부터 범위 해석
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

// FILL_BLANKS 템플릿 렌더
const renderTemplate = (template, blanks, filled, activeIndex) => {
  const parts = template.split("____");
  return parts.map((part, idx) => (
    <span key={`part-${idx}`}>
      {part}
      {idx < blanks.length ? (
        <span className={`worksheet-blank ${idx === activeIndex ? "active" : ""}`}>
          {filled[idx] || "____"}
        </span>
      ) : null}
    </span>
  ));
};

// 하이라이트 텍스트 렌더
const renderHighlightedText = (text, highlight) => {
  if (!highlight) return <RichText>{text}</RichText>;
  if (highlight.text) {
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
  }
  return <RichText>{text}</RichText>;
};

function DailyQuizModule({ content }) {
  const { status, start, adjustTime, recordAnswer, finish } = useEngine();
  const payload = content?.payload || {};
  const questions = payload.questions || [];

  // 공통 상태
  const [currentIndex, setCurrentIndex] = useState(0);
  const [statusMap, setStatusMap] = useState({});
  const [lastResult, setLastResult] = useState(null);
  const [feedbackDuration, setFeedbackDuration] = useState(FEEDBACK.A_CORRECT_ADVANCE_MS);

  // FILL_BLANKS 상태
  const [blankIndex, setBlankIndex] = useState(0);
  const [blankAnswers, setBlankAnswers] = useState({});
  const [blankResultMap, setBlankResultMap] = useState({});

  // TEXT_SELECT 상태
  const [confirmedRangeKeys, setConfirmedRangeKeys] = useState([]);
  const [revealRanges, setRevealRanges] = useState([]);
  const [textSelectResult, setTextSelectResult] = useState(null);

  // CHOICE_OX 상태
  const [choiceId, setChoiceId] = useState(null);
  const [propIndex, setPropIndex] = useState(0);
  const [choiceMarks, setChoiceMarks] = useState({});
  const [propMarks, setPropMarks] = useState({});
  const [completedChoices, setCompletedChoices] = useState(new Set());

  const advanceTimerRef = useRef(null);
  const resultTimerRef = useRef(null);
  const confirmLockRef = useRef(false);

  const currentQuestion = questions[currentIndex];
  const questionType = currentQuestion?.type;

  // FILL_BLANKS 파생
  const blanks = currentQuestion?.blanks || [];
  const filled = blanks.map((blank) => blankAnswers[blank.id]);

  // TEXT_SELECT 파생
  const textSelectPassage = currentQuestion?.passage;
  const textSelectAnswerRanges = useMemo(
    () => resolveAnswerRanges(currentQuestion, textSelectPassage),
    [currentQuestion, textSelectPassage]
  );
  const matchMode = (currentQuestion?.answerMatchMode || "ALL").toUpperCase();
  const usesAllMatches = matchMode === "ALL" && textSelectAnswerRanges.length > 1;
  const confirmedKeySet = useMemo(() => new Set(confirmedRangeKeys), [confirmedRangeKeys]);

  // CHOICE_OX 파생
  const oxChoices = currentQuestion?.choices || [];
  const currentOxChoice = oxChoices.find((c) => c.choiceId === choiceId);
  const currentProp = currentOxChoice?.propositions?.[propIndex];
  const isNegativeStem = useMemo(
    () => (currentQuestion?.stem || "").includes("않는"),
    [currentQuestion]
  );

  // 자동 시작
  useEffect(() => {
    if (status === "READY") {
      start();
    }
  }, [status, start]);

  // 타이머 정리
  useEffect(
    () => () => {
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    },
    []
  );

  // 상태 초기화 (문제 전환 시)
  const resetQuestionState = () => {
    setBlankIndex(0);
    setBlankAnswers({});
    setBlankResultMap({});
    setConfirmedRangeKeys([]);
    setRevealRanges([]);
    setTextSelectResult(null);
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

  // 다음 진행 예약 (lastResult 자동 초기화 포함)
  const scheduleAdvance = (delay, nextAction) => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    advanceTimerRef.current = setTimeout(() => {
      setLastResult(null);
      nextAction();
    }, delay);
  };

  // ── MULTI_CHOICE 핸들러 (A 패턴) ──
  const handleMultiChoice = (selectedId) => {
    if (!currentQuestion) return;
    const scoring = getScoring(currentQuestion);
    const isCorrect = selectedId === currentQuestion.answerId;
    adjustTime(isCorrect ? scoring.correctDeltaSec : scoring.wrongDeltaSec);
    recordAnswer({ id: currentQuestion.id, correct: isCorrect, questionKind: currentQuestion.questionKind });
    setLastResult(isCorrect ? "correct" : "wrong");
    setStatusMap((prev) => ({ ...prev, [currentQuestion.id]: isCorrect ? "correct" : "wrong" }));
    const delay = isCorrect ? FEEDBACK.A_CORRECT_ADVANCE_MS : FEEDBACK.A_WRONG_ADVANCE_MS;
    setFeedbackDuration(delay);
    scheduleAdvance(delay, handleNext);
  };

  // ── FILL_BLANKS 핸들러 (A 패턴) ──
  const handleBlankChoice = (selectedId) => {
    if (!currentQuestion) return;
    const blank = blanks[blankIndex];
    const scoring = getScoring(currentQuestion);
    const isCorrect = selectedId === blank.answerId;
    const correctChoice = blank.choices?.find((c) => c.id === blank.answerId);
    adjustTime(isCorrect ? scoring.correctDeltaSec : scoring.wrongDeltaSec);
    recordAnswer({ id: `${currentQuestion.id}-${blank.id}`, correct: isCorrect, questionKind: currentQuestion.questionKind });
    setBlankAnswers((prev) => ({ ...prev, [blank.id]: correctChoice?.text || "" }));
    setBlankResultMap((prev) => ({ ...prev, [blank.id]: isCorrect }));
    setLastResult(isCorrect ? "correct" : "wrong");
    const delay = isCorrect ? FEEDBACK.A_CORRECT_ADVANCE_MS : FEEDBACK.A_WRONG_ADVANCE_MS;
    setFeedbackDuration(delay);
    if (blankIndex >= blanks.length - 1) {
      const resultMap = { ...blankResultMap, [blank.id]: isCorrect };
      const allCorrect = blanks.every((item) => resultMap[item.id]);
      setStatusMap((prev) => ({ ...prev, [currentQuestion.id]: allCorrect ? "correct" : "wrong" }));
      scheduleAdvance(delay, handleNext);
    } else {
      scheduleAdvance(delay, () => setBlankIndex((prev) => prev + 1));
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

    // ALL 모드: 이미 확인한 범위 재클릭 무시
    if (usesAllMatches && matchedRange) {
      const key = toRangeKey(matchedRange);
      if (confirmedKeySet.has(key)) return;
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
        setTextSelectResult("correct");
        setRevealRanges(textSelectAnswerRanges);
        if (nextKeys.length >= textSelectAnswerRanges.length) {
          // 모든 범위 찾음 (정답 → 즉시 다음)
          setStatusMap((prev) => ({ ...prev, [currentQuestion.id]: "correct" }));
          advanceTimerRef.current = setTimeout(() => {
            confirmLockRef.current = false;
            handleNext();
          }, FEEDBACK.A_CORRECT_ADVANCE_MS);
        } else {
          // 아직 남음 — 잠금 풀고 계속
          confirmLockRef.current = false;
          setTimeout(() => {
            setRevealRanges([]);
            setTextSelectResult(null);
          }, 600);
        }
        return;
      }
      // ANY 모드 또는 단일 정답 (정답 → 즉시 다음)
      setTextSelectResult("correct");
      setRevealRanges(textSelectAnswerRanges);
      setStatusMap((prev) => ({ ...prev, [currentQuestion.id]: "correct" }));
      advanceTimerRef.current = setTimeout(() => {
        confirmLockRef.current = false;
        handleNext();
      }, FEEDBACK.A_CORRECT_ADVANCE_MS);
    } else {
      // 오답 → 정답 위치 표시 후 3초 후 다음
      setTextSelectResult("wrong");
      setRevealRanges(textSelectAnswerRanges);
      setStatusMap((prev) => ({ ...prev, [currentQuestion.id]: "wrong" }));
      advanceTimerRef.current = setTimeout(() => {
        confirmLockRef.current = false;
        handleNext();
      }, FEEDBACK.A_WRONG_ADVANCE_MS);
    }
  };

  // ── CHOICE_OX 핸들러 ──
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

    // 명제 O/X 기록
    setPropMarks((prev) => ({ ...prev, [currentProp.propId]: currentProp.oxAnswer }));
    const nextPropIdx = propIndex + 1;
    if (nextPropIdx < currentOxChoice.propositions.length) {
      setPropIndex(nextPropIdx);
      return;
    }

    // 선택지 완료
    const isCorrectChoice = currentOxChoice.finalIsCorrectChoice;
    setChoiceMarks((prev) => ({
      ...prev,
      [currentOxChoice.choiceId]: isCorrectChoice
        ? "정답"
        : isNegativeStem ? "O" : "X",
    }));
    const nextCompleted = new Set(completedChoices);
    nextCompleted.add(currentOxChoice.choiceId);
    setCompletedChoices(nextCompleted);

    // 모든 선택지 처리 완료?
    if (nextCompleted.size >= oxChoices.length) {
      setStatusMap((prev) => ({ ...prev, [currentQuestion.id]: "correct" }));
      scheduleAdvance(FEEDBACK.B_CORRECT_FINAL_MS, handleNext);
    } else if (isCorrectChoice) {
      // 정답 선택지를 찾았으면 완료
      setStatusMap((prev) => ({ ...prev, [currentQuestion.id]: "correct" }));
      scheduleAdvance(FEEDBACK.B_CORRECT_FINAL_MS, handleNext);
    } else {
      // 아직 정답 선택지 미발견 — 다음 선택지로
      setChoiceId(null);
      setPropIndex(0);
    }
  };

  // ── 렌더링 ──
  if (!currentQuestion) return null;

  const progressPercent = ((currentIndex + 1) / questions.length) * 100;
  const competencyLabel = currentQuestion.competency || "";

  // 문제 번호 표시 리스트 (좌측 진행 표시)
  const renderProgressBar = () => (
    <div className="dq-progress">
      <div className="dq-progress-bar">
        <div className="dq-progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>
      <div className="dq-progress-text">
        <span>{currentIndex + 1} / {questions.length}</span>
        {competencyLabel ? <span className="dq-competency-tag">{competencyLabel}</span> : null}
      </div>
    </div>
  );

  // 지문 표시 (MULTI_CHOICE, FILL_BLANKS 공통)
  const renderPassage = () => {
    const passage = currentQuestion.passage;
    if (!passage) return null;
    if (typeof passage === "string") {
      return (
        <div className="dq-passage">
          {currentQuestion.highlight
            ? renderHighlightedText(passage, currentQuestion.highlight)
            : <RichText>{passage}</RichText>}
        </div>
      );
    }
    return null;
  };

  // 문제 stem 표시
  const renderStem = () => (
    <div className="dq-stem">
      <RichText>{currentQuestion.stem || ""}</RichText>
    </div>
  );

  // ── MULTI_CHOICE 렌더 ──
  const renderMultiChoice = () => (
    <div className="dq-question-area">
      {renderPassage()}
      {renderStem()}
      <QuestionModal
        title={`문제 ${currentIndex + 1}`}
        prompt={currentQuestion.prompt || currentQuestion.stem}
        choices={currentQuestion.choices || []}
        onSelect={handleMultiChoice}
        mark={lastResult}
        shuffleKey={currentQuestion.id}
        correctChoiceId={currentQuestion.answerId}
        feedbackDuration={feedbackDuration}
      />
    </div>
  );

  // ── FILL_BLANKS 렌더 ──
  const renderFillBlanks = () => (
    <div className="dq-question-area">
      {renderPassage()}
      <div className="dq-stem">
        {renderTemplate(currentQuestion.template || "", blanks, filled, blankIndex)}
      </div>
      <QuestionModal
        title="빈칸 채우기"
        prompt={`${blankIndex + 1}번째 빈칸을 선택하세요.`}
        choices={blanks[blankIndex]?.choices || []}
        onSelect={handleBlankChoice}
        mark={lastResult}
        shuffleKey={`${currentQuestion.id}-${blankIndex}`}
        correctChoiceId={blanks[blankIndex]?.answerId}
        feedbackDuration={feedbackDuration}
      />
    </div>
  );

  // ── TEXT_SELECT 렌더 ──
  const renderTextSelect = () => {
    const paragraphs = textSelectPassage?.paragraphs || [];
    // 이미 확인된 범위
    const confirmedRanges = textSelectAnswerRanges.filter((r) =>
      confirmedKeySet.has(toRangeKey(r))
    );
    // 정답 공개 범위 (정오답 표시 시)
    const activeRanges = [...confirmedRanges, ...revealRanges];
    const allRangeKeys = textSelectAnswerRanges.map(toRangeKey);

    return (
      <div className="dq-question-area dq-text-select">
        <div className="dq-stem">
          <RichText>{currentQuestion.stem || ""}</RichText>
          {usesAllMatches ? (
            <span className="dq-select-progress">
              ({confirmedRangeKeys.length} / {textSelectAnswerRanges.length})
            </span>
          ) : null}
        </div>
        <div className="dq-text-select-passage">
          {paragraphs.map((paragraph) => {
            const pRanges = activeRanges.filter((r) => r.paragraphId === paragraph.id);
            const mask = buildHighlightMask(paragraph.text.length, pRanges);
            return (
              <p key={paragraph.id} className="confirm-paragraph">
                {Array.from(paragraph.text).map((char, idx) => {
                  const isSpace = char === " " || char === "\n";
                  return (
                    <span
                      key={`${paragraph.id}-${idx}`}
                      className={`confirm-char ${mask.has(idx) ? "worksheet-highlight" : ""}`}
                      onClick={isSpace ? undefined : () => handleTextSelectClick(paragraph.id, idx)}
                    >
                      {isSpace ? "\u00A0" : char}
                    </span>
                  );
                })}
              </p>
            );
          })}
        </div>
        {textSelectResult ? (
          <div className={`confirm-ox-mark ${textSelectResult}`} />
        ) : null}
        {currentQuestion.explanation && statusMap[currentQuestion.id] ? (
          <div className="dq-explanation">
            <RichText>{currentQuestion.explanation}</RichText>
          </div>
        ) : null}
      </div>
    );
  };

  // ── CHOICE_OX 렌더 ──
  const renderChoiceOx = () => {
    const passage = currentQuestion.passage;
    // 현재 명제의 evidenceTokens 하이라이트
    const highlightTokens = currentProp?.evidenceTokens || [];

    return (
      <div className="dq-question-area dq-choice-ox">
        <div className="dq-stem">
          <RichText>{currentQuestion.stem || ""}</RichText>
        </div>
        {currentProp ? (
          <div className="dq-prop-banner">
            명제: <RichText>{currentProp.text}</RichText>
            <span className="dq-prop-ox">({currentProp.oxAnswer})</span>
            {lastResult ? (
              <span className={`worksheet-feedback ${lastResult}`}>
                {lastResult === "correct" ? " 정답!" : " 오답"}
              </span>
            ) : null}
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
                {choiceMarks[choice.choiceId] ? (
                  <span className="choice-mark">{choiceMarks[choice.choiceId]}</span>
                ) : null}
              </button>
            ))}
          </div>
          <div className="dq-choice-ox-passage">
            <TokenPassage
              passage={passage}
              highlightTokens={highlightTokens}
              onTokenClick={handleOxTokenClick}
            />
            {currentOxChoice ? (
              <div className="choice-props">
                {currentOxChoice.propositions.map((prop) => (
                  <div key={prop.propId} className="choice-prop">
                    <span><RichText>{prop.text}</RichText></span>
                    {propMarks[prop.propId] ? (
                      <span className="choice-prop-mark">{propMarks[prop.propId]}</span>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  // 유형별 렌더 분기
  const renderQuestion = () => {
    switch (questionType) {
      case "FILL_BLANKS":
        return renderFillBlanks();
      case "TEXT_SELECT":
        return renderTextSelect();
      case "CHOICE_OX":
        return renderChoiceOx();
      case "MULTI_CHOICE":
      default:
        return renderMultiChoice();
    }
  };

  return (
    <div className="daily-quiz-module">
      {renderProgressBar()}
      {/* 문제 번호 탭 */}
      <div className="dq-tabs">
        {questions.map((q, idx) => {
          const qStatus = statusMap[q.id];
          return (
            <span
              key={q.id}
              className={`dq-tab ${idx === currentIndex ? "active" : ""} ${qStatus || ""}`}
            >
              {idx + 1}
            </span>
          );
        })}
      </div>
      {renderQuestion()}
    </div>
  );
}

export default DailyQuizModule;
