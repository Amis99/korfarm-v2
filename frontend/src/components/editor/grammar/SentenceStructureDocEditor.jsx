import InlineEditable from "../dailyquiz/InlineEditable";

const ROLE_OPTIONS = ["주어", "서술어", "목적어", "보어", "관형어", "부사어", "독립어"];
const CLAUSE_TYPES = ["대등", "종속", "명사절", "서술절", "관형절", "부사절", "인용절"];

/**
 * SENTENCE_STRUCTURE 워드 프로세서형 에디터.
 * payload.sentences[] = [{ text, boxes:[{id,text,layer,role}], roleOrder:[boxId], clauses:[{range:[boxId], layer, clauseType, parentRole, parentLayer}] }]
 *
 * 가장 복잡한 구조라 기본 필드만 폼으로, clauses 등은 JSON 직접 편집 옵션.
 */
export default function SentenceStructureDocEditor({ editor }) {
  const { content } = editor;
  const sentences = content?.sentences || [];

  const addSentence = (atIdx) => {
    editor.addItem("sentences", atIdx, {
      text: "", boxes: [], roleOrder: [], clauses: [],
    });
  };
  const removeSentence = (i) => {
    if (!window.confirm(`문장 ${i + 1} 삭제?`)) return;
    editor.removeItem("sentences", i);
  };
  const moveSentence = (from, to) => {
    if (to < 0 || to >= sentences.length) return;
    editor.reorderItems("sentences", from, to);
  };

  const addBox = (si) => {
    const cur = sentences[si]?.boxes || [];
    const newId = `b-${Date.now().toString(36).slice(-3)}-${cur.length + 1}`;
    editor.addItem(`sentences[${si}].boxes`, cur.length, {
      id: newId, text: "", layer: 1, role: "주어",
    });
  };
  const removeBox = (si, bi) => editor.removeItem(`sentences[${si}].boxes`, bi);
  const moveBox = (si, from, to) => {
    const len = sentences[si]?.boxes?.length || 0;
    if (to < 0 || to >= len) return;
    editor.reorderItems(`sentences[${si}].boxes`, from, to);
  };

  return (
    <div className="dq-doc-root">
      <div className="dq-doc-meta">
        <div className="dq-doc-meta-row">
          <label>제한 시간 <input type="number" value={content?.timeLimitSec ?? 600}
            onChange={(e) => editor.updateField("timeLimitSec", Number(e.target.value))} style={{ width: 90 }} /></label>
          <span style={{ flex: 1 }} />
          <span className="dq-doc-meta-stat">총 {sentences.length} 문장</span>
        </div>
      </div>

      <div className="dq-doc-paper">
        {sentences.length === 0 && <div className="dq-doc-empty">아래 [+]로 첫 문장을 추가하세요.</div>}
        {sentences.map((s, si) => {
          const boxes = s.boxes || [];
          const roleOrder = s.roleOrder || [];
          const clauses = s.clauses || [];
          return (
            <div key={si}>
              <button type="button" className="dr-step-insert" onClick={() => addSentence(si)}>+ 여기에 문장 추가</button>
              <div className="dq-card">
                <div className="dq-card-header">
                  <div className="dq-card-num">문장 {si + 1}</div>
                  <div className="dq-fb-blank-move">
                    <button type="button" onClick={() => moveSentence(si, si - 1)} disabled={si === 0}>▲</button>
                    <button type="button" onClick={() => moveSentence(si, si + 1)} disabled={si >= sentences.length - 1}>▼</button>
                  </div>
                  <span style={{ flex: 1 }} />
                  <button type="button" className="dq-mc-del" onClick={() => removeSentence(si)}>×</button>
                </div>
                <div className="dq-card-body">
                  <div className="dq-section-label">문장 본문</div>
                  <InlineEditable value={s.text || ""}
                    onChange={(v) => editor.updateField(`sentences[${si}].text`, v)}
                    placeholder="분석 대상 문장" className="dq-stem" />

                  <div className="dq-section-label">어절 박스 (boxes) — id / text / layer / role</div>
                  <table className="gr-table">
                    <thead><tr><th>#</th><th>id</th><th>text</th><th>layer</th><th>role</th><th>이동</th><th>삭제</th></tr></thead>
                    <tbody>
                      {boxes.map((b, bi) => (
                        <tr key={bi}>
                          <td>{bi + 1}</td>
                          <td><input type="text" value={b.id || ""}
                            onChange={(e) => editor.updateField(`sentences[${si}].boxes[${bi}].id`, e.target.value)} style={{ width: 100, fontFamily: "monospace", fontSize: 11 }} /></td>
                          <td><input type="text" value={b.text || ""}
                            onChange={(e) => editor.updateField(`sentences[${si}].boxes[${bi}].text`, e.target.value)} /></td>
                          <td><input type="number" value={b.layer ?? 1}
                            onChange={(e) => editor.updateField(`sentences[${si}].boxes[${bi}].layer`, Number(e.target.value))} style={{ width: 50 }} /></td>
                          <td>
                            <select value={b.role || "주어"}
                              onChange={(e) => editor.updateField(`sentences[${si}].boxes[${bi}].role`, e.target.value)}>
                              {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                            </select>
                          </td>
                          <td>
                            <div className="dq-fb-blank-move">
                              <button type="button" onClick={() => moveBox(si, bi, bi - 1)} disabled={bi === 0}>▲</button>
                              <button type="button" onClick={() => moveBox(si, bi, bi + 1)} disabled={bi >= boxes.length - 1}>▼</button>
                            </div>
                          </td>
                          <td><button type="button" className="dq-mc-del" onClick={() => removeBox(si, bi)}>×</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button type="button" className="dq-add-btn" onClick={() => addBox(si)}>+ 박스 추가</button>

                  <div className="dq-section-label" style={{ marginTop: 10 }}>역할 정답 순서 (roleOrder) — 박스 id 를 쉼표 또는 줄바꿈으로</div>
                  <textarea rows={2} style={{ width: "100%", fontFamily: "monospace", fontSize: 11 }}
                    value={roleOrder.join(", ")}
                    onChange={(e) => editor.updateField(`sentences[${si}].roleOrder`, e.target.value.split(/[,\n]/).map((x) => x.trim()).filter(Boolean))} />

                  <details style={{ marginTop: 10 }} open={clauses.length > 0}>
                    <summary style={{ cursor: "pointer", fontSize: 12, color: "#5b4d2e" }}>
                      절 분석 (clauses) — {clauses.length}개
                    </summary>

                    {clauses.map((cl, ci) => {
                      const rangeSet = new Set(cl.range || []);
                      const toggleBox = (boxId) => {
                        const next = rangeSet.has(boxId)
                          ? (cl.range || []).filter((id) => id !== boxId)
                          : [...(cl.range || []), boxId];
                        editor.updateField(`sentences[${si}].clauses[${ci}].range`, next);
                      };
                      return (
                        <div key={ci} className="gr-step">
                          <div className="gr-step-head">
                            <span className="dr-step-num">절 {ci + 1}</span>
                            <span style={{ flex: 1 }} />
                            <button type="button" className="dq-mc-del"
                              onClick={() => editor.removeItem(`sentences[${si}].clauses`, ci)}>×</button>
                          </div>

                          <div className="dq-section-label">절 범위 (range) — 박스 클릭으로 토글</div>
                          <div className="gr-clause-boxes">
                            {boxes.map((b) => (
                              <button key={b.id} type="button"
                                className={`gr-clause-box ${rangeSet.has(b.id) ? "on" : ""}`}
                                onClick={() => toggleBox(b.id)}
                                title={`${b.id} (layer ${b.layer})`}
                              >
                                <span className="gr-clause-box-text">{b.text || "(빈 박스)"}</span>
                                <span className="gr-clause-box-id">{b.id}</span>
                              </button>
                            ))}
                          </div>

                          <div className="gr-grid-2col">
                            <div>
                              <div className="dq-section-label">절 종류 (clauseType)</div>
                              <select value={cl.clauseType || "대등"}
                                onChange={(e) => editor.updateField(`sentences[${si}].clauses[${ci}].clauseType`, e.target.value)}>
                                {CLAUSE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                              </select>
                            </div>
                            <div>
                              <div className="dq-section-label">절 layer</div>
                              <input type="number" value={cl.layer ?? 2}
                                onChange={(e) => editor.updateField(`sentences[${si}].clauses[${ci}].layer`, Number(e.target.value))} />
                            </div>
                            <div>
                              <div className="dq-section-label">parentRole (안긴 문장의 모문 성분)</div>
                              <select value={cl.parentRole || ""}
                                onChange={(e) => editor.updateField(`sentences[${si}].clauses[${ci}].parentRole`, e.target.value)}>
                                <option value="">(없음 / 이어진 문장)</option>
                                {ROLE_OPTIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                              </select>
                            </div>
                            <div>
                              <div className="dq-section-label">parentLayer</div>
                              <input type="number" value={cl.parentLayer ?? 1}
                                onChange={(e) => editor.updateField(`sentences[${si}].clauses[${ci}].parentLayer`, Number(e.target.value))} />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    <button type="button" className="dq-add-btn"
                      onClick={() => editor.addItem(`sentences[${si}].clauses`, clauses.length, {
                        range: [], layer: 2, clauseType: "대등", parentRole: "", parentLayer: 1,
                      })}>+ 절 추가</button>
                  </details>
                </div>
              </div>
            </div>
          );
        })}
        <button type="button" className="dr-step-insert dr-step-insert-end" onClick={() => addSentence(sentences.length)}>+ 마지막에 문장 추가</button>
      </div>
    </div>
  );
}
