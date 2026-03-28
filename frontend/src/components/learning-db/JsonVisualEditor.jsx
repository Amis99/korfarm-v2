import { useState } from "react";

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
function JsonEditor({ data, onChange, depth = 0 }) {
  const [adding, setAdding] = useState(false);

  if (data === null || data === undefined) return null;

  if (typeof data === "string") {
    const isLong = data.length > 80 || data.includes("\n");
    return isLong
      ? <textarea value={data} onChange={e => onChange(e.target.value)} />
      : <input type="text" value={data} onChange={e => onChange(e.target.value)} />;
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
            <JsonEditor data={item} depth={depth + 1} onChange={v => { const next = [...data]; next[i] = v; onChange(next); }} />
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
    const removeKey = (key) => {
      const next = { ...data };
      delete next[key];
      onChange(next);
    };
    return (
      <div className={depth > 0 ? "ldb-obj-fields" : ""}>
        {Object.entries(data).map(([key, val]) => (
          <div key={key} className={`ldb-field ${typeof val === "string" && (val.length > 80 || val.includes("\n")) ? "ldb-field-long" : ""}`}>
            <div className="ldb-field-label-row">
              <label className="ldb-field-label">{key}</label>
              <button className="ldb-field-remove" title="필드 삭제" onClick={() => removeKey(key)}>
                <span className="material-symbols-outlined" style={{ fontSize: 13 }}>close</span>
              </button>
            </div>
            <JsonEditor data={val} depth={depth + 1} onChange={v => onChange({ ...data, [key]: v })} />
          </div>
        ))}
        {adding ? (
          <AddFieldForm
            onAdd={(key, val) => { onChange({ ...data, [key]: val }); setAdding(false); }}
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
function SectionEditor({ sectionKey, data, onChange, onRemove }) {
  const [open, setOpen] = useState(false);
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
        <JsonEditor data={data} onChange={onChange} />
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
function JsonVisualEditor({ data, onChange, rawMode, rawText, onRawTextChange, rawError, title, actions }) {
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
              onRemove={() => { const next = { ...data }; delete next[key]; onChange(next); }} />
          ))}
          <AddSectionForm onAdd={(key, val) => onChange({ ...data, [key]: val })} />
        </>
      )}
    </>
  );
}

export default JsonVisualEditor;
