import { useEffect, useMemo, useRef, useState } from "react";
import { useEngine } from "../core/EngineContext";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const shuffleArray = (items) => {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

const buildChoiceSignature = (items) =>
  items.map((item) => `${item.id}:${item.text}`).join("|");

function QuestionModal({
  title,
  prompt,
  choices = [],
  onSelect,
  onClose,
  footer,
  mark,
  anchorRect,
  shuffleKey,
}) {
  const engine = useEngine();
  const status = engine?.status;
  const modalRef = useRef(null);
  const dragState = useRef(null);
  const [position, setPosition] = useState({ x: 28, y: 28 });
  const [isDragging, setIsDragging] = useState(false);
  const [visibleMark, setVisibleMark] = useState(null);
  const markTimerRef = useRef(null);
  const choiceSignature = useMemo(() => buildChoiceSignature(choices), [choices]);
  const resolvedShuffleKey = useMemo(() => {
    if (shuffleKey != null) {
      return `${shuffleKey}|${choiceSignature}`;
    }
    return `${title ?? ""}|${prompt ?? ""}|${choiceSignature}`;
  }, [shuffleKey, title, prompt, choiceSignature]);
  const lastShuffleKeyRef = useRef(resolvedShuffleKey);
  const [shuffledChoices, setShuffledChoices] = useState(() =>
    shuffleArray(choices)
  );

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;
    const container = modal.closest(".engine-body") || document.body;
    const containerRect = container.getBoundingClientRect();
    const modalRect = modal.getBoundingClientRect();
    const maxX = Math.max(8, containerRect.width - modalRect.width - 8);
    const maxY = Math.max(8, containerRect.height - modalRect.height - 8);
    setPosition((prev) => ({
      x: clamp(prev.x, 8, maxX),
      y: clamp(prev.y, 8, maxY),
    }));
  }, []);

  useEffect(() => {
    if (!anchorRect) return;
    const modal = modalRef.current;
    if (!modal) return;
    const container = modal.closest(".engine-body") || document.body;
    const containerRect = container.getBoundingClientRect();
    const modalRect = modal.getBoundingClientRect();
    const maxX = Math.max(8, containerRect.width - modalRect.width - 8);
    const maxY = Math.max(8, containerRect.height - modalRect.height - 8);
    const gap = 12;
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      const spaceBelow = containerRect.height - (anchorRect.top + anchorRect.height);
      const placeBelow = spaceBelow >= modalRect.height + gap;
      const baseY = placeBelow
        ? (anchorRect.top + anchorRect.height + gap)
        : (anchorRect.top - modalRect.height - gap);
      const nextY = clamp(baseY, 8, maxY);
      const nextX = clamp(anchorRect.left || 28, 8, maxX);
      setPosition({ x: nextX, y: nextY });
      return;
    }
    const align = anchorRect.align || "right";
    const baseX =
      align === "right"
        ? (anchorRect.right ?? 28) + gap
        : (anchorRect.left ?? 28) - modalRect.width - gap;
    const nextX = clamp(baseX, 8, maxX);
    const nextY = clamp(anchorRect.top || 28, 8, maxY);
    setPosition({ x: nextX, y: nextY });
  }, [anchorRect]);

  useEffect(() => {
    if (resolvedShuffleKey === lastShuffleKeyRef.current) return;
    setShuffledChoices(shuffleArray(choices));
    lastShuffleKeyRef.current = resolvedShuffleKey;
  }, [resolvedShuffleKey, choices]);

  useEffect(() => {
    if (markTimerRef.current) {
      clearTimeout(markTimerRef.current);
    }
    if (!mark) {
      setVisibleMark(null);
      return undefined;
    }
    setVisibleMark(mark);
    markTimerRef.current = setTimeout(() => {
      setVisibleMark(null);
      markTimerRef.current = null;
    }, 1000);
    return () => {
      if (markTimerRef.current) {
        clearTimeout(markTimerRef.current);
        markTimerRef.current = null;
      }
    };
  }, [mark]);

  useEffect(() => {
    if (!isDragging) return undefined;
    const handleMove = (event) => {
      if (!dragState.current) return;
      const { startX, startY, startLeft, startTop, containerRect, modalRect } = dragState.current;
      const deltaX = event.clientX - startX;
      const deltaY = event.clientY - startY;
      const maxX = Math.max(8, containerRect.width - modalRect.width - 8);
      const maxY = Math.max(8, containerRect.height - modalRect.height - 8);
      const nextX = clamp(startLeft + deltaX, 8, maxX);
      const nextY = clamp(startTop + deltaY, 8, maxY);
      setPosition({ x: nextX, y: nextY });
    };
    const handleUp = () => {
      dragState.current = null;
      setIsDragging(false);
    };
    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [isDragging]);

  const handleDragStart = (event) => {
    const modal = modalRef.current;
    if (!modal) return;
    const container = modal.closest(".engine-body") || document.body;
    const containerRect = container.getBoundingClientRect();
    const modalRect = modal.getBoundingClientRect();
    dragState.current = {
      startX: event.clientX,
      startY: event.clientY,
      startLeft: modalRect.left - containerRect.left,
      startTop: modalRect.top - containerRect.top,
      containerRect,
      modalRect,
    };
    setIsDragging(true);
  };

  if (status === "FINISHED") {
    return null;
  }

  return (
    <div className="question-modal-overlay">
      <div
        ref={modalRef}
        className={`question-modal ${isDragging ? "dragging" : ""}`}
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          minHeight: anchorRect?.height ? `${anchorRect.height}px` : undefined,
        }}
      >
        <div className="question-modal-header" onPointerDown={handleDragStart}>
          <h3>{title}</h3>
          {onClose ? (
            <button
              type="button"
              className="question-close"
              onClick={onClose}
              onPointerDown={(event) => event.stopPropagation()}
            >
              닫기
            </button>
          ) : null}
        </div>
        <p className="question-modal-prompt">{prompt}</p>
        <div className="question-modal-choices">
          {visibleMark ? <div className={`question-modal-mark ${visibleMark}`} /> : null}
          {shuffledChoices.map((choice) => (
            <button
              type="button"
              key={choice.id}
              className="question-choice"
              onClick={() => onSelect(choice.id)}
            >
              <span>{choice.text}</span>
            </button>
          ))}
        </div>
        {footer ? <div className="question-modal-footer">{footer}</div> : null}
      </div>
    </div>
  );
}

export default QuestionModal;
