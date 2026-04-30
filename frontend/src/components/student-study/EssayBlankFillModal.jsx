import { useState } from "react";

/**
 * 서술형 빈칸 채우기 모달.
 * modelAnswerMasked 안의 ___ 영역을 클릭하면 입력 모달이 떠서 한 단어를 채움.
 * 모든 빈칸이 채워지면 제출 가능.
 *
 * props:
 *  - question: { stem, modelAnswerMasked, fillBlanksCount }
 *  - onSubmit(userAnswer)  // 빈칸을 채운 완성된 텍스트
 *  - onClose()
 */
export default function EssayBlankFillModal({ question, onSubmit, onClose, busy }) {
  // modelAnswerMasked 의 _____ (3+ 연속 _) 를 빈칸으로 분리
  const blanks = parseBlanks(question.modelAnswerMasked || "");
  const [values, setValues] = useState(() => blanks.map(() => ""));
  const [editingIdx, setEditingIdx] = useState(null);
  const [draftValue, setDraftValue] = useState("");

  const filled = values.filter(v => v.trim()).length;
  const total = blanks.length;

  const openEdit = (i) => {
    if (busy) return;
    setEditingIdx(i);
    setDraftValue(values[i] || "");
  };

  const confirmEdit = () => {
    const next = [...values];
    next[editingIdx] = draftValue.trim();
    setValues(next);
    setEditingIdx(null);
    setDraftValue("");
  };

  const cancelEdit = () => {
    setEditingIdx(null);
    setDraftValue("");
  };

  const submit = () => {
    if (filled < total) return;
    // 완성된 텍스트 = 빈칸을 학생 입력으로 치환
    let result = "";
    let blankIdx = 0;
    for (const seg of blanks.segments) {
      if (seg.type === "text") {
        result += seg.text;
      } else {
        result += values[blankIdx] || "";
        blankIdx += 1;
      }
    }
    onSubmit(result);
  };

  return (
    <div className="ssm-overlay" onClick={onClose}>
      <div className="ssm-modal ssm-modal-wide" onClick={(e) => e.stopPropagation()}>
        <h3 style={{ margin: 0, fontSize: 16, color: "#1f4a37" }}>{question.questionNo || "?"}번 서술형</h3>
        <p style={{ margin: "8px 0 14px", fontSize: 14, color: "#1a2920", whiteSpace: "pre-wrap" }}>{question.stem}</p>

        <div className="essay-passage">
          {blanks.segments.map((seg, i) => {
            if (seg.type === "text") {
              return <span key={i}>{seg.text}</span>;
            }
            const blankIdx = blanks.indexByPos[i];
            const value = values[blankIdx];
            return (
              <button
                key={i}
                type="button"
                className={`essay-blank ${value ? "filled" : ""}`}
                onClick={() => openEdit(blankIdx)}
                disabled={busy}
              >
                {value || `빈칸${blankIdx + 1}`}
              </button>
            );
          })}
        </div>

        <p style={{ fontSize: 12, color: "#3a4a3e", textAlign: "center", margin: "12px 0" }}>
          빈칸을 클릭해서 채우세요 ({filled}/{total})
        </p>

        <div className="ssm-actions">
          <button type="button" className="ssm-btn ssm-btn-ghost" onClick={onClose} disabled={busy}>닫기</button>
          <button
            type="button"
            className="ssm-btn ssm-btn-primary"
            onClick={submit}
            disabled={filled < total || busy}
          >
            {busy ? "채점 중..." : "제출"}
          </button>
        </div>

        {/* 단어 입력 미니 모달 */}
        {editingIdx !== null && (
          <div className="essay-edit-overlay" onClick={cancelEdit}>
            <div className="essay-edit-modal" onClick={(e) => e.stopPropagation()}>
              <p style={{ margin: 0, fontSize: 13, color: "#3a4a3e" }}>빈칸 {editingIdx + 1} 채우기</p>
              <input
                autoFocus
                value={draftValue}
                onChange={(e) => setDraftValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") confirmEdit(); else if (e.key === "Escape") cancelEdit(); }}
                placeholder="단어를 입력"
                style={{
                  width: "100%", padding: "8px 12px",
                  border: "1px solid #2d6a4f", borderRadius: 6,
                  fontSize: 16, fontFamily: "inherit",
                }}
              />
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end", marginTop: 10 }}>
                <button type="button" className="ssm-btn ssm-btn-ghost" onClick={cancelEdit}>취소</button>
                <button type="button" className="ssm-btn ssm-btn-primary" onClick={confirmEdit} disabled={!draftValue.trim()}>
                  확인
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** masked 문자열을 텍스트 / 빈칸 세그먼트로 분리 */
function parseBlanks(masked) {
  const segments = [];
  const indexByPos = {};
  let blankCount = 0;
  let buf = "";
  let i = 0;
  while (i < masked.length) {
    if (masked[i] === "_") {
      // 연속 _ 감지
      let j = i;
      while (j < masked.length && masked[j] === "_") j += 1;
      if (j - i >= 2) {
        if (buf) {
          segments.push({ type: "text", text: buf });
          buf = "";
        }
        const segIdx = segments.length;
        indexByPos[segIdx] = blankCount;
        segments.push({ type: "blank" });
        blankCount += 1;
        i = j;
        continue;
      }
    }
    buf += masked[i];
    i += 1;
  }
  if (buf) segments.push({ type: "text", text: buf });
  return { segments, indexByPos, length: blankCount };
}
