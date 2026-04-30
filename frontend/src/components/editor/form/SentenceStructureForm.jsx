import CollapsibleSection from "../widgets/CollapsibleSection";

/**
 * 문장 짜임 편집 폼 (오른쪽 패널)
 * sentences[] > tokens[] + roleQueryOrder[]
 */
export default function SentenceStructureForm({ editor, focusPath }) {
  const { content, updateField, addItem, removeItem } = editor;
  const sentences = content?.sentences || [];

  const handleAddSentence = () => {
    addItem("sentences", sentences.length, {
      sentenceId: `sent${Date.now()}`,
      tokens: [],
      predicateTokens: [],
      roleQueryOrder: [],
      embeddedOrLinked: [],
    });
  };

  const handleRemoveSentence = (idx) => {
    if (!confirm(`문장 ${idx + 1}을 삭제하시겠습니까?`)) return;
    removeItem("sentences", idx);
  };

  /* 토큰 */
  const handleAddToken = (si, tokens) => {
    addItem(`sentences[${si}].tokens`, tokens.length, {
      tokenId: `t${Date.now()}`,
      text: "",
      role: "",
    });
  };

  const handleRemoveToken = (si, ti) => {
    removeItem(`sentences[${si}].tokens`, ti);
  };

  /* roleQueryOrder */
  const handleAddRoleQuery = (si, rqs) => {
    addItem(`sentences[${si}].roleQueryOrder`, rqs.length, {
      predicate: "",
      targetRoles: [],
    });
  };

  const handleRemoveRoleQuery = (si, ri) => {
    removeItem(`sentences[${si}].roleQueryOrder`, ri);
  };

  /* embeddedOrLinked */
  const handleAddClause = (si, clauses) => {
    addItem(`sentences[${si}].embeddedOrLinked`, clauses.length, {
      type: "EMBEDDED",
      tokenRefs: [],
      clauseType: "",
    });
  };

  const handleRemoveClause = (si, ci) => {
    removeItem(`sentences[${si}].embeddedOrLinked`, ci);
  };

  return (
    <div>
      <div style={{ marginBottom: 12, fontSize: 14, fontWeight: 600 }}>
        문장 편집 ({sentences.length}개)
      </div>

      {sentences.map((sent, si) => {
        const sPath = `sentences[${si}]`;
        const isActive = focusPath && focusPath.startsWith(sPath);

        return (
          <CollapsibleSection
            key={sent.sentenceId || si}
            title={`문장 ${si + 1} — ${sent.sentenceId || ""}`}
            defaultOpen={isActive}
          >
            <div data-field-path={sPath}>
              {/* sentenceId */}
              <div className="ce-form-section">
                <label className="ce-form-label">문장 ID</label>
                <input
                  className="ce-form-input"
                  value={sent.sentenceId || ""}
                  onChange={(e) => updateField(`${sPath}.sentenceId`, e.target.value)}
                />
              </div>

              {/* 토큰 */}
              <div className="ce-form-section">
                <label className="ce-form-label">토큰 ({(sent.tokens || []).length}개)</label>
                {(sent.tokens || []).map((t, ti) => {
                  const tPath = `${sPath}.tokens[${ti}]`;
                  return (
                    <div key={t.tokenId || ti} className="ce-form-row" style={{ marginBottom: 4 }}>
                      <input
                        className="ce-form-input"
                        style={{ width: 70, flex: "none" }}
                        value={t.tokenId || ""}
                        onChange={(e) => updateField(`${tPath}.tokenId`, e.target.value)}
                        placeholder="ID"
                      />
                      <input
                        className="ce-form-input"
                        value={t.text || ""}
                        onChange={(e) => updateField(`${tPath}.text`, e.target.value)}
                        placeholder="텍스트"
                      />
                      <input
                        className="ce-form-input"
                        style={{ width: 120, flex: "none" }}
                        value={t.role || ""}
                        onChange={(e) => updateField(`${tPath}.role`, e.target.value)}
                        placeholder="역할"
                      />
                      <button className="ce-choice-del" onClick={() => handleRemoveToken(si, ti)} title="삭제">×</button>
                    </div>
                  );
                })}
                <button className="ce-add-btn" onClick={() => handleAddToken(si, sent.tokens || [])}>
                  + 토큰 추가
                </button>
              </div>

              {/* predicateTokens */}
              <div className="ce-form-section">
                <label className="ce-form-label">서술어 토큰 ID (쉼표 구분)</label>
                <input
                  className="ce-form-input"
                  value={(sent.predicateTokens || []).join(",")}
                  onChange={(e) => {
                    const ids = e.target.value.split(",").map((v) => v.trim()).filter(Boolean);
                    updateField(`${sPath}.predicateTokens`, ids);
                  }}
                  placeholder="예: t1,t5"
                />
              </div>

              {/* roleQueryOrder */}
              <div className="ce-form-section">
                <label className="ce-form-label">역할 질의 순서 ({(sent.roleQueryOrder || []).length}개)</label>
                {(sent.roleQueryOrder || []).map((rq, ri) => {
                  const rqPath = `${sPath}.roleQueryOrder[${ri}]`;
                  return (
                    <div key={ri} style={{ marginBottom: 8, padding: 8, background: "var(--panel)", borderRadius: 6 }}>
                      <div className="ce-form-row">
                        <div>
                          <label className="ce-form-label">서술어 토큰 ID</label>
                          <input
                            className="ce-form-input"
                            value={rq.predicate || ""}
                            onChange={(e) => updateField(`${rqPath}.predicate`, e.target.value)}
                            placeholder="토큰 ID"
                          />
                        </div>
                        <div>
                          <label className="ce-form-label">대상 역할 (쉼표 구분)</label>
                          <input
                            className="ce-form-input"
                            value={(rq.targetRoles || []).join(",")}
                            onChange={(e) => {
                              const roles = e.target.value.split(",").map((v) => v.trim()).filter(Boolean);
                              updateField(`${rqPath}.targetRoles`, roles);
                            }}
                            placeholder="SUBJECT_1,OBJECT_1"
                          />
                        </div>
                        <button className="ce-choice-del" onClick={() => handleRemoveRoleQuery(si, ri)} title="삭제">×</button>
                      </div>
                    </div>
                  );
                })}
                <button className="ce-add-btn" onClick={() => handleAddRoleQuery(si, sent.roleQueryOrder || [])}>
                  + 역할 질의 추가
                </button>
              </div>

              {/* embeddedOrLinked */}
              <div className="ce-form-section">
                <label className="ce-form-label">절 구조 ({(sent.embeddedOrLinked || []).length}개)</label>
                {(sent.embeddedOrLinked || []).map((cl, ci) => {
                  const clPath = `${sPath}.embeddedOrLinked[${ci}]`;
                  return (
                    <div key={ci} style={{ marginBottom: 8, padding: 8, background: "var(--panel)", borderRadius: 6 }}>
                      <div className="ce-form-row">
                        <div>
                          <label className="ce-form-label">유형</label>
                          <select
                            className="ce-form-select"
                            value={cl.type || "EMBEDDED"}
                            onChange={(e) => updateField(`${clPath}.type`, e.target.value)}
                          >
                            <option value="EMBEDDED">안긴절 (EMBEDDED)</option>
                            <option value="LINKED">이어진절 (LINKED)</option>
                          </select>
                        </div>
                        <div>
                          <label className="ce-form-label">절 종류</label>
                          <input
                            className="ce-form-input"
                            value={cl.clauseType || ""}
                            onChange={(e) => updateField(`${clPath}.clauseType`, e.target.value)}
                            placeholder="예: 관형절"
                          />
                        </div>
                        <button className="ce-choice-del" onClick={() => handleRemoveClause(si, ci)} title="삭제">×</button>
                      </div>
                      <div className="ce-form-section" style={{ marginTop: 6 }}>
                        <label className="ce-form-label">토큰 참조 (쉼표 구분)</label>
                        <input
                          className="ce-form-input"
                          value={(cl.tokenRefs || []).join(",")}
                          onChange={(e) => {
                            const refs = e.target.value.split(",").map((v) => v.trim()).filter(Boolean);
                            updateField(`${clPath}.tokenRefs`, refs);
                          }}
                          placeholder="t1,t2,t3"
                        />
                      </div>
                    </div>
                  );
                })}
                <button className="ce-add-btn" onClick={() => handleAddClause(si, sent.embeddedOrLinked || [])}>
                  + 절 구조 추가
                </button>
              </div>

              <button
                className="ce-btn ce-btn-danger"
                style={{ marginTop: 8 }}
                onClick={() => handleRemoveSentence(si)}
              >
                문장 삭제
              </button>
            </div>
          </CollapsibleSection>
        );
      })}

      <button className="ce-add-btn" onClick={handleAddSentence}>
        + 문장 추가
      </button>
    </div>
  );
}
