import { useState } from "react";
import MarkdownEditField from "../editor/MarkdownEditField";

/**
 * 4유형 문제 카드 — MULTI_CHOICE / OX / SHORT_ANSWER / ESSAY 통합.
 * 각 유형별로 필요한 필드 + 10대 역량 벡터 + 선택지별 wrongVector 편집.
 *
 * props:
 *  - question: 문제 객체
 *  - index: 문제 번호(0-based)
 *  - onChange(updated): 변경 시 콜백
 *  - onDelete(): 삭제
 */
const COMPETENCY_KEYS = [
  "사실 이해", "구조 파악", "어휘 이해", "추론", "비판적 사고",
  "종합·적용", "표현", "매체 이해", "문법", "문학",
];

const QUESTION_TYPES = [
  { value: "MULTI_CHOICE", label: "객관식" },
  { value: "OX", label: "OX" },
  { value: "SHORT_ANSWER", label: "단답형" },
  { value: "ESSAY", label: "서술형" },
];

/** 연속된 `_` 가 2개 이상인 구간을 한 빈칸으로 카운트 (백엔드 로직과 동일). */
function countUnderscoreRuns(text) {
  let count = 0, i = 0;
  while (i < text.length) {
    if (text[i] === "_") {
      let j = i;
      while (j < text.length && text[j] === "_") j++;
      if (j - i >= 2) count++;
      i = j;
    } else i++;
  }
  return count;
}

export default function StudyQuestionCard({ question, index, onChange, onDelete }) {
  const [showVector, setShowVector] = useState(false);
  const [showWrongAt, setShowWrongAt] = useState(null); // 선택지 인덱스

  const update = (patch) => onChange({ ...question, ...patch });

  const updateChoice = (i, patch) => {
    const choices = [...(question.choices || [])];
    choices[i] = { ...choices[i], ...patch };
    update({ choices });
  };

  const addChoice = () => {
    const choices = [...(question.choices || [])];
    choices.push({ id: `c${Date.now()}`, text: "", isCorrect: false, wrongVector: {} });
    update({ choices });
  };

  const removeChoice = (i) => {
    const choices = [...(question.choices || [])];
    choices.splice(i, 1);
    update({ choices });
  };

  const setCompetencyWeight = (target, key, value) => {
    const v = parseFloat(value) || 0;
    if (target === "competency") {
      const next = { ...(question.competencyVector || {}) };
      if (v <= 0) delete next[key]; else next[key] = v;
      update({ competencyVector: next });
    } else if (target === "wrong") {
      const next = { ...(question.wrongVector || {}) };
      if (v <= 0) delete next[key]; else next[key] = v;
      update({ wrongVector: next });
    } else if (typeof target === "number") {
      const choices = [...(question.choices || [])];
      const c = { ...(choices[target] || {}) };
      const wv = { ...(c.wrongVector || {}) };
      if (v <= 0) delete wv[key]; else wv[key] = v;
      c.wrongVector = wv;
      choices[target] = c;
      update({ choices });
    }
  };

  // 유형 변경 시 기본 필드 초기화
  const changeType = (newType) => {
    const patch = { questionType: newType };
    if (newType === "MULTI_CHOICE") {
      patch.choices = question.choices?.length >= 2
        ? question.choices
        : [
            { id: "c1", text: "", isCorrect: false, wrongVector: {} },
            { id: "c2", text: "", isCorrect: false, wrongVector: {} },
            { id: "c3", text: "", isCorrect: false, wrongVector: {} },
            { id: "c4", text: "", isCorrect: false, wrongVector: {} },
            { id: "c5", text: "", isCorrect: false, wrongVector: {} },
          ];
      patch.modelAnswer = null;
      patch.fillBlanks = null;
    } else if (newType === "OX") {
      patch.choices = [
        { id: "o", text: "O", isCorrect: false, wrongVector: {} },
        { id: "x", text: "X", isCorrect: false, wrongVector: {} },
      ];
      patch.modelAnswer = null;
      patch.fillBlanks = null;
    } else if (newType === "SHORT_ANSWER") {
      patch.choices = null;
      patch.modelAnswer = "";
      patch.fillBlanks = null;
    } else if (newType === "ESSAY") {
      patch.choices = null;
      patch.modelAnswer = "";
      patch.fillBlanks = [];
    }
    update(patch);
  };

  return (
    <div style={{
      border: "1px solid var(--admin-stroke)",
      borderRadius: 10,
      padding: 14,
      marginBottom: 10,
      background: "var(--admin-panel)",
    }}>
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <strong style={{ fontSize: 14, color: "var(--admin-accent-strong)", minWidth: 36 }}>
          {index + 1}번
        </strong>
        <select
          value={question.questionType || question.question_type || "MULTI_CHOICE"}
          onChange={(e) => changeType(e.target.value)}
          style={inputStyle({ width: 100 })}
        >
          {QUESTION_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <input
          type="number" min={1} max={10} value={question.difficulty || 3}
          onChange={(e) => update({ difficulty: parseInt(e.target.value, 10) || 3 })}
          style={inputStyle({ width: 60 })}
          title="난이도 1~10"
        />
        <button
          type="button"
          className="admin-detail-btn ghost xs"
          onClick={() => setShowVector(!showVector)}
        >
          {showVector ? "역량 닫기" : "역량 ▼"}
        </button>
        <div style={{ marginLeft: "auto" }}>
          <button type="button" className="admin-detail-btn danger xs" onClick={onDelete}>
            삭제
          </button>
        </div>
      </div>

      {/* 발문 — 마크다운 풀기능 (밑줄 <u>·이미지 등) */}
      <div style={{ marginBottom: 8 }}>
        <label style={labelStyle}>발문</label>
        <MarkdownEditField
          value={question.stem || ""}
          onChange={(text) => update({ stem: text })}
          placeholder="문제 발문 — 밑줄(<u>)·강조·이미지 가능"
          minHeight={70}
        />
      </div>

      {/* <보기> — 객관식·서술형에서만 (선택) */}
      {(question.questionType === "MULTI_CHOICE" || question.questionType === "ESSAY") && (
        <div style={{ marginBottom: 8 }}>
          {!question.boxContent && question.boxContent !== "" ? (
            <button
              type="button"
              className="admin-detail-btn secondary xs"
              onClick={() => update({ boxContent: " " })}
            >
              + &lt;보기&gt; 추가
            </button>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={labelStyle}>&lt;보기&gt; (마크다운 + 밑줄·이미지)</label>
                <button
                  type="button"
                  className="admin-detail-btn ghost xs"
                  onClick={() => update({ boxContent: null })}
                >
                  제거
                </button>
              </div>
              <MarkdownEditField
                value={question.boxContent || ""}
                onChange={(text) => update({ boxContent: text })}
                placeholder="<보기> 본문 — 마크다운 + 밑줄(<u>) + 이미지 가능"
                minHeight={100}
              />
            </>
          )}
        </div>
      )}

      {/* <조건> — 서술형 위주 (객관식도 가능) */}
      {(question.questionType === "ESSAY" || question.questionType === "MULTI_CHOICE") && (
        <div style={{ marginBottom: 8 }}>
          {!question.conditionContent && question.conditionContent !== "" ? (
            <button
              type="button"
              className="admin-detail-btn secondary xs"
              onClick={() => update({ conditionContent: " " })}
            >
              + &lt;조건&gt; 추가
            </button>
          ) : (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={labelStyle}>&lt;조건&gt; (마크다운 + 밑줄)</label>
                <button
                  type="button"
                  className="admin-detail-btn ghost xs"
                  onClick={() => update({ conditionContent: null })}
                >
                  제거
                </button>
              </div>
              <MarkdownEditField
                value={question.conditionContent || ""}
                onChange={(text) => update({ conditionContent: text })}
                placeholder="<조건> 본문 — 30자 이내, ~을 포함하여 등 (밑줄 가능)"
                minHeight={60}
              />
            </>
          )}
        </div>
      )}

      {/* 정답시 누적 역량 벡터 */}
      {showVector && (
        <div style={vectorBoxStyle}>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: "var(--admin-accent-strong)" }}>
            정답 시 누적될 역량 (+ 가중치 0.0~1.0)
          </div>
          <VectorEditor
            vector={question.competencyVector || {}}
            onChange={(k, v) => setCompetencyWeight("competency", k, v)}
          />
        </div>
      )}

      {/* 유형별 본문 */}
      {(question.questionType === "MULTI_CHOICE" || question.questionType === "OX") && (
        <div style={{ marginTop: 8 }}>
          <label style={labelStyle}>선택지</label>
          {(question.choices || []).map((ch, i) => (
            <div key={ch.id || i} style={{ marginBottom: 6 }}>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                <input
                  type="radio"
                  name={`correct-${index}`}
                  checked={!!ch.isCorrect}
                  onChange={() => {
                    // 정답 단일 선택 — 다른 모든 선택지 isCorrect false
                    const choices = (question.choices || []).map((c, j) => ({
                      ...c, isCorrect: j === i,
                    }));
                    update({ choices });
                  }}
                  title="정답으로 지정"
                />
                <input
                  value={ch.text || ""}
                  onChange={(e) => updateChoice(i, { text: e.target.value })}
                  placeholder={question.questionType === "OX" ? (i === 0 ? "O" : "X") : `선택지 ${i + 1}`}
                  style={inputStyle({ flex: 1 })}
                  disabled={question.questionType === "OX"}
                />
                <button
                  type="button"
                  className="admin-detail-btn ghost xs"
                  onClick={() => setShowWrongAt(showWrongAt === i ? null : i)}
                >
                  {showWrongAt === i ? "약점 닫기" : "약점 ▼"}
                </button>
                {question.questionType === "MULTI_CHOICE" && (
                  <button
                    type="button"
                    className="admin-detail-btn ghost xs"
                    onClick={() => removeChoice(i)}
                    disabled={(question.choices || []).length <= 2}
                    title="선택지 삭제"
                  >
                    ✕
                  </button>
                )}
              </div>
              {showWrongAt === i && (
                <div style={{ ...vectorBoxStyle, marginLeft: 24 }}>
                  <div style={{ fontSize: 11, color: "var(--admin-muted)", marginBottom: 4 }}>
                    이 선택지를 골라 틀린 학생의 약점 (− 가중치)
                  </div>
                  <VectorEditor
                    vector={ch.wrongVector || {}}
                    onChange={(k, v) => setCompetencyWeight(i, k, v)}
                  />
                </div>
              )}
            </div>
          ))}
          {question.questionType === "MULTI_CHOICE" && (question.choices || []).length < 5 && (
            <button type="button" className="admin-detail-btn secondary xs" onClick={addChoice}>
              + 선택지 추가
            </button>
          )}
        </div>
      )}

      {question.questionType === "SHORT_ANSWER" && (
        <div style={{ marginTop: 8 }}>
          <label style={labelStyle}>정답 (음절 카드 변환됨)</label>
          <input
            value={question.modelAnswer || ""}
            onChange={(e) => update({ modelAnswer: e.target.value })}
            placeholder="예: 활유법"
            style={inputStyle({ width: "100%" })}
          />
          <p style={{ fontSize: 11, color: "var(--admin-muted)", margin: "4px 0 0" }}>
            학생 화면: 정답 글자수 × 2개의 음절 카드 중 정답 글자 순서대로 클릭
          </p>

          {/* 오답 음절 풀 */}
          <div style={{ marginTop: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label style={labelStyle}>오답 음절 풀 (정답 글자수만큼, 중복 금지)</label>
              <button
                type="button"
                className="admin-detail-btn ghost xs"
                onClick={() => {
                  // AI 자동 생성은 향후 — 일단 자모 비슷한 글자 자동 추천 (간단)
                  alert("오답 음절은 직접 입력하거나, AI 문제 생성 시 자동 채워집니다.");
                }}
                title="향후 AI 자동 생성 지원"
              >
                ❓ 도움말
              </button>
            </div>
            <input
              value={(question.distractorSyllables || []).join(", ")}
              onChange={(e) => {
                const list = e.target.value.split(/[,\s]+/).map(s => s.trim()).filter(Boolean);
                // 한 글자 + 정답·서로 중복 제거
                const answer = (question.modelAnswer || "").replace(/\s/g, "").split("");
                const seen = new Set(answer);
                const uniq = [];
                for (const s of list) {
                  if (s.length !== 1) continue;
                  if (seen.has(s)) continue;
                  seen.add(s);
                  uniq.push(s);
                }
                update({ distractorSyllables: uniq });
              }}
              placeholder="예: 의, 인, 수 (콤마로 구분)"
              style={inputStyle({ width: "100%" })}
            />
            <p style={{ fontSize: 11, color: "var(--admin-muted)", margin: "4px 0 0" }}>
              현재 {(question.distractorSyllables || []).length}개 — 정답 글자수와 같으면 OK. 부족하면 자동 보충.
            </p>
          </div>

          {showVector && (
            <div style={vectorBoxStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: "#c0392b" }}>
                오답 시 누적 약점 (− 가중치)
              </div>
              <VectorEditor
                vector={question.wrongVector || {}}
                onChange={(k, v) => setCompetencyWeight("wrong", k, v)}
              />
            </div>
          )}
        </div>
      )}

      {question.questionType === "ESSAY" && (
        <div style={{ marginTop: 8 }}>
          <label style={labelStyle}>
            모범답안 — 빈칸 자리에 <code style={{ background: "rgba(192,57,43,0.08)", padding: "0 4px", borderRadius: 3 }}>____</code> (밑줄 2개 이상 연속) 으로 표시
          </label>
          <textarea
            value={question.modelAnswer || ""}
            onChange={(e) => update({ modelAnswer: e.target.value })}
            placeholder='예: "이 작품의 주제는 ____ 이고, 인물은 ____ 적이다."'
            rows={4}
            style={textareaStyle}
          />
          <p style={{ fontSize: 11, color: "var(--admin-muted)", margin: "4px 0 8px" }}>
            감지된 빈칸 <strong style={{ color: "var(--admin-accent-strong)" }}>{countUnderscoreRuns(question.modelAnswer || "")}개</strong>
            {" · "}
            아래 빈칸 데이터 <strong>{(question.fillBlanks || []).length}개</strong>
            {" — "}
            <span style={{ color: countUnderscoreRuns(question.modelAnswer || "") === (question.fillBlanks || []).length ? "#2d6a4f" : "#c0392b" }}>
              {countUnderscoreRuns(question.modelAnswer || "") === (question.fillBlanks || []).length ? "OK" : "개수 불일치 (작은 쪽만 사용)"}
            </span>
          </p>
          <label style={labelStyle}>빈칸 데이터 (____ 위치 순서대로)</label>
          <FillBlanksEditor
            blanks={question.fillBlanks || []}
            onChange={(blanks) => update({ fillBlanks: blanks })}
          />
          {showVector && (
            <div style={vectorBoxStyle}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: "#c0392b" }}>
                오답 시 누적 약점 (− 가중치)
              </div>
              <VectorEditor
                vector={question.wrongVector || {}}
                onChange={(k, v) => setCompetencyWeight("wrong", k, v)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function VectorEditor({ vector, onChange }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 4 }}>
      {COMPETENCY_KEYS.map((k) => (
        <label key={k} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--admin-ink)" }}>
          <span style={{ width: 80 }}>{k}</span>
          <input
            type="number" step="0.1" min="0" max="1"
            value={vector[k] || 0}
            onChange={(e) => onChange(k, e.target.value)}
            style={{ width: 60, padding: "3px 6px", border: "1px solid var(--admin-stroke)", borderRadius: 4, fontSize: 12 }}
          />
        </label>
      ))}
    </div>
  );
}

function FillBlanksEditor({ blanks, onChange }) {
  const update = (i, patch) => {
    const next = [...blanks];
    next[i] = { ...next[i], ...patch };
    onChange(next);
  };
  const add = () => onChange([...blanks, { phrase: "", choices: [] }]);
  const remove = (i) => {
    const next = [...blanks];
    next.splice(i, 1);
    onChange(next);
  };
  return (
    <div>
      <p style={{ fontSize: 11, color: "var(--admin-muted)", margin: "0 0 6px" }}>
        한 단어/두 단어 빈칸 5개 이상. 각 빈칸에 정답 + 오답 보기 3~4개 (학생은 선택지에서 고름).
      </p>
      {blanks.map((b, i) => (
        <div key={i} style={{
          marginBottom: 8, padding: 8,
          border: "1px solid var(--admin-stroke)",
          borderRadius: 6,
          background: "var(--admin-panel-light, #f5f9f3)",
        }}>
          <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "var(--admin-accent-strong)", minWidth: 40 }}>
              빈칸 {i + 1}
            </span>
            <input
              value={b.phrase || ""}
              onChange={(e) => update(i, { phrase: e.target.value })}
              placeholder="정답 (한 단어 또는 두 단어)"
              style={inputStyle({ flex: 1 })}
            />
            <button type="button" className="admin-detail-btn ghost xs" onClick={() => remove(i)}>✕</button>
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <span style={{ fontSize: 10, color: "var(--admin-muted)", minWidth: 40 }}>오답 보기</span>
            <input
              value={(b.choices || []).filter(c => c !== b.phrase).join(", ")}
              onChange={(e) => {
                const distractors = e.target.value.split(/[,\n]/).map(s => s.trim()).filter(Boolean);
                // choices = 정답 + 오답들 (중복 제거)
                const set = new Set();
                const list = [];
                if (b.phrase) { list.push(b.phrase); set.add(b.phrase); }
                for (const d of distractors) {
                  if (!set.has(d)) { list.push(d); set.add(d); }
                }
                update(i, { choices: list });
              }}
              placeholder="오답 3~4개 (콤마 구분)"
              style={inputStyle({ flex: 1, fontSize: 12 })}
            />
          </div>
        </div>
      ))}
      <button type="button" className="admin-detail-btn secondary xs" onClick={add}>+ 빈칸 추가</button>
    </div>
  );
}

const inputStyle = (extra = {}) => ({
  padding: "6px 10px",
  border: "1px solid var(--admin-stroke)",
  borderRadius: 6,
  background: "var(--admin-panel)",
  color: "var(--admin-ink)",
  fontSize: 13,
  fontFamily: "inherit",
  ...extra,
});

const textareaStyle = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid var(--admin-stroke)",
  borderRadius: 6,
  background: "var(--admin-panel)",
  color: "var(--admin-ink)",
  fontSize: 13,
  fontFamily: "inherit",
  resize: "vertical",
  boxSizing: "border-box",
};

const labelStyle = {
  display: "block",
  fontSize: 12,
  fontWeight: 700,
  color: "var(--admin-accent-strong)",
  marginBottom: 4,
};

const vectorBoxStyle = {
  marginTop: 6,
  padding: 8,
  background: "var(--admin-panel-light, #f5f9f3)",
  border: "1px solid var(--admin-stroke)",
  borderRadius: 6,
};
