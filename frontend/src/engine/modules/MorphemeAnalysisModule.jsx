import { useEffect, useMemo, useRef, useState } from "react";
import { useEngine } from "../core/EngineContext";
import QuestionModal from "../shared/QuestionModal";
import { FEEDBACK } from "../shared/feedbackTimings";

/**
 * 형태소 분석 학습 모듈
 * 4단계: COUNTING → SPLITTING → NAMING → TYPING
 * 문장 5개를 순차 학습
 */
function MorphemeAnalysisModule({ content }) {
  const { adjustTime, recordAnswer, finish, start, status } = useEngine();
  const payload = content?.payload || {};
  const sentences = payload.sentences || [];
  const isAdvanced = content?.title?.includes("심화");

  const [sentIdx, setSentIdx] = useState(0);
  const [phase, setPhase] = useState("COUNTING"); // COUNTING | SPLITTING | NAMING | TYPING
  const [morphIdx, setMorphIdx] = useState(0);
  const [lastResult, setLastResult] = useState(null);
  const [feedbackDuration, setFeedbackDuration] = useState(FEEDBACK.A_CORRECT_ADVANCE_MS);
  const [statusMap, setStatusMap] = useState({}); // sentIdx → "correct"|"wrong"
  const [splitDone, setSplitDone] = useState(false); // 2단계 정답 후 분해 표시
  const resultTimer = useRef(null);
  const advanceTimer = useRef(null);

  const sent = sentences[sentIdx];
  const morphemes = sent?.morphemes || [];

  useEffect(() => {
    if (status === "READY") start();
  }, [status, start]);

  useEffect(() => () => {
    if (resultTimer.current) clearTimeout(resultTimer.current);
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
  }, []);

  const showFeedback = (result, duration) => {
    setLastResult(result);
    setFeedbackDuration(duration);
    if (resultTimer.current) clearTimeout(resultTimer.current);
    resultTimer.current = setTimeout(() => setLastResult(null), duration);
  };

  const markSentence = (result) => {
    setStatusMap((prev) => {
      const key = `${sentIdx}-${phase}`;
      if (prev[key] === "wrong") return prev; // 이미 틀렸으면 유지
      return { ...prev, [key]: result };
    });
  };

  // A 패턴: 정답 즉시 / 오답 3초
  const advanceTo = (nextPhase, nextMorphIdx = 0, delay = FEEDBACK.A_CORRECT_ADVANCE_MS) => {
    advanceTimer.current = setTimeout(() => {
      setPhase(nextPhase);
      setMorphIdx(nextMorphIdx);
      setLastResult(null);
    }, delay);
  };

  const advanceToNextSentence = (delay = FEEDBACK.A_CORRECT_ADVANCE_MS) => {
    advanceTimer.current = setTimeout(() => {
      if (sentIdx < sentences.length - 1) {
        setSentIdx((p) => p + 1);
        setPhase("COUNTING");
        setMorphIdx(0);
        setSplitDone(false);
        setLastResult(null);
      } else {
        finish(true);
      }
    }, delay);
  };

  // ─── 1단계: 형태소 개수 ───
  const handleCount = (choiceId) => {
    if (!sent) return;
    const isCorrect = Number(choiceId) === sent.countAnswer;
    adjustTime(isCorrect ? 20 : -20);
    recordAnswer({ id: `${sent.id}-count`, correct: isCorrect });
    if (!isCorrect) markSentence("wrong");
    else markSentence("correct");
    const delay = isCorrect ? FEEDBACK.A_CORRECT_ADVANCE_MS : FEEDBACK.A_WRONG_ADVANCE_MS;
    showFeedback(isCorrect ? "correct" : "wrong", delay);
    advanceTo("SPLITTING", 0, delay);
  };

  // ─── 2단계: 형태소 구분 ───
  const handleSplit = (choiceId) => {
    if (!sent) return;
    const isCorrect = choiceId === sent.splitAnswer;
    adjustTime(isCorrect ? 20 : -20);
    recordAnswer({ id: `${sent.id}-split`, correct: isCorrect });
    if (!isCorrect) markSentence("wrong");
    const delay = isCorrect ? FEEDBACK.A_CORRECT_ADVANCE_MS : FEEDBACK.A_WRONG_ADVANCE_MS;
    showFeedback(isCorrect ? "correct" : "wrong", delay);
    advanceTimer.current = setTimeout(() => {
      setSplitDone(true);
      setLastResult(null);
      setTimeout(() => {
        setPhase("NAMING");
        setMorphIdx(0);
      }, 400);
    }, delay);
  };

  // ─── 3단계: 형태소 이름 ───
  const handleName = (choiceId) => {
    const morph = morphemes[morphIdx];
    if (!morph) return;
    const correctName = isAdvanced ? morph.nameDetail : morph.name;
    const isCorrect = choiceId === correctName;
    adjustTime(isCorrect ? 10 : -10);
    recordAnswer({ id: `${sent.id}-name-${morphIdx}`, correct: isCorrect });
    if (!isCorrect) markSentence("wrong");
    const delay = isCorrect ? FEEDBACK.A_CORRECT_ADVANCE_MS : FEEDBACK.A_WRONG_ADVANCE_MS;
    showFeedback(isCorrect ? "correct" : "wrong", delay);
    advanceTo("TYPING", morphIdx, delay);
  };

  // ─── 4단계: 형태소 종류 ───
  const handleType = (choiceId) => {
    const morph = morphemes[morphIdx];
    if (!morph) return;
    const isCorrect = choiceId === morph.type;
    adjustTime(isCorrect ? 10 : -10);
    recordAnswer({ id: `${sent.id}-type-${morphIdx}`, correct: isCorrect });
    if (!isCorrect) markSentence("wrong");
    const delay = isCorrect ? FEEDBACK.A_CORRECT_ADVANCE_MS : FEEDBACK.A_WRONG_ADVANCE_MS;
    showFeedback(isCorrect ? "correct" : "wrong", delay);
    if (morphIdx < morphemes.length - 1) {
      advanceTo("NAMING", morphIdx + 1, delay);
    } else {
      advanceToNextSentence(delay);
    }
  };

  // ─── 선택지 생성 헬퍼 ───
  const shuffleArray = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const makeCountChoices = () => {
    if (!sent) return [];
    const counts = sent.countChoices || [];
    return counts.map((n) => ({ id: String(n), text: `${n}개` }));
  };

  const makeSplitChoices = () => {
    if (!sent) return [];
    return (sent.splitChoices || []).map((c) => ({ id: c.id, text: c.text }));
  };

  const NAME_POOL_BASIC = ["명사", "대명사", "수사", "동사", "형용사", "관형사", "부사", "감탄사", "조사", "어간", "어미", "접사"];
  const NAME_POOL_ADVANCED = [
    "보통 명사", "고유 명사", "의존 명사", "1인칭 대명사", "3인칭 대명사", "지시 대명사",
    "양수사", "서수사", "동사 어간", "형용사 어간", "보조 동사 어간",
    "주격 조사", "목적격 조사", "부사격 조사", "관형격 조사", "보조사", "접속 조사",
    "종결 어미", "연결 어미", "전성 어미", "선어말 어미",
    "파생 접두사", "파생 접미사", "어근",
  ];

  const nameChoices = useMemo(() => {
    const morph = morphemes[morphIdx];
    if (!morph) return [];
    const correct = isAdvanced ? morph.nameDetail : morph.name;
    const pool = isAdvanced ? NAME_POOL_ADVANCED : NAME_POOL_BASIC;
    const distractors = shuffleArray(pool.filter((n) => n !== correct)).slice(0, 3);
    const all = shuffleArray([correct, ...distractors]);
    return all.map((t) => ({ id: t, text: t }));
  }, [sentIdx, morphIdx, phase]);

  const TYPE_CHOICES = [
    { id: "실질 자립", text: "실질 자립" },
    { id: "실질 의존", text: "실질 의존" },
    { id: "형식 의존", text: "형식 의존" },
  ];

  // ─── 렌더링 ───
  if (!sent) return null;

  const renderSentenceDisplay = () => {
    if (splitDone && (phase === "NAMING" || phase === "TYPING")) {
      // 분해된 형태소 표시
      return (
        <div className="morpheme-split-display">
          {morphemes.map((m, i) => (
            <span
              key={i}
              className={`morpheme-chip ${i === morphIdx ? "active" : ""} ${i < morphIdx ? "done" : ""}`}
            >
              {m.form}
            </span>
          ))}
        </div>
      );
    }
    // 1~2단계: 문장 전체 하이라이트
    return (
      <div className="morpheme-sentence-highlight">
        {sent.text}
      </div>
    );
  };

  const getModalProps = () => {
    switch (phase) {
      case "COUNTING":
        return {
          title: `문장 ${sentIdx + 1} — 1단계`,
          prompt: "이 문장의 형태소는 몇 개인가요?",
          choices: makeCountChoices(),
          onSelect: handleCount,
          shuffleKey: `${sent.id}-count`,
          correctId: String(sent.countAnswer),
        };
      case "SPLITTING":
        return {
          title: `문장 ${sentIdx + 1} — 2단계`,
          prompt: "올바르게 형태소를 구분한 것을 고르세요.",
          choices: makeSplitChoices(),
          onSelect: handleSplit,
          shuffleKey: `${sent.id}-split`,
          correctId: sent.splitAnswer,
        };
      case "NAMING":
        return {
          title: `문장 ${sentIdx + 1} — 3단계`,
          prompt: `'${morphemes[morphIdx]?.form}'의 형태소 이름은?`,
          choices: nameChoices,
          onSelect: handleName,
          shuffleKey: `${sent.id}-name-${morphIdx}`,
          correctId: isAdvanced ? morphemes[morphIdx]?.nameDetail : morphemes[morphIdx]?.name,
        };
      case "TYPING":
        return {
          title: `문장 ${sentIdx + 1} — 4단계`,
          prompt: `'${morphemes[morphIdx]?.form}'의 형태소 종류는?`,
          choices: TYPE_CHOICES,
          onSelect: handleType,
          shuffleKey: `${sent.id}-type-${morphIdx}`,
          correctId: morphemes[morphIdx]?.type,
        };
      default:
        return null;
    }
  };

  const modal = getModalProps();

  return (
    <div className="morpheme-module">
      {status === "READY" ? (
        <div className="worksheet-start">
          <div className="worksheet-empty">형태소 분석을 시작합니다.</div>
          <button type="button" className="worksheet-start-btn" onClick={start}>
            학습 시작
          </button>
        </div>
      ) : (
        <>
          {/* 진행 표시 */}
          <div className="morpheme-header">
            <span>문장 {sentIdx + 1} / {sentences.length}</span>
            <span className="morpheme-phase-label">
              {phase === "COUNTING" && "1단계: 형태소 개수"}
              {phase === "SPLITTING" && "2단계: 형태소 구분"}
              {phase === "NAMING" && `3단계: 이름 (${morphIdx + 1}/${morphemes.length})`}
              {phase === "TYPING" && `4단계: 종류 (${morphIdx + 1}/${morphemes.length})`}
            </span>
          </div>

          {/* 문장 표시 영역 */}
          <div className="morpheme-display-area">
            {renderSentenceDisplay()}
          </div>

          {/* 문장별 상태 표시 */}
          <div className="morpheme-sentence-dots">
            {sentences.map((s, i) => (
              <span
                key={i}
                className={`morpheme-dot ${i === sentIdx ? "current" : ""} ${i < sentIdx ? "done" : ""}`}
              >
                {i + 1}
              </span>
            ))}
          </div>

          {/* 모달 */}
          {modal && (
            <QuestionModal
              title={modal.title}
              prompt={modal.prompt}
              choices={modal.choices}
              onSelect={modal.onSelect}
              mark={lastResult}
              shuffleKey={modal.shuffleKey}
              correctChoiceId={modal.correctId}
              feedbackDuration={feedbackDuration}
            />
          )}
        </>
      )}
    </div>
  );
}

export default MorphemeAnalysisModule;
