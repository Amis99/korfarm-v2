import { useEffect, useMemo, useRef, useState } from "react";
import { useEngine } from "../core/EngineContext";
import QuestionModal from "../shared/QuestionModal";

function PhonemeChangeModule({ content }) {
  const { adjustTime, recordAnswer, finish, start, status } = useEngine();
  const payload = content?.payload || {};
  const words = payload.words || [];

  const [wordIndex, setWordIndex] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  // "CLICK" | "PHONEME_MODAL" | "RULE_MODAL"
  const [phase, setPhase] = useState("CLICK");
  const [destCells, setDestCells] = useState(() =>
    words.map((w) =>
      w.cells.map((c) => ({ ...c, text: c.text === "," ? "" : c.text }))
    )
  );
  const [lastResult, setLastResult] = useState(null);
  const [wrongCellNo, setWrongCellNo] = useState(null);
  const resultTimerRef = useRef(null);
  const advanceTimerRef = useRef(null);
  const wrongTimerRef = useRef(null);
  const moduleRef = useRef(null);

  const word = words[wordIndex];
  const steps = word?.steps || [];
  const step = steps[stepIndex];

  // 현재 단어의 모든 PHONEME_RESULT 타겟 셀 번호 수집
  // (변동이 일어나는 셀만 클릭 가능하도록)
  const allTargetCellNos = useMemo(() => {
    if (!word) return new Set();
    const set = new Set();
    for (const s of word.steps || []) {
      if (s.questionType === "PHONEME_RESULT") {
        set.add(s.targetCellNo);
      }
    }
    return set;
  }, [word]);

  // 셀 클릭 핸들러 (CLICK phase에서만 동작, 모든 셀 클릭 가능)
  const handleCellClick = (cellNo) => {
    if (phase !== "CLICK" || !step) return;
    clearFeedback();
    if (cellNo === step.targetCellNo) {
      setPhase("PHONEME_MODAL");
    } else {
      // 잘못된 셀 클릭 → 오답 + 흔들림 애니메이션
      adjustTime(-40);
      recordAnswer({ id: `wrong_click_${step.stepId}_${cellNo}`, correct: false });
      showFeedback("wrong");
      setWrongCellNo(cellNo);
      if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
      wrongTimerRef.current = setTimeout(() => setWrongCellNo(null), 600);
    }
  };

  // 모든 도착점 셀 클릭 가능 (ㄴ첨가, 축약 등 쉼표/빈칸도 타겟 가능)
  const isCellClickable = () => true;

  // 셀 업데이트 헬퍼 (단일/다중 모두 처리)
  const applyCellUpdates = (updates) => {
    setDestCells((prev) =>
      prev.map((cellList, idx) => {
        if (idx !== wordIndex) return cellList;
        return cellList.map((c) => {
          const match = updates.find((u) => u.cellNo === c.cellNo);
          return match ? { ...c, text: match.newText } : c;
        });
      })
    );
  };

  // 음운 선택 핸들러 (PHONEME_MODAL)
  const handlePhonemeAnswer = (choiceId) => {
    if (!step || step.questionType !== "PHONEME_RESULT") return;
    const isCorrect = choiceId === step.answerId;
    adjustTime(isCorrect ? (step.onCorrect?.deltaSec ?? 20) : (step.onWrong?.deltaSec ?? -40));
    recordAnswer({ id: step.stepId, correct: isCorrect });
    showFeedback(isCorrect ? "correct" : "wrong");

    if (isCorrect) {
      // 다중 셀 업데이트 (축약: applyCellTexts)
      if (step.onCorrect?.applyCellTexts) {
        applyCellUpdates(step.onCorrect.applyCellTexts);
      }
      // 단일 셀 업데이트 (기존: applyCellText)
      else if (step.onCorrect?.applyCellText) {
        applyCellUpdates([step.onCorrect.applyCellText]);
      }
      // 딜레이 후 다음 step (RULE_EXPLANATION)으로 전환
      advanceTimerRef.current = setTimeout(() => {
        setStepIndex((prev) => prev + 1);
        setPhase("RULE_MODAL");
      }, 600);
    }
    // 오답: retry (phase 유지)
  };

  // 규칙 선택 핸들러 (RULE_MODAL)
  const handleRuleAnswer = (choiceId) => {
    if (!step || step.questionType !== "RULE_EXPLANATION") return;
    // 현재 stepIndex는 이미 RULE step을 가리킴
    const ruleStep = steps[stepIndex];
    if (!ruleStep) return;
    const isCorrect = choiceId === ruleStep.answerId;
    const delta = isCorrect
      ? (ruleStep.onCorrect?.deltaSec ?? 0)
      : (ruleStep.onWrong?.deltaSec ?? -40);
    adjustTime(delta);
    recordAnswer({ id: ruleStep.stepId, correct: isCorrect });
    showFeedback(isCorrect ? "correct" : "wrong");

    if (isCorrect) {
      advanceTimerRef.current = setTimeout(() => {
        const nextIdx = stepIndex + 1;
        if (nextIdx < steps.length) {
          setStepIndex(nextIdx);
          setPhase("CLICK");
        } else if (wordIndex < words.length - 1) {
          setWordIndex((prev) => prev + 1);
          setStepIndex(0);
          setPhase("CLICK");
        } else {
          finish(true);
        }
      }, 600);
    }
    // 오답: retry (phase 유지)
  };

  const showFeedback = (result) => {
    setLastResult(result);
    if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
    resultTimerRef.current = setTimeout(() => setLastResult(null), 800);
  };

  const clearFeedback = () => {
    setLastResult(null);
    if (resultTimerRef.current) {
      clearTimeout(resultTimerRef.current);
      resultTimerRef.current = null;
    }
  };

  useEffect(() => {
    if (status === "READY") start();
  }, [status, start]);

  useEffect(
    () => () => {
      if (resultTimerRef.current) clearTimeout(resultTimerRef.current);
      if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
      if (wrongTimerRef.current) clearTimeout(wrongTimerRef.current);
    },
    []
  );

  // 모달용 현재 step 데이터
  const modalStep =
    phase === "PHONEME_MODAL"
      ? steps[stepIndex]
      : phase === "RULE_MODAL"
        ? steps[stepIndex]
        : null;

  // phase에 따른 모달 핸들러
  const modalHandler =
    phase === "PHONEME_MODAL"
      ? handlePhonemeAnswer
      : phase === "RULE_MODAL"
        ? handleRuleAnswer
        : null;

  const modalTitle =
    phase === "PHONEME_MODAL"
      ? "음운 변동"
      : phase === "RULE_MODAL"
        ? "변동 규칙"
        : "";

  return (
    <div className="phoneme-module" ref={moduleRef}>
      {status === "READY" ? (
        <div className="worksheet-start">
          <div className="worksheet-empty">음운 변동 분석을 시작합니다.</div>
          <button type="button" className="worksheet-start-btn" onClick={start}>
            학습 시작
          </button>
        </div>
      ) : word ? (
        <>
          {/* 단어 진행 표시 */}
          <div className="phoneme-header">
            <span>
              {wordIndex + 1}/{words.length}
            </span>
          </div>

          {/* 안내문 */}
          <div className="phoneme-instruction">
            다음 단어의 음운 변동을 분석하시오.
          </div>
          <div className="phoneme-surface">{word.surface}</div>

          {/* 시작점 (S행) — 읽기 전용 */}
          <div className="phoneme-row phoneme-row-start">
            <span className="phoneme-row-label">시작</span>
            {word.cells.map((cell) => (
              <div
                key={`s-${cell.cellNo}`}
                className={`phoneme-cell${cell.text === "," ? " comma" : ""}`}
              >
                {cell.text}
              </div>
            ))}
          </div>

          {/* 도착점 (D행) — 변동 대상 셀만 클릭 가능 */}
          <div className="phoneme-row phoneme-row-dest">
            <span className="phoneme-row-label">도착</span>
            {destCells[wordIndex]?.map((cell) => {
              const srcCell = word.cells.find((c) => c.cellNo === cell.cellNo);
              const isCommaSlot = srcCell?.text === ",";
              const isEmpty = isCommaSlot && cell.text === "";
              const isTarget = allTargetCellNos.has(cell.cellNo);
              const isDeleted = cell.text === "∅";
              const canClick = isCellClickable(cell);
              return (
                <div
                  key={`d-${cell.cellNo}`}
                  className={[
                    "phoneme-cell",
                    canClick ? "clickable" : "",
                    isEmpty ? "empty-slot" : "",
                    isDeleted ? "deleted" : "",
                    wrongCellNo === cell.cellNo ? "wrong-shake" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={canClick ? () => handleCellClick(cell.cellNo) : undefined}
                >
                  {cell.text}
                </div>
              );
            })}
          </div>

          {/* 피드백 */}
          {lastResult && phase === "CLICK" ? (
            <div className={`worksheet-feedback ${lastResult}`}>
              {lastResult === "correct" ? "정답입니다!" : "오답입니다."}
            </div>
          ) : null}

          {/* 모달 */}
          {modalStep && modalHandler ? (
            <QuestionModal
              title={modalTitle}
              prompt={modalStep.prompt}
              choices={modalStep.choices || []}
              onSelect={modalHandler}
              mark={phase !== "CLICK" ? lastResult : null}
              shuffleKey={modalStep.stepId}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}

export default PhonemeChangeModule;
