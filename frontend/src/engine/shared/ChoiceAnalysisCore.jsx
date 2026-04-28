import { useEffect, useMemo, useRef, useState } from "react";
import RichText from "../../utils/RichText";
import QuestionModal from "./QuestionModal";

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

  // 마지막 클릭한 선택지 anchorRect — 모달이 자연스럽게 그 카드 옆으로 이동
  const [anchorRect, setAnchorRect] = useState(null);

  // 클릭 위치에 띄우는 ⭕/❌ 플로팅 피드백
  // {x, y, kind: "correct"|"wrong"} | null
  const [clickFeedback, setClickFeedback] = useState(null);
  // 오답 시 정답 영역(들)을 일시 강조 (3초간 학습용 노출)
  const [revealEvidence, setRevealEvidence] = useState(false);

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
    setAnchorRect(null);
    setClickFeedback(null);
    setRevealEvidence(false);
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

  const handleChoiceClick = (cid, event) => {
    if (terminated) return;
    if (passedChoices.has(cid)) return;
    if (activeChoiceId === cid) return;
    if (event?.currentTarget?.getBoundingClientRect) {
      const r = event.currentTarget.getBoundingClientRect();
      setAnchorRect({ left: r.left, right: r.right, top: r.top, height: r.height });
    }
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

  const handleParagraphClick = (paragraphId, charIndex, clientX, clientY) => {
    if (terminated || step !== "evidence" || !activeProp) return;
    const matchedIdx = evidenceRanges.findIndex(
      (r) => r.paragraphId === paragraphId && charIndex >= r.start && charIndex < r.end,
    );
    if (matchedIdx < 0) {
      // 오답 영역 클릭 → 클릭 위치 ❌ + 정답 영역 3초 노출 + 학습 종료
      adjustTime(scoring.wrongDeltaSec);
      recordAnswer({
        id: `${question.id}-${activeChoice.choiceId}-${activeProp.propId}-evidence-wrong`,
        correct: false,
        questionKind: question.questionKind,
      });
      setClickFeedback({ x: clientX, y: clientY, kind: "wrong" });
      setRevealEvidence(true);
      setEvidenceFeedback("wrong");
      fail("evidence-wrong");
      return;
    }
    if (confirmedEvidenceIdx.has(matchedIdx)) return;
    // 정답 영역 클릭 → 즉시 그 range 전체를 confirmed 로 추가 (start~end 전 글자 하이라이트)
    const next = new Set(confirmedEvidenceIdx);
    next.add(matchedIdx);
    setConfirmedEvidenceIdx(next);
    setClickFeedback({ x: clientX, y: clientY, kind: "correct" });
    setEvidenceFeedback("correct");

    // 통과 조건
    const passed = matchMode === "ANY"
      ? next.size >= 1
      : next.size >= evidenceRanges.length;

    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      setEvidenceFeedback(null);
      setClickFeedback(null);
      if (!passed) return; // ALL 인데 아직 다 안 클릭 — 사용자가 다음 영역 계속 클릭

      // 명제 통과 → 다음 명제 또는 선택지 통과
      if (activePropIdx + 1 < totalProps) {
        setActivePropIdx(activePropIdx + 1);
        setStep("ox");
        setConfirmedEvidenceIdx(new Set());
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
      setAnchorRect(null);
      // 모든 선택지 통과 시 onComplete
      if (passedNext.size >= choices.length) {
        setTimeout(() => onComplete && onComplete(), 400);
      }
    }, CORRECT_FEEDBACK_MS);
  };

  // ─── QuestionModal 통합용 props 빌드 ───
  const choiceIdx = activeChoice ? choices.findIndex((c) => c.choiceId === activeChoiceId) : -1;
  const modalTitle = activeChoice
    ? `선택지 ${choiceIdx + 1} · 명제 ${activePropIdx + 1}${totalProps > 1 ? ` / ${totalProps}` : ""}`
    : "";
  const modalPrompt = (() => {
    if (!activeProp) return "";
    if (step === "ox") {
      return `**검증 명제** — ${activeProp.text}\n\n지문과 일치하나요?`;
    }
    const guide = matchMode === "ANY"
      ? "근거 부분을 한 군데만 정확히 클릭하세요."
      : `근거 부분을 모두 클릭하세요. (${confirmedEvidenceIdx.size} / ${evidenceRanges.length})`;
    return `**검증 명제** — ${activeProp.text}\n\n${guide}`;
  })();
  const modalChoices = step === "ox"
    ? [
        { id: "O", text: "**O** · 일치" },
        { id: "X", text: "**X** · 불일치" },
      ]
    : [];
  const modalMark = oxFeedback || evidenceFeedback || null;
  const modalShuffleKey = activeChoice
    ? `${question.id}-${activeChoiceId}-${activePropIdx}-${step}`
    : null;
  const modalFeedbackDur = (oxFeedback === "wrong" || evidenceFeedback === "wrong")
    ? WRONG_FEEDBACK_MS
    : CORRECT_FEEDBACK_MS;

  // ─── 마크다운 토큰 검출 (char offset 보존) ───
  // **굵게**, *기울이기*, ==하이라이트== 패턴 → styleMap[i] / tokenSet 으로 분리.
  // 토큰 char(**·*·==) 자체는 CSS 로 시각적으로 숨김 → evidenceRanges char index 그대로 보존.
  const computeMarkdownMaps = (text) => {
    const styleMap = {};
    const tokenSet = new Set();
    const addRange = (a, b, kind) => { for (let i = a; i < b; i += 1) if (!styleMap[i]) styleMap[i] = kind; };
    const addTokens = (a, b) => { for (let i = a; i < b; i += 1) tokenSet.add(i); };
    text.replace(/==([^=\n]+)==/g, (m, _g, idx) => {
      addRange(idx + 2, idx + m.length - 2, "highlight");
      addTokens(idx, idx + 2);
      addTokens(idx + m.length - 2, idx + m.length);
      return m;
    });
    text.replace(/\*\*([^*\n]+)\*\*/g, (m, _g, idx) => {
      addRange(idx + 2, idx + m.length - 2, "bold");
      addTokens(idx, idx + 2);
      addTokens(idx + m.length - 2, idx + m.length);
      return m;
    });
    text.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, (m, pre, _g, idx) => {
      const off = pre ? pre.length : 0;
      addRange(idx + off + 1, idx + m.length - 1, "italic");
      addTokens(idx + off, idx + off + 1);
      addTokens(idx + m.length - 1, idx + m.length);
      return m;
    });
    return { styleMap, tokenSet };
  };

  // ─── 단락 렌더링 (글자 단위, 활성 evidence + 마크다운 + 줄바꿈) ───
  const renderParagraph = (p) => {
    const text = p.text || "";
    const { styleMap, tokenSet } = computeMarkdownMaps(text);
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
          if (ch === "\n") return <br key={`${p.id}-${i}-br`} />;
          const isClickable = step === "evidence" && !terminated && activeChoice;
          const isConfirmed = confirmedSet.has(i);
          const isToken = tokenSet.has(i);
          const style = styleMap[i];
          const classes = ["ca-char"];
          if (isClickable) classes.push("clickable");
          if (isConfirmed) classes.push("confirmed");
          if (isToken) classes.push("md-token");
          if (style === "bold") classes.push("md-bold");
          if (style === "italic") classes.push("md-italic");
          if (style === "highlight") classes.push("md-highlight");
          // 오답 시 정답 영역 일시 노출 (revealEvidence=true 동안 evidenceRanges 강조)
          const isRevealed = revealEvidence && evidenceRanges.some(
            (r) => r.paragraphId === p.id && i >= r.start && i < r.end,
          );
          if (isRevealed) classes.push("reveal");
          return (
            <span
              key={`${p.id}-${i}`}
              className={classes.join(" ")}
              onClick={isClickable ? (e) => handleParagraphClick(p.id, i, e.clientX, e.clientY) : undefined}
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
        <span className="ca-progress-count">
          {passedChoices.size} / {choices.length} 선택지 통과
          {activeChoice && totalProps > 1 && (
            <span className="ca-prop-progress">
              {" "}· 명제 {activePropIdx + 1} / {totalProps}
            </span>
          )}
        </span>
        <span className="ca-progress-guide">
          {terminated
            ? "오답 — 학습 종료"
            : passedChoices.size >= choices.length
              ? "모든 선지 분석 완료"
              : !activeChoice
                ? "선택지를 클릭하세요."
                : step === "ox"
                  ? "명제의 OX를 판별하세요."
                  : "근거를 지문에서 찾으세요."}
        </span>
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
            // 선지의 적절성 = 모든 명제의 oxAnswer. 하나라도 X면 부적절(X), 모두 O면 적절(O)
            const choiceOx = (c.propositions || []).some((p) => p.oxAnswer === "X") ? "X" : "O";
            return (
              <button
                key={c.choiceId}
                type="button"
                className={`ca-choice ${isActive ? "active" : ""} ${isPassed ? "passed" : ""}`}
                onClick={(e) => handleChoiceClick(c.choiceId, e)}
                disabled={terminated || isPassed}
              >
                <span className="ca-choice-num">{i + 1}</span>
                <span className="ca-choice-text">
                  <RichText>{c.text}</RichText>
                </span>
                {/* 통과 후: 선지의 적절성(O/X) 표시 — O 4개 + X 1개 */}
                {isPassed && (
                  <span className={`ca-choice-ox ox-${choiceOx === "O" ? "yes" : "no"}`}>
                    {choiceOx}
                  </span>
                )}
                {isActive && !isPassed && <span className="ca-choice-mark active">▶</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* 1~9번 일일퀴즈와 동일한 QuestionModal — 명제·OX/안내·피드백을 모달 안에 통합 */}
      {activeChoice && !terminated && (
        <QuestionModal
          title={modalTitle}
          prompt={modalPrompt}
          choices={modalChoices}
          preShuffled
          onSelect={(id) => {
            if (step === "ox") handleOxClick(id);
          }}
          mark={modalMark}
          anchorRect={anchorRect}
          shuffleKey={modalShuffleKey}
          feedbackDuration={modalFeedbackDur}
        />
      )}

      {/* 클릭 위치 ⭕/❌ 플로팅 — viewport 좌표 기준 fixed */}
      {clickFeedback && (
        <div
          className={`ca-click-mark ca-click-${clickFeedback.kind}`}
          style={{ left: clickFeedback.x, top: clickFeedback.y }}
        >
          {clickFeedback.kind === "correct" ? "⭕" : "❌"}
        </div>
      )}
    </div>
  );
}
