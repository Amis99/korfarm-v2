import { useEffect, useMemo, useRef, useState } from "react";
import RichText from "../../utils/RichText";
import PassageMarkdown from "../../utils/PassageMarkdown";

/**
 * ChoiceAnalysisCore — 선택지 분석 1문제 단위의 인터랙션 컴포넌트
 *
 * 단일 모듈(농장)과 DailyQuiz Q10에서 공통으로 사용.
 *
 * Props:
 *   question: 신 양식 CHOICE_ANALYSIS 문제
 *     {
 *       stem: string,
 *       passage: { paragraphs: [{ id, sentences: [{ id, text }] }] },
 *       choices: [{ choiceId, text, evidenceSentenceIds, matchMode, expectedOX }],
 *       scoring: { correctDeltaSec, wrongDeltaSec }
 *     }
 *   onComplete(): 문제 5개 선택지 모두 통과 시 호출
 *   adjustTime(delta): 시간 가감
 *   recordAnswer(entry): 답변 기록
 *
 * 옛 형식 감지: passage가 paragraphs+tokens 구조면 옛 형식, 안내 메시지 표시
 *
 * 인터랙션:
 *   1. 선택지 클릭 → 활성화
 *   2. 지문 문장 클릭 → 모달 (O/X 묻기)
 *   3. OX 선택 → 정답이면 통과 (ANY) 또는 다음 근거 (ALL)
 *   4. 5개 모두 통과 → onComplete
 *
 * 잘못된 문장 클릭 시 흔들림 + 페널티
 * 무한 재시도 (정답 맞출 때까지)
 */

const isLegacyFormat = (passage) => {
  if (!passage || typeof passage !== "object") return true;
  // 신 형식: paragraphs[].sentences[]
  // 옛 형식: paragraphs[] + tokens[]
  if (Array.isArray(passage.tokens)) return true;
  const ps = passage.paragraphs || [];
  if (ps.length === 0) return true;
  // 신 형식이면 적어도 하나의 paragraph가 sentences를 가져야 함
  return !ps.some((p) => Array.isArray(p.sentences));
};

export default function ChoiceAnalysisCore({
  question,
  onComplete,
  adjustTime,
  recordAnswer,
}) {
  const passage = question?.passage || {};
  const choices = useMemo(() => question?.choices || [], [question]);
  const scoring = question?.scoring || { correctDeltaSec: 20, wrongDeltaSec: -40 };
  const legacy = isLegacyFormat(passage);

  // 활성 선택지 ID
  const [activeChoiceId, setActiveChoiceId] = useState(null);
  // 통과한 선택지 ID들
  const [passedChoices, setPassedChoices] = useState(() => new Set());
  // 활성 선택지에서 이미 정답 처리한 근거 문장 ID들 (ALL 모드용)
  const [confirmedSentences, setConfirmedSentences] = useState(() => new Set());
  // 잘못 클릭한 문장 ID (흔들림용)
  const [shakeSentenceId, setShakeSentenceId] = useState(null);
  // 모달 상태
  const [modalState, setModalState] = useState(null); // { sentenceId, sentenceText, choiceText }
  // 모달 OX 선택 후 즉시 피드백
  const [modalFeedback, setModalFeedback] = useState(null); // "correct" | "wrong"

  const shakeTimerRef = useRef(null);
  const feedbackTimerRef = useRef(null);

  // 문제가 바뀔 때 상태 리셋
  useEffect(() => {
    setActiveChoiceId(null);
    setPassedChoices(new Set());
    setConfirmedSentences(new Set());
    setShakeSentenceId(null);
    setModalState(null);
    setModalFeedback(null);
  }, [question]);

  // 클린업
  useEffect(() => () => {
    if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
  }, []);

  if (!question) return null;
  if (legacy) {
    return (
      <div className="ca-legacy-warn">
        <h3>옛 형식 콘텐츠</h3>
        <p>이 문항은 이전 버전 선택지 분석 형식입니다. 신 형식(<code>paragraphs[].sentences[]</code> +
          <code>evidenceSentenceIds</code>)으로 재출제해 주세요.</p>
      </div>
    );
  }

  // 모든 문장을 평면화 (paragraphId 순서 유지)
  const allSentences = [];
  (passage.paragraphs || []).forEach((p) => {
    (p.sentences || []).forEach((s) => {
      allSentences.push({ ...s, paragraphId: p.id });
    });
  });

  const sentenceById = (id) => allSentences.find((s) => s.id === id);

  const activeChoice = choices.find((c) => c.choiceId === activeChoiceId);

  // 선택지 클릭 (이미 통과한 건 비활성)
  const handleChoiceClick = (cid) => {
    if (passedChoices.has(cid)) return;
    setActiveChoiceId(cid);
    setConfirmedSentences(new Set());
  };

  // 문장 클릭
  const handleSentenceClick = (sid) => {
    if (!activeChoice) {
      // 선택지를 안 골랐으면 흔들림으로 안내
      flashShake(sid);
      return;
    }
    const evidenceIds = activeChoice.evidenceSentenceIds || [];
    const isEvidence = evidenceIds.includes(sid);

    if (!isEvidence) {
      // 잘못된 문장 → 흔들림 + 페널티
      adjustTime(-10);
      recordAnswer({
        id: `${question.id}-${activeChoice.choiceId}-wrong-${sid}`,
        correct: false,
        questionKind: question.questionKind,
      });
      flashShake(sid);
      return;
    }

    // ALL 모드에서 이미 확인한 문장이면 무시
    if (activeChoice.matchMode === "ALL" && confirmedSentences.has(sid)) {
      return;
    }

    // 모달 띄우기
    const sent = sentenceById(sid);
    setModalState({
      sentenceId: sid,
      sentenceText: sent?.text || "",
      choiceText: activeChoice.text,
      choiceId: activeChoice.choiceId,
      expectedOX: activeChoice.expectedOX,
    });
    setModalFeedback(null);
  };

  const flashShake = (sid) => {
    setShakeSentenceId(sid);
    if (shakeTimerRef.current) clearTimeout(shakeTimerRef.current);
    shakeTimerRef.current = setTimeout(() => setShakeSentenceId(null), 600);
  };

  // 모달에서 OX 선택
  const handleModalAnswer = (ox) => {
    if (!modalState) return;
    const isCorrect = ox === modalState.expectedOX;
    adjustTime(isCorrect ? scoring.correctDeltaSec : scoring.wrongDeltaSec);
    recordAnswer({
      id: `${question.id}-${modalState.choiceId}-${modalState.sentenceId}-${ox}`,
      correct: isCorrect,
      questionKind: question.questionKind,
    });

    if (!isCorrect) {
      // 무한 재시도 — 모달은 그대로, 피드백만 표시 후 사라짐
      setModalFeedback("wrong");
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = setTimeout(() => setModalFeedback(null), 800);
      return;
    }

    // 정답 → 모달 닫기, 활성 선택지 진행
    setModalFeedback("correct");
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => {
      setModalFeedback(null);
      setModalState(null);

      const evidenceIds = activeChoice.evidenceSentenceIds || [];
      if (activeChoice.matchMode === "ALL") {
        // 이 문장 통과 추가
        const nextConfirmed = new Set(confirmedSentences);
        nextConfirmed.add(modalState.sentenceId);
        setConfirmedSentences(nextConfirmed);
        // 모든 evidence를 다 처리했으면 선택지 통과
        if (evidenceIds.every((id) => nextConfirmed.has(id))) {
          completeChoice(activeChoice.choiceId);
        }
      } else {
        // ANY 모드: 첫 정답으로 즉시 선택지 통과
        completeChoice(activeChoice.choiceId);
      }
    }, 600);
  };

  const completeChoice = (cid) => {
    const next = new Set(passedChoices);
    next.add(cid);
    setPassedChoices(next);
    setActiveChoiceId(null);
    setConfirmedSentences(new Set());
    // 5개 모두 통과 시
    if (next.size >= choices.length) {
      setTimeout(() => onComplete && onComplete(), 400);
    }
  };

  const handleModalClose = () => {
    setModalState(null);
    setModalFeedback(null);
  };

  return (
    <div className="ca-module">
      <div className="ca-stem">
        <RichText>{question.stem || ""}</RichText>
      </div>

      <div className="ca-progress-bar">
        <span>{passedChoices.size} / {choices.length} 선택지 처리 완료</span>
        {activeChoice && activeChoice.matchMode === "ALL" && (
          <span className="ca-all-progress">
            (ALL · {confirmedSentences.size} / {(activeChoice.evidenceSentenceIds || []).length})
          </span>
        )}
      </div>

      <div className="ca-split">
        {/* 좌측: 지문 (문장 클릭 가능) */}
        <div className="ca-passage-pane">
          <div className="ca-passage-label">지문</div>
          <div className="ca-passage-body">
            {(passage.paragraphs || []).map((p) => (
              <p key={p.id} className="ca-paragraph">
                {(p.sentences || []).map((s) => {
                  const isShake = shakeSentenceId === s.id;
                  const isConfirmed = confirmedSentences.has(s.id);
                  const isClickable = !!activeChoice;
                  return (
                    <span
                      key={s.id}
                      className={`ca-sentence ${isClickable ? "clickable" : ""} ${isShake ? "shake" : ""} ${isConfirmed ? "confirmed" : ""}`}
                      onClick={() => handleSentenceClick(s.id)}
                    >
                      <RichText>{s.text}</RichText>
                      {isConfirmed && <span className="ca-sentence-check">✓</span>}
                    </span>
                  );
                })}
              </p>
            ))}
          </div>
        </div>

        {/* 우측: 선택지 5개 */}
        <div className="ca-choices-pane">
          <div className="ca-passage-label">선택지</div>
          {choices.map((c, i) => {
            const isActive = c.choiceId === activeChoiceId;
            const isPassed = passedChoices.has(c.choiceId);
            return (
              <button
                key={c.choiceId}
                type="button"
                className={`ca-choice ${isActive ? "active" : ""} ${isPassed ? "passed" : ""}`}
                onClick={() => handleChoiceClick(c.choiceId)}
                disabled={isPassed}
              >
                <span className="ca-choice-num">{i + 1}</span>
                <span className="ca-choice-text">
                  <RichText>{c.text}</RichText>
                </span>
                {isPassed && (
                  <span className="ca-choice-mark passed">✓</span>
                )}
                {isActive && !isPassed && (
                  <span className="ca-choice-mark active">▶</span>
                )}
              </button>
            );
          })}
          {!activeChoiceId && passedChoices.size < choices.length && (
            <div className="ca-hint">선택지를 클릭한 뒤 지문에서 근거 문장을 찾아 클릭하세요.</div>
          )}
        </div>
      </div>

      {/* OX 모달 */}
      {modalState && (
        <div className="ca-modal-overlay" onClick={handleModalClose}>
          <div className="ca-modal" onClick={(e) => e.stopPropagation()}>
            <div className="ca-modal-title">이 진술은 지문과 일치하나요?</div>
            <div className="ca-modal-body">
              <div className="ca-modal-section">
                <div className="ca-modal-label">선택지</div>
                <div className="ca-modal-text choice"><RichText>{modalState.choiceText}</RichText></div>
              </div>
              <div className="ca-modal-arrow">↕</div>
              <div className="ca-modal-section">
                <div className="ca-modal-label">근거 문장</div>
                <div className="ca-modal-text sentence">{modalState.sentenceText}</div>
              </div>
            </div>
            {modalFeedback === "wrong" && (
              <div className="ca-modal-feedback wrong">다시 생각해 보세요</div>
            )}
            {modalFeedback === "correct" && (
              <div className="ca-modal-feedback correct">정답!</div>
            )}
            <div className="ca-modal-actions">
              <button
                type="button"
                className="ca-modal-ox-btn ca-ox-O"
                onClick={() => handleModalAnswer("O")}
                disabled={modalFeedback === "correct"}
              >
                O<br />
                <span className="ca-ox-sub">일치</span>
              </button>
              <button
                type="button"
                className="ca-modal-ox-btn ca-ox-X"
                onClick={() => handleModalAnswer("X")}
                disabled={modalFeedback === "correct"}
              >
                X<br />
                <span className="ca-ox-sub">불일치</span>
              </button>
            </div>
            <button
              type="button"
              className="ca-modal-cancel"
              onClick={handleModalClose}
              disabled={modalFeedback === "correct"}
            >
              취소 (다른 문장 선택)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// 옛 형식 감지 export (다른 곳에서 재사용)
export { isLegacyFormat };
