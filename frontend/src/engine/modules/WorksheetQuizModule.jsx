import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useEngine } from "../core/EngineContext";
import QuestionModal from "../shared/QuestionModal";
import { FEEDBACK } from "../shared/feedbackTimings";
import RichText from "../../utils/RichText";

// 타이머 규칙 (전체 통일: 정답 +20초, 오답 -40초)
const DEFAULT_SCORING = { correctDeltaSec: 20, wrongDeltaSec: -40 };

const getScoring = (question) => {
  const s = question.scoring;
  if (!s) return DEFAULT_SCORING;
  return {
    correctDeltaSec: s.correctDeltaSec ?? s.correct ?? DEFAULT_SCORING.correctDeltaSec,
    wrongDeltaSec: s.wrongDeltaSec ?? s.wrong ?? DEFAULT_SCORING.wrongDeltaSec,
  };
};

// contentType별 기본 requireCorrect (JSON에 없을 때 적용)
const DEFAULT_REQUIRE_CORRECT = {};

const renderTemplate = (template, blanks, filled, activeIndex) => {
  const parts = template.split("____");
  return parts.map((part, idx) => (
    <span key={`part-${idx}`}>
      {part}
      {idx < blanks.length ? (
        <span
          className={`worksheet-blank ${idx === activeIndex ? "active" : ""}`}
        >
          {filled[idx] || "____"}
        </span>
      ) : null}
    </span>
  ));
};

const renderTemplatePlain = (template, blanks) => {
  const parts = template.split("____");
  return parts.map((part, idx) => (
    <span key={`plain-${idx}`}>
      {part}
      {idx < blanks.length ? <span className="worksheet-blank">____</span> : null}
    </span>
  ));
};

const renderHighlightedText = (text, highlight) => {
  if (!highlight) return <RichText>{text}</RichText>;
  if (Array.isArray(highlight.ranges) && highlight.ranges.length > 0) {
    const sorted = [...highlight.ranges].sort((a, b) => (a.start ?? 0) - (b.start ?? 0));
    const parts = [];
    let cursor = 0;
    sorted.forEach((range, idx) => {
      const start = Math.max(cursor, Math.max(0, Math.min(text.length, range.start ?? 0)));
      const end = Math.max(start, Math.min(text.length, range.end ?? 0));
      if (start > cursor) {
        parts.push(<RichText key={`r-before-${idx}`}>{text.slice(cursor, start)}</RichText>);
      }
      if (end > start) {
        parts.push(
          <span key={`r-hl-${idx}`} className="worksheet-highlight">
            <RichText>{text.slice(start, end)}</RichText>
          </span>
        );
      }
      cursor = end;
    });
    if (cursor < text.length) {
      parts.push(<RichText key="r-after">{text.slice(cursor)}</RichText>);
    }
    return parts;
  }
  if (highlight.range) {
    const before = text.slice(0, highlight.range.start);
    const target = text.slice(highlight.range.start, highlight.range.end);
    const after = text.slice(highlight.range.end);
    return (
      <>
        <RichText>{before}</RichText>
        <span className="worksheet-highlight"><RichText>{target}</RichText></span>
        <RichText>{after}</RichText>
      </>
    );
  }
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

const replaceWordInExample = (example, word) => {
  if (!example) return "";
  if (!word) return example;
  return example.split(word).join("____");
};

const renderPassageBox = (passage, highlight) => {
  if (!passage) return null;
  return (
    <span className="worksheet-passage-box">
      {highlight ? renderHighlightedText(passage, highlight) : <RichText>{passage}</RichText>}
    </span>
  );
};

/** 문제의 정답 텍스트 추출 — MCQ/FILL_BLANKS/SENTENCE_BUILDING 지원 */
const getCorrectAnswerText = (question) => {
  if (!question) return "";
  // FILL_BLANKS / SENTENCE_BUILDING — 빈칸별 정답 모음
  if (question.type === "FILL_BLANKS" || question.type === "SENTENCE_BUILDING") {
    const blanks = question.blanks || [];
    if (question.type === "SENTENCE_BUILDING") {
      // sentenceParts를 그대로 이어 출력
      return (question.sentenceParts || []).join(" ");
    }
    return blanks
      .map((b) => {
        const c = b.choices?.find((ch) => ch.id === b.answerId);
        return c?.text || "";
      })
      .filter(Boolean)
      .join(" / ");
  }
  // MCQ
  const correct = question.choices?.find((c) => c.id === question.answerId);
  return correct?.text || "";
};

function WorksheetQuizModule({ content }) {
  const { status, start, adjustTime, recordAnswer, finish } = useEngine();
  const contentType = content?.contentType;
  const payload = content?.payload || {};
  const questions = payload.questions || [];
  const wordMap = useMemo(() => {
    if (!payload.words) return {};
    return payload.words.reduce((acc, word) => {
      acc[word.wordId] = word;
      return acc;
    }, {});
  }, [payload.words]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showPdf, setShowPdf] = useState(false);
  const [blankIndex, setBlankIndex] = useState(0);
  const [blankAnswers, setBlankAnswers] = useState({});
  const [blankResultMap, setBlankResultMap] = useState({});
  const [lastResult, setLastResult] = useState(null);
  // 피드백 표시 시간 (정답=짧게, 오답=3초)
  const [feedbackDuration, setFeedbackDuration] = useState(FEEDBACK.A_CORRECT_ADVANCE_MS);
  // B 패턴(requireCorrect)에서 사라질 선택지 ID 추적 — 문제 ID 별로 관리
  const [disabledMap, setDisabledMap] = useState({});
  const [statusMap, setStatusMap] = useState({});
  const [itemHeights, setItemHeights] = useState([]);
  const [anchorRect, setAnchorRect] = useState(null);
  const [modalKey, setModalKey] = useState(null);
  const measureRef = useRef(null);
  const itemRefs = useRef({});
  const advanceTimerRef = useRef(null);
  const resultTimerRef = useRef(null);

  const columnHeight = 1123 - 48;
  const itemGap = 14;
  const usePageStack = payload.pageStack;
  const isDictionary = Array.isArray(payload.words) && payload.words.length > 0;

  const currentQuestion = questions[currentIndex];

  const normalizedQuestion = useMemo(() => {
    if (currentQuestion?.type !== "SENTENCE_BUILDING") return currentQuestion;
    const parts = currentQuestion.sentenceParts || [];
    const template = parts.map(() => "____").join(" ");
    const blanks = parts.map((part, idx) => ({
      id: `sb-${currentQuestion.id}-${idx}`,
      answerId: `answer-${idx}`,
      choices: [
        { id: `answer-${idx}`, text: part.answer },
        ...part.distractors.map((text, dIdx) => ({
          id: `distractor-${idx}-${dIdx}`, text
        }))
      ]
    }));
    return { ...currentQuestion, type: "FILL_BLANKS", template, blanks };
  }, [currentQuestion]);

  const isFillBlanks = normalizedQuestion?.type === "FILL_BLANKS";
  const blanks = normalizedQuestion?.blanks || [];
  const filled = blanks.map((blank) => blankAnswers[blank.id]);
  const isManuscript =
    normalizedQuestion?.render === "MANUSCRIPT" || content?.contentType === "WRITING_DESCRIPTIVE";
  const activeModalKey = normalizedQuestion ? `${normalizedQuestion.id}-${blankIndex}` : null;
  const modalOpen = modalKey === activeModalKey;
  const activeQuestionHasHighlight = Boolean(normalizedQuestion?.highlight || isFillBlanks);
  const modalInstruction = activeQuestionHasHighlight
    ? "하이라이트된 부분을 다 읽고 난 후 클릭하여 질문에 답하세요."
    : "문제를 읽고 클릭하면 답안을 입력할 수 있습니다.";

  const renderDictionaryCard = (question, options = {}) => {
    const {
      isActive = false,
      blankList = [],
      filledValues = [],
      activeBlankIndex = -1,
      forMeasure = false,
    } = options;
    const linkedWord = wordMap[question.linkWordId] || {};
    const headword = linkedWord.headword || "";
    const pos = linkedWord.pos || "";
    const sense = question.definitionText || linkedWord.sense || "";
    const exampleBase =
      question.exampleTemplate ||
      question.exampleText ||
      linkedWord.exampleSentences?.[0] ||
      "";
    const headwordBlank =
      question.headwordBlank ??
      (question.questionKind === "DICT_MEANING_TO_WORD" ||
        question.questionKind === "HOMONYM_EXAMPLE");
    const headwordNode = headwordBlank ? (
      <span className={`worksheet-blank ${isActive && !forMeasure ? "active" : ""}`}>____</span>
    ) : (
      headword
    );
    const exampleText = headwordBlank ? replaceWordInExample(exampleBase, headword) : exampleBase;

    let definitionNode = null;
    if (question.questionKind === "WORD_TO_DICT_FILL") {
      definitionNode = forMeasure
        ? renderTemplatePlain(question.template || "", blankList)
        : isActive
          ? renderTemplate(question.template || "", blankList, filledValues, activeBlankIndex)
          : renderTemplatePlain(question.template || "", blankList);
    } else if (question.questionKind !== "HOMONYM_EXAMPLE") {
      definitionNode = sense;
    }

    return (
      <div className="worksheet-dict-card">
        <div className="dict-headword">
          <strong>{headwordNode}</strong>
          {pos ? <span className="dict-pos">[{pos}]</span> : null}
        </div>
        {definitionNode ? <div className="dict-sense">{definitionNode}</div> : null}
        {exampleText ? <div className="dict-example">{exampleText}</div> : null}
      </div>
    );
  };

  const measureItems = useMemo(
    () =>
      questions.map((question, idx) => {
        const isBlank = question.type === "FILL_BLANKS" || question.type === "SENTENCE_BUILDING";
        const blankList = question.type === "SENTENCE_BUILDING"
          ? (question.sentenceParts || []).map((_, i) => ({ id: `sb-measure-${i}` }))
          : (question.blanks || []);
        const template = question.type === "SENTENCE_BUILDING"
          ? (question.sentenceParts || []).map(() => "____").join(" ")
          : (question.template || "");
        let contentText = question.stem || question.prompt || "";
        const passageNode = !isDictionary ? renderPassageBox(question.passage) : null;
        if (isDictionary) {
          contentText = renderDictionaryCard(question, {
            isActive: false,
            blankList,
            filledValues: [],
            activeBlankIndex: -1,
            forMeasure: true,
          });
        } else if (isBlank) {
          contentText = renderTemplatePlain(template, blankList);
        }
        return (
          <li key={`measure-${question.id}`} className="worksheet-item">
            <span className="worksheet-item-number">{idx + 1}.</span>
            <span className="worksheet-item-text">
              {contentText}
              {passageNode}
            </span>
          </li>
        );
      }),
    [questions, isDictionary, wordMap]
  );

  useLayoutEffect(() => {
    if (!measureRef.current) return;
    const nodes = Array.from(measureRef.current.querySelectorAll(".worksheet-item"));
    if (!nodes.length) return;
    setItemHeights(nodes.map((node) => node.getBoundingClientRect().height));
  }, [measureItems]);

  /* 누적형 단일 칼럼: currentIndex 까지만 렌더 (이전 푼 문제 + 현재 문제) */
  const visibleIndexes = useMemo(() => {
    const out = [];
    for (let i = 0; i <= currentIndex && i < questions.length; i++) {
      out.push(i);
    }
    return out;
  }, [currentIndex, questions.length]);
  // pages 변수는 이전 코드 호환을 위해 단일 페이지 형태로 유지
  const pages = useMemo(
    () => [{ left: visibleIndexes, right: [] }],
    [visibleIndexes]
  );

  const handleNext = () => {
    if (currentIndex >= questions.length - 1) {
      finish(true);
      return;
    }
    setCurrentIndex((prev) => prev + 1);
    setBlankIndex(0);
    setBlankAnswers({});
    setBlankResultMap({});
    setLastResult(null);
    setModalKey(null);
  };

  // 다음 진행 예약. delay 만큼 기다린 후 nextAction 실행 + lastResult 초기화
  const scheduleAdvance = (delay, nextAction) => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    advanceTimerRef.current = setTimeout(() => {
      setLastResult(null);
      nextAction();
    }, delay);
  };

  // B 패턴(재시도)에서 짧은 피드백만 보여주고 lastResult 해제
  const scheduleRetryReset = () => {
    if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    resultTimerRef.current = setTimeout(() => {
      setLastResult(null);
    }, FEEDBACK.B_WRONG_RETRY_MS);
  };

  const handleChoice = (choiceId) => {
    if (!normalizedQuestion) return;
    const scoring = getScoring(normalizedQuestion);
    const isCorrect = choiceId === normalizedQuestion.answerId;
    adjustTime(isCorrect ? scoring.correctDeltaSec : scoring.wrongDeltaSec);
    recordAnswer({ id: normalizedQuestion.id, correct: isCorrect, questionKind: normalizedQuestion.questionKind });
    setLastResult(isCorrect ? "correct" : "wrong");
    setStatusMap((prev) => ({
      ...prev,
      [normalizedQuestion.id]: isCorrect ? "correct" : "wrong",
    }));
    const requireCorrect = normalizedQuestion.requireCorrect ?? DEFAULT_REQUIRE_CORRECT[contentType] ?? false;

    if (requireCorrect) {
      // B 패턴
      if (!isCorrect) {
        // 오답 → 고른 선택지를 disabled로 추가, 같은 문제 재시도
        setFeedbackDuration(FEEDBACK.B_WRONG_RETRY_MS);
        setDisabledMap((prev) => ({
          ...prev,
          [normalizedQuestion.id]: [...(prev[normalizedQuestion.id] || []), choiceId],
        }));
        scheduleRetryReset();
        return;
      }
      // 정답: 첫 시도면 즉시(0ms), 재시도 후라면 3초 유지
      const hadWrongAttempts = (disabledMap[normalizedQuestion.id]?.length || 0) > 0;
      const finalDelay = hadWrongAttempts
        ? FEEDBACK.B_CORRECT_RETRY_MS
        : FEEDBACK.B_CORRECT_FIRST_MS;
      setFeedbackDuration(finalDelay);
      scheduleAdvance(finalDelay, () => {
        setDisabledMap((prev) => {
          const next = { ...prev };
          delete next[normalizedQuestion.id];
          return next;
        });
        handleNext();
      });
      return;
    }

    // A 패턴: 정답 즉시 / 오답 3초
    const delay = isCorrect ? FEEDBACK.A_CORRECT_ADVANCE_MS : FEEDBACK.A_WRONG_ADVANCE_MS;
    setFeedbackDuration(delay);
    scheduleAdvance(delay, handleNext);
  };

  const handleBlankChoice = (choiceId) => {
    if (!normalizedQuestion) return;
    const blank = blanks[blankIndex];
    const scoring = getScoring(normalizedQuestion);
    const isCorrect = choiceId === blank.answerId;
    const correctChoice = blank.choices?.find((choice) => choice.id === blank.answerId);
    const correctText = correctChoice?.text || "";
    adjustTime(isCorrect ? scoring.correctDeltaSec : scoring.wrongDeltaSec);
    recordAnswer({ id: `${normalizedQuestion.id}-${blank.id}`, correct: isCorrect, questionKind: normalizedQuestion.questionKind });
    setBlankAnswers((prev) => ({ ...prev, [blank.id]: correctText }));
    setBlankResultMap((prev) => ({
      ...prev,
      [blank.id]: isCorrect,
    }));
    setLastResult(isCorrect ? "correct" : "wrong");

    // FILL_BLANKS는 A 패턴: 정답이든 오답이든 다음 빈칸/문제로 진행
    const delay = isCorrect ? FEEDBACK.A_CORRECT_ADVANCE_MS : FEEDBACK.A_WRONG_ADVANCE_MS;
    setFeedbackDuration(delay);

    if (blankIndex >= blanks.length - 1) {
      const resultMap = {
        ...blankResultMap,
        [blank.id]: isCorrect,
      };
      const allCorrect = blanks.every((item) => resultMap[item.id]);
      setStatusMap((prev) => ({
        ...prev,
        [normalizedQuestion.id]: allCorrect ? "correct" : "wrong",
      }));
      scheduleAdvance(delay, handleNext);
    } else {
      scheduleAdvance(delay, () => setBlankIndex((prev) => prev + 1));
    }
  };

  const hasStartGate = payload.requireStart && status === "READY";

  useEffect(() => {
    if (!payload.requireStart && status === "READY") {
      start();
    }
  }, [payload.requireStart, status, start]);

  useLayoutEffect(() => {
    const node = itemRefs.current[currentIndex];
    if (!node) return;
    const container = node.closest(".engine-body");
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const scale = containerRect.width / container.offsetWidth || 1;
    const rect = node.getBoundingClientRect();
    setAnchorRect({
      left: (rect.left - containerRect.left) / scale,
      right: (rect.right - containerRect.left) / scale,
      top: (rect.top - containerRect.top) / scale,
      height: rect.height / scale,
    });
  }, [currentIndex, pages.length]);

  const openActiveModal = () => {
    if (!normalizedQuestion) return;
    if (normalizedQuestion.type === "FILL_BLANKS" && !blanks[blankIndex]) return;
    if (normalizedQuestion.type !== "FILL_BLANKS" && !(normalizedQuestion.choices || []).length) return;
    setModalKey(activeModalKey);
  };

  const handleActiveItemClick = (event, idx) => {
    if (idx !== currentIndex || !normalizedQuestion) return;
    const target = event.target;
    const highlightSelector = ".worksheet-highlight, .worksheet-blank.active";
    const hasHighlight = Boolean(event.currentTarget.querySelector(highlightSelector));
    if (hasHighlight) {
      if (target.closest?.(highlightSelector)) openActiveModal();
      return;
    }
    if (target.closest?.(".worksheet-item-text")) {
      openActiveModal();
    }
  };

  const handleActiveItemKeyDown = (event, idx) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    if (idx !== currentIndex || !normalizedQuestion) return;
    event.preventDefault();
    openActiveModal();
  };

  useEffect(
    () => () => {
      if (advanceTimerRef.current) {
        clearTimeout(advanceTimerRef.current);
      }
      if (resultTimerRef.current) {
        clearTimeout(resultTimerRef.current);
      }
    },
    []
  );

  return (
    <div className="worksheet-module">
      {hasStartGate ? (
        <div className="worksheet-start">
          <div className="worksheet-preview">
            {payload.pdfUrl ? (
              <object className="pdf-viewer" data={payload.pdfUrl} type="application/pdf" />
            ) : (
              <div className="worksheet-empty">학습 자료 미리보기</div>
            )}
          </div>
          <button type="button" className="worksheet-start-btn" onClick={start}>
            학습 시작
          </button>
        </div>
      ) : (
        <>
          <div className="learning-modal-instruction">{modalInstruction}</div>
          <div className="worksheet-sheet">
            <div className="worksheet-stem">
              <div className="worksheet-pages">
                {pages.map((page, pageIndex) => (
                  <div
                    className={usePageStack ? "worksheet-page" : "worksheet-page single"}
                    key={`page-${pageIndex}`}
                  >
                    <div className="worksheet-page-inner">
                      <div className="worksheet-page-number">
                        {pageIndex + 1} / {pages.length}
                      </div>
                      <div className="worksheet-columns">
                        <ol className="worksheet-list">
                          {page.left.map((idx) => {
                            const question = questions[idx];
                            const isActive = idx === currentIndex;
                            const status = statusMap[question.id];
                            const isBlank = question.type === "FILL_BLANKS" || question.type === "SENTENCE_BUILDING";
                            const blankList = isActive && isBlank ? blanks : (question.type === "SENTENCE_BUILDING"
                              ? (question.sentenceParts || []).map((_, i) => ({ id: `sb-${question.id}-${i}` }))
                              : (question.blanks || []));
                            const template = question.type === "SENTENCE_BUILDING"
                              ? (question.sentenceParts || []).map(() => "____").join(" ")
                              : (question.template || "");
                            const filledValues = isActive
                              ? blankList.map((blank) => blankAnswers[blank.id])
                              : [];
                            const activeBlankIndex = isActive ? blankIndex : -1;
                            const passageNode = !isDictionary ? renderPassageBox(question.passage, isActive ? question.highlight : null) : null;
                            let content = null;
                            if (isDictionary) {
                              content = renderDictionaryCard(question, {
                                isActive,
                                blankList,
                                filledValues,
                                activeBlankIndex,
                              });
                            } else if (isBlank) {
                              content = isActive
                                ? renderTemplate(
                                    template,
                                    blankList,
                                    filledValues,
                                    activeBlankIndex
                                  )
                                : renderTemplatePlain(template, blankList);
                            } else {
                              content = <RichText>{question.stem || question.prompt || ""}</RichText>;
                            }

                            const answerText = status ? getCorrectAnswerText(question) : "";
                            return (
                              <li
                                key={question.id}
                                ref={(el) => {
                                  if (el) itemRefs.current[idx] = el;
                                }}
                                className={`worksheet-item ${isActive ? "active" : ""} ${
                                  status ? `done ${status}` : ""
                                } ${isDictionary ? "dict" : ""} ${question.passage ? "has-passage" : ""} ${
                                  isActive ? "modal-trigger-ready" : ""
                                }`}
                                onClick={(event) => handleActiveItemClick(event, idx)}
                                onKeyDown={(event) => handleActiveItemKeyDown(event, idx)}
                                tabIndex={isActive ? 0 : undefined}
                              >
                                <span className="worksheet-item-number">
                                  {idx + 1}.
                                  {status ? (
                                    <span className={`worksheet-number-mark ${status}`}>
                                      {status === "correct" ? "○" : "／"}
                                    </span>
                                  ) : null}
                                </span>
                                <span className="worksheet-item-text">
                                  {content}
                                  {passageNode}
                                  {answerText ? (
                                    <span className="worksheet-item-answer">정답: {answerText}</span>
                                  ) : null}
                                </span>
                              </li>
                            );
                          })}
                        </ol>
                        <ol className="worksheet-list">
                          {page.right.map((idx) => {
                            const question = questions[idx];
                            const isActive = idx === currentIndex;
                            const status = statusMap[question.id];
                            const isBlank = question.type === "FILL_BLANKS" || question.type === "SENTENCE_BUILDING";
                            const blankList = isActive && isBlank ? blanks : (question.type === "SENTENCE_BUILDING"
                              ? (question.sentenceParts || []).map((_, i) => ({ id: `sb-${question.id}-${i}` }))
                              : (question.blanks || []));
                            const template = question.type === "SENTENCE_BUILDING"
                              ? (question.sentenceParts || []).map(() => "____").join(" ")
                              : (question.template || "");
                            const filledValues = isActive
                              ? blankList.map((blank) => blankAnswers[blank.id])
                              : [];
                            const activeBlankIndex = isActive ? blankIndex : -1;
                            const passageNode = !isDictionary ? renderPassageBox(question.passage, isActive ? question.highlight : null) : null;
                            let content = null;
                            if (isDictionary) {
                              content = renderDictionaryCard(question, {
                                isActive,
                                blankList,
                                filledValues,
                                activeBlankIndex,
                              });
                            } else if (isBlank) {
                              content = isActive
                                ? renderTemplate(
                                    template,
                                    blankList,
                                    filledValues,
                                    activeBlankIndex
                                  )
                                : renderTemplatePlain(template, blankList);
                            } else {
                              content = <RichText>{question.stem || question.prompt || ""}</RichText>;
                            }

                            const answerText = status ? getCorrectAnswerText(question) : "";
                            return (
                              <li
                                key={question.id}
                                ref={(el) => {
                                  if (el) itemRefs.current[idx] = el;
                                }}
                                className={`worksheet-item ${isActive ? "active" : ""} ${
                                  status ? `done ${status}` : ""
                                } ${isDictionary ? "dict" : ""} ${question.passage ? "has-passage" : ""} ${
                                  isActive ? "modal-trigger-ready" : ""
                                }`}
                                onClick={(event) => handleActiveItemClick(event, idx)}
                                onKeyDown={(event) => handleActiveItemKeyDown(event, idx)}
                                tabIndex={isActive ? 0 : undefined}
                              >
                                <span className="worksheet-item-number">
                                  {idx + 1}.
                                  {status ? (
                                    <span className={`worksheet-number-mark ${status}`}>
                                      {status === "correct" ? "○" : "／"}
                                    </span>
                                  ) : null}
                                </span>
                                <span className="worksheet-item-text">
                                  {content}
                                  {passageNode}
                                  {answerText ? (
                                    <span className="worksheet-item-answer">정답: {answerText}</span>
                                  ) : null}
                                </span>
                              </li>
                            );
                          })}
                        </ol>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {isManuscript ? (
                <div className="manuscript-grid">
                  {blanks.map((blank) => (
                    <span key={blank.id} className="manuscript-cell">
                      {blankAnswers[blank.id] ? "●" : ""}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="worksheet-controls">
              {payload.pdfUrl ? (
                <button
                  type="button"
                  className="worksheet-pdf-btn"
                  onClick={() => setShowPdf(true)}
                >
                  PDF 보기
                </button>
              ) : null}
              <span>{currentIndex + 1} / {questions.length}</span>
            </div>
          </div>
          {modalOpen && normalizedQuestion && normalizedQuestion.type !== "FILL_BLANKS" ? (
            <QuestionModal
              title="문제"
              prompt={normalizedQuestion.prompt || normalizedQuestion.stem}
              choices={normalizedQuestion.choices || []}
              onSelect={handleChoice}
              onClose={() => setModalKey(null)}
              anchorRect={anchorRect}
              mark={lastResult}
              shuffleKey={normalizedQuestion.id}
              correctChoiceId={normalizedQuestion.answerId}
              disabledChoiceIds={disabledMap[normalizedQuestion.id] || null}
              feedbackDuration={feedbackDuration}
            />
          ) : null}

          {modalOpen && isFillBlanks ? (
            <QuestionModal
              title="빈칸 채우기"
              prompt={`${blankIndex + 1}번째 빈칸을 선택하세요.`}
              choices={blanks[blankIndex]?.choices || []}
              onSelect={handleBlankChoice}
              onClose={() => setModalKey(null)}
              anchorRect={anchorRect}
              mark={lastResult}
              shuffleKey={`${normalizedQuestion?.id || "blank"}-${blankIndex}`}
              correctChoiceId={blanks[blankIndex]?.answerId}
              feedbackDuration={feedbackDuration}
            />
          ) : null}
        </>
      )}

      {showPdf ? (
        <div className="worksheet-pdf-overlay">
          <div className="worksheet-pdf-card">
            <object className="pdf-viewer" data={payload.pdfUrl} type="application/pdf" />
            <button type="button" onClick={() => setShowPdf(false)}>
              보기 종료
            </button>
          </div>
        </div>
      ) : null}

      <div className="worksheet-measure" ref={measureRef} aria-hidden="true">
        <ol className="worksheet-list">{measureItems}</ol>
      </div>
    </div>
  );
}

export default WorksheetQuizModule;
