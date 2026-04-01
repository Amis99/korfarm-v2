import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useEngine } from "../core/EngineContext";
import QuestionModal from "../shared/QuestionModal";

const ROLE_SHORT = { "주어":"주","서술어":"서","목적어":"목","보어":"보","부사어":"부","관형어":"관","독립어":"독" };

const LINKED_TYPE_CHOICES = [
  { id: "대등", text: "대등하게 이어진 문장" },
  { id: "종속", text: "종속적으로 이어진 문장" },
];
const EMBEDDED_TYPE_CHOICES = [
  { id: "명사절", text: "명사절" }, { id: "서술절", text: "서술절" },
  { id: "관형절", text: "관형절" }, { id: "부사절", text: "부사절" },
  { id: "인용절", text: "인용절" },
];
const CLAUSE_TYPE_CHOICES = [
  { id: "이어진 문장", text: "이어진 문장" },
  { id: "주어", text: "주어" }, { id: "서술어", text: "서술어" },
  { id: "목적어", text: "목적어" }, { id: "보어", text: "보어" },
  { id: "부사어", text: "부사어" }, { id: "관형어", text: "관형어" },
];

function SentenceStructureModule({ content }) {
  const { adjustTime, recordAnswer, finish, start, status } = useEngine();
  const sentences = content?.payload?.sentences || [];

  const [sentIdx, setSentIdx] = useState(0);
  const [phase, setPhase] = useState("WAITING"); // WAITING | ROLE_MODAL | CLAUSE_SELECT | CLAUSE_TYPE | CLAUSE_SUBTYPE
  const [activeBoxId, setActiveBoxId] = useState(null);
  const [currentLayer, setCurrentLayer] = useState(1);
  const [roleLabels, setRoleLabels] = useState({}); // boxId → "주1"
  const [layersDone, setLayersDone] = useState(new Set()); // 완료된 레이어
  const [clauseStep, setClauseStep] = useState(0);
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [selectedRange, setSelectedRange] = useState([]);
  const [mergedRows, setMergedRows] = useState([]);
  const [slashes, setSlashes] = useState([]);
  const [lastResult, setLastResult] = useState(null);
  const [wrongBoxId, setWrongBoxId] = useState(null);
  const [hintMsg, setHintMsg] = useState("");
  const [completedSentences, setCompletedSentences] = useState([]);

  const resultTimer = useRef(null);
  const advanceTimer = useRef(null);
  const hintTimer = useRef(null);

  const sent = sentences[sentIdx];
  const boxes = sent?.boxes || [];
  const roleOrder = sent?.roleOrder || [];
  const clauses = sent?.clauses || [];
  const sortedClauses = useMemo(() => [...clauses].sort((a, b) => b.layer - a.layer), [clauses]);

  // 레이어별 그룹
  const maxLayer = useMemo(() => Math.max(...boxes.map(b => b.layer), 1), [boxes]);
  const labeledBoxIds = useMemo(() => new Set(Object.keys(roleLabels)), [roleLabels]);

  // 현재 레이어에서 아직 레이블 안 된 박스
  const pendingInLayer = useMemo(() => {
    return roleOrder.filter(id => {
      const box = boxes.find(b => b.id === id);
      return box && box.layer === currentLayer && !labeledBoxIds.has(id);
    });
  }, [roleOrder, boxes, currentLayer, labeledBoxIds]);

  // 레이어의 서술어가 먼저 레이블되었는지
  const predicateOfLayer = useMemo(() => {
    return boxes.find(b => b.layer === currentLayer && b.role === "서술어");
  }, [boxes, currentLayer]);

  useEffect(() => { if (status === "READY") start(); }, [status, start]);
  useEffect(() => () => {
    [resultTimer, advanceTimer, hintTimer].forEach(r => { if (r.current) clearTimeout(r.current); });
  }, []);

  const showFeedback = (result) => {
    setLastResult(result);
    if (resultTimer.current) clearTimeout(resultTimer.current);
    resultTimer.current = setTimeout(() => setLastResult(null), 1000);
  };

  const showHint = (msg) => {
    setHintMsg(msg);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHintMsg(""), 2000);
  };

  const shakeBox = (boxId) => {
    setWrongBoxId(boxId);
    setTimeout(() => setWrongBoxId(null), 600);
  };

  // ─── 박스 클릭 (Phase 1: 문장성분 이름 붙이기) ───
  const handleBoxClick = (boxId) => {
    if (phase === "CLAUSE_SELECT") {
      handleClauseBoxClick(boxId);
      return;
    }
    if (phase !== "WAITING") return;
    const box = boxes.find(b => b.id === boxId);
    if (!box) return;
    if (labeledBoxIds.has(boxId)) return; // 이미 레이블됨

    // 서술어 먼저 체크
    if (box.layer !== currentLayer) {
      // 현재 레이어가 아직 안 끝남
      if (pendingInLayer.length > 0) {
        showHint("현재 서술어와 호응하는 성분부터 클릭하세요");
        shakeBox(boxId);
        return;
      }
      // 레이어 전환
      setCurrentLayer(box.layer);
    }

    // 같은 레이어에서 서술어가 아직 안 된 경우, 서술어 먼저
    if (box.role !== "서술어" && predicateOfLayer && !labeledBoxIds.has(predicateOfLayer.id) && box.layer === currentLayer) {
      showHint("서술어를 먼저 클릭하세요");
      shakeBox(boxId);
      return;
    }

    setActiveBoxId(boxId);
    setPhase("ROLE_MODAL");
  };

  // ─── 문장성분 모달 선택지 생성 (레이어 포함 5지선다) ───
  const roleModalChoices = useMemo(() => {
    if (!activeBoxId) return [];
    const box = boxes.find(b => b.id === activeBoxId);
    if (!box) return [];
    const correct = `${ROLE_SHORT[box.role] || box.role}${box.layer}`;

    // 오답 생성
    const allRoles = ["주어","서술어","목적어","보어","부사어","관형어","독립어"];
    const allLayers = Array.from({ length: maxLayer }, (_, i) => i + 1);
    const pool = [];
    for (const r of allRoles) {
      for (const l of allLayers) {
        const label = `${ROLE_SHORT[r]}${l}`;
        if (label !== correct) pool.push(label);
      }
    }
    // 셔플
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const distractors = pool.slice(0, 4);
    const all = [correct, ...distractors];
    // 셔플
    for (let i = all.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [all[i], all[j]] = [all[j], all[i]];
    }
    return all.map(t => ({ id: t, text: t }));
  }, [activeBoxId, boxes, maxLayer, phase]);

  const handleRoleAnswer = (choiceId) => {
    const box = boxes.find(b => b.id === activeBoxId);
    if (!box) return;
    const correct = `${ROLE_SHORT[box.role] || box.role}${box.layer}`;
    const isCorrect = choiceId === correct;
    adjustTime(isCorrect ? 20 : -20);
    recordAnswer({ id: `${sent.id}-role-${box.id}`, correct: isCorrect });
    showFeedback(isCorrect ? "correct" : "wrong");

    // 레이블 기록 (정답이든 오답이든 정답을 기록)
    setRoleLabels(prev => ({ ...prev, [box.id]: correct }));

    if (!isCorrect) shakeBox(activeBoxId);

    setTimeout(() => {
      setActiveBoxId(null);
      setPhase("WAITING");
      setLastResult(null);

      // 모든 박스 레이블 완료 체크
      const newLabeled = new Set([...labeledBoxIds, box.id]);
      if (newLabeled.size >= boxes.length) {
        // Phase 2로 전환 또는 완료
        if (sortedClauses.length > 0) {
          setPhase("CLAUSE_SELECT");
          setClauseStep(0);
        } else {
          finishSentence();
        }
      }
    }, isCorrect ? 500 : 1200);
  };

  // ─── Phase 2: 절 선택 (클릭 + 드래그) ───
  const currentClause = sortedClauses[clauseStep];

  const handleClauseBoxClick = (boxId) => {
    if (phase !== "CLAUSE_SELECT") return;

    if (!dragStart) {
      // 첫 클릭 → 시작점
      setDragStart(boxId);
      setDragEnd(boxId);
      setSelectedRange([boxId]);
    } else if (dragStart === boxId) {
      // 같은 박스 다시 클릭 → 한 칸 선택 확정
      confirmClauseSelection([boxId]);
    } else {
      // 다른 박스 클릭 → 범위 확정
      const startIdx = boxes.findIndex(b => b.id === dragStart);
      const endIdx = boxes.findIndex(b => b.id === boxId);
      const minIdx = Math.min(startIdx, endIdx);
      const maxIdx = Math.max(startIdx, endIdx);
      const range = boxes.slice(minIdx, maxIdx + 1).map(b => b.id);
      setSelectedRange(range);
      setDragEnd(boxId);
      confirmClauseSelection(range);
    }
  };

  const confirmClauseSelection = (range) => {
    if (!currentClause) return;
    const correctRange = currentClause.range;
    const isCorrect = range.length === correctRange.length && range.every((id, i) => id === correctRange[i]);
    adjustTime(isCorrect ? 20 : -20);
    recordAnswer({ id: `${sent.id}-clause-${clauseStep}`, correct: isCorrect });

    if (isCorrect) {
      showFeedback("correct");
      setTimeout(() => {
        setPhase("CLAUSE_TYPE");
        setLastResult(null);
      }, 500);
    } else {
      showFeedback("wrong");
      showHint("절의 범위가 정확하지 않습니다. 다시 선택하세요.");
      range.forEach(id => shakeBox(id));
      setTimeout(() => {
        setDragStart(null);
        setDragEnd(null);
        setSelectedRange([]);
        setLastResult(null);
      }, 1200);
    }
  };

  // ─── Phase 3: 절 분류 ───
  const handleClauseType = (choiceId) => {
    if (!currentClause) return;
    const isLinked = currentClause.clauseType === "대등" || currentClause.clauseType === "종속";
    const correctAnswer = isLinked ? "이어진 문장" : currentClause.parentRole;
    const isCorrect = choiceId === correctAnswer;
    adjustTime(isCorrect ? 20 : -20);
    recordAnswer({ id: `${sent.id}-ctype-${clauseStep}`, correct: isCorrect });
    showFeedback(isCorrect ? "correct" : "wrong");

    if (isLinked) {
      const lastBox = currentClause.range[currentClause.range.length - 1];
      setSlashes(prev => [...prev, lastBox]);
    } else {
      const label = `${ROLE_SHORT[currentClause.parentRole] || currentClause.parentRole}${currentClause.parentLayer}`;
      setMergedRows(prev => [...prev, { range: currentClause.range, label, clauseType: "" }]);
    }
    setTimeout(() => { setPhase("CLAUSE_SUBTYPE"); setLastResult(null); }, isCorrect ? 500 : 1200);
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

    setTimeout(() => {
      if (clauseStep < sortedClauses.length - 1) {
        setClauseStep(prev => prev + 1);
        setPhase("CLAUSE_SELECT");
        setDragStart(null); setDragEnd(null); setSelectedRange([]);
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
      resetSentenceState();
    } else {
      finish(true);
    }
  };

  const resetSentenceState = () => {
    setPhase("WAITING"); setActiveBoxId(null); setCurrentLayer(1);
    setRoleLabels({}); setLayersDone(new Set()); setClauseStep(0);
    setDragStart(null); setDragEnd(null); setSelectedRange([]);
    setMergedRows([]); setSlashes([]); setLastResult(null); setHintMsg("");
  };

  // ─── 모달 ───
  const getModal = () => {
    if (!sent) return null;
    if (phase === "ROLE_MODAL" && activeBoxId) {
      const box = boxes.find(b => b.id === activeBoxId);
      return {
        title: "문장성분", prompt: `'${box?.text}'의 문장성분은?`,
        choices: roleModalChoices, onSelect: handleRoleAnswer,
        key: `${sent.id}-role-${activeBoxId}`,
      };
    }
    if (phase === "CLAUSE_TYPE") {
      return {
        title: "절 분류", prompt: "선택한 범위는 어떤 역할인가요?",
        choices: CLAUSE_TYPE_CHOICES, onSelect: handleClauseType,
        key: `${sent.id}-ctype-${clauseStep}`,
      };
    }
    if (phase === "CLAUSE_SUBTYPE") {
      const isLinked = currentClause?.clauseType === "대등" || currentClause?.clauseType === "종속";
      return {
        title: isLinked ? "이어진 문장" : "안긴 문장",
        prompt: isLinked ? "어떤 이어진 문장인가요?" : "어떤 안긴 문장인가요?",
        choices: isLinked ? LINKED_TYPE_CHOICES : EMBEDDED_TYPE_CHOICES,
        onSelect: handleClauseSubtype, key: `${sent.id}-csub-${clauseStep}`,
      };
    }
    return null;
  };

  const modal = getModal();

  // ─── 렌더링: 완료된 문장 ───
  const renderDone = (result, idx) => (
    <div key={`done-${idx}`} className="ss-sentence-block completed">
      <div className="ss-grid">
        <div className="ss-box-row">
          {result.boxes.map(box => (
            <div key={box.id} className="ss-box-wrapper">
              <div className="ss-box done">{box.text}</div>
              {result.slashes.includes(box.id) && <span className="ss-slash">/</span>}
            </div>
          ))}
        </div>
        <div className="ss-box-row">
          {result.boxes.map(box => (
            <div key={`l-${box.id}`} className="ss-box label-box">{result.roleLabels[box.id] || ""}</div>
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
    </div>
  );

  // ─── 렌더링: 현재 문장 ───
  const renderCurrent = () => {
    if (!sent) return null;
    return (
      <div className="ss-sentence-block current">
        <div className="ss-grid">
          <div className="ss-box-row">
            {boxes.map(box => {
              const isActive = activeBoxId === box.id;
              const isLabeled = !!roleLabels[box.id];
              const isSelected = selectedRange.includes(box.id);
              const isWrong = wrongBoxId === box.id;
              return (
                <div key={box.id} className="ss-box-wrapper">
                  <div
                    className={`ss-box ${isActive ? "active" : ""} ${isLabeled ? "labeled" : ""} ${isSelected ? "selected" : ""} ${isWrong ? "wrong-shake" : ""}`}
                    onClick={() => handleBoxClick(box.id)}
                  >
                    {box.text}
                  </div>
                  {slashes.includes(box.id) && <span className="ss-slash">/</span>}
                </div>
              );
            })}
          </div>
          {/* 레이블 행 (박스 정렬) */}
          <div className="ss-box-row">
            {boxes.map(box => (
              <div key={`l-${box.id}`} className="ss-box label-box">
                {roleLabels[box.id] || ""}
              </div>
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
      </div>
    );
  };

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
            <div className="ss-instruction-sub">(절 선택: 시작 칸 클릭 → 끝 칸 클릭. 한 칸이면 같은 칸 두 번 클릭)</div>
          </div>
          <div className="ss-progress">
            문장 {sentIdx + 1} / {sentences.length}
            {phase === "WAITING" && ` · 칸을 클릭하세요`}
            {phase === "CLAUSE_SELECT" && ` · 절 범위를 선택하세요`}
          </div>

          {hintMsg && <div className="ss-hint">{hintMsg}</div>}

          {completedSentences.map((r, i) => renderDone(r, i))}
          {renderCurrent()}

          {modal && (
            <QuestionModal
              title={modal.title} prompt={modal.prompt}
              choices={modal.choices} onSelect={modal.onSelect}
              mark={lastResult} shuffleKey={modal.key}
            />
          )}
        </>
      )}
    </div>
  );
}

export default SentenceStructureModule;
