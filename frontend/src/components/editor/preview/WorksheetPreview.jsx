/**
 * 퀴즈/워크시트 미리보기 (왼쪽 패널)
 *
 * 주의: DAILY_QUIZ 같은 복합 문항 타입은 passage가 객체 {paragraphs, tokens}
 *       구조를 가질 수 있으므로 모든 렌더 위치에서 string 강제 변환을 거친다.
 */

/** 어떤 값이든 안전한 표시 문자열로 변환 */
function toDisplayString(v, maxLen = 80) {
  if (v == null) return "";
  if (typeof v === "string") {
    return v.length > maxLen ? v.slice(0, maxLen) + "..." : v;
  }
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  // 객체/배열은 요약 형태로
  if (Array.isArray(v)) return `[배열 · ${v.length}개]`;
  if (typeof v === "object") {
    // passage 객체: {paragraphs:[...]} 형태이면 첫 문단 미리보기
    if (Array.isArray(v.paragraphs)) {
      const first = v.paragraphs[0];
      const txt = typeof first?.text === "string" ? first.text : "";
      const more = v.paragraphs.length > 1 ? ` (외 ${v.paragraphs.length - 1}문단)` : "";
      return (txt.length > maxLen ? txt.slice(0, maxLen) + "..." : txt) + more;
    }
    return `{객체 · ${Object.keys(v).join(",")}}`;
  }
  return String(v);
}

export default function WorksheetPreview({ content, onClickPath, focusPath }) {
  const questions = content?.questions || [];

  return (
    <div>
      {questions.length === 0 && <div style={{ color: "#6a7a6e" }}>문항이 없습니다.</div>}
      {questions.map((q, i) => {
        const path = `questions[${i}]`;
        const isActive = focusPath && focusPath.startsWith(path);
        const stemDisp = toDisplayString(q.stem || q.prompt, 200) || "(발문 없음)";
        const passageDisp = q.passage != null ? toDisplayString(q.passage) : "";
        const templateDisp = q.template != null ? toDisplayString(q.template, 60) : "";
        return (
          <div
            key={q.id || q.choiceId || i}
            className={`ce-preview-card ${isActive ? "active" : ""}`}
            data-editor-path={path}
            onClick={() => onClickPath(path)}
          >
            <div className="ce-preview-q-stem">
              <strong style={{ color: "#6a7a6e", marginRight: 6 }}>{i + 1}.</strong>
              {stemDisp}
            </div>
            {passageDisp && (
              <div style={{ fontSize: 12, color: "#8a9a8e", marginBottom: 6, padding: "4px 8px", background: "#111815", borderRadius: 4 }}>
                {passageDisp}
              </div>
            )}
            {(q.choices || []).map((c, ci) => {
              const cid = c.id || c.choiceId;
              const isCorrect = cid === q.answerId || c.finalIsCorrectChoice === true;
              return (
                <div
                  key={cid || ci}
                  className={`ce-preview-q-choice ${isCorrect ? "correct" : ""}`}
                >
                  {ci + 1}. {toDisplayString(c.text, 200) || "(빈 선택지)"}
                  {isCorrect && " ✓"}
                </div>
              );
            })}
            {templateDisp && (
              <div style={{ fontSize: 12, color: "#a6b6a9", marginTop: 4 }}>
                [빈칸형] {templateDisp}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
