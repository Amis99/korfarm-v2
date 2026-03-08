/**
 * 음운 변동 미리보기 (왼쪽 패널)
 */
export default function PhonemeChangePreview({ content, onClickPath, focusPath }) {
  const words = content?.words || [];

  return (
    <div>
      {words.length === 0 && <div style={{ color: "#6a7a6e" }}>단어가 없습니다.</div>}
      {words.map((w, wi) => {
        const path = `words[${wi}]`;
        const isActive = focusPath && focusPath.startsWith(path);
        return (
          <div
            key={w.wordId || wi}
            className={`ce-preview-card ${isActive ? "active" : ""}`}
            data-editor-path={path}
            onClick={() => onClickPath(path)}
          >
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8 }}>
              {w.surface || "(단어 없음)"}
            </div>

            {/* 음소 셀 */}
            <div className="ce-phoneme-cells">
              {(w.cells || []).map((c, ci) => (
                <div key={ci} className="ce-phoneme-cell">
                  <span className="ce-phoneme-cell-no">{c.cellNo}</span>
                  <span className="ce-phoneme-cell-text">{c.text || "?"}</span>
                </div>
              ))}
            </div>

            {/* steps 요약 */}
            {(w.steps || []).map((s, si) => (
              <div key={s.stepId || si} className="ce-preview-step">
                <span className="ce-preview-badge">{s.questionType || "STEP"}</span>
                셀{s.targetCellNo}
                {s.envCellNos?.length > 0 && ` (환경: ${s.envCellNos.join(",")})`}
                {s.answerId && (
                  <span className="ce-preview-badge correct" style={{ marginLeft: 6 }}>
                    정답: {(s.choices || []).find((c) => c.id === s.answerId)?.text || s.answerId}
                  </span>
                )}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
