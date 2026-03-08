/**
 * 문장 짜임 미리보기 (왼쪽 패널)
 */
export default function SentenceStructurePreview({ content, onClickPath, focusPath }) {
  const sentences = content?.sentences || [];

  return (
    <div>
      {sentences.length === 0 && <div style={{ color: "#6a7a6e" }}>문장이 없습니다.</div>}
      {sentences.map((sent, si) => {
        const path = `sentences[${si}]`;
        const isActive = focusPath && focusPath.startsWith(path);
        return (
          <div
            key={sent.sentenceId || si}
            className={`ce-preview-card ${isActive ? "active" : ""}`}
            data-editor-path={path}
            onClick={() => onClickPath(path)}
          >
            <div style={{ fontSize: 12, color: "#6a7a6e", marginBottom: 6 }}>
              문장 {si + 1} — {sent.sentenceId || ""}
            </div>

            {/* 토큰 칩 */}
            <div className="ce-token-chips">
              {(sent.tokens || []).map((t, ti) => (
                <span key={t.tokenId || ti} className="ce-token-chip">
                  <span className="ce-token-chip-text">{t.text}</span>
                  {t.role && <span className="ce-token-chip-role">{t.role}</span>}
                </span>
              ))}
            </div>

            {/* roleQueryOrder 요약 */}
            {(sent.roleQueryOrder || []).map((rq, ri) => (
              <div key={ri} className="ce-preview-step">
                <span className="ce-preview-badge">서술어</span>
                {rq.predicate}
                {rq.targetRoles?.length > 0 && (
                  <span style={{ marginLeft: 6, fontSize: 11, color: "#a6b6a9" }}>
                    → {rq.targetRoles.join(", ")}
                  </span>
                )}
              </div>
            ))}

            {/* embeddedOrLinked 요약 */}
            {(sent.embeddedOrLinked || []).length > 0 && (
              <div style={{ marginTop: 6, fontSize: 11, color: "#6a7a6e" }}>
                절 구조: {sent.embeddedOrLinked.map((e) => `${e.type}(${e.clauseType || ""})`).join(", ")}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
