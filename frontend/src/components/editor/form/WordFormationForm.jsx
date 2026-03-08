import CollapsibleSection from "../widgets/CollapsibleSection";
import ChoiceEditor from "../widgets/ChoiceEditor";

/**
 * 단어 형성 편집 폼 (오른쪽 패널)
 * items[] > morphemes[] + steps[] + formationGame
 */
export default function WordFormationForm({ editor, focusPath }) {
  const { content, updateField, addItem, removeItem } = editor;
  const items = content?.items || [];

  const handleAddItem = () => {
    addItem("items", items.length, {
      word: "",
      morphemes: [],
      steps: [],
      formationGame: { mergeQuestions: [] },
    });
  };

  const handleRemoveItem = (idx) => {
    if (!confirm(`항목 ${idx + 1}을 삭제하시겠습니까?`)) return;
    removeItem("items", idx);
  };

  /* 형태소 추가/삭제 */
  const handleAddMorpheme = (itemIdx, morphemes) => {
    addItem(`items[${itemIdx}].morphemes`, morphemes.length, "");
  };

  const handleRemoveMorpheme = (itemIdx, mIdx) => {
    removeItem(`items[${itemIdx}].morphemes`, mIdx);
  };

  /* step 추가/삭제 */
  const handleAddStep = (itemIdx, steps) => {
    addItem(`items[${itemIdx}].steps`, steps.length, {
      type: "COUNT",
      index: 0,
      choices: [
        { id: `c${Date.now()}a`, text: "" },
        { id: `c${Date.now()}b`, text: "" },
      ],
      answer: "",
      delta: { correct: -10, wrong: 5 },
    });
  };

  const handleRemoveStep = (itemIdx, sIdx) => {
    if (!confirm(`단계 ${sIdx + 1}을 삭제하시겠습니까?`)) return;
    removeItem(`items[${itemIdx}].steps`, sIdx);
  };

  /* mergeQuestion 추가/삭제 */
  const handleAddMerge = (itemIdx, merges) => {
    addItem(`items[${itemIdx}].formationGame.mergeQuestions`, merges.length, {
      ask: "",
      answer: "LEFT",
    });
  };

  const handleRemoveMerge = (itemIdx, mIdx) => {
    removeItem(`items[${itemIdx}].formationGame.mergeQuestions`, mIdx);
  };

  return (
    <div>
      <div style={{ marginBottom: 12, fontSize: 14, fontWeight: 600 }}>
        단어 항목 편집 ({items.length}개)
      </div>

      {items.map((item, ii) => {
        const iPath = `items[${ii}]`;
        const isActive = focusPath && focusPath.startsWith(iPath);

        return (
          <CollapsibleSection
            key={ii}
            title={`${ii + 1}. ${item.word || "(미입력)"}`}
            defaultOpen={isActive}
          >
            <div data-field-path={iPath}>
              {/* 단어 */}
              <div className="ce-form-section">
                <label className="ce-form-label">대상 단어</label>
                <input
                  className="ce-form-input"
                  value={item.word || ""}
                  onChange={(e) => updateField(`${iPath}.word`, e.target.value)}
                />
              </div>

              {/* 형태소 */}
              <div className="ce-form-section">
                <label className="ce-form-label">형태소 ({(item.morphemes || []).length}개)</label>
                {(item.morphemes || []).map((m, mi) => (
                  <div key={mi} className="ce-form-row" style={{ marginBottom: 4 }}>
                    <span style={{ color: "#6a7a6e", fontSize: 12, width: 24, textAlign: "center", flexShrink: 0 }}>{mi}</span>
                    <input
                      className="ce-form-input"
                      value={m || ""}
                      onChange={(e) => updateField(`${iPath}.morphemes[${mi}]`, e.target.value)}
                      placeholder="형태소"
                    />
                    <button className="ce-choice-del" onClick={() => handleRemoveMorpheme(ii, mi)} title="삭제">×</button>
                  </div>
                ))}
                <button className="ce-add-btn" onClick={() => handleAddMorpheme(ii, item.morphemes || [])}>
                  + 형태소 추가
                </button>
              </div>

              {/* Steps */}
              <div className="ce-form-section">
                <label className="ce-form-label">단계 ({(item.steps || []).length}개)</label>
                {(item.steps || []).map((s, si) => {
                  const sPath = `${iPath}.steps[${si}]`;
                  return (
                    <CollapsibleSection
                      key={si}
                      title={`단계 ${si + 1} — ${s.type || ""}`}
                      defaultOpen={false}
                    >
                      <div data-field-path={sPath}>
                        <div className="ce-form-row">
                          <div>
                            <label className="ce-form-label">유형</label>
                            <select
                              className="ce-form-select"
                              value={s.type || ""}
                              onChange={(e) => updateField(`${sPath}.type`, e.target.value)}
                            >
                              <option value="COUNT">COUNT (개수)</option>
                              <option value="NAME">NAME (이름)</option>
                              <option value="LABEL">LABEL (분류명)</option>
                              <option value="ROLE">ROLE (역할)</option>
                              <option value="CLASSIFY">CLASSIFY (분류)</option>
                            </select>
                          </div>
                          <div>
                            <label className="ce-form-label">대상 형태소 인덱스</label>
                            <input
                              className="ce-form-input"
                              type="number"
                              value={s.index ?? ""}
                              onChange={(e) => updateField(`${sPath}.index`, Number(e.target.value))}
                            />
                          </div>
                        </div>

                        {/* answer (텍스트) */}
                        <div className="ce-form-section">
                          <label className="ce-form-label">정답 (answer)</label>
                          <input
                            className="ce-form-input"
                            value={s.answer || ""}
                            onChange={(e) => updateField(`${sPath}.answer`, e.target.value)}
                          />
                        </div>

                        {/* 선택지 (있는 경우) */}
                        {s.choices && (
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
                        )}

                        {/* delta */}
                        <div className="ce-form-row">
                          <div>
                            <label className="ce-form-label">정답 시간(초)</label>
                            <input
                              className="ce-form-input"
                              type="number"
                              value={s.delta?.correct ?? ""}
                              onChange={(e) => updateField(`${sPath}.delta.correct`, Number(e.target.value))}
                            />
                          </div>
                          <div>
                            <label className="ce-form-label">오답 시간(초)</label>
                            <input
                              className="ce-form-input"
                              type="number"
                              value={s.delta?.wrong ?? ""}
                              onChange={(e) => updateField(`${sPath}.delta.wrong`, Number(e.target.value))}
                            />
                          </div>
                        </div>

                        <button
                          className="ce-btn ce-btn-danger"
                          style={{ marginTop: 8 }}
                          onClick={() => handleRemoveStep(ii, si)}
                        >
                          단계 삭제
                        </button>
                      </div>
                    </CollapsibleSection>
                  );
                })}
                <button className="ce-add-btn" onClick={() => handleAddStep(ii, item.steps || [])}>
                  + 단계 추가
                </button>
              </div>

              {/* Formation Game */}
              <div className="ce-form-section">
                <label className="ce-form-label">
                  결합 게임 ({(item.formationGame?.mergeQuestions || []).length}문항)
                </label>
                {(item.formationGame?.mergeQuestions || []).map((mq, mi) => {
                  const mqPath = `${iPath}.formationGame.mergeQuestions[${mi}]`;
                  return (
                    <div key={mi} className="ce-form-row" style={{ marginBottom: 8, alignItems: "flex-end" }}>
                      <div style={{ flex: 2 }}>
                        <label className="ce-form-label">질문</label>
                        <input
                          className="ce-form-input"
                          value={mq.ask || ""}
                          onChange={(e) => updateField(`${mqPath}.ask`, e.target.value)}
                        />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="ce-form-label">정답</label>
                        <select
                          className="ce-form-select"
                          value={mq.answer || "LEFT"}
                          onChange={(e) => updateField(`${mqPath}.answer`, e.target.value)}
                        >
                          <option value="LEFT">LEFT</option>
                          <option value="RIGHT">RIGHT</option>
                        </select>
                      </div>
                      <button className="ce-choice-del" onClick={() => handleRemoveMerge(ii, mi)} title="삭제">×</button>
                    </div>
                  );
                })}
                <button className="ce-add-btn" onClick={() => handleAddMerge(ii, item.formationGame?.mergeQuestions || [])}>
                  + 결합 문항 추가
                </button>
              </div>

              <button
                className="ce-btn ce-btn-danger"
                style={{ marginTop: 8 }}
                onClick={() => handleRemoveItem(ii)}
              >
                항목 삭제
              </button>
            </div>
          </CollapsibleSection>
        );
      })}

      <button className="ce-add-btn" onClick={handleAddItem}>
        + 단어 항목 추가
      </button>
    </div>
  );
}
