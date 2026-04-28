import InlineEditable from "../dailyquiz/InlineEditable";

const TYPE_OPTIONS = ["실질 자립", "실질 의존", "형식 의존"];

/* 학생 모듈 (MorphemeAnalysisModule) 의 NAME_POOL 과 일치 */
const NAME_POOL_BASIC = ["명사", "대명사", "수사", "동사", "형용사", "관형사", "부사", "감탄사", "조사", "어간", "어미", "접사"];
const NAME_POOL_ADVANCED = [
  "보통 명사", "고유 명사", "의존 명사", "1인칭 대명사", "3인칭 대명사", "지시 대명사",
  "양수사", "서수사", "동사 어간", "형용사 어간", "보조 동사 어간",
  "주격 조사", "목적격 조사", "부사격 조사", "관형격 조사", "보조사", "접속 조사",
  "종결 어미", "연결 어미", "전성 어미", "선어말 어미",
  "파생 접두사", "파생 접미사", "어근",
];

/**
 * MORPHEME_ANALYSIS 워드 프로세서형 에디터.
 * payload.sentences[] = [{ text, morphemes: [{form, name, nameDetail, type}], countAnswer, countChoices[], splitAnswer, splitChoices[] }]
 *
 * 학생: COUNTING → SPLITTING → NAMING → TYPING (단계별 모달)
 * 에디터: 문장 + 형태소 리스트 + 정답 자동 추출
 */
export default function MorphemeAnalysisDocEditor({ editor }) {
  const { content, meta } = editor;
  const sentences = content?.sentences || [];
  // 학생 모듈은 content.title 에 "심화" 포함 시 nameDetail 채점, 아니면 name 채점
  const isAdvanced = (meta?.title || content?.title || "").includes("심화");

  const addSentence = (atIdx) => {
    editor.addItem("sentences", atIdx, {
      text: "",
      morphemes: [],
      countAnswer: 0,
      countChoices: [],
      splitAnswer: "",
      splitChoices: [],
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

  const addMorpheme = (si) => {
    const cur = sentences[si]?.morphemes || [];
    editor.addItem(`sentences[${si}].morphemes`, cur.length, {
      form: "", name: "", nameDetail: "", type: "실질 자립",
    });
  };
  const removeMorpheme = (si, mi) => {
    editor.removeItem(`sentences[${si}].morphemes`, mi);
  };
  const moveMorpheme = (si, from, to) => {
    const len = sentences[si]?.morphemes?.length || 0;
    if (to < 0 || to >= len) return;
    editor.reorderItems(`sentences[${si}].morphemes`, from, to);
  };

  return (
    <div className="dq-doc-root">
      <div className="dq-doc-meta">
        <div className="dq-doc-meta-row">
          <label>제한 시간 (초)
            <input type="number" value={content?.timeLimitSec ?? 600}
              onChange={(e) => editor.updateField("timeLimitSec", Number(e.target.value))} style={{ width: 90 }} />
          </label>
          <label>씨앗 보상
            <input type="number" value={content?.seedReward?.count ?? 3}
              onChange={(e) => editor.updateField("seedReward.count", Number(e.target.value))} style={{ width: 70 }} />
          </label>
          <span style={{ flex: 1 }} />
          <span className={`dq-doc-meta-stat ${isAdvanced ? "ma-advanced" : "ma-basic"}`}
            title="학생 모듈은 콘텐츠 제목에 '심화' 포함 시 nameDetail 채점, 아니면 name 채점">
            {isAdvanced ? "심화 모드 (nameDetail 채점)" : "기초 모드 (name 채점)"}
          </span>
          <span className="dq-doc-meta-stat">총 {sentences.length} 문장</span>
        </div>
      </div>
      <datalist id="ma-name-pool">
        {NAME_POOL_BASIC.map((n) => <option key={n} value={n} />)}
      </datalist>
      <datalist id="ma-namedetail-pool">
        {NAME_POOL_ADVANCED.map((n) => <option key={n} value={n} />)}
      </datalist>

      <div className="dq-doc-paper">
        {sentences.length === 0 && <div className="dq-doc-empty">아래 [+]로 첫 문장을 추가하세요.</div>}
        {sentences.map((s, si) => {
          const morphemes = s.morphemes || [];
          return (
            <div key={si}>
              <button type="button" className="dr-step-insert" onClick={() => addSentence(si)}>+ 여기에 문장 추가</button>
              <div className="dq-card">
                <div className="dq-card-header">
                  <div className="dq-card-num">문장 {si + 1} / {sentences.length}</div>
                  <div className="dq-fb-blank-move">
                    <button type="button" onClick={() => moveSentence(si, si - 1)} disabled={si === 0}>▲</button>
                    <button type="button" onClick={() => moveSentence(si, si + 1)} disabled={si >= sentences.length - 1}>▼</button>
                  </div>
                  <span style={{ flex: 1 }} />
                  <button type="button" className="dq-mc-del" onClick={() => removeSentence(si)}>×</button>
                </div>
                <div className="dq-card-body">
                  <div className="dq-section-label">문장 본문</div>
                  <InlineEditable
                    value={s.text || ""}
                    onChange={(v) => editor.updateField(`sentences[${si}].text`, v)}
                    placeholder="형태소 분석 대상 문장"
                    className="dq-stem"
                  />

                  <div className="dq-section-label">형태소 ({morphemes.length}개) — 학생이 NAMING/TYPING 단계에서 답할 정답</div>
                  {/* 학생 화면 미리보기 — 분리된 형태소 칩 */}
                  {morphemes.length > 0 && (
                    <div className="ma-preview-chips">
                      <span className="ma-preview-label">학생이 보는 모습:</span>
                      {morphemes.map((m, mi) => (
                        <span key={mi} className="ma-chip">{m.form || "(빈 form)"}</span>
                      ))}
                    </div>
                  )}
                  {/* 검증 — countAnswer 와 morphemes.length 일치 여부 */}
                  {morphemes.length > 0 && s.countAnswer != null && s.countAnswer !== morphemes.length && (
                    <div className="ma-warn-row">
                      ⚠ countAnswer({s.countAnswer}) ≠ 형태소 개수({morphemes.length}). 채점 불일치 가능.
                      <button type="button" className="dq-add-btn"
                        onClick={() => editor.updateField(`sentences[${si}].countAnswer`, morphemes.length)}>
                        countAnswer 를 {morphemes.length} 로 자동 수정
                      </button>
                    </div>
                  )}
                  <table className="gr-table">
                    <thead>
                      <tr>
                        <th>#</th><th>형태 (form)</th><th>이름 (기초)</th><th>이름 상세 (심화)</th><th>종류</th><th>이동</th><th>삭제</th>
                      </tr>
                    </thead>
                    <tbody>
                      {morphemes.map((m, mi) => (
                        <tr key={mi}>
                          <td>{mi + 1}</td>
                          <td><input type="text" value={m.form || ""} onChange={(e) => editor.updateField(`sentences[${si}].morphemes[${mi}].form`, e.target.value)} /></td>
                          <td>
                            <input type="text" list="ma-name-pool" value={m.name || ""}
                              onChange={(e) => editor.updateField(`sentences[${si}].morphemes[${mi}].name`, e.target.value)}
                              placeholder="명사"
                              className={!isAdvanced && m.name && !NAME_POOL_BASIC.includes(m.name) ? "ma-warn" : ""}
                              title={!isAdvanced ? "기초 모드: 학생이 보는 4지선다는 NAME_POOL_BASIC 에서 만들어집니다" : ""} />
                          </td>
                          <td>
                            <input type="text" list="ma-namedetail-pool" value={m.nameDetail || ""}
                              onChange={(e) => editor.updateField(`sentences[${si}].morphemes[${mi}].nameDetail`, e.target.value)}
                              placeholder="보통 명사"
                              className={isAdvanced && m.nameDetail && !NAME_POOL_ADVANCED.includes(m.nameDetail) ? "ma-warn" : ""}
                              title={isAdvanced ? "심화 모드: 학생이 보는 4지선다는 NAME_POOL_ADVANCED 에서 만들어집니다" : ""} />
                          </td>
                          <td>
                            <select value={m.type || "실질 자립"} onChange={(e) => editor.updateField(`sentences[${si}].morphemes[${mi}].type`, e.target.value)}>
                              {TYPE_OPTIONS.map((t) => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </td>
                          <td>
                            <div className="dq-fb-blank-move">
                              <button type="button" onClick={() => moveMorpheme(si, mi, mi - 1)} disabled={mi === 0}>▲</button>
                              <button type="button" onClick={() => moveMorpheme(si, mi, mi + 1)} disabled={mi >= morphemes.length - 1}>▼</button>
                            </div>
                          </td>
                          <td><button type="button" className="dq-mc-del" onClick={() => removeMorpheme(si, mi)}>×</button></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <button type="button" className="dq-add-btn" onClick={() => addMorpheme(si)}>+ 형태소 추가</button>

                  <div className="gr-grid-2col">
                    <div>
                      <div className="dq-section-label">개수 선택지 ({(s.countChoices || []).length}개) — 라디오로 정답 지정</div>
                      <div className="gr-clause-boxes">
                        {(s.countChoices || []).map((n, ci) => (
                          <label key={ci} className={`gr-clause-box ${s.countAnswer === n ? "on" : ""}`} style={{ flexDirection: "row", gap: 4 }}>
                            <input type="radio" name={`ma-${si}-count`} checked={s.countAnswer === n}
                              onChange={() => editor.updateField(`sentences[${si}].countAnswer`, n)} />
                            <span>{n}개</span>
                            <button type="button" className="dq-mc-del" style={{ marginLeft: 4 }}
                              onClick={(e) => { e.preventDefault(); editor.removeItem(`sentences[${si}].countChoices`, ci); }}>×</button>
                          </label>
                        ))}
                      </div>
                      <div style={{ display: "flex", gap: 4, marginTop: 4, alignItems: "center" }}>
                        <input type="number" placeholder="새 숫자"
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const v = Number(e.currentTarget.value);
                              if (!isNaN(v) && v > 0) {
                                editor.addItem(`sentences[${si}].countChoices`, (s.countChoices || []).length, v);
                                e.currentTarget.value = "";
                              }
                            }
                          }}
                          style={{ width: 80 }} />
                        <span style={{ fontSize: 11, color: "#888" }}>(Enter 추가)</span>
                      </div>
                    </div>
                    <div>
                      <div className="dq-section-label">분리 선택지 ({(s.splitChoices || []).length}개) — 라디오로 정답 지정</div>
                      <table className="gr-table">
                        <thead><tr><th>#</th><th>id</th><th>text</th><th>정답</th><th>×</th></tr></thead>
                        <tbody>
                          {(s.splitChoices || []).map((c, ci) => (
                            <tr key={ci}>
                              <td>{ci + 1}</td>
                              <td><input type="text" value={c.id || ""}
                                onChange={(e) => editor.updateField(`sentences[${si}].splitChoices[${ci}].id`, e.target.value)}
                                style={{ fontFamily: "monospace", fontSize: 11 }} /></td>
                              <td><input type="text" value={c.text || ""}
                                onChange={(e) => editor.updateField(`sentences[${si}].splitChoices[${ci}].text`, e.target.value)} /></td>
                              <td style={{ textAlign: "center" }}>
                                <input type="radio" name={`ma-${si}-split`}
                                  checked={s.splitAnswer === c.id}
                                  onChange={() => editor.updateField(`sentences[${si}].splitAnswer`, c.id)} />
                              </td>
                              <td><button type="button" className="dq-mc-del" onClick={() => editor.removeItem(`sentences[${si}].splitChoices`, ci)}>×</button></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <button type="button" className="dq-add-btn"
                        onClick={() => editor.addItem(`sentences[${si}].splitChoices`, (s.splitChoices || []).length, { id: `s${(s.splitChoices || []).length + 1}`, text: "" })}>
                        + 분리 선택지 추가
                      </button>
                    </div>
                  </div>
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
