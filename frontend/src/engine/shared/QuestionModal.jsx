import { useEffect, useMemo, useRef, useState } from "react";
import { useEngine } from "../core/EngineContext";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const parseTransformScale = (transform) => {
  if (!transform || transform === "none") return null;
  const match = transform.match(/matrix\(([^)]+)\)/);
  if (!match) return null;
  const values = match[1].split(",").map((value) => Number.parseFloat(value.trim()));
  const scale = values[0];
  return Number.isFinite(scale) && scale > 0 ? scale : null;
};

const getContainerMetrics = (modal) => {
  const container = modal?.closest(".engine-body") || document.body;
  const containerRect = container.getBoundingClientRect();
  const modalRect = modal.getBoundingClientRect();
  const containerWidth = container.offsetWidth || containerRect.width;
  const containerHeight = container.offsetHeight || containerRect.height;
  const modalWidth = modal.offsetWidth || modalRect.width;
  const modalHeight = modal.offsetHeight || modalRect.height;
  let scale = 1;
  const shell = modal?.closest(".engine-shell");
  if (shell) {
    const rawScale = window.getComputedStyle(shell).getPropertyValue("--scale").trim();
    const parsedScale = Number.parseFloat(rawScale);
    if (Number.isFinite(parsedScale) && parsedScale > 0) {
      scale = parsedScale;
    }
  }
  if (!Number.isFinite(scale) || scale <= 0 || scale === 1) {
    const scaleHost = modal?.closest(".engine-scale");
    if (scaleHost) {
      const computed = window.getComputedStyle(scaleHost);
      const zoom = Number.parseFloat(computed.zoom);
      if (Number.isFinite(zoom) && zoom > 0 && zoom !== 1) {
        scale = zoom;
      } else {
        const transformScale = parseTransformScale(computed.transform);
        if (transformScale) {
          scale = transformScale;
        }
      }
    }
  }
  if (!Number.isFinite(scale) || scale <= 0 || scale === 1) {
    const ratio =
      containerWidth && containerRect.width ? containerRect.width / containerWidth : 1;
    if (Number.isFinite(ratio) && ratio > 0) {
      scale = ratio;
    } else {
      scale = 1;
    }
  }
  return {
    container,
    containerRect,
    modalRect,
    containerWidth,
    containerHeight,
    modalWidth,
    modalHeight,
    scale,
  };
};

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
  const flashTimerRef = useRef(null);
  const switchTimerRef = useRef(null);
  const enterTimerRef = useRef(null);
  const lastChoiceRef = useRef(null);
  const lastChoiceKeyRef = useRef(null);
  const [pendingChoiceId, setPendingChoiceId] = useState(null);
  const [flashChoiceId, setFlashChoiceId] = useState(null);
  const [flashStatus, setFlashStatus] = useState(null);
  const [interactionLocked, setInteractionLocked] = useState(false);
  const lockRef = useRef(false);
  const lockTimerRef = useRef(null);
  const choiceSignature = useMemo(() => buildChoiceSignature(choices), [choices]);
  const resolvedShuffleKey = useMemo(() => {
    if (shuffleKey != null) {
      return `${shuffleKey}|${choiceSignature}`;
    }
    return `${title ?? ""}|${prompt ?? ""}|${choiceSignature}`;
  }, [shuffleKey, title, prompt, choiceSignature]);
  const [contentKey, setContentKey] = useState(resolvedShuffleKey);
  const [isSwitching, setIsSwitching] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const [displayPrompt, setDisplayPrompt] = useState(prompt);
  const [displayChoices, setDisplayChoices] = useState(() =>
    shuffleArray(choices)
  );
  const [displayFooter, setDisplayFooter] = useState(footer);

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;
    const { containerWidth, containerHeight, modalWidth, modalHeight } = getContainerMetrics(modal);
    const maxX = Math.max(8, containerWidth - modalWidth - 8);
    const maxY = Math.max(8, containerHeight - modalHeight - 8);
    setPosition((prev) => ({
      x: clamp(prev.x, 8, maxX),
      y: clamp(prev.y, 8, maxY),
    }));
  }, []);

  useEffect(() => {
    if (!anchorRect) return;
    const modal = modalRef.current;
    if (!modal) return;
    const { containerWidth, containerHeight, modalWidth, modalHeight, scale } =
      getContainerMetrics(modal);
    const maxX = Math.max(8, containerWidth - modalWidth - 8);
    const maxY = Math.max(8, containerHeight - modalHeight - 8);
    const gap = 12;
    const isMobile = window.innerWidth < 768;
    const anchorLeft = (anchorRect.left ?? 28) / scale;
    const anchorRight = (anchorRect.right ?? 28) / scale;
    const anchorTop = (anchorRect.top ?? 28) / scale;
    const anchorHeight = (anchorRect.height ?? 0) / scale;
    if (isMobile) {
      const spaceBelow = containerHeight - (anchorTop + anchorHeight);
      const placeBelow = spaceBelow >= modalHeight + gap;
      const baseY = placeBelow
        ? (anchorTop + anchorHeight + gap)
        : (anchorTop - modalHeight - gap);
      const nextY = clamp(baseY, 8, maxY);
      const nextX = clamp(anchorLeft || 28, 8, maxX);
      setPosition({ x: nextX, y: nextY });
      return;
    }
    const align = anchorRect.align || "right";
    const baseX =
      align === "right"
        ? (anchorRight ?? 28) + gap
        : (anchorLeft ?? 28) - modalWidth - gap;
    const nextX = clamp(baseX, 8, maxX);
    const nextY = clamp(anchorTop || 28, 8, maxY);
    setPosition({ x: nextX, y: nextY });
  }, [anchorRect]);

  useEffect(() => {
    if (!contentKey || resolvedShuffleKey === contentKey) return;
    setIsSwitching(true);
    if (switchTimerRef.current) {
      clearTimeout(switchTimerRef.current);
    }
    switchTimerRef.current = setTimeout(() => {
      setContentKey(resolvedShuffleKey);
      setDisplayPrompt(prompt);
      setDisplayChoices(shuffleArray(choices));
      setDisplayFooter(footer);
      setIsSwitching(false);
    }, 160);
  }, [resolvedShuffleKey, contentKey, prompt, choices, footer]);

  useEffect(() => {
    if (resolvedShuffleKey !== contentKey) return;
    setDisplayFooter(footer);
  }, [footer, resolvedShuffleKey, contentKey]);

  useEffect(() => {
    if (!contentKey) return undefined;
    if (enterTimerRef.current) {
      clearTimeout(enterTimerRef.current);
    }
    setAnimateIn(true);
    enterTimerRef.current = setTimeout(() => {
      setAnimateIn(false);
    }, 240);
    return () => {
      if (enterTimerRef.current) {
        clearTimeout(enterTimerRef.current);
        enterTimerRef.current = null;
      }
    };
  }, [contentKey]);

  useEffect(() => {
    setPendingChoiceId(null);
    setFlashChoiceId(null);
    setFlashStatus(null);
    setInteractionLocked(false);
    lockRef.current = false;
    lastChoiceRef.current = null;
    lastChoiceKeyRef.current = null;
    if (lockTimerRef.current) {
      clearTimeout(lockTimerRef.current);
      lockTimerRef.current = null;
    }
  }, [contentKey]);

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
    if (!mark || !pendingChoiceId) return;
    setFlashChoiceId(pendingChoiceId);
    setFlashStatus(mark);
    setPendingChoiceId(null);
    if (flashTimerRef.current) {
      clearTimeout(flashTimerRef.current);
    }
    flashTimerRef.current = setTimeout(() => {
      setFlashChoiceId(null);
      setFlashStatus(null);
      flashTimerRef.current = null;
    }, 480);
  }, [mark, pendingChoiceId]);

  useEffect(() => {
    if (!isDragging) return undefined;
    const handleMove = (event) => {
      if (!dragState.current) return;
      const {
        containerLeft,
        containerTop,
        offsetX,
        offsetY,
        containerWidth,
        containerHeight,
        modalWidth,
        modalHeight,
        scale,
      } = dragState.current;
      const maxX = Math.max(8, containerWidth - modalWidth - 8);
      const maxY = Math.max(8, containerHeight - modalHeight - 8);
      const nextX = clamp(
        (event.clientX - containerLeft) / (scale || 1) - offsetX,
        8,
        maxX
      );
      const nextY = clamp(
        (event.clientY - containerTop) / (scale || 1) - offsetY,
        8,
        maxY
      );
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

  useEffect(
    () => () => {
      if (flashTimerRef.current) {
        clearTimeout(flashTimerRef.current);
        flashTimerRef.current = null;
      }
      if (switchTimerRef.current) {
        clearTimeout(switchTimerRef.current);
        switchTimerRef.current = null;
      }
      if (enterTimerRef.current) {
        clearTimeout(enterTimerRef.current);
        enterTimerRef.current = null;
      }
      if (lockTimerRef.current) {
        clearTimeout(lockTimerRef.current);
        lockTimerRef.current = null;
      }
    },
    []
  );

  const handleDragStart = (event) => {
    const modal = modalRef.current;
    if (!modal) return;
    event.preventDefault();
    const {
      containerRect,
      modalRect,
      containerWidth,
      containerHeight,
      modalWidth,
      modalHeight,
      scale,
    } = getContainerMetrics(modal);
    const offsetX = (event.clientX - modalRect.left) / (scale || 1);
    const offsetY = (event.clientY - modalRect.top) / (scale || 1);
    dragState.current = {
      containerLeft: containerRect.left,
      containerTop: containerRect.top,
      offsetX,
      offsetY,
      containerWidth,
      containerHeight,
      modalWidth,
      modalHeight,
      scale,
    };
    setIsDragging(true);
  };

  if (status === "FINISHED") {
    return null;
  }

  const handleChoiceClick = (choiceId) => {
    if (!onSelect) return;
    if (isSwitching) return;
    if (lockRef.current) return;
    if (lastChoiceKeyRef.current === contentKey && lastChoiceRef.current === choiceId) {
      return;
    }
    lastChoiceRef.current = choiceId;
    lastChoiceKeyRef.current = contentKey;
    lockRef.current = true;
    setInteractionLocked(true);
    if (lockTimerRef.current) {
      clearTimeout(lockTimerRef.current);
    }
    lockTimerRef.current = setTimeout(() => {
      lockRef.current = false;
      setInteractionLocked(false);
      lockTimerRef.current = null;
    }, 1000);
    setPendingChoiceId(choiceId);
    onSelect(choiceId);
  };

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
        <div
          className={`question-modal-body ${isSwitching ? "switching" : ""} ${
            animateIn ? "enter" : ""
          }`}
        >
          <p className="question-modal-prompt">{displayPrompt}</p>
          <div className="question-modal-choices">
            {visibleMark ? <div className={`question-modal-mark ${visibleMark}`} /> : null}
            {displayChoices.map((choice) => {
              const flashClass =
                flashChoiceId === choice.id && flashStatus
                  ? `flash-${flashStatus}`
                  : "";
              return (
                <button
                  type="button"
                  key={choice.id}
                  className={`question-choice ${flashClass}`}
                  onClick={() => handleChoiceClick(choice.id)}
                  disabled={interactionLocked || Boolean(flashChoiceId) || isSwitching}
                >
                  <span>{choice.text}</span>
                </button>
              );
            })}
          </div>
          {displayFooter ? <div className="question-modal-footer">{displayFooter}</div> : null}
        </div>
      </div>
    </div>
  );
}

export default QuestionModal;
