import { useEffect, useRef } from "react";

/**
 * contentEditable 래퍼 — 마크다운 토큰(**, ==, *, <u>) 을 raw 로 그대로 보존하며 인라인 편집.
 * 학생 화면에서는 RichText 가 마크다운을 렌더하지만, 에디터 안에서는 토큰이 그대로 보여야 편집 가능.
 *
 * value: 부모가 들고 있는 텍스트
 * onChange(text): blur/input 시 호출
 * placeholder: 비어 있을 때 표시할 안내
 * multiline: false 면 Enter 차단
 */
export default function InlineEditable({
  value,
  onChange,
  placeholder = "",
  multiline = true,
  className = "",
  style = {},
  as: Tag = "div",
  ...rest
}) {
  const ref = useRef(null);
  const isFocusedRef = useRef(false);

  // 외부 value 변화 시 (다른 데서 update) — 포커스 중엔 덮어쓰지 않음
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (!isFocusedRef.current && el.textContent !== (value || "")) {
      el.textContent = value || "";
    }
  }, [value]);

  const handleInput = (e) => {
    if (onChange) onChange(e.currentTarget.textContent || "");
  };

  const handleKeyDown = (e) => {
    if (!multiline && e.key === "Enter") {
      e.preventDefault();
      e.currentTarget.blur();
    }
    // Ctrl+B / Ctrl+I / Ctrl+U → 마크다운 토큰 삽입
    if (e.ctrlKey || e.metaKey) {
      const insertWrap = (left, right) => {
        e.preventDefault();
        document.execCommand("insertText", false, left + right);
        // 커서를 토큰 사이로 이동 (간이 — 항상 끝에 추가됨)
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
          const range = sel.getRangeAt(0);
          range.setStart(range.endContainer, range.endOffset - right.length);
          range.setEnd(range.endContainer, range.endOffset);
          // 커서 이동 표시
        }
      };
      if (e.key === "b") insertWrap("**", "**");
      else if (e.key === "i") insertWrap("*", "*");
      else if (e.key === "u") insertWrap("<u>", "</u>");
      else if (e.key === "h") insertWrap("==", "==");
    }
  };

  return (
    <Tag
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      className={`ie-editable ${!value ? "is-empty" : ""} ${className}`}
      data-placeholder={placeholder}
      onFocus={() => { isFocusedRef.current = true; }}
      onBlur={(e) => {
        isFocusedRef.current = false;
        if (onChange) onChange(e.currentTarget.textContent || "");
      }}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      style={{ whiteSpace: "pre-wrap", wordBreak: "keep-all", overflowWrap: "anywhere", outline: "none", ...style }}
      {...rest}
    />
  );
}
