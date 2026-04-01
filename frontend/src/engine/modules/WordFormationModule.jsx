import { useEffect, useMemo, useRef, useState } from "react";
import { useEngine } from "../core/EngineContext";
import QuestionModal from "../shared/QuestionModal";

/**
 * 단어의 형성 학습 모듈 (기초+심화)
 *
 * 기초: 1~4단계 형태소 분석 → 동그라미/네모 표시 → 5단계 단일어/합성어/파생어
 * 심화: + 3개 이상 요소 시 결합 순서 분석 + 통사적/비통사적, 대등/종속/융합
 *
 * 단계:
 * COUNTING → SPLITTING → NAMING → TYPING → MARKING → FORMATION
 *   (심화: MARKING 후 MERGE_SELECT → MERGE_TYPE → ... 반복 → FORMATION)
 */
function WordFormationModule({ content }) {
  const { adjustTime, recordAnswer, finish, start, status } = useEngine();
  const payload = content?.payload || {};
  const words = payload.words || [];
  const isAdvanced = content?.title?.includes("심화");

  const [wordIdx, setWordIdx] = useState(0);
  const [phase, setPhase] = useState("COUNTING");
  const [morphIdx, setMorphIdx] = useState(0);
  const [splitDone, setSplitDone] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [wrongMap, setWrongMap] = useState({});
  // 심화: 결합 순서
  const [mergeStep, setMergeStep] = useState(0);
  const [mergedMorphemes, setMergedMorphemes] = useState(null);

  const resultTimer = useRef(null);
  const advanceTimer = useRef(null);

  const word = words[wordIdx];
  const morphemes = word?.morphemes || [];

  useEffect(() => { if (status === "READY") start(); }, [status, start]);
  useEffect(() => () => {
    if (resultTimer.current) clearTimeout(resultTimer.current);
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
  }, []);

  const showFeedback = (result) => {
    setLastResult(result);
    if (resultTimer.current) clearTimeout(resultTimer.current);
    resultTimer.current = setTimeout(() => setLastResult(null), 600);
  };

  const markWrong = () => {
    setWrongMap(prev => ({ ...prev, [`${wordIdx}-${phase}`]: true }));
  };

  const advanceTo = (nextPhase, nextMorphIdx = 0, delay = 500) => {
    advanceTimer.current = setTimeout(() => {
      setPhase(nextPhase);
      setMorphIdx(nextMorphIdx);
      setLastResult(null);
    }, delay);
  };

  const advanceToNextWord = () => {
    advanceTimer.current = setTimeout(() => {
      if (wordIdx < words.length - 1) {
        setWordIdx(p => p + 1);
        setPhase("COUNTING");
        setMorphIdx(0);
        setSplitDone(false);
        setMergeStep(0);
        setMergedMorphemes(null);
        setLastResult(null);
      } else {
        finish(true);
      }
    }, 500);
  };

  // ─── 1단계: 형태소 개수 ───
  const handleCount = (choiceId) => {
    const isCorrect = Number(choiceId) === word.countAnswer;
    adjustTime(isCorrect ? 20 : -20);
    recordAnswer({ id: `${word.id}-count`, correct: isCorrect });
    showFeedback(isCorrect ? "correct" : "wrong");
    if (!isCorrect) { markWrong(); return; }
    advanceTo("SPLITTING");
  };

  // ─── 2단계: 형태소 구분 ───
  const handleSplit = (choiceId) => {
    const isCorrect = choiceId === word.splitAnswer;
    adjustTime(isCorrect ? 20 : -20);
    recordAnswer({ id: `${word.id}-split`, correct: isCorrect });
    showFeedback(isCorrect ? "correct" : "wrong");
    if (!isCorrect) { markWrong(); return; }
    advanceTimer.current = setTimeout(() => {
      setSplitDone(true);
      setLastResult(null);
      setTimeout(() => { setPhase("NAMING"); setMorphIdx(0); }, 300);
    }, 500);
  };

  // ─── 3단계: 형태소 이름 ───
  const handleName = (choiceId) => {
    const morph = morphemes[morphIdx];
    const correct = isAdvanced ? morph.nameDetail : morph.name;
    const isCorrect = choiceId === correct;
    adjustTime(isCorrect ? 10 : -10);
    recordAnswer({ id: `${word.id}-name-${morphIdx}`, correct: isCorrect });
    showFeedback(isCorrect ? "correct" : "wrong");
    if (!isCorrect) { markWrong(); return; }
    advanceTo("TYPING", morphIdx);
  };

  // ─── 4단계: 형태소 종류 ───
  const handleType = (choiceId) => {
    const morph = morphemes[morphIdx];
    const isCorrect = choiceId === morph.type;
    adjustTime(isCorrect ? 10 : -10);
    recordAnswer({ id: `${word.id}-type-${morphIdx}`, correct: isCorrect });
    showFeedback(isCorrect ? "correct" : "wrong");
    if (!isCorrect) { markWrong(); return; }
    if (morphIdx < morphemes.length - 1) {
      advanceTo("NAMING", morphIdx + 1);
    } else {
      // 4단계 완료 → MARKING 표시 후 → FORMATION 또는 심화 MERGE
      advanceTo("FORMATION");
    }
  };

  // ─── 5단계: 단어 형성 유형 ───
  const handleFormation = (choiceId) => {
    const isCorrect = choiceId === word.formation;
    adjustTime(isCorrect ? 20 : -20);
    recordAnswer({ id: `${word.id}-formation`, correct: isCorrect });
    showFeedback(isCorrect ? "correct" : "wrong");
    if (!isCorrect) { markWrong(); return; }
    // 심화: 합성어면 통사적/비통사적 + 관계 유형
    if (isAdvanced && word.compoundInfo && word.formation === "합성어") {
      advanceTo("COMPOUND_SYNTACTIC");
    } else {
      advanceToNextWord();
    }
  };

  // ─── 심화: 통사적/비통사적 ───
  const handleSyntactic = (choiceId) => {
    const isCorrect = choiceId === word.compoundInfo?.syntactic;
    adjustTime(isCorrect ? 10 : -10);
    recordAnswer({ id: `${word.id}-syntactic`, correct: isCorrect });
    showFeedback(isCorrect ? "correct" : "wrong");
    if (!isCorrect) { markWrong(); return; }
    advanceTo("COMPOUND_RELATION");
  };

  // ─── 심화: 대등/종속/융합 ───
  const handleRelation = (choiceId) => {
    const isCorrect = choiceId === word.compoundInfo?.relation;
    adjustTime(isCorrect ? 10 : -10);
    recordAnswer({ id: `${word.id}-relation`, correct: isCorrect });
    showFeedback(isCorrect ? "correct" : "wrong");
    if (!isCorrect) { markWrong(); return; }
    advanceToNextWord();
  };

  // ─── 선택지 생성 ───
  const shuffleArray = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const NAME_POOL_BASIC = ["명사", "대명사", "수사", "동사", "형용사", "관형사", "부사", "감탄사", "조사", "어간", "어미", "접사", "어근"];
  const NAME_POOL_ADV = [
    "보통 명사", "고유 명사", "의존 명사", "대명사", "수 관형사", "성상 관형사",
    "동사 어간", "형용사 어간", "보조 동사 어간",
    "접두사", "접미사", "사동 접미사", "피동 접미사",
    "종결 어미", "연결 어미", "전성 어미", "선어말 어미",
    "주격 조사", "목적격 조사", "부사격 조사", "보조사",
  ];

  const nameChoices = useMemo(() => {
    const morph = morphemes[morphIdx];
    if (!morph) return [];
    const correct = isAdvanced ? morph.nameDetail : morph.name;
    const pool = isAdvanced ? NAME_POOL_ADV : NAME_POOL_BASIC;
    const distractors = shuffleArray(pool.filter(n => n !== correct)).slice(0, 3);
    return shuffleArray([correct, ...distractors]).map(t => ({ id: t, text: t }));
  }, [wordIdx, morphIdx, phase]);

  const TYPE_CHOICES = [
    { id: "실질 자립", text: "실질 자립" },
    { id: "실질 의존", text: "실질 의존" },
    { id: "형식 의존", text: "형식 의존" },
  ];

  const FORMATION_CHOICES = [
    { id: "단일어", text: "단일어" },
    { id: "합성어", text: "합성어" },
    { id: "파생어", text: "파생어" },
  ];

  // ─── 모달 설정 ───
  const getModal = () => {
    if (!word) return null;
    switch (phase) {
      case "COUNTING":
        return {
          title: `${wordIdx + 1}번 단어 — 1단계`,
          prompt: `'${word.word}'의 형태소 개수는? (어미 제외)`,
          choices: (word.countChoices || []).map(n => ({ id: String(n), text: `${n}개` })),
          onSelect: handleCount,
          key: `${word.id}-count`,
        };
      case "SPLITTING":
        return {
          title: `${wordIdx + 1}번 단어 — 2단계`,
          prompt: "올바르게 형태소를 구분한 것을 고르세요.",
          choices: word.splitChoices || [],
          onSelect: handleSplit,
          key: `${word.id}-split`,
        };
      case "NAMING":
        return {
          title: `${wordIdx + 1}번 단어 — 3단계`,
          prompt: `'${morphemes[morphIdx]?.form}'의 형태소 이름은?`,
          choices: nameChoices,
          onSelect: handleName,
          key: `${word.id}-name-${morphIdx}`,
        };
      case "TYPING":
        return {
          title: `${wordIdx + 1}번 단어 — 4단계`,
          prompt: `'${morphemes[morphIdx]?.form}'의 형태소 종류는?`,
          choices: TYPE_CHOICES,
          onSelect: handleType,
          key: `${word.id}-type-${morphIdx}`,
        };
      case "FORMATION":
        return {
          title: `${wordIdx + 1}번 단어 — 5단계`,
          prompt: `'${word.word}'은(는) 어떤 단어인가요?`,
          choices: FORMATION_CHOICES,
          onSelect: handleFormation,
          key: `${word.id}-formation`,
        };
      case "COMPOUND_SYNTACTIC":
        return {
          title: `${wordIdx + 1}번 단어 — 합성어 분류`,
          prompt: `'${word.word}'은(는) 어떤 합성어인가요?`,
          choices: [
            { id: "통사적", text: "통사적 합성어" },
            { id: "비통사적", text: "비통사적 합성어" },
          ],
          onSelect: handleSyntactic,
          key: `${word.id}-syntactic`,
        };
      case "COMPOUND_RELATION":
        return {
          title: `${wordIdx + 1}번 단어 — 합성어 관계`,
          prompt: `'${word.word}'의 어근 간 관계는?`,
          choices: [
            { id: "대등", text: "대등 합성어" },
            { id: "종속", text: "종속 합성어" },
            { id: "융합", text: "융합 합성어" },
          ],
          onSelect: handleRelation,
          key: `${word.id}-relation`,
        };
      default:
        return null;
    }
  };

  const modal = getModal();

  // ─── 렌더링 ───
  const renderWordDisplay = () => {
    if (splitDone || phase === "FORMATION" || phase === "COMPOUND_SYNTACTIC" || phase === "COMPOUND_RELATION") {
      return (
        <div className="wf-morpheme-display">
          {morphemes.map((m, i) => {
            const markClass = m.mark === "circle" ? "wf-circle" : m.mark === "square" ? "wf-square" : "";
            const isActive = (phase === "NAMING" || phase === "TYPING") && i === morphIdx;
            const isDone = (phase === "NAMING" || phase === "TYPING") && i < morphIdx;
            return (
              <span
                key={i}
                className={`morpheme-chip ${markClass} ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}
              >
                {m.form}
              </span>
            );
          })}
        </div>
      );
    }
    return (
      <div className="morpheme-sentence-highlight" style={{ fontSize: 24 }}>
        {word?.word}
      </div>
    );
  };

  if (!word) return null;

  return (
    <div className="morpheme-module">
      {status === "READY" ? (
        <div className="worksheet-start">
          <div className="worksheet-empty">단어의 형성을 분석합니다.</div>
          <button type="button" className="worksheet-start-btn" onClick={start}>학습 시작</button>
        </div>
      ) : (
        <>
          <div className="morpheme-header">
            <span>단어 {wordIdx + 1} / {words.length}</span>
            <span className="morpheme-phase-label">
              {phase === "COUNTING" && "1단계: 형태소 개수"}
              {phase === "SPLITTING" && "2단계: 형태소 구분"}
              {phase === "NAMING" && `3단계: 이름 (${morphIdx + 1}/${morphemes.length})`}
              {phase === "TYPING" && `4단계: 종류 (${morphIdx + 1}/${morphemes.length})`}
              {phase === "FORMATION" && "5단계: 단어의 형성"}
              {phase === "COMPOUND_SYNTACTIC" && "합성어 분류"}
              {phase === "COMPOUND_RELATION" && "합성어 관계"}
            </span>
          </div>

          <div className="morpheme-display-area">
            {renderWordDisplay()}
          </div>

          <div className="morpheme-sentence-dots">
            {words.map((w, i) => (
              <span key={i} className={`morpheme-dot ${i === wordIdx ? "current" : ""} ${i < wordIdx ? "done" : ""}`}>
                {wrongMap[`${i}-COUNTING`] || wrongMap[`${i}-SPLITTING`] || wrongMap[`${i}-NAMING`] || wrongMap[`${i}-TYPING`] || wrongMap[`${i}-FORMATION`]
                  ? <span style={{ textDecoration: "line-through" }}>{i + 1}</span>
                  : i + 1}
              </span>
            ))}
          </div>

          {modal && (
            <QuestionModal
              title={modal.title}
              prompt={modal.prompt}
              choices={modal.choices}
              onSelect={modal.onSelect}
              mark={lastResult}
              shuffleKey={modal.key}
            />
          )}
        </>
      )}
    </div>
  );
}

export default WordFormationModule;
