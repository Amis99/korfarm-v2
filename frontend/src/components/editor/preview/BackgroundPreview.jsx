/**
 * 배경지식 미리보기 (왼쪽 패널)
 * passages[] 기반 + questions[] 레거시 fallback
 */
export default function BackgroundPreview({ content, onClickPath, focusPath }) {
  const passages = content?.passages || [];
  const legacyQuestions = content?.questions || [];
  const hasPassages = passages.length > 0;

  if (!hasPassages && legacyQuestions.length === 0) {
    return <div style={{ color: "var(--muted)" }}>콘텐츠가 없습니다.</div>;
  }

  // passages 모드
  if (hasPassages) {
    return (
      <div>
        {passages.map((p, pi) => {
          const pPath = `passages[${pi}]`;
          const isPActive = focusPath && focusPath.startsWith(pPath);
          return (
            <div
              key={p.id || pi}
              className={`ce-preview-card ${isPActive ? "active" : ""}`}
              data-editor-path={pPath}
              onClick={() => onClickPath(pPath)}
              style={{ marginBottom: 16 }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ background: "#ff8f2b", color: "#fff", padding: "2px 8px", borderRadius: 4, fontSize: 12, fontWeight: 700 }}>
                  지문 {pi + 1}
                </span>
                <strong style={{ fontSize: 14 }}>{p.title || "(제목 없음)"}</strong>
              </div>
              <div style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.7, marginBottom: 8, whiteSpace: "pre-wrap" }}>
                {p.text
                  ? p.text.length > 200 ? p.text.slice(0, 200) + "..." : p.text
                  : "(지문 없음)"}
              </div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>
                글자 수: {p.text?.length || 0}자
              </div>
              {(p.questions || []).map((q, qi) => {
                const qPath = `${pPath}.questions[${qi}]`;
                const isQActive = focusPath && focusPath.startsWith(qPath);
                return (
                  <div
                    key={q.id || qi}
                    className={`ce-preview-card ${isQActive ? "active" : ""}`}
                    data-editor-path={qPath}
                    onClick={(e) => { e.stopPropagation(); onClickPath(qPath); }}
                    style={{ marginTop: 6, marginLeft: 8 }}
                  >
                    <div className="ce-preview-q-stem">
                      <strong style={{ color: "var(--muted)", marginRight: 6 }}>Q{qi + 1}.</strong>
                      {q.stem || "(발문 없음)"}
                    </div>
                    {(q.choices || []).map((c, ci) => (
                      <div
                        key={c.id || ci}
                        className={`ce-preview-q-choice ${c.id === q.answerId ? "correct" : ""}`}
                      >
                        {ci + 1}. {c.text || "(빈 선택지)"}
                        {c.id === q.answerId && " ✓"}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  }

  // 레거시 모드 (questions만 있는 경우)
  return (
    <div>
      <div style={{ fontSize: 12, color: "#ff8f2b", marginBottom: 8 }}>레거시 모드 (지문 없는 문항)</div>
      {legacyQuestions.map((q, i) => {
        const path = `questions[${i}]`;
        const isActive = focusPath && focusPath.startsWith(path);
        return (
          <div
            key={q.id || i}
            className={`ce-preview-card ${isActive ? "active" : ""}`}
            data-editor-path={path}
            onClick={() => onClickPath(path)}
          >
            <div className="ce-preview-q-stem">
              <strong style={{ color: "var(--muted)", marginRight: 6 }}>{i + 1}.</strong>
              {q.stem || q.prompt || "(발문 없음)"}
            </div>
            {(q.choices || []).map((c, ci) => (
              <div
                key={c.id || ci}
                className={`ce-preview-q-choice ${c.id === q.answerId ? "correct" : ""}`}
              >
                {ci + 1}. {c.text || "(빈 선택지)"}
                {c.id === q.answerId && " ✓"}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
