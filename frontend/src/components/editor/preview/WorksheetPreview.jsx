/**
 * 퀴즈/워크시트 미리보기 (왼쪽 패널)
 *
 * 주의: DAILY_QUIZ 같은 복합 문항 타입은 passage가 객체 {paragraphs, tokens}
 *       구조를 가질 수 있으므로 모든 렌더 위치에서 string 강제 변환을 거친다.
 *
 * 하이라이트: 문항별 q.highlight.ranges 를 표시. 컨테이너는 ce-passage-container
 *            ID + data-paragraph-id 속성을 가져 HighlightPicker가 드래그 감지 가능.
 */

/** 어떤 값이든 안전한 표시 문자열로 변환 */
function toDisplayString(v, maxLen = 80) {
  if (v == null) return "";
  if (typeof v === "string") {
    return v.length > maxLen ? v.slice(0, maxLen) + "..." : v;
  }
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return `[배열 · ${v.length}개]`;
  if (typeof v === "object") {
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

/** 단락 텍스트에 ranges 적용 — string passage를 paragraphId="default" 단일 단락으로 가정 */
function renderHighlightedString(text, ranges) {
  if (!ranges || ranges.length === 0) return text;
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  const parts = [];
  let pos = 0;
  sorted.forEach((r, i) => {
    if (r.start > pos) parts.push({ text: text.slice(pos, r.start), hl: false });
    parts.push({ text: text.slice(r.start, r.end), hl: true });
    pos = r.end;
  });
  if (pos < text.length) parts.push({ text: text.slice(pos), hl: false });
  return parts.map((p, i) =>
    p.hl ? <span key={i} className="highlight">{p.text}</span> : <span key={i}>{p.text}</span>
  );
}

export default function WorksheetPreview({ content, onClickPath, focusPath }) {
  const questions = content?.questions || [];

  return (
    <div id="ce-passage-container">
      {questions.length === 0 && <div style={{ color: "#6a7a6e" }}>문항이 없습니다.</div>}
      {questions.map((q, i) => {
        const path = `questions[${i}]`;
        const isActive = focusPath && focusPath.startsWith(path);
        const stemDisp = toDisplayString(q.stem || q.prompt, 200) || "(발문 없음)";
        const templateDisp = q.template != null ? toDisplayString(q.template, 60) : "";
        // string passage는 하이라이트 적용, 객체 passage는 요약 표시
        const isStringPassage = typeof q.passage === "string" && q.passage.length > 0;
        const passageRanges = Array.isArray(q.highlight?.ranges) ? q.highlight.ranges : [];
        // legacy: highlight.text(string) → 첫 매칭 위치를 자동 range로 변환
        const legacyHighlightText = !passageRanges.length && typeof q.highlight?.text === "string" ? q.highlight.text : "";
        const effectiveRanges = passageRanges.length
          ? passageRanges
          : (isStringPassage && legacyHighlightText
              ? [{ paragraphId: `q${i}`, start: q.passage.indexOf(legacyHighlightText), end: q.passage.indexOf(legacyHighlightText) + legacyHighlightText.length }]
                  .filter((r) => r.start >= 0)
              : []);
        const objectPassageDisp = !isStringPassage && q.passage != null ? toDisplayString(q.passage) : "";
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
            {isStringPassage && (
              <div
                className="ce-preview-passage-line"
                data-paragraph-id={`q${i}`}
                style={{ fontSize: 13, color: "#cdd6d0", marginBottom: 6, padding: "6px 10px", background: "#111815", borderRadius: 4, lineHeight: 1.6 }}
              >
                {renderHighlightedString(q.passage, effectiveRanges)}
              </div>
            )}
            {objectPassageDisp && (
              <div style={{ fontSize: 12, color: "#8a9a8e", marginBottom: 6, padding: "4px 8px", background: "#111815", borderRadius: 4 }}>
                {objectPassageDisp}
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
