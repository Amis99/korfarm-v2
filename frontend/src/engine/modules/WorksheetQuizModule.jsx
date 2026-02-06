import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useEngine } from "../core/EngineContext";
import QuestionModal from "../shared/QuestionModal";

const getScoring = (question) => {
  const s = question.scoring;
  if (!s) return { correctDeltaSec: 0, wrongDeltaSec: 0 };
  return {
    correctDeltaSec: s.correctDeltaSec ?? s.correct ?? 0,
    wrongDeltaSec: s.wrongDeltaSec ?? s.wrong ?? 0,
  };
};

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
  if (!highlight) return text;
  if (highlight.range) {
    const before = text.slice(0, highlight.range.start);
    const target = text.slice(highlight.range.start, highlight.range.end);
    const after = text.slice(highlight.range.end);
    return (
      <>
        {before}
        <span className="worksheet-highlight">{target}</span>
        {after}
      </>
    );
  }
  if (highlight.text) {
    const parts = text.split(highlight.text);
    if (parts.length === 1) return text;
    return parts.reduce((acc, part, idx) => {
      acc.push(part);
      if (idx < parts.length - 1) {
        acc.push(
          <span key={`hl-${idx}`} className="worksheet-highlight">
            {highlight.text}
          </span>
        );
      }
      return acc;
    }, []);
  }
  return text;
};

const replaceWordInExample = (example, word) => {
  if (!example) return "";
  if (!word) return example;
  return example.split(word).join("____");
};

const renderPassageBox = (passage) => {
  if (!passage) return null;
  return <span className="worksheet-passage-box">{passage}</span>;
};

function WorksheetQuizModule({ content }) {
  const { status, start, adjustTime, recordAnswer, finish } = useEngine();
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
  const [statusMap, setStatusMap] = useState({});
  const [itemHeights, setItemHeights] = useState([]);
  const [anchorRect, setAnchorRect] = useState(null);
  const measureRef = useRef(null);
  const itemRefs = useRef({});
  const advanceTimerRef = useRef(null);
  const resultTimerRef = useRef(null);
  const feedbackDelay = 420;

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
              {passageNode}
              {contentText}
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

  const pages = useMemo(() => {
    if (!questions.length) return [];
    if (!usePageStack || itemHeights.length !== questions.length) {
      return [{ left: questions.map((_, idx) => idx), right: [] }];
    }
    const result = [];
    let left = [];
    let right = [];
    let leftHeight = 0;
    let rightHeight = 0;
    itemHeights.forEach((height, idx) => {
      const leftExtra = left.length > 0 ? itemGap : 0;
      if (leftHeight + height + leftExtra <= columnHeight || left.length === 0) {
        left.push(idx);
        leftHeight += height + leftExtra;
        return;
      }
      const rightExtra = right.length > 0 ? itemGap : 0;
      if (rightHeight + height + rightExtra <= columnHeight || right.length === 0) {
        right.push(idx);
        rightHeight += height + rightExtra;
        return;
      }
      result.push({ left, right });
      left = [idx];
      right = [];
      leftHeight = height;
      rightHeight = 0;
    });
    if (left.length || right.length) {
      result.push({ left, right });
    }
    return result;
  }, [itemHeights, questions.length, columnHeight, itemGap]);

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
  };

  const queueResultReset = () => {
    if (resultTimerRef.current) {
      clearTimeout(resultTimerRef.current);
    }
    resultTimerRef.current = setTimeout(() => {
      setLastResult(null);
    }, feedbackDelay);
  };

  const queueNext = (nextAction) => {
    if (advanceTimerRef.current) {
      clearTimeout(advanceTimerRef.current);
    }
    advanceTimerRef.current = setTimeout(() => {
      nextAction();
    }, feedbackDelay);
  };

  const handleChoice = (choiceId) => {
    if (!normalizedQuestion) return;
    const scoring = getScoring(normalizedQuestion);
    const isCorrect = choiceId === normalizedQuestion.answerId;
    adjustTime(isCorrect ? scoring.correctDeltaSec : scoring.wrongDeltaSec);
    recordAnswer({ id: normalizedQuestion.id, correct: isCorrect });
    setLastResult(isCorrect ? "correct" : "wrong");
    queueResultReset();
    setStatusMap((prev) => ({
      ...prev,
      [normalizedQuestion.id]: isCorrect ? "correct" : "wrong",
    }));
    if (!isCorrect && normalizedQuestion.requireCorrect) {
      return;
    }
    queueNext(handleNext);
  };

  const handleBlankChoice = (choiceId) => {
    if (!normalizedQuestion) return;
    const blank = blanks[blankIndex];
    const scoring = getScoring(normalizedQuestion);
    const isCorrect = choiceId === blank.answerId;
    const correctChoice = blank.choices?.find((choice) => choice.id === blank.answerId);
    const correctText = correctChoice?.text || "";
    adjustTime(isCorrect ? scoring.correctDeltaSec : scoring.wrongDeltaSec);
    recordAnswer({ id: `${normalizedQuestion.id}-${blank.id}`, correct: isCorrect });
    setBlankAnswers((prev) => ({ ...prev, [blank.id]: correctText }));
    setBlankResultMap((prev) => ({
      ...prev,
      [blank.id]: isCorrect,
    }));
    setLastResult(isCorrect ? "correct" : "wrong");
    queueResultReset();
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
      queueNext(handleNext);
    } else {
      queueNext(() => setBlankIndex((prev) => prev + 1));
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
    const highlightNode =
      node.querySelector(".worksheet-highlight") || node.querySelector(".worksheet-blank.active");
    const rect = (highlightNode || node).getBoundingClientRect();
    setAnchorRect({
      left: rect.left - containerRect.left,
      right: rect.right - containerRect.left,
      top: rect.top - containerRect.top,
      height: rect.height,
    });
  }, [currentIndex, pages.length]);

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
                            const passageNode = !isDictionary ? renderPassageBox(question.passage) : null;
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
                              content = isActive
                                ? renderHighlightedText(
                                    question.stem || question.prompt || "",
                                    question.highlight
                                  )
                                : question.stem || question.prompt || "";
                            }

                            return (
                              <li
                                key={question.id}
                                ref={(el) => {
                                  if (el) itemRefs.current[idx] = el;
                                }}
                                className={`worksheet-item ${isActive ? "active" : ""} ${
                                  status ? `done ${status}` : ""
                                } ${isDictionary ? "dict" : ""}`}
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
                                  {passageNode}
                                  {content}
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
                            const passageNode = !isDictionary ? renderPassageBox(question.passage) : null;
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
                              content = isActive
                                ? renderHighlightedText(
                                    question.stem || question.prompt || "",
                                    question.highlight
                                  )
                                : question.stem || question.prompt || "";
                            }

                            return (
                              <li
                                key={question.id}
                                ref={(el) => {
                                  if (el) itemRefs.current[idx] = el;
                                }}
                                className={`worksheet-item ${isActive ? "active" : ""} ${
                                  status ? `done ${status}` : ""
                                } ${isDictionary ? "dict" : ""}`}
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
                                  {passageNode}
                                  {content}
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
          {normalizedQuestion && normalizedQuestion.type !== "FILL_BLANKS" ? (
            <QuestionModal
              title="문제"
              prompt={normalizedQuestion.prompt || normalizedQuestion.stem}
              choices={normalizedQuestion.choices || []}
              onSelect={handleChoice}
              anchorRect={anchorRect}
              mark={lastResult}
              shuffleKey={normalizedQuestion.id}
            />
          ) : null}

          {isFillBlanks ? (
            <QuestionModal
              title="빈칸 채우기"
              prompt={`${blankIndex + 1}번째 빈칸을 선택하세요.`}
              choices={blanks[blankIndex]?.choices || []}
              onSelect={handleBlankChoice}
              anchorRect={anchorRect}
              mark={lastResult}
              shuffleKey={`${normalizedQuestion?.id || "blank"}-${blankIndex}`}
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
