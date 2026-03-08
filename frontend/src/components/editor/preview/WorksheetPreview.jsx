/**
 * 퀴즈/워크시트 미리보기 (왼쪽 패널)
 */
export default function WorksheetPreview({ content, onClickPath, focusPath }) {
  const questions = content?.questions || [];

  return (
    <div>
      {questions.length === 0 && <div style={{ color: "#6a7a6e" }}>문항이 없습니다.</div>}
      {questions.map((q, i) => {
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
              <strong style={{ color: "#6a7a6e", marginRight: 6 }}>{i + 1}.</strong>
              {q.stem || q.prompt || "(발문 없음)"}
            </div>
            {q.passage && (
              <div style={{ fontSize: 12, color: "#8a9a8e", marginBottom: 6, padding: "4px 8px", background: "#111815", borderRadius: 4 }}>
                {q.passage.length > 80 ? q.passage.slice(0, 80) + "..." : q.passage}
              </div>
            )}
            {(q.choices || []).map((c, ci) => (
              <div
                key={c.id || ci}
                className={`ce-preview-q-choice ${c.id === q.answerId ? "correct" : ""}`}
              >
                {ci + 1}. {c.text || "(빈 선택지)"}
                {c.id === q.answerId && " ✓"}
              </div>
            ))}
            {q.template && (
              <div style={{ fontSize: 12, color: "#a6b6a9", marginTop: 4 }}>
                [빈칸형] {q.template.slice(0, 60)}...
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
