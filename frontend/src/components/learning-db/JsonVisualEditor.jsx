import { useState } from "react";
import MarkdownEditField from "../editor/MarkdownEditField";

// ─── 마크다운 자동 판정 ───
// 키 이름이 아래 화이트리스트 중 하나를 포함하면 MarkdownEditField (분할 미리보기) 사용.
// 그 외에도 값 길이 80 초과 또는 줄바꿈 포함이면 MarkdownEditField.
const DEFAULT_MARKDOWN_KEYS = [
  "지문", "본문", "해설", "문제", "보기", "선택지", "조건", "답안", "정답",
  "모범_답안", "content", "contentMd", "description", "question", "passage",
  "stem", "explanation"
];

function isAutoMarkdown(fieldKey, value, extraKeys) {
  if (typeof value !== "string") return false;
  if (value.length > 80 || value.includes("\n")) return true;
  if (!fieldKey) return false;
  const all = [...DEFAULT_MARKDOWN_KEYS, ...(extraKeys || [])];
  return all.some(k => fieldKey.includes(k));
}

// ─── String 필드 — 자동/강제 마크다운 토글 ───
function StringField({ value, onChange, fieldKey, markdownKeys }) {
  const [forceMd, setForceMd] = useState(false);
  const auto = isAutoMarkdown(fieldKey, value, markdownKeys);
  const useMd = forceMd || auto;
  if (useMd) {
    return (
      <div className="ldb-md-wrap">
        <MarkdownEditField value={value} onChange={onChange} minHeight={120} />
        {!auto && (
          <button type="button" className="ldb-md-toggle"
            title="일반 입력으로" onClick={() => setForceMd(false)}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>edit_off</span>
          </button>
        )}
      </div>
    );
  }
  return (
    <div className="ldb-string-row">
      <input type="text" value={value} onChange={e => onChange(e.target.value)} />
      <button type="button" className="ldb-md-toggle"
        title="마크다운 + 미리보기" onClick={() => setForceMd(true)}>
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>format_paragraph</span>
      </button>
    </div>
  );
}

// ─── 교재 원고 필드 정렬/그루핑 ───

const FIELD_PRIORITY = { "제목": 0, "목록": 1, "안내": 2, "지문": 3, "문제_지문": 3 };
const TYPE_PRIORITY = { "객관식": 100, "단답형": 200, "빈칸": 300, "서술형": 400, "글쓰기": 500 };
const SUB_PRIORITY = { "지침": 0, "문제": 1, "보기": 2, "조건": 3, "선택지": 4, "답안_형식": 5, "정답": 6, "모범_답안": 6, "해설": 7 };

function manuscriptKeyScore(key) {
  // 일반 필드 (제목, 목록, 안내, 지문)
  for (const [pat, score] of Object.entries(FIELD_PRIORITY)) {
    if (key.endsWith("_" + pat) || key === pat) return score;
  }
  // 문제 유형 필드 (객관식_문제, 서술형_정답 등)
  for (const [typeName, typeScore] of Object.entries(TYPE_PRIORITY)) {
    if (key.includes("_" + typeName + "_") || key.includes("_" + typeName)) {
      for (const [subName, subScore] of Object.entries(SUB_PRIORITY)) {
        if (key.endsWith("_" + subName)) return typeScore + subScore;
      }
      return typeScore + 1; // 하위 필드 못 찾으면 문제 바로 뒤
    }
  }
  return 50; // 기타
}

/** 교재 원고 키를 지문→문제유형 순으로 정렬 */
function sortManuscriptKeys(keys) {
  return [...keys].sort((a, b) => manuscriptKeyScore(a) - manuscriptKeyScore(b));
}

/** 키에서 문제 유형 그룹명 추출 (객관식, 서술형, 단답형, 빈칸, 글쓰기) */
function getQuestionTypeGroup(key) {
  for (const typeName of Object.keys(TYPE_PRIORITY)) {
    if (key.includes("_" + typeName + "_") || key.endsWith("_" + typeName)) return typeName;
  }
  return null;
}

/** 서술형 정답에 해설이 포함된 경우 분리하여 해설 키 추가 */
function ensureEssayExplanation(data) {
  if (typeof data !== "object" || data === null || Array.isArray(data)) return data;
  const keys = Object.keys(data);
  const result = { ...data };
  let changed = false;

  for (const key of keys) {
    // 서술형_정답 또는 서술형_모범_답안 키 찾기
    const isAnswer = (key.includes("서술형_정답") || key.includes("서술형_모범_답안") || key.includes("글쓰기_모범_답안"));
    if (!isAnswer) continue;

    // 같은 접두사의 해설 키가 이미 있는지 확인
    const prefix = key.replace(/_정답$/, "").replace(/_모범_답안$/, "");
    const explanationKey = prefix + "_해설";
    if (!(explanationKey in result)) {
      result[explanationKey] = "";
      changed = true;
    }
  }
  return changed ? result : data;
}

// ─── 필드 추가 인라인 폼 ───
function AddFieldForm({ onAdd, onCancel }) {
  const [name, setName] = useState("");
  const [type, setType] = useState("string");
  const submit = () => {
    const key = name.trim();
    if (!key) return;
    const defaults = { string: "", number: 0, boolean: false, array: [], object: {} };
    onAdd(key, defaults[type] ?? "");
    setName(""); setType("string");
  };
  return (
    <div className="ldb-add-field">
      <input type="text" placeholder="키 이름" value={name} onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") submit(); if (e.key === "Escape") onCancel(); }} autoFocus />
      <select value={type} onChange={e => setType(e.target.value)}>
        <option value="string">텍스트</option>
        <option value="number">숫자</option>
        <option value="boolean">참/거짓</option>
        <option value="array">배열</option>
        <option value="object">객체</option>
      </select>
      <button className="ldb-btn ldb-btn-primary" style={{ padding: "4px 10px" }} onClick={submit}>추가</button>
      <button className="ldb-btn ldb-btn-ghost" style={{ padding: "4px 8px" }} onClick={onCancel}>취소</button>
    </div>
  );
}

// ─── 재귀적 JSON 편집기 ───
function JsonEditor({ data, onChange, depth = 0, manuscriptMode = false, parentKey = null, markdownKeys = [] }) {
  const [adding, setAdding] = useState(false);

  if (data === null || data === undefined) return null;

  if (typeof data === "string") {
    return <StringField value={data} onChange={onChange} fieldKey={parentKey} markdownKeys={markdownKeys} />;
  }
  if (typeof data === "number") {
    return <input type="number" value={data} onChange={e => onChange(Number(e.target.value) || 0)} />;
  }
  if (typeof data === "boolean") {
    return (
      <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
        <input type="checkbox" checked={data} onChange={e => onChange(e.target.checked)} /> {data ? "true" : "false"}
      </label>
    );
  }
  if (Array.isArray(data)) {
    return (
      <div>
        {data.map((item, i) => (
          <div key={i} className="ldb-arr-item">
            <div className="ldb-arr-item-header">
              <span className="ldb-arr-item-num">#{i + 1}</span>
              <div className="ldb-arr-item-actions">
                <button title="삭제" onClick={() => { const next = [...data]; next.splice(i, 1); onChange(next); }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                </button>
              </div>
            </div>
            <JsonEditor data={item} depth={depth + 1} manuscriptMode={manuscriptMode}
              parentKey={parentKey} markdownKeys={markdownKeys}
              onChange={v => { const next = [...data]; next[i] = v; onChange(next); }} />
          </div>
        ))}
        <button className="ldb-arr-add" onClick={() => {
          const template = data.length > 0 ? structuredClone(data[0]) : "";
          if (typeof template === "object" && template !== null) {
            for (const k of Object.keys(template)) {
              if (typeof template[k] === "string") template[k] = "";
              else if (typeof template[k] === "number") template[k] = 0;
              else if (Array.isArray(template[k])) template[k] = [];
            }
          }
          onChange([...data, template]);
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>항목 추가
        </button>
      </div>
    );
  }
  if (typeof data === "object") {
    // 교재 원고 모드: 키 정렬 + 서술형 해설 키 표시용 추가
    const workData = manuscriptMode ? ensureEssayExplanation(data) : data;

    const rawKeys = Object.keys(workData);
    const sortedKeys = manuscriptMode ? sortManuscriptKeys(rawKeys) : rawKeys;

    const removeKey = (key) => {
      const next = { ...workData };
      delete next[key];
      onChange(next); // workData 기반 — 추가된 해설 키도 포함
    };

    // 문제 유형 그룹 구분선 렌더링용
    let lastGroup = null;

    return (
      <div className={depth > 0 ? "ldb-obj-fields" : ""}>
        {sortedKeys.map((key) => {
          const val = workData[key];
          // 교재 원고 모드: 문제 유형 그룹 변경 시 구분선
          let groupDivider = null;
          if (manuscriptMode) {
            const curGroup = getQuestionTypeGroup(key);
            if (curGroup && curGroup !== lastGroup) {
              const groupLabels = { "객관식": "📝 객관식", "서술형": "✍️ 서술형", "단답형": "📋 단답형", "빈칸": "🔲 빈칸 채우기", "글쓰기": "📝 글쓰기" };
              groupDivider = (
                <div key={`grp-${curGroup}`} className="ldb-question-group-header">
                  {groupLabels[curGroup] || curGroup}
                </div>
              );
            }
            if (curGroup) lastGroup = curGroup;
          }

          return [
            groupDivider,
            <div key={key} className={`ldb-field ${typeof val === "string" && (val.length > 80 || val.includes("\n")) ? "ldb-field-long" : ""}`}>
              <div className="ldb-field-label-row">
                <label className="ldb-field-label">{key}</label>
                <button className="ldb-field-remove" title="필드 삭제" onClick={() => removeKey(key)}>
                  <span className="material-symbols-outlined" style={{ fontSize: 13 }}>close</span>
                </button>
              </div>
              <JsonEditor data={val} depth={depth + 1} manuscriptMode={manuscriptMode}
                parentKey={key} markdownKeys={markdownKeys}
                onChange={v => onChange({ ...workData, [key]: v })} />
            </div>
          ];
        })}
        {adding ? (
          <AddFieldForm
            onAdd={(key, val) => { onChange({ ...workData, [key]: val }); setAdding(false); }}
            onCancel={() => setAdding(false)}
          />
        ) : (
          <button className="ldb-arr-add" onClick={() => setAdding(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>필드 추가
          </button>
        )}
      </div>
    );
  }
  return <input type="text" value={String(data)} onChange={e => onChange(e.target.value)} />;
}

// ─── 섹션별 아코디언 편집기 ───
function SectionEditor({ sectionKey, data, onChange, onRemove, manuscriptMode = false, markdownKeys = [] }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="ldb-section">
      <div className="ldb-section-header">
        <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, cursor: "pointer" }} onClick={() => setOpen(v => !v)}>
          <span className={`material-symbols-outlined ${open ? "rotated" : ""}`}>chevron_right</span>
          <span>{sectionKey}</span>
        </div>
        {onRemove && (
          <button className="ldb-field-remove" title="섹션 삭제" onClick={e => { e.stopPropagation(); onRemove(); }}
            style={{ marginRight: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
          </button>
        )}
      </div>
      <div className={`ldb-section-body ${open ? "" : "collapsed"}`}>
        <JsonEditor data={data} onChange={onChange} manuscriptMode={manuscriptMode}
          parentKey={sectionKey} markdownKeys={markdownKeys} />
      </div>
    </div>
  );
}

// ─── 최상위 섹션 추가 ───
function AddSectionForm({ onAdd }) {
  const [show, setShow] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState("object");
  const submit = () => {
    const key = name.trim();
    if (!key) return;
    const defaults = { string: "", number: 0, boolean: false, array: [], object: {} };
    onAdd(key, defaults[type] ?? "");
    setName(""); setType("object"); setShow(false);
  };
  if (!show) {
    return (
      <button className="ldb-arr-add" style={{ marginTop: 8 }} onClick={() => setShow(true)}>
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>add</span>섹션 추가
      </button>
    );
  }
  return (
    <div className="ldb-add-field" style={{ marginTop: 8 }}>
      <input type="text" placeholder="섹션 이름 (예: 본문, 날개, 메타...)" value={name} onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") submit(); if (e.key === "Escape") setShow(false); }} autoFocus />
      <select value={type} onChange={e => setType(e.target.value)}>
        <option value="object">객체</option>
        <option value="string">텍스트</option>
        <option value="number">숫자</option>
        <option value="array">배열</option>
        <option value="boolean">참/거짓</option>
      </select>
      <button className="ldb-btn ldb-btn-primary" style={{ padding: "4px 10px" }} onClick={submit}>추가</button>
      <button className="ldb-btn ldb-btn-ghost" style={{ padding: "4px 8px" }} onClick={() => setShow(false)}>취소</button>
    </div>
  );
}

/**
 * JSON 비주얼 편집기 (통합)
 * props:
 *   data: object — 편집할 JSON 데이터
 *   onChange: (newData) => void
 *   rawMode: boolean
 *   rawText: string
 *   onRawTextChange: (text) => void
 *   rawError: string
 *   title: string
 *   actions?: ReactNode — 헤더 우측 액션 영역
 */
function JsonVisualEditor({ data, onChange, rawMode, rawText, onRawTextChange, rawError, title, actions, manuscriptMode = false, markdownKeys = [] }) {
  if (!data) return <div className="ldb-editor-empty">좌측에서 항목을 선택하세요</div>;

  return (
    <>
      <div className="ldb-editor-header">
        <span className="ldb-editor-title">{title}</span>
        <div className="ldb-editor-actions">{actions}</div>
      </div>
      {rawMode ? (
        <div className="ldb-raw">
          <textarea className="ldb-field" value={rawText} onChange={e => onRawTextChange(e.target.value)} />
          {rawError && <div className="ldb-raw-error">{rawError}</div>}
        </div>
      ) : (
        <>
          {Object.entries(data).map(([key, val]) => (
            <SectionEditor key={key} sectionKey={key} data={val}
              onChange={v => onChange({ ...data, [key]: v })}
              onRemove={() => { const next = { ...data }; delete next[key]; onChange(next); }}
              manuscriptMode={manuscriptMode} markdownKeys={markdownKeys} />
          ))}
          <AddSectionForm onAdd={(key, val) => onChange({ ...data, [key]: val })} />
        </>
      )}
    </>
  );
}

export default JsonVisualEditor;
