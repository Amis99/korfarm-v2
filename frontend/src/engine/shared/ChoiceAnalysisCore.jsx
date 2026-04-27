import { useEffect, useMemo, useRef, useState } from "react";
import RichText from "../../utils/RichText";

/**
 * ChoiceAnalysisCore — 선택지 분석(CHOICE_OX / CHOICE_ANALYSIS) 1문제 단위 인터랙션.
 *
 * 단일 모듈(농장)과 DailyQuiz Q10 에서 공통 사용.
 *
 * 학습 흐름 (구형식, 사용자 의도):
 *   1) 지문 표시 — paragraphs[].text + tokens[] (token 단위 클릭 가능)
 *   2) 5개 선택지 노출
 *   3) 선택지 클릭 → 그 선택지의 propositions[] (명제 1~N개) 활성
 *   4) 명제별 처리:
 *      a) 명제 텍스트 + OX 모달 표시
 *      b) 학생이 OX 클릭 → propositions[i].oxAnswer 와 비교
 *      c) 정답이면 다음 단계 (token 클릭), 오답이면 페널티 + 재시도
 *      d) token 클릭 단계 — 학생이 evidenceTokens 의 token 들을 클릭
 *         · matchMode === "ALL": 모든 evidenceTokens 클릭해야 통과
 *         · matchMode === "ANY": 한 개만 클릭해도 통과
 *      e) 통과 → 다음 명제 (또는 선택지 분석 완료)
 *   5) 5개 선택지 모두 분석 완료 → 최종 선택 단계 (phase="final")
 *   6) 학생이 finalIsCorrectChoice === true 인 선택지를 클릭해야 정답
 *
 * Props:
 *   question: 구형식 CHOICE_OX 문제
 *   onComplete(): 최종 정답 통과 시 호출
 *   adjustTime(delta): 시간 가감
 *   recordAnswer(entry): 답변 기록
 */

export default function ChoiceAnalysisCore({
  question,
  onComplete,
  adjustTime,
  recordAnswer,
}) {
  const passage = question?.passage || {};
  const choices = useMemo(() => question?.choices || [], [question]);
  const tokens = useMemo(() => passage.tokens || [], [passage]);
  const paragraphs = passage.paragraphs || [];
  const scoring = question?.scoring || { correctDeltaSec: 20, wrongDeltaSec: -40 };

  const tokenById = (tid) => tokens.find((t) => t.tokenId === tid);

  // ─── 상태 ───
  // phase: "analysis" — 명제별 OX + token 분석
  //        "final"    — 최종 선택지 1개 클릭
  //        "done"     — 정답 통과
  const [phase, setPhase] = useState("analysis");

  // 활성 선택지·명제·서브단계
  const [activeChoiceId, setActiveChoiceId] = useState(null);
  const [activePropIdx, setActivePropIdx] = useState(0);
  // "ox" — OX 모달, "tokens" — 지문에서 evidence token 클릭
  const [propStep, setPropStep] = useState("ox");

  // 분석 완료한 선택지 ID 들
  const [analyzedChoices, setAnalyzedChoices] = useState(() => new Set());

  // 활성 명제 내에서 이미 정답 클릭한 token 들 (ALL 모드)
  const [confirmedTokens, setConfirmedTokens] = useState(() => new Set());

  // 잘못 클릭한 token (흔들림)
  const [shakeTokenId, setShakeTokenId] = useState(null);
  // 잘못 클릭한 선택지 (final 단계)
  const [shakeChoiceId, setShakeChoiceId] = useState(null);
  // OX 모달 즉시 피드백
  const [oxFeedback, setOxFeedback] = useState(null); // "correct" | "wrong"

  const shakeTimerRef = useRef(null);
  const oxFeedbackTimerRef = useRef(null);

  // 문제 바뀌면 리셋
  useEffect(() => {
    setPhase("analysis");
    setActiveChoiceId(null);
    setActivePropIdx(0);
    setPropStep("ox");
    setAnalyzedChoices(new Set());
    setConfirmedTokens(new Set());
    setShakeTokenId(null);
    setShakeChoiceId(null);
    setOxFeedback(null);
  }, [question]);

  useEffect(() => () => {
    if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    if (oxFeedbackTimerRef.current) clearTimeout(oxFeedbackTimerRef.current);
  }, []);

  if (!question) return null;

  // 활성 선택지·명제 객체
  const activeChoice = choices.find((c) => c.choiceId === activeChoiceId);
  const activeProposition = activeChoice?.propositions?.[activePropIdx] || null;

  // ─── 핸들러 ───

  const flashShakeToken = (tid) => {
    setShakeTokenId(tid);
    if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    shakeTimerRef.current = setTimeout(() => setShakeTokenId(null), 500);
  };

  const flashShakeChoice = (cid) => {
    setShakeChoiceId(cid);
    if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    shakeTimerRef.current = setTimeout(() => setShakeChoiceId(null), 500);
  };

  // 선택지 클릭 (analysis phase)
  const handleChoiceClick = (cid) => {
    if (phase !== "analysis") return;
    if (analyzedChoices.has(cid)) return; // 이미 분석된 건 비활성
    if (activeChoiceId === cid) return;
    setActiveChoiceId(cid);
    setActivePropIdx(0);
    setPropStep("ox");
    setConfirmedTokens(new Set());
  };

  // 명제 OX 클릭
  const handleOxClick = (ox) => {
    if (!activeProposition) return;
    const isCorrect = ox === activeProposition.oxAnswer;
    adjustTime(isCorrect ? scoring.correctDeltaSec : scoring.wrongDeltaSec);
    recordAnswer({
      id: `${question.id}-${activeChoice.choiceId}-${activeProposition.propId}-${ox}`,
      correct: isCorrect,
      questionKind: question.questionKind,
    });
    if (!isCorrect) {
      // 무한 재시도: 모달 그대로 두고 피드백만
      setOxFeedback("wrong");
      if (oxFeedbackTimerRef.current) clearTimeout(oxFeedbackTimerRef.current);
      oxFeedbackTimerRef.current = setTimeout(() => setOxFeedback(null), 800);
      return;
    }
    // 정답 → token 클릭 단계로 진행
    setOxFeedback("correct");
    if (oxFeedbackTimerRef.current) clearTimeout(oxFeedbackTimerRef.current);
    oxFeedbackTimerRef.current = setTimeout(() => {
      setOxFeedback(null);
      setPropStep("tokens");
    }, 600);
  };

  // 명제 통과 → 다음 명제 또는 선택지 분석 완료
  const advanceAfterToken = () => {
    const props = activeChoice?.propositions || [];
    if (activePropIdx + 1 < props.length) {
      // 다음 명제
      setActivePropIdx(activePropIdx + 1);
      setPropStep("ox");
      setConfirmedTokens(new Set());
      return;
    }
    // 모든 명제 처리 → 선택지 분석 완료
    const next = new Set(analyzedChoices);
    next.add(activeChoice.choiceId);
    setAnalyzedChoices(next);
    setActiveChoiceId(null);
    setActivePropIdx(0);
    setPropStep("ox");
    setConfirmedTokens(new Set());
    // 5개 모두 분석 완료 → final phase
    if (next.size >= choices.length) {
      setTimeout(() => setPhase("final"), 300);
    }
  };

  // token 클릭 (propStep === "tokens" 일 때)
  const handleTokenClick = (tid) => {
    if (phase !== "analysis" || propStep !== "tokens" || !activeProposition) return;
    const evidenceTokens = activeProposition.evidenceTokens || [];
    const isEvidence = evidenceTokens.includes(tid);
    if (!isEvidence) {
      adjustTime(-10);
      recordAnswer({
        id: `${question.id}-${activeChoice.choiceId}-${activeProposition.propId}-wrong-${tid}`,
        correct: false,
        questionKind: question.questionKind,
      });
      flashShakeToken(tid);
      return;
    }
    if (confirmedTokens.has(tid)) return; // 이미 클릭한 token

    const matchMode = activeProposition.matchMode || "ALL";
    if (matchMode === "ANY") {
      advanceAfterToken();
      return;
    }
    // ALL: 모두 클릭해야 통과
    const next = new Set(confirmedTokens);
    next.add(tid);
    setConfirmedTokens(next);
    if (evidenceTokens.every((t) => next.has(t))) {
      advanceAfterToken();
    }
  };

  // 최종 선택지 클릭 (phase === "final")
  const handleFinalChoiceClick = (cid) => {
    if (phase !== "final") return;
    const choice = choices.find((c) => c.choiceId === cid);
    if (!choice) return;
    const isFinal = choice.finalIsCorrectChoice === true;
    adjustTime(isFinal ? scoring.correctDeltaSec : scoring.wrongDeltaSec);
    recordAnswer({
      id: `${question.id}-final-${cid}`,
      correct: isFinal,
      questionKind: question.questionKind,
    });
    if (!isFinal) {
      flashShakeChoice(cid);
      return;
    }
    setPhase("done");
    setTimeout(() => onComplete && onComplete(), 400);
  };

  // ─── 렌더 ───

  const totalProps = activeChoice?.propositions?.length || 0;
  const renderedTokens = tokens.length > 0 ? tokens : null;

  return (
    <div className="ca-module">
      <div className="ca-stem">
        <RichText>{question.stem || ""}</RichText>
      </div>

      <div className="ca-progress-bar">
        {phase === "analysis" && (
          <span>
            {analyzedChoices.size} / {choices.length} 선택지 분석 완료
            {activeChoice && totalProps > 1 && (
              <span className="ca-prop-progress">
                {" "}· 명제 {activePropIdx + 1} / {totalProps}
              </span>
            )}
          </span>
        )}
        {phase === "final" && <span>최종 정답을 1개 선택하세요.</span>}
        {phase === "done" && <span className="ca-done-mark">정답!</span>}
      </div>

      <div className="ca-split">
        {/* 좌측: 지문 */}
        <div className="ca-passage-pane">
          <div className="ca-passage-label">지문</div>
          <div className="ca-passage-body">
            {/* 단락별 본문은 그대로 + token 별도 클릭 가능 영역 */}
            {paragraphs.map((p) => (
              <p key={p.id} className="ca-paragraph">
                {p.text}
              </p>
            ))}
            {renderedTokens && (
              <div className="ca-tokens">
                <div className="ca-tokens-label">근거 단위</div>
                <div className="ca-tokens-list">
                  {renderedTokens.map((t) => {
                    const isShake = shakeTokenId === t.tokenId;
                    const isConfirmed = confirmedTokens.has(t.tokenId);
                    const isClickable = phase === "analysis" && propStep === "tokens";
                    return (
                      <span
                        key={t.tokenId}
                        className={`ca-token ${isClickable ? "clickable" : ""} ${isShake ? "shake" : ""} ${isConfirmed ? "confirmed" : ""}`}
                        onClick={() => handleTokenClick(t.tokenId)}
                      >
                        <RichText>{t.text}</RichText>
                        {isConfirmed && <span className="ca-token-check">✓</span>}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 우측: 선택지 5개 */}
        <div className="ca-choices-pane">
          <div className="ca-passage-label">
            {phase === "final" ? "최종 정답을 고르세요" : "선택지"}
          </div>
          {choices.map((c, i) => {
            const isAnalyzed = analyzedChoices.has(c.choiceId);
            const isActiveAnalysis = phase === "analysis" && c.choiceId === activeChoiceId;
            const isShake = shakeChoiceId === c.choiceId;
            const isCorrectFinal = phase === "done" && c.finalIsCorrectChoice;
            const disabled =
              (phase === "analysis" && isAnalyzed) ||
              (phase === "final" && false) ||
              phase === "done";
            return (
              <button
                key={c.choiceId}
                type="button"
                className={`ca-choice ${isActiveAnalysis ? "active" : ""} ${isAnalyzed ? "analyzed" : ""} ${isShake ? "shake" : ""} ${isCorrectFinal ? "final-correct" : ""}`}
                onClick={() =>
                  phase === "final"
                    ? handleFinalChoiceClick(c.choiceId)
                    : handleChoiceClick(c.choiceId)
                }
                disabled={disabled}
              >
                <span className="ca-choice-num">{i + 1}</span>
                <span className="ca-choice-text">
                  <RichText>{c.text}</RichText>
                </span>
                {isAnalyzed && phase === "analysis" && (
                  <span className="ca-choice-mark passed">✓</span>
                )}
                {isActiveAnalysis && (
                  <span className="ca-choice-mark active">▶</span>
                )}
                {isCorrectFinal && (
                  <span className="ca-choice-mark final">✓ 정답</span>
                )}
              </button>
            );
          })}
          {phase === "analysis" && !activeChoiceId && analyzedChoices.size < choices.length && (
            <div className="ca-hint">선택지를 클릭하여 명제를 분석하세요.</div>
          )}
          {phase === "analysis" && activeChoice && propStep === "tokens" && (
            <div className="ca-hint">
              명제의 근거가 되는 <strong>근거 단위</strong>를 지문에서 클릭하세요.
              {activeProposition?.matchMode === "ALL" && (
                <span> (모두: {confirmedTokens.size} / {(activeProposition?.evidenceTokens || []).length})</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* OX 모달 (analysis phase, propStep === "ox") */}
      {phase === "analysis" && activeProposition && propStep === "ox" && (
        <div className="ca-modal-overlay">
          <div className="ca-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ca-modal-title">
              명제 {activePropIdx + 1}{totalProps > 1 ? ` / ${totalProps}` : ""} — 지문과 일치하나요?
            </div>
            <div className="ca-modal-body">
              <div className="ca-modal-section">
                <div className="ca-modal-label">선택지 {choices.findIndex(c => c.choiceId === activeChoiceId) + 1}</div>
                <div className="ca-modal-text choice"><RichText>{activeChoice?.text || ""}</RichText></div>
              </div>
              <div className="ca-modal-arrow">↓</div>
              <div className="ca-modal-section">
                <div className="ca-modal-label">검증 명제</div>
                <div className="ca-modal-text proposition"><RichText>{activeProposition.text || ""}</RichText></div>
              </div>
            </div>
            {oxFeedback === "wrong" && (
              <div className="ca-modal-feedback wrong">다시 생각해 보세요</div>
            )}
            {oxFeedback === "correct" && (
              <div className="ca-modal-feedback correct">정답! 이제 근거 위치를 찾아주세요.</div>
            )}
            <div className="ca-modal-actions">
              <button
                type="button"
                className="ca-modal-ox-btn ca-ox-O"
                onClick={() => handleOxClick("O")}
                disabled={oxFeedback === "correct"}
              >
                O<br />
                <span className="ca-ox-sub">일치</span>
              </button>
              <button
                type="button"
                className="ca-modal-ox-btn ca-ox-X"
                onClick={() => handleOxClick("X")}
                disabled={oxFeedback === "correct"}
              >
                X<br />
                <span className="ca-ox-sub">불일치</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
