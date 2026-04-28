import InlineEditable from "../dailyquiz/InlineEditable";
import CompetencyVectorEditor from "../dailyquiz/CompetencyVectorEditor";

const STEP_TYPES = [
  { value: "PHONEME_RESULT", label: "음운 결과 (도착 셀 채우기)" },
  { value: "RULE_EXPLANATION", label: "규칙 설명" },
];

/**
 * PHONEME_CHANGE 워드 프로세서형 에디터.
 * payload.words[] = [{ wordId, surface, cells:[{cellNo, text}], steps:[{stepId, questionType, targetCellNo, envCellNos[], choices, answerId, onCorrect:{deltaSec, applyCellText:[{cellNo, text}]}, onWrong:{deltaSec}}] }]
 */
export default function PhonemeChangeDocEditor({ editor }) {
  const { content } = editor;
  const words = content?.words || [];

  const addWord = (atIdx) => {
    const wid = `w-${Date.now().toString(36).slice(-4)}`;
    editor.addItem("words", atIdx, {
      wordId: wid, surface: "", cells: [], steps: [],
    });
  };
  const removeWord = (i) => {
    if (!window.confirm(`단어 ${i + 1} 삭제?`)) return;
    editor.removeItem("words", i);
  };
  const moveWord = (from, to) => {
    if (to < 0 || to >= words.length) return;
    editor.reorderItems("words", from, to);
  };

  const addCell = (wi) => {
    const cur = words[wi]?.cells || [];
    editor.addItem(`words[${wi}].cells`, cur.length, { cellNo: cur.length + 1, text: "" });
  };
  const removeCell = (wi, ci) => editor.removeItem(`words[${wi}].cells`, ci);

  const addStep = (wi, atIdx) => {
    const cur = words[wi]?.steps || [];
    editor.addItem(`words[${wi}].steps`, atIdx ?? cur.length, {
      stepId: `s-${Date.now().toString(36).slice(-4)}`,
      questionType: "PHONEME_RESULT",
      targetCellNo: 1,
      envCellNos: [],
      choices: [
        { id: "c1", text: "" }, { id: "c2", text: "" }, { id: "c3", text: "" },
      ],
      answerId: "",
      onCorrect: { deltaSec: 20, applyCellText: [] },
      onWrong: { deltaSec: -10 },
    });
  };
  const removeStep = (wi, si) => editor.removeItem(`words[${wi}].steps`, si);
  const moveStep = (wi, from, to) => {
    const len = words[wi]?.steps?.length || 0;
    if (to < 0 || to >= len) return;
    editor.reorderItems(`words[${wi}].steps`, from, to);
  };

  return (
    <div className="dq-doc-root">
      <div className="dq-doc-meta">
        <div className="dq-doc-meta-row">
          <label>제한 시간 <input type="number" value={content?.timeLimitSec ?? 600}
            onChange={(e) => editor.updateField("timeLimitSec", Number(e.target.value))} style={{ width: 90 }} /></label>
          <span style={{ flex: 1 }} />
          <span className="dq-doc-meta-stat">총 {words.length} 단어</span>
        </div>
      </div>
      <div className="dq-doc-paper">
        {words.length === 0 && <div className="dq-doc-empty">아래 [+]로 첫 단어를 추가하세요.</div>}
        {words.map((w, wi) => {
          const cells = w.cells || [];
          const steps = w.steps || [];
          return (
            <div key={w.wordId || wi}>
              <button type="button" className="dr-step-insert" onClick={() => addWord(wi)}>+ 여기에 단어 추가</button>
              <div className="dq-card">
                <div className="dq-card-header">
                  <div className="dq-card-num">단어 {wi + 1}</div>
                  <code className="dr-step-id">{w.wordId}</code>
                  <div className="dq-fb-blank-move">
                    <button type="button" onClick={() => moveWord(wi, wi - 1)} disabled={wi === 0}>▲</button>
                    <button type="button" onClick={() => moveWord(wi, wi + 1)} disabled={wi >= words.length - 1}>▼</button>
                  </div>
                  <span style={{ flex: 1 }} />
                  <button type="button" className="dq-mc-del" onClick={() => removeWord(wi)}>×</button>
                </div>
                <div className="dq-card-body">
                  <div className="dq-section-label">표면형 (surface) — 예: '같다→[가따]'</div>
                  <InlineEditable
                    value={w.surface || ""}
                    onChange={(v) => editor.updateField(`words[${wi}].surface`, v)}
                    placeholder="단어 (음운 변동 전)"
                    multiline={false}
                    className="dq-stem"
                  />

                  <div className="dq-section-label">시작 셀 (cells) — 음소 단위 행</div>
                  <table className="gr-table">
                    <thead><tr><th>cellNo</th><th>text (음소)</th><th>삭제</th></tr></thead>
                    <tbody>
                      {cells.map((c, ci) => (
                        <tr key={ci}>
                          <td><input type="number" value={c.cellNo ?? ci + 1}
                            onChange={(e) => editor.updateField(`words[${wi}].cells[${ci}].cellNo`, Number(e.target.value))} style={{ width: 50 }} /></td>
                          <td><input type="text" value={c.text || ""}
                            onChange={(e) => editor.updateField(`words[${wi}].cells[${ci}].text`, e.target.value)} placeholder="ㄱ" style={{ width: 60 }} /></td>
                          <td><button type="button" className="dq-mc-del" onClick={() => removeCell(wi, ci)}>×</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button type="button" className="dq-add-btn" onClick={() => addCell(wi)}>+ 셀 추가</button>

                  <div className="dq-section-label" style={{ marginTop: 14 }}>변동 단계 (steps) — 학생이 풀어야 할 질문들</div>
                  {steps.map((step, si) => {
                    const envSet = new Set(step.envCellNos || []);
                    const toggleEnv = (cellNo) => {
                      const next = envSet.has(cellNo)
                        ? (step.envCellNos || []).filter((n) => n !== cellNo)
                        : [...(step.envCellNos || []), cellNo];
                      editor.updateField(`words[${wi}].steps[${si}].envCellNos`, next);
                    };
                    const apply = step.onCorrect?.applyCellText || [];
                    return (
                      <div key={step.stepId || si} className="gr-step">
                        <div className="gr-step-head">
                          <span className="dr-step-num">Step {si + 1}</span>
                          <select value={step.questionType || "PHONEME_RESULT"}
                            onChange={(e) => editor.updateField(`words[${wi}].steps[${si}].questionType`, e.target.value)}>
                            {STEP_TYPES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                          <label style={{ fontSize: 11 }}>대상 셀
                            <select value={step.targetCellNo ?? ""}
                              onChange={(e) => editor.updateField(`words[${wi}].steps[${si}].targetCellNo`, Number(e.target.value))}
                              style={{ marginLeft: 4 }}>
                              <option value="">(선택)</option>
                              {cells.map((c) => (
                                <option key={c.cellNo} value={c.cellNo}>#{c.cellNo} {c.text}</option>
                              ))}
                            </select>
                          </label>
                          <div className="dq-fb-blank-move">
                            <button type="button" onClick={() => moveStep(wi, si, si - 1)} disabled={si === 0}>▲</button>
                            <button type="button" onClick={() => moveStep(wi, si, si + 1)} disabled={si >= steps.length - 1}>▼</button>
                          </div>
                          <span style={{ flex: 1 }} />
                          <button type="button" className="dq-mc-del" onClick={() => removeStep(wi, si)}>×</button>
                        </div>

                        <div className="dq-section-label">환경 셀 (envCellNos) — 클릭으로 토글</div>
                        <div className="gr-clause-boxes">
                          {cells.length === 0 && <span style={{ fontSize: 11, color: "#888" }}>먼저 셀을 추가하세요.</span>}
                          {cells.map((c) => (
                            <button key={c.cellNo} type="button"
                              className={`gr-clause-box ${envSet.has(c.cellNo) ? "on" : ""}`}
                              onClick={() => toggleEnv(c.cellNo)}>
                              <span className="gr-clause-box-text">{c.text || "(공)"}</span>
                              <span className="gr-clause-box-id">#{c.cellNo}</span>
                            </button>
                          ))}
                        </div>

                        <div className="dq-section-label" style={{ marginTop: 6 }}>선택지</div>
                        <div className="dq-mc-list">
                          {(step.choices || []).map((c, ci) => (
                            <div key={c.id || ci} className={`dq-mc-row ${step.answerId === c.id ? "is-answer" : ""}`}>
                              <label className="dq-mc-radio">
                                <input type="radio" name={`pc-${wi}-${si}-ans`} checked={step.answerId === c.id}
                                  onChange={() => editor.updateField(`words[${wi}].steps[${si}].answerId`, c.id)} />
                                <span className="dq-mc-num">{ci + 1}</span>
                              </label>
                              <InlineEditable value={c.text}
                                onChange={(v) => editor.updateField(`words[${wi}].steps[${si}].choices[${ci}].text`, v)}
                                placeholder="선택지 텍스트" multiline={false} className="dq-mc-text" />
                              <button type="button" className="dq-mc-del" onClick={() => editor.removeItem(`words[${wi}].steps[${si}].choices`, ci)}>×</button>
                            </div>
                          ))}
                        </div>
                        <button type="button" className="dq-add-btn"
                          onClick={() => editor.addItem(`words[${wi}].steps[${si}].choices`, (step.choices || []).length, { id: `c${(step.choices || []).length + 1}`, text: "" })}>+ 선택지</button>

                        {step.questionType === "PHONEME_RESULT" && (
                          <>
                            <div className="dq-section-label" style={{ marginTop: 8 }}>정답 시 도착 셀 갱신 (applyCellText) — 어느 셀에 어떤 음소를 채울지</div>
                            <table className="gr-table">
                              <thead><tr><th>cellNo</th><th>text</th><th>×</th></tr></thead>
                              <tbody>
                                {apply.map((a, ai) => (
                                  <tr key={ai}>
                                    <td>
                                      <select value={a.cellNo ?? ""}
                                        onChange={(e) => editor.updateField(`words[${wi}].steps[${si}].onCorrect.applyCellText[${ai}].cellNo`, Number(e.target.value))}>
                                        <option value="">(선택)</option>
                                        {cells.map((c) => <option key={c.cellNo} value={c.cellNo}>#{c.cellNo} {c.text}</option>)}
                                      </select>
                                    </td>
                                    <td><input type="text" value={a.text || ""}
                                      onChange={(e) => editor.updateField(`words[${wi}].steps[${si}].onCorrect.applyCellText[${ai}].text`, e.target.value)} /></td>
                                    <td><button type="button" className="dq-mc-del"
                                      onClick={() => editor.removeItem(`words[${wi}].steps[${si}].onCorrect.applyCellText`, ai)}>×</button></td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            <button type="button" className="dq-add-btn"
                              onClick={() => editor.addItem(`words[${wi}].steps[${si}].onCorrect.applyCellText`, apply.length, { cellNo: cells[0]?.cellNo ?? 1, text: "" })}>+ 도착 셀 갱신 추가</button>
                          </>
                        )}

                        <div className="dq-section-label" style={{ marginTop: 8 }}>점수</div>
                        <div className="dq-scoring-row">
                          <label>정답 시간 가산
                            <input type="number" value={step.onCorrect?.deltaSec ?? 20}
                              onChange={(e) => editor.updateField(`words[${wi}].steps[${si}].onCorrect.deltaSec`, Number(e.target.value))} />초
                          </label>
                          <label>오답 시간 차감
                            <input type="number" value={step.onWrong?.deltaSec ?? -10}
                              onChange={(e) => editor.updateField(`words[${wi}].steps[${si}].onWrong.deltaSec`, Number(e.target.value))} />초
                          </label>
                        </div>
                      </div>
                    );
                  })}
                  <button type="button" className="dq-add-btn" onClick={() => addStep(wi)}>+ Step 추가</button>

                  <div className="dq-section-label" style={{ marginTop: 14 }}>10대 역량 벡터</div>
                  <CompetencyVectorEditor
                    value={w.competencyVector}
                    onChange={(v) => editor.updateField(`words[${wi}].competencyVector`, v)}
                    label="이 단어 학습 정답 시 누적될 역량 가중치"
                    color="correct"
                  />
                </div>
              </div>
            </div>
          );
        })}
        <button type="button" className="dr-step-insert dr-step-insert-end" onClick={() => addWord(words.length)}>+ 마지막에 단어 추가</button>
      </div>
    </div>
  );
}
