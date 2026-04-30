/**
 * 선택지 판별 미리보기 (왼쪽 패널)
 * passage 토큰 + items > choices > propositions
 */
export default function ChoiceJudgementPreview({ content, onClickPath, focusPath }) {
  const passage = content?.passage;
  const items = content?.items || [];

  return (
    <div>
      {/* 지문 */}
      {passage && (
        <div
          className={`ce-preview-card ${focusPath === "passage" ? "active" : ""}`}
          onClick={() => onClickPath("passage")}
        >
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--muted)", marginBottom: 6 }}>지문</div>
          {(passage.paragraphs || []).map((p, pi) => (
            <p key={p.id || pi} style={{ margin: "0 0 4px", fontSize: 13, textIndent: "1em" }}>
              {p.text}
            </p>
          ))}
          {passage.tokens?.length > 0 && (
            <div style={{ marginTop: 6, fontSize: 11, color: "var(--muted)" }}>
              토큰 {passage.tokens.length}개
            </div>
          )}
        </div>
      )}

      {/* 문항 */}
      {items.length === 0 && !passage && <div style={{ color: "var(--muted)" }}>항목이 없습니다.</div>}
      {items.map((item, i) => {
        const path = `items[${i}]`;
        const isActive = focusPath && focusPath.startsWith(path);
        return (
          <div
            key={item.itemId || i}
            className={`ce-preview-card ${isActive ? "active" : ""}`}
            data-editor-path={path}
            onClick={() => onClickPath(path)}
          >
            <div className="ce-preview-q-stem">
              <strong style={{ color: "var(--muted)", marginRight: 6 }}>{i + 1}.</strong>
              {item.stem || "(발문 없음)"}
            </div>

            {(item.choices || []).map((ch, ci) => (
              <div key={ch.choiceId || ci} style={{ marginTop: 6 }}>
                <div style={{ fontSize: 13 }}>
                  <span style={{ color: "var(--muted)", marginRight: 4 }}>{ch.choiceId || ci + 1}.</span>
                  {ch.text || "(빈 선택지)"}
                  {ch.finalIsCorrectChoice && <span style={{ color: "#4ecb71", marginLeft: 6 }}>✓ 정답</span>}
                </div>

                {/* 명제 */}
                {(ch.propositions || []).map((pr, pri) => (
                  <div key={pr.propId || pri} style={{ paddingLeft: 16, fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                    <span className={`ce-ox-badge ${pr.oxAnswer === "O" ? "o" : "x"}`}>
                      {pr.oxAnswer || "?"}
                    </span>
                    {pr.text || "(명제 없음)"}
                    {pr.evidenceTokens?.length > 0 && (
                      <span className="ce-evidence-tags" style={{ display: "inline-flex", marginLeft: 6 }}>
                        {pr.evidenceTokens.map((et, eti) => (
                          <span key={eti} className="ce-evidence-tag">{et}</span>
                        ))}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
