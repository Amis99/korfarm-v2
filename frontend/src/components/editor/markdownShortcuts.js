/**
 * 비주얼 에디터 textarea 공통 마크다운 단축키 + Enter 자동 <br>.
 *
 * 지원:
 *  - Ctrl+B → **선택**
 *  - Ctrl+I → *선택*
 *  - Ctrl+U → <u>선택</u> (브라우저 view-source 가로채기)
 *  - Ctrl+J → <div style="text-align: justify;">선택</div>
 *  - Ctrl+E → <div style="text-align: center;">선택</div>
 *  - Ctrl+R → <div style="text-align: right;">선택</div> (브라우저 새로고침 가로채기)
 *  - Enter  → 줄 끝에 <br> 자동 삽입 + 새 줄 (Shift+Enter 는 일반 \n)
 *
 * IME 대응: e.key 외에 e.code (KeyB/KeyU 등) 도 함께 검사. 한글 입력 모드여도 작동.
 * 이벤트 전파: 매칭 시 preventDefault + stopPropagation 으로 브라우저 기본 동작·상위 핸들러 모두 차단.
 *
 * 사용:
 *  <textarea
 *    onKeyDown={(e) => handleTextareaShortcut(e, { value, setValue: onChange })}
 *  />
 *
 * 정렬 토큰 형식은 기존 MarkdownEditField.setAlign 과 일치 (`<div style="text-align: X;">`).
 */

function wrapSelection(textarea, value, setValue, prefix, suffix, fallback) {
  const start = textarea.selectionStart ?? 0;
  const end = textarea.selectionEnd ?? 0;
  const text = value || "";
  const sel = text.slice(start, end);
  const inner = sel || fallback;
  const next = text.slice(0, start) + prefix + inner + suffix + text.slice(end);
  setValue(next);
  requestAnimationFrame(() => {
    try {
      textarea.focus();
      const cursor = start + prefix.length + inner.length;
      textarea.setSelectionRange(
        sel ? start + prefix.length : cursor,
        sel ? end + prefix.length : cursor,
      );
    } catch { /* ignore */ }
  });
}

function setAlign(textarea, value, setValue, align) {
  const text = value || "";
  let start = textarea.selectionStart ?? 0;
  let end = textarea.selectionEnd ?? 0;
  // 선택이 없으면 현재 줄 전체를 감쌈
  if (start === end) {
    const lineStart = text.lastIndexOf("\n", start - 1) + 1;
    const lineEndIdx = text.indexOf("\n", start);
    const lineEnd = lineEndIdx === -1 ? text.length : lineEndIdx;
    start = lineStart;
    end = lineEnd;
  }
  const inner = text.slice(start, end) || "내용";
  // 이미 align div 로 감싸진 경우 정렬만 교체
  const alignTagRe = /^<div style="text-align:\s*(\w+);?">([\s\S]*)<\/div>$/i;
  const m = inner.match(alignTagRe);
  const replacement = m
    ? `<div style="text-align: ${align};">${m[2]}</div>`
    : `<div style="text-align: ${align};">${inner}</div>`;
  // 앞뒤 빈 줄 보장 (마크다운 단락 분리)
  const before = text.slice(0, start);
  const after = text.slice(end);
  const needLeadingBlank = before.length > 0 && !/\n\n$/.test(before) && !/^\s*$/.test(before);
  const needTrailingBlank = after.length > 0 && !/^\n\n/.test(after) && !/^\s*$/.test(after);
  const next = before
    + (needLeadingBlank ? "\n\n" : "")
    + replacement
    + (needTrailingBlank ? "\n\n" : "")
    + after;
  setValue(next);
  requestAnimationFrame(() => {
    try {
      textarea.focus();
      const newStart = before.length + (needLeadingBlank ? 2 : 0);
      const newEnd = newStart + replacement.length;
      textarea.setSelectionRange(newStart, newEnd);
    } catch { /* ignore */ }
  });
}

// Enter 키 — 줄 끝에 <br> 삽입 + 새 줄로 커서 이동.
// Shift+Enter / Ctrl+Enter / Alt+Enter 는 기본 동작(\n) 유지.
function insertBrAndNewline(textarea, value, setValue) {
  const start = textarea.selectionStart ?? 0;
  const end = textarea.selectionEnd ?? 0;
  const text = value || "";
  const insertion = "<br>\n";
  const next = text.slice(0, start) + insertion + text.slice(end);
  setValue(next);
  requestAnimationFrame(() => {
    try {
      textarea.focus();
      const cursor = start + insertion.length;
      textarea.setSelectionRange(cursor, cursor);
    } catch { /* ignore */ }
  });
}

// e.key / e.code 둘 다 검사. e.key 는 한글 IME 중에 "Process" 일 수 있음.
// e.code 는 키보드 물리 위치 기반이라 IME·언어 무관.
function matchKey(e, char, codeName) {
  const key = (e.key || "").toLowerCase();
  const code = e.code || "";
  return key === char || code === codeName;
}

/**
 * textarea onKeyDown 에서 호출. 단축키 매칭 시 true, 아니면 false.
 *
 * @param {KeyboardEvent} e
 * @param {{ value: string, setValue: (next: string) => void }} ctx
 * @returns {boolean} 처리 여부
 */
export function handleTextareaShortcut(e, { value, setValue }) {
  // IME 진행 중 단축키 무시 (한글 조합 중 끼어들면 입력 깨짐)
  if (e.isComposing || e.keyCode === 229) return false;

  const textarea = e.target;
  if (!textarea || typeof textarea.selectionStart !== "number") return false;

  const handle = (action) => {
    e.preventDefault();
    e.stopPropagation();
    action();
    return true;
  };

  // Enter 자동 <br> — 모디파이어 없는 단순 Enter 만
  if (e.key === "Enter" && !e.ctrlKey && !e.metaKey && !e.shiftKey && !e.altKey) {
    return handle(() => insertBrAndNewline(textarea, value, setValue));
  }

  // 마크다운 단축키 — Ctrl/Cmd 만 (Shift·Alt 동반은 무시)
  if (!(e.ctrlKey || e.metaKey)) return false;
  if (e.altKey || e.shiftKey) return false;

  if (matchKey(e, "b", "KeyB")) return handle(() => wrapSelection(textarea, value, setValue, "**", "**", "굵게"));
  if (matchKey(e, "i", "KeyI")) return handle(() => wrapSelection(textarea, value, setValue, "*", "*", "기울임"));
  if (matchKey(e, "u", "KeyU")) return handle(() => wrapSelection(textarea, value, setValue, "<u>", "</u>", "밑줄"));
  if (matchKey(e, "j", "KeyJ")) return handle(() => setAlign(textarea, value, setValue, "justify"));
  if (matchKey(e, "e", "KeyE")) return handle(() => setAlign(textarea, value, setValue, "center"));
  if (matchKey(e, "r", "KeyR")) return handle(() => setAlign(textarea, value, setValue, "right"));
  return false;
}

/**
 * contentEditable (InlineEditable) 용 — execCommand("insertText") 로 토큰 삽입.
 * 짧은 발문·명제 등에 쓰이므로 정렬은 줄 단위가 아닌 단순 토큰 감싸기로 처리.
 *
 * @param {KeyboardEvent} e
 * @returns {boolean} 처리 여부
 */
export function handleContentEditableShortcut(e) {
  if (e.isComposing || e.keyCode === 229) return false;
  if (!(e.ctrlKey || e.metaKey)) return false;
  if (e.altKey || e.shiftKey) return false;
  const insertWrap = (left, right) => {
    e.preventDefault();
    e.stopPropagation();
    document.execCommand("insertText", false, left + right);
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      try {
        range.setStart(range.endContainer, range.endOffset - right.length);
        range.setEnd(range.endContainer, range.endOffset);
      } catch { /* ignore */ }
    }
  };
  const insertAlign = (align) => {
    e.preventDefault();
    e.stopPropagation();
    const open = `<div style="text-align: ${align};">`;
    const close = "</div>";
    document.execCommand("insertText", false, open + close);
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      try {
        range.setStart(range.endContainer, range.endOffset - close.length);
        range.setEnd(range.endContainer, range.endOffset);
      } catch { /* ignore */ }
    }
  };
  if (matchKey(e, "b", "KeyB")) { insertWrap("**", "**"); return true; }
  if (matchKey(e, "i", "KeyI")) { insertWrap("*", "*"); return true; }
  if (matchKey(e, "u", "KeyU")) { insertWrap("<u>", "</u>"); return true; }
  if (matchKey(e, "h", "KeyH")) { insertWrap("==", "=="); return true; }
  if (matchKey(e, "j", "KeyJ")) { insertAlign("justify"); return true; }
  if (matchKey(e, "e", "KeyE")) { insertAlign("center"); return true; }
  if (matchKey(e, "r", "KeyR")) { insertAlign("right"); return true; }
  return false;
}
