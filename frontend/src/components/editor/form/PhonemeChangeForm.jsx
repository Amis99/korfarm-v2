import CollapsibleSection from "../widgets/CollapsibleSection";
import ChoiceEditor from "../widgets/ChoiceEditor";

/**
 * 음운 변동 편집 폼 (오른쪽 패널)
 * words[] > cells[] + steps[]
 */
export default function PhonemeChangeForm({ editor, focusPath }) {
  const { content, updateField, addItem, removeItem } = editor;
  const words = content?.words || [];

  const handleAddWord = () => {
    addItem("words", words.length, {
      wordId: `w${Date.now()}`,
      surface: "",
      cells: [{ cellNo: 1, text: "" }],
      steps: [],
    });
  };

  const handleRemoveWord = (idx) => {
    if (!confirm(`단어 ${idx + 1}을 삭제하시겠습니까?`)) return;
    removeItem("words", idx);
  };

  const handleAddCell = (wi, cells) => {
    const path = `words[${wi}].cells`;
    addItem(path, cells.length, { cellNo: cells.length + 1, text: "" });
  };

  const handleRemoveCell = (wi, ci) => {
    removeItem(`words[${wi}].cells`, ci);
  };

  const handleAddStep = (wi, steps) => {
    const path = `words[${wi}].steps`;
    addItem(path, steps.length, {
      stepId: `s${Date.now()}`,
      questionType: "PHONEME_RESULT",
      targetCellNo: 1,
      envCellNos: [],
      choices: [
        { id: `c${Date.now()}a`, text: "" },
        { id: `c${Date.now()}b`, text: "" },
      ],
      answerId: "",
      onCorrect: { deltaSec: -10, applyCellText: "" },
      onWrong: { deltaSec: 5, retry: true },
    });
  };

  const handleRemoveStep = (wi, si) => {
    if (!confirm(`단계 ${si + 1}을 삭제하시겠습니까?`)) return;
    removeItem(`words[${wi}].steps`, si);
  };

  return (
    <div>
      <div style={{ marginBottom: 12, fontSize: 14, fontWeight: 600 }}>
        단어 편집 ({words.length}개)
      </div>

      {words.map((w, wi) => {
        const wPath = `words[${wi}]`;
        const isActive = focusPath && focusPath.startsWith(wPath);

        return (
          <CollapsibleSection
            key={w.wordId || wi}
            title={`${wi + 1}. ${w.surface || "(미입력)"}`}
            defaultOpen={isActive}
          >
            <div data-field-path={wPath}>
              {/* 표기 */}
              <div className="ce-form-section">
                <label className="ce-form-label">표기 (surface)</label>
                <input
                  className="ce-form-input"
                  value={w.surface || ""}
                  onChange={(e) => updateField(`${wPath}.surface`, e.target.value)}
                />
              </div>

              {/* 셀 */}
              <div className="ce-form-section">
                <label className="ce-form-label">음소 셀 ({(w.cells || []).length}개)</label>
                {(w.cells || []).map((c, ci) => (
                  <div key={ci} className="ce-form-row" style={{ marginBottom: 4 }}>
                    <input
                      className="ce-form-input"
                      style={{ width: 60, flex: "none" }}
                      type="number"
                      value={c.cellNo ?? ""}
                      onChange={(e) => updateField(`${wPath}.cells[${ci}].cellNo`, Number(e.target.value))}
                      placeholder="번호"
                    />
                    <input
                      className="ce-form-input"
                      value={c.text || ""}
                      onChange={(e) => updateField(`${wPath}.cells[${ci}].text`, e.target.value)}
                      placeholder="음소 텍스트"
                    />
                    <button className="ce-choice-del" onClick={() => handleRemoveCell(wi, ci)} title="삭제">×</button>
                  </div>
                ))}
                <button className="ce-add-btn" onClick={() => handleAddCell(wi, w.cells || [])}>
                  + 셀 추가
                </button>
              </div>

              {/* Steps */}
              <div className="ce-form-section">
                <label className="ce-form-label">단계 ({(w.steps || []).length}개)</label>
                {(w.steps || []).map((s, si) => {
                  const sPath = `${wPath}.steps[${si}]`;
                  return (
                    <CollapsibleSection
                      key={s.stepId || si}
                      title={`단계 ${si + 1} — ${s.questionType || ""}`}
                      defaultOpen={false}
                    >
                      <div data-field-path={sPath}>
                        {/* questionType */}
                        <div className="ce-form-section">
                          <label className="ce-form-label">질문 유형</label>
                          <select
                            className="ce-form-select"
                            value={s.questionType || ""}
                            onChange={(e) => updateField(`${sPath}.questionType`, e.target.value)}
                          >
                            <option value="PHONEME_RESULT">음운 결과 (PHONEME_RESULT)</option>
                            <option value="RULE_EXPLANATION">규칙 설명 (RULE_EXPLANATION)</option>
                          </select>
                        </div>

                        {/* targetCellNo, envCellNos */}
                        <div className="ce-form-row">
                          <div>
                            <label className="ce-form-label">대상 셀 번호</label>
                            <input
                              className="ce-form-input"
                              type="number"
                              value={s.targetCellNo ?? ""}
                              onChange={(e) => updateField(`${sPath}.targetCellNo`, Number(e.target.value))}
                            />
                          </div>
                          <div>
                            <label className="ce-form-label">환경 셀 번호 (쉼표 구분)</label>
                            <input
                              className="ce-form-input"
                              value={(s.envCellNos || []).join(",")}
                              onChange={(e) => {
                                const nums = e.target.value.split(",").map((v) => Number(v.trim())).filter((v) => !isNaN(v));
                                updateField(`${sPath}.envCellNos`, nums);
                              }}
                              placeholder="예: 1,2"
                            />
                          </div>
                        </div>

                        {/* 선택지 */}
                        <div className="ce-form-section">
                          <label className="ce-form-label">선택지</label>
                          <ChoiceEditor
                            choices={s.choices || []}
                            answerId={s.answerId}
                            pathPrefix={sPath}
                            updateField={updateField}
                            addItem={addItem}
                            removeItem={removeItem}
                          />
                        </div>

                        {/* onCorrect */}
                        <div className="ce-form-section">
                          <label className="ce-form-label">정답 시</label>
                          <div className="ce-form-row">
                            <div>
                              <label className="ce-form-label">시간 변동(초)</label>
                              <input
                                className="ce-form-input"
                                type="number"
                                value={s.onCorrect?.deltaSec ?? ""}
                                onChange={(e) => updateField(`${sPath}.onCorrect.deltaSec`, Number(e.target.value))}
                              />
                            </div>
                            <div>
                              <label className="ce-form-label">적용 텍스트</label>
                              <input
                                className="ce-form-input"
                                value={s.onCorrect?.applyCellText || ""}
                                onChange={(e) => updateField(`${sPath}.onCorrect.applyCellText`, e.target.value)}
                              />
                            </div>
                          </div>
                        </div>

                        {/* onWrong */}
                        <div className="ce-form-section">
                          <label className="ce-form-label">오답 시</label>
                          <div className="ce-form-row">
                            <div>
                              <label className="ce-form-label">시간 변동(초)</label>
                              <input
                                className="ce-form-input"
                                type="number"
                                value={s.onWrong?.deltaSec ?? ""}
                                onChange={(e) => updateField(`${sPath}.onWrong.deltaSec`, Number(e.target.value))}
                              />
                            </div>
                            <div>
                              <label className="ce-form-label">재시도</label>
                              <select
                                className="ce-form-select"
                                value={s.onWrong?.retry ? "true" : "false"}
                                onChange={(e) => updateField(`${sPath}.onWrong.retry`, e.target.value === "true")}
                              >
                                <option value="true">예</option>
                                <option value="false">아니오</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <button
                          className="ce-btn ce-btn-danger"
                          style={{ marginTop: 8 }}
                          onClick={() => handleRemoveStep(wi, si)}
                        >
                          단계 삭제
                        </button>
                      </div>
                    </CollapsibleSection>
                  );
                })}
                <button className="ce-add-btn" onClick={() => handleAddStep(wi, w.steps || [])}>
                  + 단계 추가
                </button>
              </div>

              <button
                className="ce-btn ce-btn-danger"
                style={{ marginTop: 8 }}
                onClick={() => handleRemoveWord(wi)}
              >
                단어 삭제
              </button>
            </div>
          </CollapsibleSection>
        );
      })}

      <button className="ce-add-btn" onClick={handleAddWord}>
        + 단어 추가
      </button>
    </div>
  );
}
