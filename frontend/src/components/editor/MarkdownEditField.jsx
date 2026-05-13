import { useRef, useState, useLayoutEffect } from "react";
import ReactMarkdown from "react-markdown";
import FileImage from "../FileImage";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { uploadFile, fileDownloadUrl } from "../../utils/fileUpload";
import { handleTextareaShortcut } from "./markdownShortcuts";

/**
 * 지문/본문용 마크다운 에디터.
 *
 * 기능:
 *  - textarea 자동 높이
 *  - 툴바: 굵게(B) / 기울임(I) / 밑줄(U) / 이미지 삽입
 *  - 이미지 업로드 → ![](url) 자동 삽입
 *  - 라이브 미리보기 토글 (편집 / 미리보기 분리 또는 동시)
 *
 * 데이터: 마크다운 텍스트(string). 학생 화면도 동일 마크다운을 ReactMarkdown 으로 렌더링.
 *
 * props:
 *  - value (string)
 *  - onChange(text)
 *  - placeholder
 *  - minHeight
 */
export default function MarkdownEditField({ value, onChange, placeholder, minHeight = 120 }) {
  const taRef = useRef(null);
  const fileInputRef = useRef(null);
  const [previewMode, setPreviewMode] = useState("split"); // "edit" | "split" | "preview"
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  // 자동 높이
  useLayoutEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.max(minHeight, el.scrollHeight)}px`;
  }, [value, minHeight]);

  // 선택 영역에 prefix/suffix 감싸기 (없으면 placeholder 텍스트 삽입)
  const wrapSelection = (prefix, suffix = prefix, fallback = "") => {
    const el = taRef.current;
    if (!el) return;
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const text = value || "";
    const sel = text.slice(start, end);
    const inner = sel || fallback;
    const next = text.slice(0, start) + prefix + inner + suffix + text.slice(end);
    onChange(next);
    // 커서 위치 복원
    requestAnimationFrame(() => {
      try {
        el.focus();
        const cursor = start + prefix.length + inner.length;
        el.setSelectionRange(sel ? start + prefix.length : cursor, sel ? end + prefix.length : cursor);
      } catch { /* ignore */ }
    });
  };

  // 정렬 — 선택 영역 또는 현재 줄을 <div style="text-align:X">로 감쌈
  // 마크다운 단락 구분을 위해 앞뒤 빈 줄 보장
  const setAlign = (align) => {
    const el = taRef.current;
    if (!el) return;
    const text = value || "";
    let start = el.selectionStart ?? 0;
    let end = el.selectionEnd ?? 0;
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
    let replacement;
    if (m) {
      replacement = `<div style="text-align: ${align};">${m[2]}</div>`;
    } else {
      replacement = `<div style="text-align: ${align};">${inner}</div>`;
    }
    // 앞뒤 빈 줄 보장 (마크다운 단락 분리)
    const before = text.slice(0, start);
    const after = text.slice(end);
    const needLeadingBlank = before.length > 0 && !/\n\n$/.test(before) && !/^\s*$/.test(before);
    const needTrailingBlank = after.length > 0 && !/^\n\n/.test(after) && !/^\s*$/.test(after);
    const next = before + (needLeadingBlank ? "\n\n" : "") + replacement + (needTrailingBlank ? "\n\n" : "") + after;
    onChange(next);
    requestAnimationFrame(() => {
      try {
        el.focus();
        const newStart = before.length + (needLeadingBlank ? 2 : 0);
        const newEnd = newStart + replacement.length;
        el.setSelectionRange(newStart, newEnd);
      } catch { /* ignore */ }
    });
  };

  // 커서 위치에 텍스트 삽입
  const insertAtCursor = (insertion) => {
    const el = taRef.current;
    const text = value || "";
    if (!el) {
      onChange(text + insertion);
      return;
    }
    const start = el.selectionStart ?? text.length;
    const end = el.selectionEnd ?? start;
    const next = text.slice(0, start) + insertion + text.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      try {
        el.focus();
        const pos = start + insertion.length;
        el.setSelectionRange(pos, pos);
      } catch { /* ignore */ }
    });
  };

  const handleImageFile = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드 가능합니다.");
      return;
    }
    setUploading(true);
    setProgress(0);
    try {
      const result = await uploadFile(file, {
        purpose: "content",
        onProgress: (loaded, total) => setProgress(total > 0 ? Math.round((loaded / total) * 100) : 0),
      });
      const url = result.downloadUrl || fileDownloadUrl(result.fileId);
      const alt = (result.originalName || "image").replace(/\.[^.]+$/, "");
      // 줄 시작에 삽입되도록 앞뒤 줄바꿈 보장
      insertAtCursor(`\n\n![${alt}](${url})\n\n`);
    } catch (e) {
      alert("이미지 업로드 실패: " + (e.message || ""));
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  const isEdit = previewMode !== "preview";
  const isPreview = previewMode !== "edit";

  return (
    <div style={{
      border: "1px solid var(--stroke)", borderRadius: 6,
      background: "var(--panel)", overflow: "hidden",
    }}>
      {/* 툴바 */}
      <div style={{
        display: "flex", gap: 4, padding: 6,
        background: "var(--bg)", borderBottom: "1px solid var(--stroke)",
        flexWrap: "wrap",
      }}>
        <ToolButton onClick={() => wrapSelection("**", "**", "굵게")} title="굵게 (Ctrl+B)"><b>B</b></ToolButton>
        <ToolButton onClick={() => wrapSelection("*", "*", "기울임")} title="기울임 (Ctrl+I)"><i>I</i></ToolButton>
        <ToolButton onClick={() => wrapSelection("<u>", "</u>", "밑줄")} title="밑줄"><u>U</u></ToolButton>
        <span style={{ width: 1, background: "var(--stroke)", margin: "0 4px" }} />
        <ToolButton onClick={() => setAlign("left")} title="좌측 정렬">⬅</ToolButton>
        <ToolButton onClick={() => setAlign("center")} title="가운데 정렬">⬌</ToolButton>
        <ToolButton onClick={() => setAlign("right")} title="우측 정렬">➡</ToolButton>
        <ToolButton onClick={() => setAlign("justify")} title="양쪽 정렬">⬍</ToolButton>
        <span style={{ width: 1, background: "var(--stroke)", margin: "0 4px" }} />
        <ToolButton onClick={() => wrapSelection("# ", "", "제목")} title="큰 제목">H1</ToolButton>
        <ToolButton onClick={() => wrapSelection("## ", "", "제목")} title="중간 제목">H2</ToolButton>
        <ToolButton onClick={() => wrapSelection("> ", "", "인용")} title="인용">❝</ToolButton>
        <ToolButton onClick={() => wrapSelection("- ", "", "목록")} title="목록">•</ToolButton>
        <span style={{ width: 1, background: "var(--stroke)", margin: "0 4px" }} />
        <ToolButton onClick={() => insertAtCursor("<br>\n")} title="줄바꿈 (같은 단락 내)">↵</ToolButton>
        <ToolButton onClick={() => insertAtCursor("\n\n")} title="새 단락 (빈 줄)">¶</ToolButton>
        <span style={{ width: 1, background: "var(--stroke)", margin: "0 4px" }} />
        <ToolButton
          onClick={() => fileInputRef.current?.click()}
          title="이미지 삽입"
          disabled={uploading}
        >{uploading ? `📷 ${progress}%` : "🖼️ 이미지"}</ToolButton>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: "none" }}
          onChange={(e) => { handleImageFile(e.target.files?.[0]); e.target.value = ""; }}
        />
        <span style={{ flex: 1 }} />
        <select
          value={previewMode}
          onChange={(e) => setPreviewMode(e.target.value)}
          style={{
            padding: "2px 6px", fontSize: 11,
            background: "var(--bg)", color: "var(--text)",
            border: "1px solid var(--stroke)", borderRadius: 4,
          }}
          title="보기 모드"
        >
          <option value="edit">편집만</option>
          <option value="split">편집+미리보기</option>
          <option value="preview">미리보기만</option>
        </select>
      </div>

      <div style={{ display: "flex", gap: 0, minHeight }}>
        {isEdit && (
          <textarea
            ref={taRef}
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder || "지문 본문 (마크다운). 이미지는 툴바의 [🖼️ 이미지]로 업로드)"}
            onKeyDown={(e) => handleTextareaShortcut(e, { value: value || "", setValue: onChange })}
            style={{
              flex: 1, padding: 12, fontSize: 13, lineHeight: 1.7,
              background: "var(--bg)", color: "var(--text)",
              border: 0, outline: "none", resize: "none", overflow: "hidden",
              minHeight,
              borderRight: isPreview ? "1px solid var(--stroke)" : 0,
              fontFamily: "inherit",
            }}
          />
        )}
        {isPreview && (
          <div style={{
            flex: 1, padding: 12, fontSize: 13, lineHeight: 1.7,
            color: "var(--text)", overflow: "auto",
            minHeight,
          }}>
            {value ? (
              <MarkdownPreview value={value} />
            ) : (
              <div style={{ color: "var(--muted)", fontStyle: "italic" }}>(미리보기 — 내용을 입력하세요)</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function MarkdownPreview({ value }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        img: ({ node, src, alt, ...props }) => {
          // /v1/files/{id}/download URL 은 token 헤더 필요 → FileImage 로 wrap.
          if (typeof src === "string") {
            const m = src.match(/\/v1\/files\/([A-Za-z0-9_-]+)\/download/);
            if (m) return <FileImage fileId={m[1]} alt={alt} style={{ maxWidth: "100%", maxHeight: 400, borderRadius: 4, margin: "8px 0" }} />;
          }
          return <img {...props} src={src} alt={alt || ""} style={{ maxWidth: "100%", maxHeight: 400, borderRadius: 4, margin: "8px 0" }} />;
        },
      }}
    >{value}</ReactMarkdown>
  );
}

function ToolButton({ onClick, title, disabled, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      style={{
        padding: "3px 8px", fontSize: 12, cursor: disabled ? "wait" : "pointer",
        background: "transparent", color: "var(--text)",
        border: "1px solid var(--stroke)", borderRadius: 4,
        minWidth: 28,
      }}
    >{children}</button>
  );
}
