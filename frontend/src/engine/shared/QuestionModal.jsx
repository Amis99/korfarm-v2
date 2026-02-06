import { useEffect, useMemo, useRef, useState } from "react";
import { useEngine } from "../core/EngineContext";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const parseTransformScale = (transform) => {
  if (!transform || transform === "none") return null;
  const matrix3d = transform.match(/matrix3d\(([^)]+)\)/);
  if (matrix3d) {
    const values = matrix3d[1].split(",").map((value) => Number.parseFloat(value.trim()));
    const scale = values[0];
    return Number.isFinite(scale) && scale > 0 ? scale : null;
  }
  const matrix = transform.match(/matrix\(([^)]+)\)/);
  if (!matrix) return null;
  const values = matrix[1].split(",").map((value) => Number.parseFloat(value.trim()));
  const scale = values[0];
  return Number.isFinite(scale) && scale > 0 ? scale : null;
};

const getScaleFromHost = (host) => {
  if (!host) return 1;
  const computed = window.getComputedStyle(host);
  const zoom = Number.parseFloat(computed.zoom);
  if (Number.isFinite(zoom) && zoom > 0 && Math.abs(zoom - 1) > 0.001) {
    return zoom;
  }
  const transformScale = parseTransformScale(computed.transform);
  if (transformScale && Math.abs(transformScale - 1) > 0.001) {
    return transformScale;
  }
  const rect = host.getBoundingClientRect();
  const width = host.offsetWidth || Number.parseFloat(computed.width);
  if (Number.isFinite(width) && width > 0) {
    const ratio = rect.width / width;
    if (Number.isFinite(ratio) && ratio > 0) {
      return ratio;
    }
  }
  return 1;
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
  const scaleHost = modal?.closest(".engine-scale") || modal;
  const hostScale = getScaleFromHost(scaleHost);
  if (Number.isFinite(hostScale) && hostScale > 0) {
    scale = hostScale;
  }
  if (Math.abs(scale - 1) < 0.001) {
    const modalScale = modalWidth ? modalRect.width / modalWidth : 1;
    if (Number.isFinite(modalScale) && modalScale > 0 && Math.abs(modalScale - 1) > 0.001) {
      scale = modalScale;
    }
  }
  if (Math.abs(scale - 1) < 0.001) {
    const shell = modal?.closest(".engine-shell");
    if (shell) {
      const computed = window.getComputedStyle(shell);
      const sheetWidth = Number.parseFloat(computed.getPropertyValue("--sheet-width"));
      if (Number.isFinite(sheetWidth) && sheetWidth > 0) {
        const nextScale = Math.min(1, (window.innerWidth - 24) / sheetWidth);
        if (Number.isFinite(nextScale) && nextScale > 0 && Math.abs(nextScale - 1) > 0.001) {
          scale = nextScale;
        }
      }
    }
  }
  if (!Number.isFinite(scale) || scale <= 0 || Math.abs(scale - 1) < 0.001) {
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
    const gap = 8;
    const pad = 8;
    const maxX = Math.max(pad, containerWidth - modalWidth - pad);
    const maxY = Math.max(pad, containerHeight - modalHeight - pad);
    const aLeft = (anchorRect.left ?? 0) / scale;
    const aRight = (anchorRect.right ?? 0) / scale;
    const aTop = (anchorRect.top ?? 0) / scale;
    const aHeight = (anchorRect.height ?? 0) / scale;
    const aBottom = aTop + aHeight;
    const halfW = containerWidth / 2;

    const isMobile = window.innerWidth < 768;
    const spaces = isMobile
      ? [
          { dir: "above", space: aTop },
          { dir: "below", space: containerHeight - aBottom },
        ]
      : [
          { dir: "above", space: aTop },
          { dir: "below", space: containerHeight - aBottom },
          { dir: "right", space: containerWidth - aRight },
          { dir: "left", space: aLeft },
        ];
    spaces.sort((a, b) => b.space - a.space);
    const bestDir = spaces[0].dir;

    let nextX;
    let nextY;
    if (bestDir === "above") {
      nextY = aTop - gap - modalHeight;
      nextX = (aLeft + aRight) / 2 - modalWidth / 2;
    } else if (bestDir === "below") {
      nextY = aBottom + gap;
      nextX = (aLeft + aRight) / 2 - modalWidth / 2;
    } else if (bestDir === "right") {
      nextX = halfW;
      nextY = aTop + modalHeight <= containerHeight - pad ? aTop : aBottom - modalHeight;
    } else {
      nextX = halfW - modalWidth;
      nextY = aTop + modalHeight <= containerHeight - pad ? aTop : aBottom - modalHeight;
    }
    setPosition({
      x: clamp(nextX, pad, maxX),
      y: clamp(nextY, pad, maxY),
    });
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
