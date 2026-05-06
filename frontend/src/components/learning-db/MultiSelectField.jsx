/**
 * 분류 마스터 드롭다운을 복수 지정 가능하게 — 첫 항목이 primary, 추가 항목들도 함께 저장.
 *
 * props:
 *   values: string[]      현재 선택된 값들 (label_ko 또는 자유 입력 문자열)
 *   onChange(values)
 *   options?: {code, labelKo}[]   비어있으면 자유 입력 input
 *   placeholder?: string
 */
export default function MultiSelectField({ values = [], onChange, options, placeholder }) {
  const list = values.length > 0 ? values : [""];
  const update = (idx, val) => {
    const next = [...list];
    next[idx] = val;
    onChange(next.filter((v, i) => v || i === 0));
  };
  const remove = (idx) => {
    const next = list.filter((_, i) => i !== idx);
    onChange(next.length === 0 ? [""] : next);
  };
  const add = () => onChange([...list, ""]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {list.map((v, i) => (
        <div key={i} style={{ display: "flex", gap: 4 }}>
          {options && options.length > 0 ? (
            <select value={v || ""} onChange={e => update(i, e.target.value)} style={{ flex: 1 }}>
              <option value="">— 선택 —</option>
              {options.map(o => <option key={o.code} value={o.labelKo}>{o.labelKo}</option>)}
            </select>
          ) : (
            <input value={v || ""} onChange={e => update(i, e.target.value)} placeholder={placeholder} style={{ flex: 1 }} />
          )}
          {i === list.length - 1 ? (
            <button type="button" onClick={add} className="ldb-btn ldb-btn-ghost" style={{ padding: "2px 8px", fontSize: 12 }}>+ 추가</button>
          ) : (
            <button type="button" onClick={() => remove(i)} className="ldb-btn ldb-btn-ghost" style={{ padding: "2px 8px", fontSize: 12, color: "#c0392b" }}>−</button>
          )}
        </div>
      ))}
      {list.length > 1 && (
        <div style={{ fontSize: 11, color: "#888" }}>* 첫 번째가 primary (목록·검색 기준), 나머지는 메타로 저장</div>
      )}
    </div>
  );
}
