import { useEffect, useMemo, useRef, useState } from "react";
import { useEngine } from "../core/EngineContext";
import QuestionModal from "../shared/QuestionModal";

/**
 * 단어의 형성 학습 모듈 (기초+심화)
 *
 * 기초: COUNTING → SPLITTING → NAMING → TYPING → FORMATION
 * 심화: + MERGE_SELECT (3형태소 이상, 어미 제외, 2개 남을 때까지 반복)
 *       + MERGE_FORMATION (합쳐진 결과의 합성어/파생어)
 *       + COMPOUND_SYNTACTIC + COMPOUND_RELATION (최종 합성어인 경우)
 *
 * 누적 표시: 이전 단어 결과가 아래에 쌓임
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
  const [mergeItems, setMergeItems] = useState(null);
  // 누적 표시: 완료된 단어들의 결과
  const [completedWords, setCompletedWords] = useState([]);

  const resultTimer = useRef(null);
  const advanceTimer = useRef(null);

  const word = words[wordIdx];
  const morphemes = word?.morphemes || [];
  // 어미 제외 형태소 (merge용)
  const nonEndingMorphemes = useMemo(
    () => morphemes.filter((m) => m.name !== "어미" && m.nameDetail !== "종결 어미" && m.nameDetail !== "연결 어미" && m.nameDetail !== "전성 어미"),
    [wordIdx]
  );

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
    setWrongMap((prev) => ({ ...prev, [`${wordIdx}-${phase}`]: true }));
  };

  const advanceTo = (nextPhase, nextMorphIdx = 0, delay = 500) => {
    advanceTimer.current = setTimeout(() => {
      setPhase(nextPhase);
      setMorphIdx(nextMorphIdx);
      setLastResult(null);
    }, delay);
  };

  const saveCompletedWord = () => {
    setCompletedWords((prev) => [
      ...prev,
      {
        word: word.word,
        morphemes: morphemes.map((m) => ({ form: m.form, mark: m.mark })),
        formation: word.formation,
        hadWrong: Object.keys(wrongMap).some((k) => k.startsWith(`${wordIdx}-`)),
      },
    ]);
  };

  const advanceToNextWord = () => {
    saveCompletedWord();
    advanceTimer.current = setTimeout(() => {
      if (wordIdx < words.length - 1) {
        setWordIdx((p) => p + 1);
        setPhase("COUNTING");
        setMorphIdx(0);
        setSplitDone(false);
        setMergeStep(0);
        setMergeItems(null);
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
    // 단일어(형태소 1개)면 SPLITTING 건너뜀
    if (word.countAnswer === 1 || (!word.splitChoices?.length)) {
      advanceTimer.current = setTimeout(() => {
        setSplitDone(true);
        setLastResult(null);
        setTimeout(() => { setPhase("NAMING"); setMorphIdx(0); }, 300);
      }, 500);
    } else {
      advanceTo("SPLITTING");
    }
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
      // 4단계 완료 → 심화+3형태소 이상이면 MERGE, 아니면 FORMATION
      if (isAdvanced && nonEndingMorphemes.length >= 3 && word.mergeSteps?.length) {
        setMergeItems(nonEndingMorphemes.map((m) => ({ form: m.form, mark: m.mark })));
        setMergeStep(0);
        advanceTo("MERGE_SELECT");
      } else {
        advanceTo("FORMATION");
      }
    }
  };

  // ─── 심화: MERGE_SELECT (2번째 요소 기준 왼쪽/오른쪽) ───
  const currentMerge = word?.mergeSteps?.[mergeStep];

  const handleMergeSelect = (choiceId) => {
    if (!currentMerge) return;
    const isCorrect = choiceId === currentMerge.answer;
    adjustTime(isCorrect ? 15 : -15);
    recordAnswer({ id: `${word.id}-merge-${mergeStep}`, correct: isCorrect });
    showFeedback(isCorrect ? "correct" : "wrong");
    if (!isCorrect) { markWrong(); return; }
    // merge 결과 반영: mergeItems에서 합쳐진 결과로 교체
    setMergeItems((prev) => {
      if (!prev || prev.length < 3) return prev;
      const newItems = [...prev];
      // 항상 index 0,1,2에서 answer에 따라 합침
      if (currentMerge.answer === "right") {
        // index 1 + index 2 → merged
        newItems.splice(1, 2, { form: currentMerge.resultForm, mark: "circle" });
      } else {
        // index 0 + index 1 → merged
        newItems.splice(0, 2, { form: currentMerge.resultForm, mark: "circle" });
      }
      return newItems;
    });
    // → MERGE_FORMATION (합쳐진 것의 합성어/파생어)
    advanceTo("MERGE_FORMATION");
  };

  const handleMergeFormation = (choiceId) => {
    if (!currentMerge) return;
    const isCorrect = choiceId === currentMerge.resultFormation;
    adjustTime(isCorrect ? 10 : -10);
    recordAnswer({ id: `${word.id}-merge-form-${mergeStep}`, correct: isCorrect });
    showFeedback(isCorrect ? "correct" : "wrong");
    if (!isCorrect) { markWrong(); return; }
    // 다음 merge 단계 또는 FORMATION
    const nextStep = mergeStep + 1;
    if (nextStep < (word.mergeSteps?.length || 0)) {
      setMergeStep(nextStep);
      advanceTo("MERGE_SELECT");
    } else {
      advanceTo("FORMATION");
    }
  };

  // ─── 5단계: 단어 형성 유형 (최종) ───
  const handleFormation = (choiceId) => {
    const isCorrect = choiceId === word.formation;
    adjustTime(isCorrect ? 20 : -20);
    recordAnswer({ id: `${word.id}-formation`, correct: isCorrect });
    showFeedback(isCorrect ? "correct" : "wrong");
    if (!isCorrect) { markWrong(); return; }
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

  // ─── 선택지 ───
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
    const distractors = shuffleArray(pool.filter((n) => n !== correct)).slice(0, 3);
    return shuffleArray([correct, ...distractors]).map((t) => ({ id: t, text: t }));
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
          choices: (word.countChoices || []).map((n) => ({ id: String(n), text: `${n}개` })),
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
      case "MERGE_SELECT": {
        if (!mergeItems || mergeItems.length < 3 || !currentMerge) return null;
        const pivot = mergeItems[1];
        const left = mergeItems[0];
        const right = mergeItems[2];
        return {
          title: `${wordIdx + 1}번 단어 — 결합 순서`,
          prompt: `'${pivot.form}'은(는) 어느 쪽과 먼저 결합하나요?`,
          choices: [
            { id: "left", text: `왼쪽: ${left.form} + ${pivot.form} → ${currentMerge.answer === "left" ? currentMerge.resultForm : left.form + pivot.form}` },
            { id: "right", text: `오른쪽: ${pivot.form} + ${right.form} → ${currentMerge.answer === "right" ? currentMerge.resultForm : pivot.form + right.form}` },
          ],
          onSelect: handleMergeSelect,
          key: `${word.id}-merge-${mergeStep}`,
        };
      }
      case "MERGE_FORMATION":
        return {
          title: `${wordIdx + 1}번 단어 — 결합 결과`,
          prompt: `'${currentMerge?.resultForm}'은(는) 어떤 단어인가요?`,
          choices: [
            { id: "합성어", text: "합성어" },
            { id: "파생어", text: "파생어" },
          ],
          onSelect: handleMergeFormation,
          key: `${word.id}-merge-form-${mergeStep}`,
        };
      case "FORMATION":
        return {
          title: `${wordIdx + 1}번 단어 — 최종 단어의 형성`,
          prompt: `'${word.word}'은(는) 최종적으로 어떤 단어인가요?`,
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

  // ─── 렌더링: 현재 단어 표시 ───
  const isMergePhase = phase === "MERGE_SELECT" || phase === "MERGE_FORMATION";

  const renderWordDisplay = () => {
    // MERGE 단계: mergeItems 표시
    if (isMergePhase && mergeItems) {
      return (
        <div className="wf-morpheme-display">
          {mergeItems.map((m, i) => (
            <span key={i} className={`morpheme-chip ${m.mark === "circle" ? "wf-circle" : m.mark === "square" ? "wf-square" : ""}`}>
              {m.form}
            </span>
          ))}
        </div>
      );
    }
    // 형태소 분리 완료 후: 동그라미/네모 표시
    if (splitDone || phase === "FORMATION" || phase === "COMPOUND_SYNTACTIC" || phase === "COMPOUND_RELATION") {
      return (
        <div className="wf-morpheme-display">
          {morphemes.map((m, i) => {
            const markClass = m.mark === "circle" ? "wf-circle" : m.mark === "square" ? "wf-square" : "";
            const isActive = (phase === "NAMING" || phase === "TYPING") && i === morphIdx;
            const isDone = (phase === "NAMING" || phase === "TYPING") && i < morphIdx;
            return (
              <span key={i} className={`morpheme-chip ${markClass} ${isActive ? "active" : ""} ${isDone ? "done" : ""}`}>
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

  // ─── 렌더링: 누적 완료 단어 ───
  const renderCompletedWords = () => {
    if (!completedWords.length) return null;
    return (
      <div className="wf-completed-list">
        {completedWords.map((cw, i) => (
          <div key={i} className={`wf-completed-item ${cw.hadWrong ? "had-wrong" : ""}`}>
            <span className="wf-completed-num">{i + 1}.</span>
            <span className="wf-completed-word">{cw.word}</span>
            <span className="wf-completed-morphemes">
              {cw.morphemes.map((m, j) => (
                <span key={j} className={`morpheme-chip-sm ${m.mark === "circle" ? "wf-circle" : m.mark === "square" ? "wf-square" : ""}`}>
                  {m.form}
                </span>
              ))}
            </span>
            <span className="wf-completed-formation">{cw.formation}</span>
          </div>
        ))}
      </div>
    );
  };

  const phaseLabel = (() => {
    switch (phase) {
      case "COUNTING": return "1단계: 형태소 개수";
      case "SPLITTING": return "2단계: 형태소 구분";
      case "NAMING": return `3단계: 이름 (${morphIdx + 1}/${morphemes.length})`;
      case "TYPING": return `4단계: 종류 (${morphIdx + 1}/${morphemes.length})`;
      case "MERGE_SELECT": return `결합 순서 (${mergeStep + 1}/${word?.mergeSteps?.length || 0})`;
      case "MERGE_FORMATION": return "결합 결과";
      case "FORMATION": return "최종: 단어의 형성";
      case "COMPOUND_SYNTACTIC": return "합성어 분류";
      case "COMPOUND_RELATION": return "합성어 관계";
      default: return "";
    }
  })();

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
            <span className="morpheme-phase-label">{phaseLabel}</span>
          </div>

          <div className="morpheme-display-area">
            {renderWordDisplay()}
          </div>

          <div className="morpheme-sentence-dots">
            {words.map((w, i) => (
              <span key={i} className={`morpheme-dot ${i === wordIdx ? "current" : ""} ${i < wordIdx ? "done" : ""}`}>
                {Object.keys(wrongMap).some((k) => k.startsWith(`${i}-`))
                  ? <span style={{ textDecoration: "line-through" }}>{i + 1}</span>
                  : i + 1}
              </span>
            ))}
          </div>

          {renderCompletedWords()}

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
