import { useEffect, useMemo, useRef, useState } from "react";
import RichText from "../../utils/RichText";

/**
 * ChoiceAnalysisCore — CHOICE_COMPLEX_OX 학습 모듈.
 *
 * 학습 흐름:
 *   1) 좌측 지문 + 우측 선택지 (2~5개)
 *   2) 선택지 클릭 → 포스트잇 모달 (이동 가능)
 *      모달에 그 선택지의 1번 명제 + OX 버튼
 *   3) 학생 OX 클릭:
 *      · 정답 → 1초 연두 애니메이션 후 다음 단계 (근거 영역 클릭)
 *      · 오답 → 3초 빨강 애니메이션 후 학습 종료 (finish(false))
 *   4) 근거 영역 클릭 단계: 모달은 안내 문구로 변경, 학생은 지문에서 글자 영역 클릭
 *      · matchMode "ANY": 정답 영역 한 번만 클릭하면 통과
 *      · matchMode "ALL": 모든 정답 영역을 클릭해야 통과
 *      · 정답 영역 클릭 → 1초 하이라이트 + 다음 명제 (또는 선택지 통과)
 *      · 오답 영역 클릭 → 3초 흔들림 + 학습 종료
 *   5) 모든 명제 통과 → 선택지 통과 표시
 *   6) 모든 선택지 통과 → onComplete (정답 처리)
 *
 * Props:
 *   question: 새 CHOICE_COMPLEX_OX 스키마
 *     {
 *       passage: { paragraphs: [{ id, text }] },
 *       choices: [{
 *         choiceId, text,
 *         propositions: [{
 *           propId, text, oxAnswer ("O"|"X"),
 *           matchMode ("ANY"|"ALL"),
 *           evidenceRanges: [{ paragraphId, start, end }]
 *         }]
 *       }]
 *     }
 *   onComplete(): 모든 선택지 통과 시
 *   onFail():     오답 시 즉시 호출 (학습 종료)
 *   adjustTime(d), recordAnswer(entry)
 */

const CORRECT_FEEDBACK_MS = 1000;
const WRONG_FEEDBACK_MS = 3000;

export default function ChoiceAnalysisCore({
  question,
  onComplete,
  onFail,
  adjustTime,
  recordAnswer,
}) {
  const passage = question?.passage || {};
  const paragraphs = useMemo(() => passage.paragraphs || [], [passage]);
  // 선택지 셔플 — question.id 기준 useMemo (한 문제당 한 번만, 출제 순서 무관)
  const choices = useMemo(() => {
    const arr = [...(question?.choices || [])];
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question?.id]);
  const scoring = question?.scoring || { correctDeltaSec: 20, wrongDeltaSec: -40 };

  // ─── 상태 ───
  // passedChoices: 통과한 선택지 ID 들
  const [passedChoices, setPassedChoices] = useState(() => new Set());
  // 활성 선택지·명제
  const [activeChoiceId, setActiveChoiceId] = useState(null);
  const [activePropIdx, setActivePropIdx] = useState(0);
  // step: "ox"  — OX 모달
  //       "evidence" — 근거 영역 클릭
  const [step, setStep] = useState("ox");
  // 활성 명제에서 클릭 완료한 evidence range 인덱스 (ALL 모드용)
  const [confirmedEvidenceIdx, setConfirmedEvidenceIdx] = useState(() => new Set());
  // 클릭한 글자 위치 하이라이트 (시각용)
  // key: "paragraphId:start-end" → "correct" | "wrong"
  const [rangeHighlights, setRangeHighlights] = useState({});
  // 피드백
  const [oxFeedback, setOxFeedback] = useState(null); // "correct" | "wrong"
  const [evidenceFeedback, setEvidenceFeedback] = useState(null); // "correct" | "wrong"
  // 학습 종료됨 (onFail 호출 후)
  const [terminated, setTerminated] = useState(false);

  // 모달 위치 (드래그)
  const [modalPos, setModalPos] = useState({ x: null, y: null });
  const dragRef = useRef({ active: false, dx: 0, dy: 0 });

  const feedbackTimerRef = useRef(null);

  // 문제 변경 시 리셋
  useEffect(() => {
    setPassedChoices(new Set());
    setActiveChoiceId(null);
    setActivePropIdx(0);
    setStep("ox");
    setConfirmedEvidenceIdx(new Set());
    setRangeHighlights({});
    setOxFeedback(null);
    setEvidenceFeedback(null);
    setTerminated(false);
    setModalPos({ x: null, y: null });
  }, [question]);

  useEffect(() => () => {
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
  }, []);

  if (!question) return null;

  const activeChoice = choices.find((c) => c.choiceId === activeChoiceId) || null;
  const activeProp = activeChoice?.propositions?.[activePropIdx] || null;
  const totalProps = activeChoice?.propositions?.length || 0;
  const evidenceRanges = activeProp?.evidenceRanges || [];
  const matchMode = activeProp?.matchMode || "ALL";

  // ─── 핸들러 ───

  const fail = (reason) => {
    setTerminated(true);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      onFail && onFail(reason);
    }, WRONG_FEEDBACK_MS);
  };

  const handleChoiceClick = (cid) => {
    if (terminated) return;
    if (passedChoices.has(cid)) return;
    if (activeChoiceId === cid) return;
    setActiveChoiceId(cid);
    setActivePropIdx(0);
    setStep("ox");
    setConfirmedEvidenceIdx(new Set());
    setRangeHighlights({});
    setOxFeedback(null);
    setEvidenceFeedback(null);
  };

  const handleOxClick = (ox) => {
    if (terminated || !activeProp) return;
    const isCorrect = ox === activeProp.oxAnswer;
    adjustTime(isCorrect ? scoring.correctDeltaSec : scoring.wrongDeltaSec);
    recordAnswer({
      id: `${question.id}-${activeChoice.choiceId}-${activeProp.propId}-ox-${ox}`,
      correct: isCorrect,
      questionKind: question.questionKind,
    });
    if (!isCorrect) {
      setOxFeedback("wrong");
      fail("ox-wrong");
      return;
    }
    setOxFeedback("correct");
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      setOxFeedback(null);
      setStep("evidence");
    }, CORRECT_FEEDBACK_MS);
  };

  const handleParagraphClick = (paragraphId, charIndex) => {
    if (terminated || step !== "evidence" || !activeProp) return;
    // charIndex 가 어떤 evidenceRange 에 속하는지 확인
    const matchedIdx = evidenceRanges.findIndex(
      (r) => r.paragraphId === paragraphId && charIndex >= r.start && charIndex < r.end,
    );
    if (matchedIdx < 0) {
      // 오답 영역 클릭 → 학습 종료
      adjustTime(scoring.wrongDeltaSec);
      recordAnswer({
        id: `${question.id}-${activeChoice.choiceId}-${activeProp.propId}-evidence-wrong`,
        correct: false,
        questionKind: question.questionKind,
      });
      // 빨강 흔들림 (해당 글자 위치 표시 안 함, 그냥 화면 효과)
      setEvidenceFeedback("wrong");
      fail("evidence-wrong");
      return;
    }
    if (confirmedEvidenceIdx.has(matchedIdx)) return; // 이미 클릭한 영역
    // 정답 영역 클릭
    const r = evidenceRanges[matchedIdx];
    const key = `${r.paragraphId}:${r.start}-${r.end}`;
    setRangeHighlights((prev) => ({ ...prev, [key]: "correct" }));
    setEvidenceFeedback("correct");
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      setEvidenceFeedback(null);
      const next = new Set(confirmedEvidenceIdx);
      next.add(matchedIdx);
      setConfirmedEvidenceIdx(next);

      // 통과 조건
      const passed = matchMode === "ANY"
        ? next.size >= 1
        : next.size >= evidenceRanges.length;

      if (!passed) return; // ALL 인데 아직 다 안 클릭

      // 명제 통과 → 다음 명제 또는 선택지 통과
      if (activePropIdx + 1 < totalProps) {
        setActivePropIdx(activePropIdx + 1);
        setStep("ox");
        setConfirmedEvidenceIdx(new Set());
        setRangeHighlights({});
        return;
      }
      // 모든 명제 통과 → 선택지 통과
      adjustTime(scoring.correctDeltaSec);
      recordAnswer({
        id: `${question.id}-${activeChoice.choiceId}-passed`,
        correct: true,
        questionKind: question.questionKind,
      });
      const passedNext = new Set(passedChoices);
      passedNext.add(activeChoice.choiceId);
      setPassedChoices(passedNext);
      setActiveChoiceId(null);
      setActivePropIdx(0);
      setStep("ox");
      setConfirmedEvidenceIdx(new Set());
      setRangeHighlights({});
      setModalPos({ x: null, y: null });
      // 모든 선택지 통과 시 onComplete
      if (passedNext.size >= choices.length) {
        setTimeout(() => onComplete && onComplete(), 400);
      }
    }, CORRECT_FEEDBACK_MS);
  };

  // ─── 모달 드래그 ───
  const onModalDragStart = (e) => {
    const p = "touches" in e ? e.touches[0] : e;
    dragRef.current = { active: true, dx: p.clientX - (modalPos.x ?? 0), dy: p.clientY - (modalPos.y ?? 0) };
    document.addEventListener("mousemove", onModalDragMove);
    document.addEventListener("mouseup", onModalDragEnd);
    document.addEventListener("touchmove", onModalDragMove);
    document.addEventListener("touchend", onModalDragEnd);
  };
  const onModalDragMove = (e) => {
    if (!dragRef.current.active) return;
    const p = "touches" in e ? e.touches[0] : e;
    setModalPos({ x: p.clientX - dragRef.current.dx, y: p.clientY - dragRef.current.dy });
  };
  const onModalDragEnd = () => {
    dragRef.current.active = false;
    document.removeEventListener("mousemove", onModalDragMove);
    document.removeEventListener("mouseup", onModalDragEnd);
    document.removeEventListener("touchmove", onModalDragMove);
    document.removeEventListener("touchend", onModalDragEnd);
  };

  // ─── 단락 렌더링 (글자 단위, 활성 evidence 영역 색상) ───
  const renderParagraph = (p) => {
    const text = p.text || "";
    const len = text.length;
    // 어떤 글자 인덱스가 어떤 상태인지 미리 계산
    // 1) confirmed: 이미 정답 클릭한 영역 (활성 명제 한정)
    const confirmedSet = new Set();
    if (step === "evidence" && activeProp) {
      evidenceRanges.forEach((r, idx) => {
        if (r.paragraphId !== p.id) return;
        if (!confirmedEvidenceIdx.has(idx)) return;
        for (let i = r.start; i < r.end; i++) confirmedSet.add(i);
      });
    }
    return (
      <p key={p.id} className="ca-paragraph">
        {Array.from(text).map((ch, i) => {
          const isClickable = step === "evidence" && !terminated && activeChoice;
          const isConfirmed = confirmedSet.has(i);
          return (
            <span
              key={`${p.id}-${i}`}
              className={`ca-char ${isClickable ? "clickable" : ""} ${isConfirmed ? "confirmed" : ""}`}
              onClick={isClickable ? () => handleParagraphClick(p.id, i) : undefined}
            >
              {ch === " " ? " " : ch === "\n" ? "\n" : ch}
            </span>
          );
        })}
      </p>
    );
  };

  return (
    <div className={`ca-module ${terminated ? "terminated" : ""}`}>
      <div className="ca-stem">
        <RichText>{question.stem || ""}</RichText>
      </div>

      <div className="ca-progress-bar">
        <span>
          {passedChoices.size} / {choices.length} 선택지 통과
          {activeChoice && totalProps > 1 && (
            <span className="ca-prop-progress">
              {" "}· 명제 {activePropIdx + 1} / {totalProps}
            </span>
          )}
        </span>
        {terminated && <span className="ca-fail-mark">오답 — 학습 종료</span>}
      </div>

      <div className="ca-split">
        {/* 좌측: 지문 */}
        <div className="ca-passage-pane">
          <div className="ca-passage-label">지문</div>
          <div className={`ca-passage-body ${step === "evidence" ? "selecting" : ""}`}>
            {paragraphs.map(renderParagraph)}
          </div>
        </div>

        {/* 우측: 선택지 */}
        <div className="ca-choices-pane">
          <div className="ca-passage-label">선택지</div>
          {choices.map((c, i) => {
            const isPassed = passedChoices.has(c.choiceId);
            const isActive = c.choiceId === activeChoiceId;
            return (
              <button
                key={c.choiceId}
                type="button"
                className={`ca-choice ${isActive ? "active" : ""} ${isPassed ? "passed" : ""}`}
                onClick={() => handleChoiceClick(c.choiceId)}
                disabled={terminated || isPassed}
              >
                <span className="ca-choice-num">{i + 1}</span>
                <span className="ca-choice-text">
                  <RichText>{c.text}</RichText>
                </span>
                {isPassed && <span className="ca-choice-mark passed">✓</span>}
                {isActive && !isPassed && <span className="ca-choice-mark active">▶</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* 포스트잇 모달 (이동 가능) */}
      {activeChoice && !terminated && (
        <div
          className={`ca-postit ${oxFeedback ? `feedback-${oxFeedback}` : ""}`}
          style={
            modalPos.x != null && modalPos.y != null
              ? { left: modalPos.x, top: modalPos.y, transform: "none" }
              : undefined
          }
        >
          <div
            className="ca-postit-header"
            onMouseDown={onModalDragStart}
            onTouchStart={onModalDragStart}
          >
            <span className="ca-postit-title">
              선택지 {choices.findIndex((c) => c.choiceId === activeChoiceId) + 1} ·
              명제 {activePropIdx + 1}
              {totalProps > 1 ? ` / ${totalProps}` : ""}
            </span>
            <span className="ca-postit-drag-hint">이동 가능</span>
          </div>

          <div className="ca-postit-body">
            <div className="ca-postit-section">
              <div className="ca-postit-label">검증 명제</div>
              <div className="ca-postit-text">
                <RichText>{activeProp?.text || ""}</RichText>
              </div>
            </div>

            {step === "ox" && (
              <>
                <div className="ca-postit-question">지문과 일치하나요?</div>
                <div className="ca-postit-actions">
                  <button
                    type="button"
                    className="ca-ox-btn ca-ox-O"
                    onClick={() => handleOxClick("O")}
                    disabled={!!oxFeedback}
                  >
                    O<br /><span className="ca-ox-sub">일치</span>
                  </button>
                  <button
                    type="button"
                    className="ca-ox-btn ca-ox-X"
                    onClick={() => handleOxClick("X")}
                    disabled={!!oxFeedback}
                  >
                    X<br /><span className="ca-ox-sub">불일치</span>
                  </button>
                </div>
                {oxFeedback === "correct" && (
                  <div className="ca-postit-feedback correct">정답! 이제 근거 영역을 골라 주세요.</div>
                )}
                {oxFeedback === "wrong" && (
                  <div className="ca-postit-feedback wrong">오답! 학습이 종료됩니다.</div>
                )}
              </>
            )}

            {step === "evidence" && (
              <>
                <div className="ca-postit-question">
                  {matchMode === "ANY"
                    ? "근거 부분을 고르시오. (한 군데만 정확히)"
                    : `근거 부분을 모두 고르시오. (${confirmedEvidenceIdx.size} / ${evidenceRanges.length})`}
                </div>
                {evidenceFeedback === "correct" && (
                  <div className="ca-postit-feedback correct">정확! 다음 단계로 진행합니다.</div>
                )}
                {evidenceFeedback === "wrong" && (
                  <div className="ca-postit-feedback wrong">오답 영역입니다. 학습이 종료됩니다.</div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
