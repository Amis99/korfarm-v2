import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useEngine } from "../core/EngineContext";
import RichText from "../../utils/RichText";

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
  /** 정답 선택지 ID — mark="wrong"일 때 정답 선택지를 강조 표시 */
  correctChoiceId = null,
  /** 비활성 선택지 ID 배열 — 화면에서 사라짐 (B 패턴 재시도용) */
  disabledChoiceIds = null,
  /** 피드백 표시 시간 (ms). 정답/오답에 따라 외부에서 다르게 전달.
   *  기본 1000ms. A 패턴 오답·B 패턴 정답은 3000ms 권장. */
  feedbackDuration = 1000,
  /** inline=true → fixed/portal/드래그 비활성, 일반 block flow 로 부모 안에 렌더.
   *  시험지 컨셉에서 모달이 활성 카드 바로 아래에 누적되도록 하기 위함. */
  inline = false,
  /** preShuffled=true → 외부에서 이미 셔플된 choices를 받음. 모달 내부 shuffle 우회.
   *  같은 셔플 순서를 카드 인쇄용에도 공유할 때 사용. */
  preShuffled = false,
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
    preShuffled ? choices : shuffleArray(choices)
  );
  const [displayFooter, setDisplayFooter] = useState(footer);

  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;
    // viewport 기준 좌표 (document.body에 fixed로 떠있음)
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;
    const modalWidth = modal.offsetWidth;
    const modalHeight = modal.offsetHeight;
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
    // viewport 기준 좌표 (모달은 document.body에 fixed)
    const containerWidth = window.innerWidth;
    const containerHeight = window.innerHeight;
    const modalWidth = modal.offsetWidth;
    const modalHeight = modal.offsetHeight;
    const gap = 8;
    const pad = 8;
    const maxX = Math.max(pad, containerWidth - modalWidth - pad);
    const maxY = Math.max(pad, containerHeight - modalHeight - pad);
    const aLeft = anchorRect.left ?? 0;
    const aRight = anchorRect.right ?? 0;
    const aTop = anchorRect.top ?? 0;
    const aHeight = anchorRect.height ?? 0;
    const aBottom = aTop + aHeight;

    // 카드 아래 우선 → 공간 부족하면 카드 위. 카드와 항상 gap만큼만 떨어지도록.
    const spaceBelow = containerHeight - aBottom - pad;
    const spaceAbove = aTop - pad;
    let nextY;
    if (spaceBelow >= modalHeight + gap) {
      nextY = aBottom + gap;
    } else if (spaceAbove >= modalHeight + gap) {
      nextY = aTop - gap - modalHeight;
    } else {
      nextY = spaceBelow >= spaceAbove ? aBottom + gap : aTop - gap - modalHeight;
    }
    const nextX = (aLeft + aRight) / 2 - modalWidth / 2;
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
      setDisplayChoices(preShuffled ? choices : shuffleArray(choices));
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
    }, feedbackDuration);
    return () => {
      if (markTimerRef.current) {
        clearTimeout(markTimerRef.current);
        markTimerRef.current = null;
      }
    };
  }, [mark, feedbackDuration]);

  useEffect(() => {
    if (!mark || !pendingChoiceId) return;
    // 오답이고 정답 선택지가 명시된 경우: 정답 선택지를 초록색으로 강조
    // 그 외(정답이거나 correctChoiceId 미지정): 사용자가 고른 선택지를 강조
    const targetId =
      mark === "wrong" && correctChoiceId ? correctChoiceId : pendingChoiceId;
    setFlashChoiceId(targetId);
    // 오답이지만 정답 선택지를 보여줄 때는 색상은 항상 "correct"(초록)
    const targetStatus =
      mark === "wrong" && correctChoiceId ? "correct" : mark;
    setFlashStatus(targetStatus);
    setPendingChoiceId(null);
    if (flashTimerRef.current) {
      clearTimeout(flashTimerRef.current);
    }
    flashTimerRef.current = setTimeout(() => {
      setFlashChoiceId(null);
      setFlashStatus(null);
      flashTimerRef.current = null;
    }, feedbackDuration);
  }, [mark, pendingChoiceId, correctChoiceId, feedbackDuration]);

  useEffect(() => {
    if (!isDragging) return undefined;
    const handleMove = (event) => {
      if (!dragState.current) return;
      const { offsetX, offsetY, modalWidth, modalHeight } = dragState.current;
      // 모달이 fixed라 viewport(window) 기준 좌표 사용
      const maxX = Math.max(8, window.innerWidth - modalWidth - 8);
      const maxY = Math.max(8, window.innerHeight - modalHeight - 8);
      const nextX = clamp(event.clientX - offsetX, 8, maxX);
      const nextY = clamp(event.clientY - offsetY, 8, maxY);
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
    // 모달이 fixed positioning이라 viewport 기준 단순 좌표 계산
    const modalRect = modal.getBoundingClientRect();
    const offsetX = event.clientX - modalRect.left;
    const offsetY = event.clientY - modalRect.top;
    dragState.current = {
      offsetX,
      offsetY,
      modalWidth: modal.offsetWidth,
      modalHeight: modal.offsetHeight,
    };
    setIsDragging(true);
  };

  // Portal target — document.body로 강제 (.engine-body의 zoom/scale 및 .screen-level-* 통합 사이즈 규칙 영향에서 완전 차단).
  // 모달은 viewport 기준 fixed position으로 그려짐. 좌표 계산도 viewport rect 사용.
  const portalTarget = useMemo(() => {
    if (typeof document === "undefined") return null;
    return document.body;
  }, []);

  // 모달 sizing — viewport 기준 inline style 강제. document.body 위에 fixed라 zoom 무관.
  // 모바일: 224px (소쉬르 기준 280에서 20% 축소). 레벨 무관 통일.
  // 폰트 사이즈 13px도 inline으로 강제 (CSS .screen-level-* 통합 규칙 cascade 차단)
  const modalSizingStyle = useMemo(() => {
    if (typeof window === "undefined") return { width: "320px" };
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      const w = Math.min(window.innerWidth * 0.6, 224);
      return {
        width: `${w}px`,
        maxWidth: `${w}px`,
        minWidth: `${w}px`,
        boxSizing: "border-box",
        fontSize: "13px",
        lineHeight: "1.4",
      };
    }
    return { width: "320px", maxWidth: "320px", minWidth: "320px", boxSizing: "border-box" };
  }, []);

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
    // 잠금은 피드백 표시 시간보다 약간 짧게 — 다음 문제 진입 전에 자동 해제
    const lockMs = Math.max(400, feedbackDuration - 100);
    lockTimerRef.current = setTimeout(() => {
      lockRef.current = false;
      setInteractionLocked(false);
      lockTimerRef.current = null;
      // 동일 contentKey에서 재시도(B 패턴)를 허용하려면 마지막 클릭 기록 초기화
      lastChoiceRef.current = null;
    }, lockMs);
    setPendingChoiceId(choiceId);
    onSelect(choiceId);
  };

  // inline 모드: 부모 안에 일반 block으로 렌더 (transform/position 없음)
  if (inline) {
    return (
      <div className="question-modal-inline">
        <div className="question-modal question-modal-inline-card">
          <div className="question-modal-header">
            <h3>{title}</h3>
          </div>
          <div
            className={`question-modal-body ${isSwitching ? "switching" : ""} ${
              animateIn ? "enter" : ""
            }`}
          >
            <p className="question-modal-prompt">
              <RichText>{displayPrompt}</RichText>
            </p>
            <div className="question-modal-choices">
              {visibleMark ? <div className={`question-modal-mark ${visibleMark}`} /> : null}
              {displayChoices
                .filter((choice) => !disabledChoiceIds || !disabledChoiceIds.includes(choice.id))
                .map((choice) => {
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
                      <span>
                        <RichText>{choice.text}</RichText>
                      </span>
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

  const modalContent = (
    <div className="question-modal-overlay">
      <div
        ref={modalRef}
        className={`question-modal ${isDragging ? "dragging" : ""}`}
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          minHeight: anchorRect?.height ? `${anchorRect.height}px` : undefined,
          ...modalSizingStyle,
        }}
      >
        <div className="question-modal-header" onPointerDown={handleDragStart}>
          <h3>{title}</h3>
          <span className="question-modal-drag-hint">클릭 후 이동 가능합니다</span>
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
          <p className="question-modal-prompt"><RichText>{displayPrompt}</RichText></p>
          <div className="question-modal-choices">
            {visibleMark ? <div className={`question-modal-mark ${visibleMark}`} /> : null}
            {displayChoices
              .filter((choice) => !disabledChoiceIds || !disabledChoiceIds.includes(choice.id))
              .map((choice) => {
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
                    <span><RichText>{choice.text}</RichText></span>
                  </button>
                );
              })}
          </div>
          {displayFooter ? <div className="question-modal-footer">{displayFooter}</div> : null}
        </div>
      </div>
    </div>
  );

  if (!portalTarget) return modalContent;
  return createPortal(modalContent, portalTarget);
}

export default QuestionModal;
