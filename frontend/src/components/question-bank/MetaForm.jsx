function MetaForm({ data, codes, onChange }) {
  const getValues = (groupKey) => {
    const group = codes.find((g) => g.group_key === groupKey);
    return (group?.values || []).filter((v) => v.is_active);
  };

  const sourceTypes = getValues("source_type");
  const examOrgs = getValues("exam_org");
  const areas = getValues("area");
  const subAreas = getValues("sub_area");
  const targetGrades = getValues("target_grade");

  const toggleGrade = (code) => {
    const current = data.target_grades || [];
    const next = current.includes(code)
      ? current.filter((c) => c !== code)
      : [...current, code];
    onChange("target_grades", next);
  };

  return (
    <div>
      <h3 style={{ color: "#8a9a8e", fontSize: "0.8rem", marginBottom: 12 }}>메타 정보</h3>
      <div className="qb-meta-grid">
        <div className="qb-meta-field">
          <label>제목</label>
          <input
            className="qb-inline-input"
            value={data.title}
            onChange={(e) => onChange("title", e.target.value)}
          />
        </div>
        <div className="qb-meta-field">
          <label>작가</label>
          <input
            className="qb-inline-input"
            value={data.author}
            onChange={(e) => onChange("author", e.target.value)}
          />
        </div>
        <div className="qb-meta-field">
          <label>소스 분류</label>
          <select className="qb-select" style={{ width: "100%" }} value={data.source_type} onChange={(e) => onChange("source_type", e.target.value)}>
            <option value="">선택</option>
            {sourceTypes.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
          </select>
        </div>
        <div className="qb-meta-field">
          <label>기출 기관</label>
          <select className="qb-select" style={{ width: "100%" }} value={data.exam_org} onChange={(e) => onChange("exam_org", e.target.value)}>
            <option value="">선택</option>
            {examOrgs.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
          </select>
        </div>
        <div className="qb-meta-field">
          <label>영역</label>
          <select className="qb-select" style={{ width: "100%" }} value={data.area} onChange={(e) => onChange("area", e.target.value)}>
            <option value="">선택</option>
            {areas.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
          </select>
        </div>
        <div className="qb-meta-field">
          <label>세부영역</label>
          <select className="qb-select" style={{ width: "100%" }} value={data.sub_area} onChange={(e) => onChange("sub_area", e.target.value)}>
            <option value="">선택</option>
            {subAreas.map((v) => <option key={v.value} value={v.value}>{v.label}</option>)}
          </select>
        </div>
        <div className="qb-meta-field">
          <label>기출 연도</label>
          <input className="qb-inline-input" type="number" value={data.exam_year} onChange={(e) => onChange("exam_year", e.target.value)} placeholder="예: 2024" />
        </div>
        <div className="qb-meta-field">
          <label>기출 월</label>
          <input className="qb-inline-input" type="number" value={data.exam_month} onChange={(e) => onChange("exam_month", e.target.value)} placeholder="예: 6" />
        </div>
        <div className="qb-meta-field">
          <label>난이도 (1~5)</label>
          <input className="qb-inline-input" type="number" min="1" max="5" value={data.difficulty} onChange={(e) => onChange("difficulty", e.target.value)} />
        </div>
        <div className="qb-meta-field">
          <label>상태</label>
          <select className="qb-select" style={{ width: "100%" }} value={data.status} onChange={(e) => onChange("status", e.target.value)}>
            <option value="draft">초안</option>
            <option value="published">게시됨</option>
          </select>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <label style={{ fontSize: "0.75rem", color: "#8a9a8e", display: "block", marginBottom: 6 }}>대상 학년</label>
        <div className="qb-tags">
          {targetGrades.map((g) => (
            <span
              key={g.value}
              className="qb-tag"
              style={{
                cursor: "pointer",
                background: data.target_grades?.includes(g.value) ? "#2d5a3d" : undefined,
                borderColor: data.target_grades?.includes(g.value) ? "#3d7a4d" : undefined,
                color: data.target_grades?.includes(g.value) ? "#e8f0ea" : undefined,
              }}
              onClick={() => toggleGrade(g.value)}
            >
              {g.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MetaForm;
