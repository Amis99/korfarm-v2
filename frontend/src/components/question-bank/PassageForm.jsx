import { useState } from "react";

function PassageForm({ passage, index, onChange }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="qb-accordion">
      <div className="qb-accordion-header" onClick={() => setOpen(!open)}>
        <span>
          지문 {index + 1}: {passage.title || passage.passage_code || "(제목 없음)"}
        </span>
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
          {open ? "expand_less" : "expand_more"}
        </span>
      </div>
      {open && (
        <div className="qb-accordion-body">
          <div className="qb-meta-grid" style={{ marginBottom: 12 }}>
            <div className="qb-meta-field">
              <label>지문 코드</label>
              <input
                className="qb-inline-input"
                value={passage.passage_code}
                onChange={(e) => onChange(index, "passage_code", e.target.value)}
              />
            </div>
            <div className="qb-meta-field">
              <label>제목</label>
              <input
                className="qb-inline-input"
                value={passage.title}
                onChange={(e) => onChange(index, "title", e.target.value)}
              />
            </div>
            <div className="qb-meta-field">
              <label>참조 유형</label>
              <select
                className="qb-select"
                style={{ width: "100%" }}
                value={passage.ref_type}
                onChange={(e) => onChange(index, "ref_type", e.target.value)}
              >
                <option value="">선택</option>
                <option value="FULL">전체 지문 기준</option>
                <option value="PART">부분 지문 기준</option>
                <option value="NONE">지문 없음</option>
              </select>
            </div>
          </div>
          <div className="qb-meta-field">
            <label>본문</label>
            <textarea
              className="qb-json-area"
              style={{ minHeight: 200 }}
              value={passage.body_text}
              onChange={(e) => onChange(index, "body_text", e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default PassageForm;
