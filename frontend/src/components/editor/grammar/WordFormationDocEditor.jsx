import InlineEditable from "../dailyquiz/InlineEditable";
import CompetencyVectorEditor from "../dailyquiz/CompetencyVectorEditor";

const TYPE_OPTIONS = ["실질 자립", "실질 의존", "형식 의존"];
const FORMATION_OPTIONS = ["단일어", "합성어", "파생어"];
const MARK_OPTIONS = [{ value: "", label: "(없음)" }, { value: "circle", label: "○ 원" }, { value: "square", label: "□ 네모" }];

/**
 * WORD_FORMATION 워드 프로세서형 에디터.
 * payload.words[] = [{ word, morphemes:[{form, name, nameDetail, type, mark}], countAnswer, countChoices[], splitAnswer, splitChoices[], formation, mergeSteps?, compoundInfo? }]
 */
export default function WordFormationDocEditor({ editor }) {
  const { content } = editor;
  const words = content?.words || [];

  const addWord = (atIdx) => {
    editor.addItem("words", atIdx, {
      word: "", morphemes: [], countAnswer: 0, countChoices: [], splitAnswer: "", splitChoices: [], formation: "단일어",
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

  const addMorpheme = (wi) => {
    const cur = words[wi]?.morphemes || [];
    editor.addItem(`words[${wi}].morphemes`, cur.length, { form: "", name: "", nameDetail: "", type: "실질 자립", mark: "" });
  };
  const removeMorpheme = (wi, mi) => editor.removeItem(`words[${wi}].morphemes`, mi);

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
          const morphemes = w.morphemes || [];
          return (
            <div key={wi}>
              <button type="button" className="dr-step-insert" onClick={() => addWord(wi)}>+ 여기에 단어 추가</button>
              <div className="dq-card">
                <div className="dq-card-header">
                  <div className="dq-card-num">단어 {wi + 1}</div>
                  <div className="dq-fb-blank-move">
                    <button type="button" onClick={() => moveWord(wi, wi - 1)} disabled={wi === 0}>▲</button>
                    <button type="button" onClick={() => moveWord(wi, wi + 1)} disabled={wi >= words.length - 1}>▼</button>
                  </div>
                  <span style={{ flex: 1 }} />
                  <button type="button" className="dq-mc-del" onClick={() => removeWord(wi)}>×</button>
                </div>
                <div className="dq-card-body">
                  <div className="dq-section-label">단어 (word)</div>
                  <InlineEditable value={w.word || ""}
                    onChange={(v) => editor.updateField(`words[${wi}].word`, v)}
                    placeholder="분석 대상 단어" multiline={false} className="dq-stem" />

                  <div className="dq-section-label">형태소 ({morphemes.length}개)</div>
                  <table className="gr-table">
                    <thead>
                      <tr><th>#</th><th>form</th><th>name (기초)</th><th>nameDetail (심화)</th><th>type</th><th>mark</th><th>삭제</th></tr>
                    </thead>
                    <tbody>
                      {morphemes.map((m, mi) => (
                        <tr key={mi}>
                          <td>{mi + 1}</td>
                          <td><input type="text" value={m.form || ""}
                            onChange={(e) => editor.updateField(`words[${wi}].morphemes[${mi}].form`, e.target.value)} /></td>
                          <td><input type="text" value={m.name || ""}
                            onChange={(e) => editor.updateField(`words[${wi}].morphemes[${mi}].name`, e.target.value)} placeholder="명사" /></td>
                          <td><input type="text" value={m.nameDetail || ""}
                            onChange={(e) => editor.updateField(`words[${wi}].morphemes[${mi}].nameDetail`, e.target.value)} placeholder="보통 명사" /></td>
                          <td>
                            <select value={m.type || "실질 자립"}
                              onChange={(e) => editor.updateField(`words[${wi}].morphemes[${mi}].type`, e.target.value)}>
                              {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </td>
                          <td>
                            <select value={m.mark || ""}
                              onChange={(e) => editor.updateField(`words[${wi}].morphemes[${mi}].mark`, e.target.value)}>
                              {MARK_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                            </select>
                          </td>
                          <td><button type="button" className="dq-mc-del" onClick={() => removeMorpheme(wi, mi)}>×</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button type="button" className="dq-add-btn" onClick={() => addMorpheme(wi)}>+ 형태소 추가</button>

                  <div className="gr-grid-2col">
                    <div>
                      <div className="dq-section-label">개수 선택지 ({(w.countChoices || []).length}개) — 라디오로 정답 지정</div>
                      <div className="gr-clause-boxes">
                        {(w.countChoices || []).map((n, ci) => (
                          <label key={ci} className={`gr-clause-box ${w.countAnswer === n ? "on" : ""}`} style={{ flexDirection: "row", gap: 4 }}>
                            <input type="radio" name={`wf-${wi}-count`} checked={w.countAnswer === n}
                              onChange={() => editor.updateField(`words[${wi}].countAnswer`, n)} />
                            <span>{n}개</span>
                            <button type="button" className="dq-mc-del" style={{ marginLeft: 4 }}
                              onClick={(e) => { e.preventDefault(); editor.removeItem(`words[${wi}].countChoices`, ci); }}>×</button>
                          </label>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 4, marginTop: 4, alignItems: "center" }}>
                        <input type="number" placeholder="새 숫자"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const v = Number(e.currentTarget.value);
                              if (!isNaN(v) && v > 0) {
                                editor.addItem(`words[${wi}].countChoices`, (w.countChoices || []).length, v);
                                e.currentTarget.value = "";
                              }
                            }
                          }}
                          style={{ width: 80 }} />
                        <span style={{ fontSize: 11, color: "#888" }}>(Enter 추가)</span>
                      </div>
                    </div>
                    <div>
                      <div className="dq-section-label">분리 정답 — 정답 선택지의 id (라디오)</div>
                      <div className="dq-section-label" style={{ marginTop: 6 }}>분리 선택지 ({(w.splitChoices || []).length}개)</div>
                      <table className="gr-table">
                        <thead><tr><th>#</th><th>id</th><th>text</th><th>정답</th><th>×</th></tr></thead>
                        <tbody>
                          {(w.splitChoices || []).map((c, ci) => (
                            <tr key={ci}>
                              <td>{ci + 1}</td>
                              <td><input type="text" value={c.id || ""}
                                onChange={(e) => editor.updateField(`words[${wi}].splitChoices[${ci}].id`, e.target.value)}
                                style={{ fontFamily: "monospace", fontSize: 11 }} /></td>
                              <td><input type="text" value={c.text || ""}
                                onChange={(e) => editor.updateField(`words[${wi}].splitChoices[${ci}].text`, e.target.value)} /></td>
                              <td style={{ textAlign: "center" }}>
                                <input type="radio" name={`wf-${wi}-split`}
                                  checked={w.splitAnswer === c.id}
                                  onChange={() => editor.updateField(`words[${wi}].splitAnswer`, c.id)} />
                              </td>
                              <td><button type="button" className="dq-mc-del" onClick={() => editor.removeItem(`words[${wi}].splitChoices`, ci)}>×</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button type="button" className="dq-add-btn"
                        onClick={() => editor.addItem(`words[${wi}].splitChoices`, (w.splitChoices || []).length, { id: `s${(w.splitChoices || []).length + 1}`, text: "" })}>
                        + 분리 선택지 추가
                      </button>
                    </div>
                  </div>

                  <div className="dq-section-label" style={{ marginTop: 10 }}>최종 단어 형성 (formation)</div>
                  <select value={w.formation || "단일어"}
                    onChange={(e) => editor.updateField(`words[${wi}].formation`, e.target.value)}>
                    {FORMATION_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>

                  <details style={{ marginTop: 10 }} open={(w.mergeSteps?.length || 0) > 0 || !!w.compoundInfo}>
                    <summary style={{ cursor: "pointer", fontSize: 12, color: "#5b4d2e" }}>심화 — 결합 단계 / 합성어 분류</summary>

                    <div className="dq-section-label" style={{ marginTop: 8 }}>
                      결합 단계 (mergeSteps) — 형태소 3개 이상에서 어떻게 묶여 가는지
                    </div>
                    {(w.mergeSteps || []).map((step, msi) => (
                      <div key={msi} className="gr-step">
                        <div className="gr-step-head">
                          <span className="dr-step-num">단계 {msi + 1}</span>
                          <span style={{ fontSize: 11 }}>방향:</span>
                          {[
                            { value: "left", label: "← 왼쪽 결합" },
                            { value: "right", label: "오른쪽 결합 →" },
                          ].map((o) => (
                            <label key={o.value} style={{ fontSize: 11, marginLeft: 4 }}>
                              <input type="radio" name={`wf-${wi}-merge-${msi}`}
                                checked={step.answer === o.value}
                                onChange={() => editor.updateField(`words[${wi}].mergeSteps[${msi}].answer`, o.value)} />
                              {o.label}
                            </label>
                          ))}
                          <span style={{ flex: 1 }} />
                          <button type="button" className="dq-mc-del"
                            onClick={() => editor.removeItem(`words[${wi}].mergeSteps`, msi)}>×</button>
                        </div>
                        <div className="gr-grid-2col">
                          <div>
                            <div className="dq-section-label">결합 결과 (resultForm)</div>
                            <input type="text" value={step.resultForm || ""}
                              onChange={(e) => editor.updateField(`words[${wi}].mergeSteps[${msi}].resultForm`, e.target.value)}
                              placeholder="찌개" />
                          </div>
                          <div>
                            <div className="dq-section-label">결과 형성 (resultFormation)</div>
                            <select value={step.resultFormation || "단일어"}
                              onChange={(e) => editor.updateField(`words[${wi}].mergeSteps[${msi}].resultFormation`, e.target.value)}>
                              {FORMATION_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                    <button type="button" className="dq-add-btn"
                      onClick={() => editor.addItem(`words[${wi}].mergeSteps`, (w.mergeSteps || []).length, {
                        answer: "left", resultForm: "", resultFormation: "단일어",
                      })}>+ 결합 단계 추가</button>

                    {w.formation === "합성어" && (
                      <>
                        <div className="dq-section-label" style={{ marginTop: 14 }}>
                          합성어 분류 (compoundInfo) — 형성된 단어가 합성어일 때만
                        </div>
                        <div className="gr-grid-2col">
                          <div>
                            <div className="dq-section-label">통사적 분류 (syntactic)</div>
                            <select value={w.compoundInfo?.syntactic || "통사적"}
                              onChange={(e) => editor.updateField(`words[${wi}].compoundInfo.syntactic`, e.target.value)}>
                              <option value="통사적">통사적</option>
                              <option value="비통사적">비통사적</option>
                            </select>
                          </div>
                          <div>
                            <div className="dq-section-label">의미 관계 (relation)</div>
                            <select value={w.compoundInfo?.relation || "대등"}
                              onChange={(e) => editor.updateField(`words[${wi}].compoundInfo.relation`, e.target.value)}>
                              <option value="대등">대등</option>
                              <option value="종속">종속</option>
                              <option value="융합">융합</option>
                            </select>
                          </div>
                        </div>
                      </>
                    )}
                  </details>

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
