/**
 * 단어 형성 미리보기 (왼쪽 패널)
 */
export default function WordFormationPreview({ content, onClickPath, focusPath }) {
  const items = content?.items || [];

  return (
    <div>
      {items.length === 0 && <div style={{ color: "#6a7a6e" }}>항목이 없습니다.</div>}
      {items.map((item, i) => {
        const path = `items[${i}]`;
        const isActive = focusPath && focusPath.startsWith(path);
        return (
          <div
            key={i}
            className={`ce-preview-card ${isActive ? "active" : ""}`}
            data-editor-path={path}
            onClick={() => onClickPath(path)}
          >
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
              {item.word || "(단어 없음)"}
            </div>

            {/* 형태소 칩 */}
            <div className="ce-morpheme-chips">
              {(item.morphemes || []).map((m, mi) => (
                <span key={mi} className="ce-morpheme-chip">
                  <span className="ce-chip-idx">{mi}</span>
                  {m}
                </span>
              ))}
            </div>

            {/* steps 요약 */}
            {(item.steps || []).map((s, si) => (
              <div key={si} className="ce-preview-step">
                <span className="ce-preview-badge">{s.type || "STEP"}</span>
                {s.index != null && `형태소[${s.index}]`}
                {s.answer && (
                  <span className="ce-preview-badge correct" style={{ marginLeft: 6 }}>
                    정답: {s.answer}
                  </span>
                )}
              </div>
            ))}

            {/* formationGame 요약 */}
            {item.formationGame?.mergeQuestions?.length > 0 && (
              <div style={{ marginTop: 6, fontSize: 11, color: "#6a7a6e" }}>
                결합 게임: {item.formationGame.mergeQuestions.length}문항
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
