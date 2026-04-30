/**
 * 모범답안 미리보기 (왼쪽 패널)
 */
export default function AnswerKeyPreview({ content, onClickPath, focusPath }) {
  const sections = content?.sections || [];

  return (
    <div>
      {sections.length === 0 && <div style={{ color: "var(--muted)" }}>섹션이 없습니다.</div>}
      {sections.map((sec, si) => {
        const secPath = `sections[${si}]`;
        return (
          <div key={si} style={{ marginBottom: 16 }}>
            <div
              className={`ce-preview-card ${focusPath === secPath ? "active" : ""}`}
              data-editor-path={secPath}
              onClick={() => onClickPath(secPath)}
            >
              <div className="ce-preview-section-title">
                {sec.label || `섹션 ${si + 1}`}
              </div>
              {(sec.items || []).map((item, ii) => {
                const itemPath = `${secPath}.items[${ii}]`;
                const isActive = focusPath && focusPath.startsWith(itemPath);
                return (
                  <div
                    key={ii}
                    className={`ce-preview-answer-item ${isActive ? "active" : ""}`}
                    data-editor-path={itemPath}
                    onClick={(e) => { e.stopPropagation(); onClickPath(itemPath); }}
                    style={isActive ? { background: "#1e2a24", borderRadius: 4, padding: "6px 8px" } : undefined}
                  >
                    <span className="ce-preview-answer-num">
                      {item.number || ii + 1}.
                    </span>
                    <div className="ce-preview-answer-text">
                      <div>{item.answer || "(정답 없음)"}</div>
                      {item.explanation && (
                        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 2 }}>
                          {item.explanation.length > 60 ? item.explanation.slice(0, 60) + "..." : item.explanation}
                        </div>
                      )}
                    </div>
                    {item.type && <span style={{ fontSize: 11, color: "var(--muted)" }}>{item.type}</span>}
                    {item.points && <span style={{ fontSize: 11, color: "#ff7f2a" }}>{item.points}점</span>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
