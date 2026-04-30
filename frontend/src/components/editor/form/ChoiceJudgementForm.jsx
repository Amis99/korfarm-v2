import CollapsibleSection from "../widgets/CollapsibleSection";

/**
 * 선택지 판별 편집 폼 (오른쪽 패널)
 * passage (토큰 편집) + items[] > choices[] > propositions[]
 */
export default function ChoiceJudgementForm({ editor, focusPath }) {
  const { content, updateField, addItem, removeItem } = editor;
  const passage = content?.passage;
  const items = content?.items || [];

  /* === Passage 토큰 편집 === */
  const handleAddParagraph = () => {
    const paras = passage?.paragraphs || [];
    addItem("passage.paragraphs", paras.length, {
      id: `p${Date.now()}`,
      text: "",
    });
  };

  const handleRemoveParagraph = (pi) => {
    removeItem("passage.paragraphs", pi);
  };

  const handleAddToken = () => {
    const tokens = passage?.tokens || [];
    addItem("passage.tokens", tokens.length, {
      tokenId: `tok${Date.now()}`,
      paragraphId: "",
      text: "",
    });
  };

  const handleRemoveToken = (ti) => {
    removeItem("passage.tokens", ti);
  };

  /* === Items === */
  const handleAddItem = () => {
    addItem("items", items.length, {
      itemId: `item${Date.now()}`,
      stem: "",
      choices: [],
    });
  };

  const handleRemoveItem = (idx) => {
    if (!confirm(`문항 ${idx + 1}을 삭제하시겠습니까?`)) return;
    removeItem("items", idx);
  };

  /* === Choices === */
  const handleAddChoice = (itemIdx, choices) => {
    const labels = "ABCDEFGHIJ";
    const nextLabel = labels[choices.length] || `c${choices.length + 1}`;
    addItem(`items[${itemIdx}].choices`, choices.length, {
      choiceId: nextLabel,
      text: "",
      finalIsCorrectChoice: false,
      propositions: [],
    });
  };

  const handleRemoveChoice = (itemIdx, choiceIdx) => {
    removeItem(`items[${itemIdx}].choices`, choiceIdx);
  };

  /* === Propositions === */
  const handleAddProposition = (itemIdx, choiceIdx, props) => {
    addItem(`items[${itemIdx}].choices[${choiceIdx}].propositions`, props.length, {
      propId: `pr${Date.now()}`,
      text: "",
      oxAnswer: "O",
      evidenceTokens: [],
    });
  };

  const handleRemoveProposition = (itemIdx, choiceIdx, propIdx) => {
    removeItem(`items[${itemIdx}].choices[${choiceIdx}].propositions`, propIdx);
  };

  return (
    <div>
      {/* === 지문 편집 === */}
      <CollapsibleSection title="지문 (Passage)" defaultOpen={focusPath === "passage"}>
        <div data-field-path="passage">
          {/* format */}
          <div className="ce-form-section">
            <label className="ce-form-label">format</label>
            <input
              className="ce-form-input"
              value={passage?.format || "TEXT"}
              onChange={(e) => updateField("passage.format", e.target.value)}
            />
          </div>

          {/* 문단 */}
          <div className="ce-form-section">
            <label className="ce-form-label">문단 ({(passage?.paragraphs || []).length}개)</label>
            {(passage?.paragraphs || []).map((p, pi) => (
              <div key={p.id || pi} className="ce-form-row" style={{ marginBottom: 4 }}>
                <input
                  className="ce-form-input"
                  style={{ width: 60, flex: "none" }}
                  value={p.id || ""}
                  onChange={(e) => updateField(`passage.paragraphs[${pi}].id`, e.target.value)}
                  placeholder="ID"
                />
                <textarea
                  className="ce-form-textarea"
                  value={p.text || ""}
                  onChange={(e) => updateField(`passage.paragraphs[${pi}].text`, e.target.value)}
                  rows={2}
                  placeholder="문단 텍스트"
                />
                <button className="ce-choice-del" onClick={() => handleRemoveParagraph(pi)} title="삭제">×</button>
              </div>
            ))}
            <button className="ce-add-btn" onClick={handleAddParagraph}>+ 문단 추가</button>
          </div>

          {/* 토큰 */}
          <CollapsibleSection title={`토큰 (${(passage?.tokens || []).length}개)`} defaultOpen={false}>
            {(passage?.tokens || []).map((t, ti) => (
              <div key={t.tokenId || ti} className="ce-form-row" style={{ marginBottom: 4 }}>
                <input
                  className="ce-form-input"
                  style={{ width: 60, flex: "none" }}
                  value={t.tokenId || ""}
                  onChange={(e) => updateField(`passage.tokens[${ti}].tokenId`, e.target.value)}
                  placeholder="ID"
                />
                <input
                  className="ce-form-input"
                  style={{ width: 60, flex: "none" }}
                  value={t.paragraphId || ""}
                  onChange={(e) => updateField(`passage.tokens[${ti}].paragraphId`, e.target.value)}
                  placeholder="문단ID"
                />
                <input
                  className="ce-form-input"
                  value={t.text || ""}
                  onChange={(e) => updateField(`passage.tokens[${ti}].text`, e.target.value)}
                  placeholder="텍스트"
                />
                <button className="ce-choice-del" onClick={() => handleRemoveToken(ti)} title="삭제">×</button>
              </div>
            ))}
            <button className="ce-add-btn" onClick={handleAddToken}>+ 토큰 추가</button>
          </CollapsibleSection>
        </div>
      </CollapsibleSection>

      {/* === 문항 편집 === */}
      <div style={{ marginTop: 16, marginBottom: 12, fontSize: 14, fontWeight: 600 }}>
        문항 편집 ({items.length}개)
      </div>

      {items.map((item, ii) => {
        const iPath = `items[${ii}]`;
        const isActive = focusPath && focusPath.startsWith(iPath);

        return (
          <CollapsibleSection
            key={item.itemId || ii}
            title={`문항 ${ii + 1}`}
            defaultOpen={isActive}
          >
            <div data-field-path={iPath}>
              {/* itemId */}
              <div className="ce-form-section">
                <label className="ce-form-label">항목 ID</label>
                <input
                  className="ce-form-input"
                  value={item.itemId || ""}
                  onChange={(e) => updateField(`${iPath}.itemId`, e.target.value)}
                />
              </div>

              {/* stem */}
              <div className="ce-form-section">
                <label className="ce-form-label">발문 (stem)</label>
                <textarea
                  className="ce-form-textarea"
                  value={item.stem || ""}
                  onChange={(e) => updateField(`${iPath}.stem`, e.target.value)}
                  rows={2}
                />
              </div>

              {/* choices */}
              <div className="ce-form-section">
                <label className="ce-form-label">선택지 ({(item.choices || []).length}개)</label>
                {(item.choices || []).map((ch, ci) => {
                  const chPath = `${iPath}.choices[${ci}]`;
                  return (
                    <CollapsibleSection
                      key={ch.choiceId || ci}
                      title={`${ch.choiceId || ci + 1}. ${ch.text?.slice(0, 20) || "(빈)"} ${ch.finalIsCorrectChoice ? "✓" : ""}`}
                      defaultOpen={false}
                    >
                      <div data-field-path={chPath}>
                        <div className="ce-form-row">
                          <div style={{ flex: "none", width: 60 }}>
                            <label className="ce-form-label">ID</label>
                            <input
                              className="ce-form-input"
                              value={ch.choiceId || ""}
                              onChange={(e) => updateField(`${chPath}.choiceId`, e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="ce-form-label">텍스트</label>
                            <input
                              className="ce-form-input"
                              value={ch.text || ""}
                              onChange={(e) => updateField(`${chPath}.text`, e.target.value)}
                            />
                          </div>
                          <div style={{ flex: "none", width: 60 }}>
                            <label className="ce-form-label">정답?</label>
                            <button
                              className={`ce-ox-toggle ${ch.finalIsCorrectChoice ? "correct" : ""}`}
                              onClick={() => updateField(`${chPath}.finalIsCorrectChoice`, !ch.finalIsCorrectChoice)}
                            >
                              {ch.finalIsCorrectChoice ? "Y" : "N"}
                            </button>
                          </div>
                        </div>

                        {/* propositions */}
                        <div className="ce-form-section" style={{ marginTop: 8 }}>
                          <label className="ce-form-label">명제 ({(ch.propositions || []).length}개)</label>
                          {(ch.propositions || []).map((pr, pri) => {
                            const prPath = `${chPath}.propositions[${pri}]`;
                            return (
                              <div key={pr.propId || pri} style={{ marginBottom: 8, padding: 8, background: "var(--panel)", borderRadius: 6 }}>
                                <div className="ce-form-row">
                                  <input
                                    className="ce-form-input"
                                    style={{ width: 50, flex: "none" }}
                                    value={pr.propId || ""}
                                    onChange={(e) => updateField(`${prPath}.propId`, e.target.value)}
                                    placeholder="ID"
                                  />
                                  <input
                                    className="ce-form-input"
                                    value={pr.text || ""}
                                    onChange={(e) => updateField(`${prPath}.text`, e.target.value)}
                                    placeholder="명제 텍스트"
                                  />
                                  <button
                                    className={`ce-ox-toggle ${pr.oxAnswer === "O" ? "correct" : "wrong"}`}
                                    onClick={() => updateField(`${prPath}.oxAnswer`, pr.oxAnswer === "O" ? "X" : "O")}
                                    style={{ flex: "none" }}
                                  >
                                    {pr.oxAnswer || "?"}
                                  </button>
                                  <button className="ce-choice-del" onClick={() => handleRemoveProposition(ii, ci, pri)} title="삭제">×</button>
                                </div>
                                <div className="ce-form-section" style={{ marginTop: 4 }}>
                                  <label className="ce-form-label">근거 토큰 (쉼표 구분)</label>
                                  <input
                                    className="ce-form-input"
                                    value={(pr.evidenceTokens || []).join(",")}
                                    onChange={(e) => {
                                      const tokens = e.target.value.split(",").map((v) => v.trim()).filter(Boolean);
                                      updateField(`${prPath}.evidenceTokens`, tokens);
                                    }}
                                    placeholder="tok1,tok2"
                                  />
                                </div>
                              </div>
                            );
                          })}
                          <button className="ce-add-btn" onClick={() => handleAddProposition(ii, ci, ch.propositions || [])}>
                            + 명제 추가
                          </button>
                        </div>

                        <button className="ce-choice-del" onClick={() => handleRemoveChoice(ii, ci)} title="선택지 삭제" style={{ color: "#ff6b6b", fontSize: 12 }}>
                          선택지 삭제
                        </button>
                      </div>
                    </CollapsibleSection>
                  );
                })}
                <button className="ce-add-btn" onClick={() => handleAddChoice(ii, item.choices || [])}>
                  + 선택지 추가
                </button>
              </div>

              <button
                className="ce-btn ce-btn-danger"
                style={{ marginTop: 8 }}
                onClick={() => handleRemoveItem(ii)}
              >
                문항 삭제
              </button>
            </div>
          </CollapsibleSection>
        );
      })}

      <button className="ce-add-btn" onClick={handleAddItem}>
        + 문항 추가
      </button>
    </div>
  );
}
