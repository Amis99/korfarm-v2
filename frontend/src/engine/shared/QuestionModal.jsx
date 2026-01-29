import { useEffect, useRef, useState } from "react";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function QuestionModal({ title, prompt, choices = [], onSelect, onClose, footer }) {
  const modalRef = useRef(null);
  const dragState = useRef(null);
  const [position, setPosition] = useState({ x: 28, y: 28 });
  const [isDragging, setIsDragging] = useState(false);

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

  return (
    <div className="question-modal-overlay">
      <div
        ref={modalRef}
        className={`question-modal ${isDragging ? "dragging" : ""}`}
        style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0)` }}
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
          {choices.map((choice) => (
            <button
              type="button"
              key={choice.id}
              className="question-choice"
              onClick={() => onSelect(choice.id)}
            >
              <span className="choice-label">{choice.id}</span>
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
