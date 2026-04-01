import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEngine } from "../core/EngineContext";
import QuestionModal from "../shared/QuestionModal";

/**
 * 문장의 짜임 학습 모듈
 *
 * Phase ROLE_NAMING: 문장성분 이름 붙이기 (roleOrder 순서대로)
 * Phase CLAUSE_DRAG: 절 드래그 (clauses 안쪽→바깥쪽)
 * Phase CLAUSE_TYPE: 절 분류 (이어진 문장 / 안긴 문장성분)
 * Phase CLAUSE_SUBTYPE: 절 유형 (대등/종속 또는 명사절/관형절 등)
 */

const ROLE_LABELS = {
  "주어": "주", "서술어": "서", "목적어": "목",
  "보어": "보", "부사어": "부", "관형어": "관", "독립어": "독",
};

const ROLE_CHOICES = [
  { id: "주어", text: "주어" }, { id: "서술어", text: "서술어" },
  { id: "목적어", text: "목적어" }, { id: "보어", text: "보어" },
  { id: "부사어", text: "부사어" }, { id: "관형어", text: "관형어" },
  { id: "독립어", text: "독립어" },
];

const CLAUSE_TYPE_CHOICES = [
  { id: "이어진 문장", text: "이어진 문장" },
  { id: "주어", text: "주어" }, { id: "서술어", text: "서술어" },
  { id: "목적어", text: "목적어" }, { id: "보어", text: "보어" },
  { id: "부사어", text: "부사어" }, { id: "관형어", text: "관형어" },
];

const LINKED_TYPE_CHOICES = [
  { id: "대등", text: "대등하게 이어진 문장" },
  { id: "종속", text: "종속적으로 이어진 문장" },
];

const EMBEDDED_TYPE_CHOICES = [
  { id: "명사절", text: "명사절" }, { id: "서술절", text: "서술절" },
  { id: "관형절", text: "관형절" }, { id: "부사절", text: "부사절" },
  { id: "인용절", text: "인용절" },
];

function SentenceStructureModule({ content }) {
  const { adjustTime, recordAnswer, finish, start, status } = useEngine();
  const payload = content?.payload || {};
  const sentences = payload.sentences || [];

  const [sentIdx, setSentIdx] = useState(0);
  const [phase, setPhase] = useState("ROLE_NAMING");
  const [roleStep, setRoleStep] = useState(0);
  const [clauseStep, setClauseStep] = useState(0);
  const [lastResult, setLastResult] = useState(null);
  const [roleLabels, setRoleLabels] = useState({});
  const [mergedRows, setMergedRows] = useState([]);
  const [slashes, setSlashes] = useState([]);
  const [dragRange, setDragRange] = useState(null);
  const [completedSentences, setCompletedSentences] = useState([]);

  const resultTimer = useRef(null);
  const advanceTimer = useRef(null);
  const longPressTimer = useRef(null);
  const dragStartRef = useRef(null);

  const sent = sentences[sentIdx];
  const boxes = sent?.boxes || [];
  const roleOrder = sent?.roleOrder || [];
  const clauses = sent?.clauses || [];
  const sortedClauses = useMemo(() =>
    [...clauses].sort((a, b) => b.layer - a.layer), [clauses]);

  useEffect(() => { if (status === "READY") start(); }, [status, start]);
  useEffect(() => () => {
    [resultTimer, advanceTimer, longPressTimer].forEach(r => { if (r.current) clearTimeout(r.current); });
  }, []);

  const showFeedback = (result) => {
    setLastResult(result);
    if (resultTimer.current) clearTimeout(resultTimer.current);
    resultTimer.current = setTimeout(() => setLastResult(null), 1000);
  };

  const advanceAfterDelay = (fn, delay = 600) => {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(fn, delay);
  };

  // ─── Phase 1: 문장성분 이름 ───
  const currentRoleBoxId = roleOrder[roleStep];
  const currentRoleBox = boxes.find(b => b.id === currentRoleBoxId);

  const handleRoleAnswer = (choiceId) => {
    const box = currentRoleBox;
    if (!box) return;
    const isCorrect = choiceId === box.role;
    adjustTime(isCorrect ? 20 : -20);
    recordAnswer({ id: `${sent.id}-role-${box.id}`, correct: isCorrect });
    showFeedback(isCorrect ? "correct" : "wrong");
    const label = `${ROLE_LABELS[box.role] || box.role}${box.layer}`;
    setRoleLabels(prev => ({ ...prev, [box.id]: label }));
    advanceAfterDelay(() => {
      if (roleStep < roleOrder.length - 1) {
        setRoleStep(prev => prev + 1);
      } else if (sortedClauses.length > 0) {
        setPhase("CLAUSE_DRAG");
        setClauseStep(0);
      } else {
        finishSentence();
      }
      setLastResult(null);
    }, isCorrect ? 500 : 1200);
  };

  // ─── Phase 2: 절 드래그 ───
  const currentClause = sortedClauses[clauseStep];

  const handleDragComplete = useCallback((startId, endId) => {
    if (!currentClause || phase !== "CLAUSE_DRAG") return;
    const startIdx = boxes.findIndex(b => b.id === startId);
    const endIdx = boxes.findIndex(b => b.id === endId);
    const minIdx = Math.min(startIdx, endIdx);
    const maxIdx = Math.max(startIdx, endIdx);
    const selectedIds = boxes.slice(minIdx, maxIdx + 1).map(b => b.id);
    const correctRange = currentClause.range;
    const isCorrect = selectedIds.length === correctRange.length &&
      selectedIds.every((id, i) => id === correctRange[i]);
    adjustTime(isCorrect ? 20 : -20);
    recordAnswer({ id: `${sent.id}-clause-${clauseStep}`, correct: isCorrect });
    showFeedback(isCorrect ? "correct" : "wrong");
    if (isCorrect) {
      setDragRange(selectedIds);
      advanceAfterDelay(() => { setPhase("CLAUSE_TYPE"); setLastResult(null); });
    }
  }, [phase, clauseStep, boxes, currentClause, sent]);

  const handleBoxMouseDown = useCallback((boxId) => {
    if (phase !== "CLAUSE_DRAG") return;
    dragStartRef.current = boxId;
    longPressTimer.current = setTimeout(() => {
      handleDragComplete(boxId, boxId);
      dragStartRef.current = null;
    }, 800);
  }, [phase, handleDragComplete]);

  const handleBoxMouseUp = useCallback((boxId) => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current);
    if (phase !== "CLAUSE_DRAG" || !dragStartRef.current) return;
    if (dragStartRef.current !== boxId) {
      handleDragComplete(dragStartRef.current, boxId);
    }
    dragStartRef.current = null;
  }, [phase, handleDragComplete]);

  // ─── Phase 3: 절 분류 ───
  const handleClauseType = (choiceId) => {
    if (!currentClause) return;
    const isLinkedClause = currentClause.clauseType === "대등" || currentClause.clauseType === "종속";
    const correctAnswer = isLinkedClause ? "이어진 문장" : currentClause.parentRole;
    const isCorrect = choiceId === correctAnswer;
    adjustTime(isCorrect ? 20 : -20);
    recordAnswer({ id: `${sent.id}-ctype-${clauseStep}`, correct: isCorrect });
    showFeedback(isCorrect ? "correct" : "wrong");

    if (isLinkedClause) {
      const lastBox = currentClause.range[currentClause.range.length - 1];
      setSlashes(prev => [...prev, lastBox]);
    } else {
      const label = `${ROLE_LABELS[currentClause.parentRole] || currentClause.parentRole}${currentClause.parentLayer}`;
      setMergedRows(prev => [...prev, { range: currentClause.range, label, clauseType: "" }]);
    }
    advanceAfterDelay(() => { setPhase("CLAUSE_SUBTYPE"); setLastResult(null); }, isCorrect ? 500 : 1200);
  };

  // ─── Phase 4: 절 유형 ───
  const handleClauseSubtype = (choiceId) => {
    if (!currentClause) return;
    const isCorrect = choiceId === currentClause.clauseType;
    adjustTime(isCorrect ? 10 : -10);
    recordAnswer({ id: `${sent.id}-csub-${clauseStep}`, correct: isCorrect });
    showFeedback(isCorrect ? "correct" : "wrong");

    setMergedRows(prev => {
      const copy = [...prev];
      if (copy.length > 0 && !copy[copy.length - 1].clauseType) {
        copy[copy.length - 1].clauseType = currentClause.clauseType;
      }
      return copy;
    });

    advanceAfterDelay(() => {
      if (clauseStep < sortedClauses.length - 1) {
        setClauseStep(prev => prev + 1);
        setPhase("CLAUSE_DRAG");
        setDragRange(null);
      } else {
        finishSentence();
      }
      setLastResult(null);
    }, isCorrect ? 500 : 1200);
  };

  const finishSentence = () => {
    setCompletedSentences(prev => [...prev, {
      text: sent.text, boxes: [...boxes],
      roleLabels: { ...roleLabels }, mergedRows: [...mergedRows], slashes: [...slashes],
    }]);
    if (sentIdx < sentences.length - 1) {
      setSentIdx(prev => prev + 1);
      setPhase("ROLE_NAMING");
      setRoleStep(0); setClauseStep(0);
      setRoleLabels({}); setMergedRows([]); setSlashes([]); setDragRange(null);
    } else {
      finish(true);
    }
  };

  // ─── 모달 ───
  const getModal = () => {
    if (!sent) return null;
    switch (phase) {
      case "ROLE_NAMING":
        return currentRoleBox ? {
          title: "문장성분", prompt: `'${currentRoleBox.text}'의 문장성분은?`,
          choices: ROLE_CHOICES, onSelect: handleRoleAnswer,
          key: `${sent.id}-role-${roleStep}`,
        } : null;
      case "CLAUSE_TYPE":
        return {
          title: "절 분류", prompt: "이 범위는 어떤 역할인가요?",
          choices: CLAUSE_TYPE_CHOICES, onSelect: handleClauseType,
          key: `${sent.id}-ctype-${clauseStep}`,
        };
      case "CLAUSE_SUBTYPE": {
        const isLinked = currentClause?.clauseType === "대등" || currentClause?.clauseType === "종속";
        return {
          title: isLinked ? "이어진 문장" : "안긴 문장",
          prompt: isLinked ? "어떤 이어진 문장인가요?" : "어떤 안긴 문장인가요?",
          choices: isLinked ? LINKED_TYPE_CHOICES : EMBEDDED_TYPE_CHOICES,
          onSelect: handleClauseSubtype, key: `${sent.id}-csub-${clauseStep}`,
        };
      }
      default: return null;
    }
  };

  const modal = getModal();

  // ─── 렌더링 ───
  const renderSentenceResult = (result, idx) => (
    <div key={`done-${idx}`} className="ss-sentence-block completed">
      <div className="ss-box-row">
        {result.boxes.map(box => (
          <div key={box.id} className="ss-box-wrapper">
            <div className="ss-box done">{box.text}</div>
            {result.slashes.includes(box.id) && <span className="ss-slash">/</span>}
          </div>
        ))}
      </div>
      <div className="ss-label-row">
        {result.boxes.map(box => (
          <div key={`l-${box.id}`} className="ss-label">{result.roleLabels[box.id] || ""}</div>
        ))}
      </div>
      {result.mergedRows.map((row, ri) => (
        <div key={`mr-${ri}`} className="ss-merged-row">
          <span className="ss-bracket">(</span>
          <span className="ss-merged-label">{row.label}</span>
          {row.clauseType && <span className="ss-clause-badge">{row.clauseType}</span>}
          <span className="ss-bracket">)</span>
        </div>
      ))}
    </div>
  );

  return (
    <div className="sentence-structure-module">
      {status === "READY" ? (
        <div className="worksheet-start">
          <div className="worksheet-empty">문장의 짜임을 분석합니다.</div>
          <button type="button" className="worksheet-start-btn" onClick={start}>학습 시작</button>
        </div>
      ) : (
        <>
          <div className="ss-instruction">
            서술어를 시작으로 칸을 클릭하여 이름을 붙인 후 겹문장인 경우 호응하는 성분끼리 드래그하세요
            <div className="ss-instruction-sub">(한 어절이 하나의 절이면 길게 클릭(터치)하세요)</div>
          </div>
          <div className="ss-progress">
            문장 {sentIdx + 1} / {sentences.length}
            {phase === "ROLE_NAMING" && ` · 성분 ${roleStep + 1}/${roleOrder.length}`}
            {phase === "CLAUSE_DRAG" && ` · 절 범위 선택`}
            {phase === "CLAUSE_TYPE" && ` · 절 분류`}
            {phase === "CLAUSE_SUBTYPE" && ` · 절 유형`}
          </div>

          {/* 이전 문장 결과 */}
          {completedSentences.map((r, i) => renderSentenceResult(r, i))}

          {/* 현재 문장 */}
          {sent && (
            <div className="ss-sentence-block current">
              <div className="ss-box-row">
                {boxes.map(box => {
                  const isActive = phase === "ROLE_NAMING" && box.id === currentRoleBoxId;
                  const isDragged = dragRange?.includes(box.id);
                  return (
                    <div key={box.id} className="ss-box-wrapper">
                      <div
                        className={`ss-box ${isActive ? "active" : ""} ${isDragged ? "dragged" : ""} ${roleLabels[box.id] ? "labeled" : ""}`}
                        onMouseDown={() => handleBoxMouseDown(box.id)}
                        onMouseUp={() => handleBoxMouseUp(box.id)}
                        onTouchStart={() => handleBoxMouseDown(box.id)}
                        onTouchEnd={() => handleBoxMouseUp(box.id)}
                      >
                        {box.text}
                      </div>
                      {slashes.includes(box.id) && <span className="ss-slash">/</span>}
                    </div>
                  );
                })}
              </div>
              <div className="ss-label-row">
                {boxes.map(box => (
                  <div key={`l-${box.id}`} className="ss-label">{roleLabels[box.id] || ""}</div>
                ))}
              </div>
              {mergedRows.map((row, ri) => (
                <div key={`mr-${ri}`} className="ss-merged-row">
                  <span className="ss-bracket">(</span>
                  <span className="ss-merged-label">{row.label}</span>
                  {row.clauseType && <span className="ss-clause-badge">{row.clauseType}</span>}
                  <span className="ss-bracket">)</span>
                </div>
              ))}
            </div>
          )}

          {/* 모달 (CLAUSE_DRAG 단계에서는 드래그 대기) */}
          {modal && phase !== "CLAUSE_DRAG" && (
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

export default SentenceStructureModule;
