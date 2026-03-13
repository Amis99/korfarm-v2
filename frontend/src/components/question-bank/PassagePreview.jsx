function PassagePreview({ passage, index }) {
  return (
    <div className="qb-card">
      <div className="qb-card-title">
        <span className="material-symbols-outlined">article</span>
        지문 {index + 1}{passage.title ? ` — ${passage.title}` : ""}
        {passage.passage_code && (
          <span className="qb-tag" style={{ marginLeft: "auto" }}>{passage.passage_code}</span>
        )}
      </div>
      <div className="qb-passage-body">{passage.body_text}</div>
      {passage.sub_passages?.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: "0.78rem", color: "#8a9a8e", marginBottom: 6 }}>하위 지문</div>
          {passage.sub_passages.map((sp, i) => (
            <div key={i} className="qb-card" style={{ padding: 10, marginBottom: 6 }}>
              <div style={{ fontSize: "0.83rem", color: "#b0a8a0" }}>
                {typeof sp === "string" ? sp : JSON.stringify(sp)}
              </div>
            </div>
          ))}
        </div>
      )}
      {passage.box_items?.length > 0 && (
        <div style={{ marginTop: 10 }}>
          <div style={{ fontSize: "0.78rem", color: "#8a9a8e", marginBottom: 6 }}>보기</div>
          {passage.box_items.map((bi, i) => (
            <div key={i} style={{ padding: "6px 10px", background: "#18201a", borderRadius: 6, marginBottom: 4, fontSize: "0.83rem", color: "#b0a8a0" }}>
              {typeof bi === "string" ? bi : (bi.label || bi.기호 ? `${bi.기호 || bi.label}: ${bi.내용 || bi.content || ""}` : JSON.stringify(bi))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PassagePreview;
