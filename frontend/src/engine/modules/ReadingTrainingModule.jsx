import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useEngine } from "../core/EngineContext";
import QuestionModal from "../shared/QuestionModal";

const DEFAULT_INTENSIVE_SCORING = {
  correctDeltaSec: 20,
  wrongDeltaSec: -20,
  eliminateWrongChoice: true,
};

const DEFAULT_CONFIRM_SCORING = {
  correctDeltaSec: 30,
  wrongDeltaSec: -30,
};

const normalizeMatchMode = (mode) => (mode || "ANY").toUpperCase();

const toRangeKey = (range) => `${range.paragraphId}:${range.start}-${range.end}`;

const dedupeRanges = (ranges) => {
  const map = new Map();
  ranges.forEach((range) => {
    if (!range) return;
    map.set(toRangeKey(range), range);
  });
  return Array.from(map.values());
};

const getParagraphById = (passage, paragraphId) =>
  passage?.paragraphs?.find((item) => item.id === paragraphId);

const normalizeHighlightRanges = (highlight, passage) => {
  if (!highlight) return [];
  if (Array.isArray(highlight.ranges)) {
    return highlight.ranges
      .filter((range) => range && range.paragraphId)
      .map((range) => ({
        paragraphId: range.paragraphId,
        start: Math.max(0, range.start ?? 0),
        end: Math.max(0, range.end ?? 0),
      }));
  }
  if (Array.isArray(highlight.paragraphIds)) {
    return highlight.paragraphIds
      .map((paragraphId) => {
        const paragraph = getParagraphById(passage, paragraphId);
        if (!paragraph) return null;
        return { paragraphId, start: 0, end: paragraph.text.length };
      })
      .filter(Boolean);
  }
  if (highlight.paragraphId && highlight.range) {
    return [
      {
        paragraphId: highlight.paragraphId,
        start: Math.max(0, highlight.range.start ?? 0),
        end: Math.max(0, highlight.range.end ?? 0),
      },
    ];
  }
  if (highlight.paragraphId && highlight.mode === "PARAGRAPH") {
    const paragraph = getParagraphById(passage, highlight.paragraphId);
    if (!paragraph) return [];
    return [{ paragraphId: highlight.paragraphId, start: 0, end: paragraph.text.length }];
  }
  return [];
};

const renderHighlightedParagraph = (text, ranges) => {
  if (!ranges.length) return text;
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const parts = [];
  let cursor = 0;
  sorted.forEach((range, idx) => {
    const start = Math.max(0, Math.min(text.length, range.start));
    const end = Math.max(start, Math.min(text.length, range.end));
    if (start > cursor) {
      parts.push(text.slice(cursor, start));
    }
    if (end > start) {
      parts.push(
        <span key={`hl-${idx}-${start}`} className="worksheet-highlight">
          {text.slice(start, end)}
        </span>
      );
    }
    cursor = end;
  });
  if (cursor < text.length) {
    parts.push(text.slice(cursor));
  }
  return <>{parts}</>;
};

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

const shuffleList = (items) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

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


const isIndexInRanges = (ranges, paragraphId, index) =>
  ranges.some(
    (range) =>
      range.paragraphId === paragraphId && index >= range.start && index < range.end
  );

function ReadingTrainingModule({ content }) {
  const { adjustTime, finish, recordAnswer, seed, setSeed, start, status } = useEngine();
  const assetBase = import.meta.env.BASE_URL || "/";
  const resolveAssetUrl = (path) => {
    if (!path) return "";
    if (/^(https?:|data:|blob:)/.test(path)) return path;
    const normalized = path.startsWith("/") ? path.slice(1) : path;
    return encodeURI(`${assetBase}${normalized}`);
  };
  const payload = content?.payload || {};
  const passage = payload.passage || {};
  const intensive = payload.intensive || {};
  const recall = payload.recall || {};
  const confirm = payload.confirm || {};

  const [stage, setStage] = useState("INTENSIVE");
  const [stepIndex, setStepIndex] = useState(0);
  const [removedChoices, setRemovedChoices] = useState({});
  const [intensiveResult, setIntensiveResult] = useState(null);
  const [modalMark, setModalMark] = useState(null);

  const [topSlots, setTopSlots] = useState([]);
  const [poolOrder, setPoolOrder] = useState([]);
  const [dragging, setDragging] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [pointerDrag, setPointerDrag] = useState(null);
  const [recallResult, setRecallResult] = useState(null);
  const [recallCorrectSlots, setRecallCorrectSlots] = useState([]);

  const [confirmIndex, setConfirmIndex] = useState(0);
  const [confirmResult, setConfirmResult] = useState(null);
  const [revealRanges, setRevealRanges] = useState([]);
  const [awaitingRevealClick, setAwaitingRevealClick] = useState(false);
  const [confirmedRangeKeys, setConfirmedRangeKeys] = useState([]);

  const intensiveAdvanceRef = useRef(null);
  const modalMarkRef = useRef(null);
  const cardRefs = useRef({});
  const positionsRef = useRef({});
  const recallAdvanceRef = useRef(null);
  const confirmAdvanceRef = useRef(null);
  const confirmLockRef = useRef(false);
  const recallTopRef = useRef(null);
  const recallPoolRef = useRef(null);
  const slotRefs = useRef([]);

  const steps = intensive.timeline || payload.timeline || [];
  const step = steps[stepIndex];
  const stepHighlightRanges = useMemo(
    () => normalizeHighlightRanges(step?.highlight, passage),
    [step, passage]
  );
  const stepQuestion = step?.question;

  const stepChoices = useMemo(() => {
    const removed = removedChoices[step?.stepId] || [];
    return (stepQuestion?.choices || []).filter((choice) => !removed.includes(choice.id));
  }, [step, stepQuestion, removedChoices]);

  const recallCards = recall.cards || [];
  const recallCorrectOrder = recall.correctOrder?.length
    ? recall.correctOrder
    : recallCards.map((card) => card.id);
  const confirmQuestions = confirm.questions || [];
  const confirmQuestion = confirmQuestions[confirmIndex];
  const confirmPassage = confirm.passage || passage;
  const confirmAnswerRanges = useMemo(
    () => resolveAnswerRanges(confirmQuestion, confirmPassage),
    [confirmQuestion, confirmPassage]
  );
  const confirmRangeKeys = useMemo(
    () => dedupeRanges(confirmAnswerRanges).map(toRangeKey),
    [confirmAnswerRanges]
  );
  const confirmMatchMode = normalizeMatchMode(confirmQuestion?.answerMatchMode);
  const usesAllMatches = confirmMatchMode === "ALL" && confirmRangeKeys.length > 1;
  const confirmedKeySet = useMemo(
    () => new Set(confirmedRangeKeys),
    [confirmedRangeKeys]
  );
  const confirmedRanges = useMemo(() => {
    if (!usesAllMatches) return [];
    return confirmAnswerRanges.filter((range) => confirmedKeySet.has(toRangeKey(range)));
  }, [confirmAnswerRanges, confirmedKeySet, usesAllMatches]);
  const activeConfirmRanges = useMemo(
    () => dedupeRanges([...revealRanges, ...confirmedRanges]),
    [revealRanges, confirmedRanges]
  );

  const stageOrder = ["INTENSIVE", "RECALL", "CONFIRM"];
  const stageAvailability = useMemo(
    () => ({
      INTENSIVE: steps.length > 0,
      RECALL: recallCards.length > 0,
      CONFIRM: confirmQuestions.length > 0,
    }),
    [steps.length, recallCards.length, confirmQuestions.length]
  );
  const initialStage = useMemo(() => {
    const next = stageOrder.find((stageName) => stageAvailability[stageName]);
    return next || "INTENSIVE";
  }, [stageAvailability]);

  useEffect(() => {
    setStage(initialStage);
    setStepIndex(0);
    setRemovedChoices({});
    setIntensiveResult(null);
    setModalMark(null);
    setConfirmIndex(0);
    setConfirmResult(null);
    setRevealRanges([]);
    setAwaitingRevealClick(false);
    setConfirmedRangeKeys([]);
  }, [content?.contentId, initialStage]);

  useEffect(() => {
    if (stage === "RECALL") {
      setTopSlots(Array.from({ length: recallCorrectOrder.length }, () => null));
      setPoolOrder(shuffleList(recallCards.map((card) => card.id)));
      setRecallResult(null);
      setRecallCorrectSlots([]);
      slotRefs.current = [];
    }
    if (stage === "CONFIRM") {
      setConfirmIndex(0);
      setConfirmResult(null);
      setRevealRanges([]);
      setAwaitingRevealClick(false);
      setConfirmedRangeKeys([]);
    }
  }, [stage, recallCards]);

  useLayoutEffect(() => {
    const nextPositions = {};
    Object.entries(cardRefs.current).forEach(([id, node]) => {
      if (!node) return;
      nextPositions[id] = node.getBoundingClientRect();
    });
    const prevPositions = positionsRef.current;
    Object.entries(nextPositions).forEach(([id, rect]) => {
      const prev = prevPositions[id];
      if (!prev) return;
      const dx = prev.left - rect.left;
      const dy = prev.top - rect.top;
      if (dx || dy) {
        const node = cardRefs.current[id];
        if (node && node.animate) {
          node.animate(
            [
              { transform: `translate(${dx}px, ${dy}px)` },
              { transform: "translate(0, 0)" },
            ],
            { duration: 220, easing: "ease-out" }
          );
        }
      }
    });
    positionsRef.current = nextPositions;
  }, [topSlots, poolOrder]);

  useEffect(
    () => () => {
      if (recallAdvanceRef.current) {
        clearTimeout(recallAdvanceRef.current);
      }
      if (intensiveAdvanceRef.current) {
        clearTimeout(intensiveAdvanceRef.current);
      }
      if (confirmAdvanceRef.current) {
        clearTimeout(confirmAdvanceRef.current);
      }
      if (modalMarkRef.current) {
        clearTimeout(modalMarkRef.current);
      }
    },
    []
  );

  useEffect(() => {
    setConfirmResult(null);
    setRevealRanges([]);
    setAwaitingRevealClick(false);
    setConfirmedRangeKeys([]);
    confirmLockRef.current = false;
    if (confirmAdvanceRef.current) {
      clearTimeout(confirmAdvanceRef.current);
      confirmAdvanceRef.current = null;
    }
  }, [confirmIndex]);

  useEffect(() => {
    if (stage === "INTENSIVE" && !stageAvailability.INTENSIVE) {
      const next = stageOrder.find((item) => item !== "INTENSIVE" && stageAvailability[item]);
      if (next) {
        setStage(next);
      } else {
        finish(true);
      }
    }
    if (stage === "RECALL" && !stageAvailability.RECALL) {
      const next = stageOrder.find((item) => item !== "RECALL" && stageAvailability[item]);
      if (next) {
        setStage(next);
      } else {
        finish(true);
      }
    }
    if (stage === "CONFIRM" && !stageAvailability.CONFIRM) {
      finish(true);
    }
  }, [stage, stageAvailability, finish]);

  const advanceStage = (currentStage) => {
    const currentIndex = stageOrder.indexOf(currentStage);
    for (let idx = currentIndex + 1; idx < stageOrder.length; idx += 1) {
      const nextStage = stageOrder[idx];
      if (stageAvailability[nextStage]) {
        setStage(nextStage);
        return;
      }
    }
    finish(true);
  };

  const advanceConfirm = () => {
    setRevealRanges([]);
    setAwaitingRevealClick(false);
    setConfirmResult(null);
    if (confirmIndex < confirmQuestions.length - 1) {
      setConfirmIndex((prev) => prev + 1);
    } else {
      advanceStage("CONFIRM");
    }
  };

  const handleIntensiveAnswer = (choiceId) => {
    if (!stepQuestion) return;
    const scoring = { ...DEFAULT_INTENSIVE_SCORING, ...(stepQuestion.scoring || {}) };
    const isCorrect = choiceId === stepQuestion.answerId;
    adjustTime(isCorrect ? scoring.correctDeltaSec : scoring.wrongDeltaSec);
    recordAnswer({
      id: step.stepId || `intensive-${stepIndex}`,
      correct: isCorrect,
      stage: "INTENSIVE",
    });
    setIntensiveResult(isCorrect ? "correct" : "wrong");
    if (modalMarkRef.current) {
      clearTimeout(modalMarkRef.current);
    }
    setModalMark(isCorrect ? "correct" : "wrong");
    modalMarkRef.current = setTimeout(() => {
      setModalMark(null);
    }, 1000);
    if (!isCorrect) {
      if (scoring.eliminateWrongChoice) {
        setRemovedChoices((prev) => ({
          ...prev,
          [step.stepId]: [...(prev[step.stepId] || []), choiceId],
        }));
      }
      return;
    }
    if (intensiveAdvanceRef.current) {
      clearTimeout(intensiveAdvanceRef.current);
    }
    intensiveAdvanceRef.current = setTimeout(() => {
      if (stepIndex < steps.length - 1) {
        setStepIndex((prev) => prev + 1);
        setIntensiveResult(null);
        return;
      }
      advanceStage("INTENSIVE");
    }, 1000);
  };

  const handleDragStart = (id, from, slotIndex = null) => (event) => {
    event.dataTransfer.effectAllowed = "move";
    setDragging({ id, from, slotIndex });
  };

  const getSlotIndexFromPoint = (clientX, clientY) => {
    for (let idx = 0; idx < slotRefs.current.length; idx += 1) {
      const node = slotRefs.current[idx];
      if (!node) continue;
      const rect = node.getBoundingClientRect();
      if (
        clientX >= rect.left &&
        clientX <= rect.right &&
        clientY >= rect.top &&
        clientY <= rect.bottom
      ) {
        return idx;
      }
    }
    return -1;
  };

  const commitDropTop = (index = null) => {
    if (!dragging) return;
    if (index == null || index < 0 || index >= topSlots.length) {
      setDragging(null);
      setDropTarget(null);
      return;
    }
    const { id, from, slotIndex } = dragging;
    if (from === "top" && slotIndex == null) {
      setDragging(null);
      setDropTarget(null);
      return;
    }
    const targetId = topSlots[index];
    if (from === "top" && slotIndex === index) {
      setDragging(null);
      setDropTarget(null);
      return;
    }
    setTopSlots((prev) => {
      const next = [...prev];
      if (from === "top" && slotIndex != null) {
        const swapId = next[index];
        next[index] = id;
        next[slotIndex] = swapId ?? null;
        return next;
      }
      next[index] = id;
      return next;
    });
    setPoolOrder((prev) => {
      let next = prev.filter((item) => item !== id);
      if (from !== "top" && targetId) {
        next = [...next, targetId];
      }
      return next;
    });
    setDragging(null);
    setDropTarget(null);
  };

  const commitDropPool = () => {
    if (!dragging) return;
    const { id, from, slotIndex } = dragging;
    if (from === "top" && slotIndex == null) {
      setDragging(null);
      setDropTarget(null);
      return;
    }
    if (!poolOrder.includes(id)) {
      setPoolOrder((prev) => [...prev, id]);
    }
    if (from === "top" && slotIndex != null) {
      setTopSlots((prev) =>
        prev.map((item, idx) => (idx === slotIndex ? null : item))
      );
    }
    setDragging(null);
    setDropTarget(null);
  };

  const handleDropTop = (index = null) => (event) => {
    event.preventDefault();
    commitDropTop(index);
  };

  const handleDropPool = (event) => {
    event.preventDefault();
    commitDropPool();
  };

  const handlePointerDown = (id, from, slotIndex = null) => (event) => {
    if (event.pointerType === "mouse") return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    setDragging({ id, from, slotIndex });
    setPointerDrag({ pointerId: event.pointerId });
  };

  useEffect(() => {
    if (!pointerDrag) return undefined;
    const handleMove = (event) => {
      if (event.pointerId !== pointerDrag.pointerId) return;
      const topRect = recallTopRef.current?.getBoundingClientRect();
      const poolRect = recallPoolRef.current?.getBoundingClientRect();
      const slotIndex = getSlotIndexFromPoint(event.clientX, event.clientY);
      if (slotIndex >= 0) {
        setDropTarget({ area: "top", index: slotIndex });
        return;
      }
      if (poolRect && event.clientY >= poolRect.top && event.clientY <= poolRect.bottom) {
        setDropTarget({ area: "pool", index: null });
        return;
      }
      setDropTarget(null);
    };
    const handleUp = (event) => {
      if (event.pointerId !== pointerDrag.pointerId) return;
      if (dropTarget?.area === "top") {
        commitDropTop(dropTarget.index);
      } else if (dropTarget?.area === "pool") {
        commitDropPool();
      } else {
        setDragging(null);
        setDropTarget(null);
      }
      setPointerDrag(null);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    window.addEventListener("pointercancel", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
      window.removeEventListener("pointercancel", handleUp);
    };
  }, [pointerDrag, dropTarget, topSlots, poolOrder]);

  const handleRecallSubmit = () => {
    const correctOrder = recallCorrectOrder;
    const penalty = recall.seedPenalty ?? recall.seedPool?.wrongPenaltySeed ?? 1;
    const isComplete = topSlots.length === correctOrder.length && topSlots.every(Boolean);
    const isCorrect =
      isComplete &&
      topSlots.every((cardId, idx) => cardId === correctOrder[idx]);
    if (isCorrect) {
      recordAnswer({ id: "recall", correct: true });
      setRecallCorrectSlots(correctOrder.map(() => true));
      setRecallResult("correct");
      if (recallAdvanceRef.current) {
        clearTimeout(recallAdvanceRef.current);
      }
      recallAdvanceRef.current = setTimeout(() => {
        advanceStage("RECALL");
      }, 600);
      return;
    }
    const nextSlots = correctOrder.map((id, idx) => topSlots[idx] === id);
    setRecallCorrectSlots(nextSlots);
    setRecallResult("wrong");
    setSeed((prev) => {
      const nextSeed = Math.max(0, prev - penalty);
      if (nextSeed === 0) {
        finish(false);
      }
      return nextSeed;
    });
  };

  const handleConfirmClick = (paragraphId, index) => {
    if (!confirmQuestion) return;
    if (confirmLockRef.current) return;
    const revealOnWrong = confirmQuestion.revealOnWrong ?? true;
    const scoring = { ...DEFAULT_CONFIRM_SCORING, ...(confirmQuestion.scoring || {}) };
    const matchedRange = confirmAnswerRanges.find(
      (range) =>
        range.paragraphId === paragraphId &&
        index >= range.start &&
        index < range.end
    );
    const isCorrectClick = Boolean(matchedRange);
    if (usesAllMatches && matchedRange) {
      const key = toRangeKey(matchedRange);
      if (confirmedKeySet.has(key)) {
        return;
      }
    }
    adjustTime(isCorrectClick ? scoring.correctDeltaSec : scoring.wrongDeltaSec);
    recordAnswer({
      id: confirmQuestion.id || `confirm-${confirmIndex}`,
      correct: isCorrectClick,
      rangeKey: matchedRange ? toRangeKey(matchedRange) : null,
    });
    if (isCorrectClick) {
      if (usesAllMatches && matchedRange) {
        const key = toRangeKey(matchedRange);
        const nextKeys = confirmedKeySet.has(key)
          ? confirmedRangeKeys
          : [...confirmedRangeKeys, key];
        setConfirmedRangeKeys(nextKeys);
        setConfirmResult("correct");
        if (nextKeys.length >= confirmRangeKeys.length) {
          advanceConfirm();
        }
        return;
      }
      setConfirmResult("correct");
      advanceConfirm();
      return;
    }
    setConfirmResult("wrong");
    if (revealOnWrong) {
      setRevealRanges(confirmAnswerRanges);
    }
    setAwaitingRevealClick(false);
    confirmLockRef.current = true;
    if (confirmAdvanceRef.current) {
      clearTimeout(confirmAdvanceRef.current);
    }
    confirmAdvanceRef.current = setTimeout(() => {
      confirmLockRef.current = false;
      advanceConfirm();
    }, 900);
  };

  if (status === "READY") {
    return (
      <div className="worksheet-start">
        <div className="worksheet-empty">Reading training ready.</div>
        <button type="button" className="worksheet-start-btn" onClick={start}>
          Start
        </button>
      </div>
    );
  }

  return (
    <div className="reading-training-module">
      {stage === "INTENSIVE" ? (
        <>
          <div className="reading-passage">
            {(passage.paragraphs || []).map((paragraph) => {
              const ranges = stepHighlightRanges.filter(
                (range) => range.paragraphId === paragraph.id
              );
              return (
                <p key={paragraph.id}>
                  {ranges.length
                    ? renderHighlightedParagraph(paragraph.text, ranges)
                    : paragraph.text}
                </p>
              );
            })}
          </div>
          <div className="reading-meta">
            <span>
              {stepIndex + 1} / {steps.length || 0}
            </span>
          </div>
          {stepQuestion ? (
            <QuestionModal
              title="Question"
              prompt={stepQuestion.prompt}
              choices={stepChoices}
              onSelect={handleIntensiveAnswer}
              mark={modalMark}
              shuffleKey={step.stepId || stepIndex}
            />
          ) : null}
        </>
      ) : null}

      {stage === "RECALL" ? (
        <div className="reading-recall-stage">
          <div
            className="reading-recall-top"
            ref={recallTopRef}
            onDragOver={(event) => event.preventDefault()}
          >
            {topSlots.map((cardId, slotIndex) => {
              const card = recallCards.find((item) => item.id === cardId);
              const isCorrect = recallCorrectSlots[slotIndex];
              const isDropTarget =
                dropTarget?.area === "top" && dropTarget.index === slotIndex;
              const showResultIcon = Boolean(recallResult);
              const iconSrc = isCorrect
                ? resolveAssetUrl("정답 동그라미.png")
                : resolveAssetUrl("오답 꺾은선.png");
              return (
                <div
                  key={`slot-${slotIndex}`}
                  ref={(node) => {
                    if (node) slotRefs.current[slotIndex] = node;
                  }}
                  className={`reading-recall-slot ${isDropTarget ? "drop-target" : ""}`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    if (!dragging) return;
                    setDropTarget({ area: "top", index: slotIndex });
                  }}
                  onDragLeave={() => {
                    if (dropTarget?.area === "top" && dropTarget.index === slotIndex) {
                      setDropTarget(null);
                    }
                  }}
                  onDrop={handleDropTop(slotIndex)}
                >
                  {cardId ? (
                    <div
                      ref={(node) => {
                        if (node) cardRefs.current[cardId] = node;
                      }}
                      className={`reading-recall-card ${isCorrect ? "correct" : ""} ${dragging?.id === cardId ? "dragging" : ""}`}
                      draggable
                      onDragStart={handleDragStart(cardId, "top", slotIndex)}
                      onPointerDown={handlePointerDown(cardId, "top", slotIndex)}
                      onDragEnd={() => {
                        setDragging(null);
                        setDropTarget(null);
                      }}
                    >
                      {card?.text}
                    </div>
                  ) : (
                    <div className="reading-recall-placeholder" />
                  )}
                  {showResultIcon ? (
                    <img
                      className="reading-recall-result-icon"
                      src={iconSrc}
                      alt={isCorrect ? "정답" : "오답"}
                    />
                  ) : null}
                </div>
              );
            })}
          </div>
          <div
            className="reading-recall-pool"
            ref={recallPoolRef}
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDropPool}
          >
            {poolOrder.map((cardId) => {
              const card = recallCards.find((item) => item.id === cardId);
              return (
                <div
                  key={cardId}
                  ref={(node) => {
                    if (node) cardRefs.current[cardId] = node;
                  }}
                  className={`reading-recall-card ${dragging?.id === cardId ? "dragging" : ""}`}
                  draggable
                  onDragStart={handleDragStart(cardId, "pool")}
                  onPointerDown={handlePointerDown(cardId, "pool")}
                  onDragEnd={() => {
                    setDragging(null);
                    setDropTarget(null);
                  }}
                >
                  {card?.text}
                </div>
              );
            })}
          </div>
          <div className="reading-recall-footer">
            <span>Seeds: {seed}</span>
            <button type="button" onClick={handleRecallSubmit}>
              제출
            </button>
          </div>
          {recallResult ? (
            <div className={`worksheet-feedback ${recallResult}`}>
              {recallResult === "correct" ? "정답입니다!" : "오답입니다."}
            </div>
          ) : null}
        </div>
      ) : null}

      {stage === "CONFIRM" ? (
        <div className="reading-confirm-stage">
          <div className="reading-confirm-passage">
            {(confirmPassage.paragraphs || []).map((paragraph) => {
              const ranges = activeConfirmRanges.filter(
                (range) => range.paragraphId === paragraph.id
              );
              const mask = buildHighlightMask(paragraph.text.length, ranges);
              return (
                <p key={paragraph.id} className="confirm-paragraph">
                  {Array.from(paragraph.text).map((char, idx) => {
                    const displayChar = char === " " ? "\u00A0" : char;
                    return (
                      <span
                        key={`${paragraph.id}-${idx}`}
                        className={`confirm-char ${mask.has(idx) ? "worksheet-highlight" : ""}`}
                        onClick={() => handleConfirmClick(paragraph.id, idx)}
                      >
                        {displayChar}
                      </span>
                    );
                  })}
                </p>
              );
            })}
          </div>
          <div className="reading-confirm-question">
            <div className="confirm-header">
              <h3>{confirmQuestion?.prompt}</h3>
              <span>
                {confirmIndex + 1}/{confirmQuestions.length}
              </span>
            </div>
            {usesAllMatches ? (
              <div className="confirm-progress">
                찾은 표현: {confirmedRangeKeys.length}/{confirmRangeKeys.length}
              </div>
            ) : null}
            {confirmResult ? (
              <div className={`worksheet-feedback ${confirmResult}`}>
                {confirmResult === "correct" ? "정답입니다!" : "오답입니다."}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ReadingTrainingModule;
