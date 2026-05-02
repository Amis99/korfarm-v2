import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Underline } from "@tiptap/extension-underline";
import { TextAlign } from "@tiptap/extension-text-align";
import { Image } from "@tiptap/extension-image";
import { TextStyle, Color, FontFamily } from "@tiptap/extension-text-style";
import { Table, TableRow, TableHeader, TableCell } from "@tiptap/extension-table";
import { useEffect, useRef } from "react";
import { apiPost } from "../../utils/adminApi";
import { apiUploadFile, API_BASE, TOKEN_KEY } from "../../utils/api";
import "../../styles/word-editor.css";

/**
 * 시험지 워드프로세서 — TipTap 기반.
 * 밑줄·정렬·폰트·색상·표·이미지·시험지 스타일·2단 구성 등 자유 편집.
 *
 * Props:
 *   html        초기 HTML
 *   onChange    HTML 변경 콜백 (debounce 는 부모에서)
 */
export default function TestPaperWordEditor({ html, onChange }) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      Underline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Image.configure({ allowBase64: false }),
      TextStyle,
      Color,
      FontFamily,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: html || "",
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  // 외부에서 html 이 바뀌면 (자동 채우기 등) 에디터에 반영
  const lastExternalRef = useRef("");
  useEffect(() => {
    if (!editor) return;
    if (html === undefined || html === null) return;
    if (html === lastExternalRef.current) return;
    if (html === editor.getHTML()) return;
    editor.commands.setContent(html, false);
    lastExternalRef.current = html;
  }, [editor, html]);

  if (!editor) {
    return <div style={{ padding: 30, textAlign: "center" }}>에디터 로딩 중...</div>;
  }

  return (
    <div className="twe-root">
      <Toolbar editor={editor} />
      <div className="twe-paper">
        <EditorContent editor={editor} className="twe-editor-content" />
      </div>
    </div>
  );
}

function Toolbar({ editor }) {
  if (!editor) return null;

  const TB_BTN = (active) => ({
    padding: "4px 8px", fontSize: 12,
    background: active ? "#2d6a4f" : "#fff",
    color: active ? "#fff" : "#333",
    border: "1px solid rgba(31,58,44,0.18)",
    borderRadius: 4,
    cursor: "pointer",
  });

  // 이미지 업로드
  const fileInputRef = useRef(null);
  const onImagePick = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const presign = await apiPost("/v1/files/presign", {
        purpose: "test_paper",
        filename: file.name,
        mime: file.type,
        size: file.size,
      });
      const fileId = presign?.fileId;
      if (fileId) {
        await apiUploadFile(fileId, file);
        const token = sessionStorage.getItem(TOKEN_KEY);
        const url = `${API_BASE}/v1/files/${fileId}/download${token ? `?token=${token}` : ""}`;
        editor.chain().focus().setImage({ src: url, alt: file.name }).run();
      }
    } catch (err) {
      alert("이미지 업로드 실패: " + (err?.message || ""));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // 시험지 스타일 — 선택 영역에 div class 부여 (또는 wrap)
  const applyStyleClass = (cls) => {
    // 현재 paragraph 에 .tp-* class 부여 (TipTap 의 attribute set)
    editor.chain().focus().toggleNode("paragraph", "paragraph", { class: cls }).run();
  };

  // 2단 토글 (CSS class 적용)
  const toggle2Col = () => {
    const html = editor.getHTML();
    if (html.includes("tp-cols-2")) {
      editor.commands.setContent(html.replace(/<div class="tp-cols-2">([\s\S]*?)<\/div>/, "$1"));
    } else {
      editor.commands.setContent(`<div class="tp-cols-2">${html}</div>`);
    }
  };

  // 폰트
  const FONTS = [
    { label: "Noto Sans CJK", value: '"Noto Sans CJK KR", "Noto Sans KR", sans-serif' },
    { label: "함초롬바탕(옛한글)", value: '"HCR Batang", "함초롬바탕", serif' },
    { label: "본명조", value: '"Source Han Serif", "Noto Serif CJK KR", serif' },
    { label: "맑은 고딕", value: '"Malgun Gothic", "맑은 고딕", sans-serif' },
  ];

  return (
    <div className="twe-toolbar">
      {/* 폰트 */}
      <select
        className="twe-tb-select"
        onChange={(e) => editor.chain().focus().setFontFamily(e.target.value).run()}
        defaultValue=""
      >
        <option value="">폰트</option>
        {FONTS.map((f) => (
          <option key={f.value} value={f.value}>{f.label}</option>
        ))}
      </select>

      {/* 글자 크기 (heading level) */}
      <select
        className="twe-tb-select"
        value={
          editor.isActive("heading", { level: 1 }) ? "h1"
          : editor.isActive("heading", { level: 2 }) ? "h2"
          : editor.isActive("heading", { level: 3 }) ? "h3"
          : "p"
        }
        onChange={(e) => {
          const v = e.target.value;
          if (v === "p") editor.chain().focus().setParagraph().run();
          else editor.chain().focus().toggleHeading({ level: parseInt(v[1], 10) }).run();
        }}
      >
        <option value="p">본문</option>
        <option value="h1">제목 1</option>
        <option value="h2">제목 2</option>
        <option value="h3">제목 3</option>
      </select>

      <div className="twe-tb-divider" />

      {/* 굵게/이탤릭/밑줄/취소선 */}
      <button style={TB_BTN(editor.isActive("bold"))}
        onClick={() => editor.chain().focus().toggleBold().run()} title="굵게"><b>B</b></button>
      <button style={TB_BTN(editor.isActive("italic"))}
        onClick={() => editor.chain().focus().toggleItalic().run()} title="이탤릭"><i>I</i></button>
      <button style={TB_BTN(editor.isActive("underline"))}
        onClick={() => editor.chain().focus().toggleUnderline().run()} title="밑줄"><u>U</u></button>
      <button style={TB_BTN(editor.isActive("strike"))}
        onClick={() => editor.chain().focus().toggleStrike().run()} title="취소선"><s>S</s></button>

      {/* 색상 */}
      <input
        type="color"
        title="글자색"
        onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
        style={{ width: 28, height: 26, border: "1px solid rgba(31,58,44,0.18)", borderRadius: 4 }}
      />

      <div className="twe-tb-divider" />

      {/* 정렬 */}
      <button style={TB_BTN(editor.isActive({ textAlign: "left" }))}
        onClick={() => editor.chain().focus().setTextAlign("left").run()} title="좌측">⇤</button>
      <button style={TB_BTN(editor.isActive({ textAlign: "center" }))}
        onClick={() => editor.chain().focus().setTextAlign("center").run()} title="가운데">⇔</button>
      <button style={TB_BTN(editor.isActive({ textAlign: "right" }))}
        onClick={() => editor.chain().focus().setTextAlign("right").run()} title="우측">⇥</button>
      <button style={TB_BTN(editor.isActive({ textAlign: "justify" }))}
        onClick={() => editor.chain().focus().setTextAlign("justify").run()} title="양측">≡</button>

      <div className="twe-tb-divider" />

      {/* 리스트/인용 */}
      <button style={TB_BTN(editor.isActive("bulletList"))}
        onClick={() => editor.chain().focus().toggleBulletList().run()} title="• 목록">•</button>
      <button style={TB_BTN(editor.isActive("orderedList"))}
        onClick={() => editor.chain().focus().toggleOrderedList().run()} title="1. 목록">1.</button>
      <button style={TB_BTN(editor.isActive("blockquote"))}
        onClick={() => editor.chain().focus().toggleBlockquote().run()} title="인용">”</button>

      <div className="twe-tb-divider" />

      {/* 시험지 스타일 */}
      <button style={TB_BTN(false)} onClick={() => applyStyleClass("tp-passage")} title="지문">[지문]</button>
      <button style={TB_BTN(false)} onClick={() => applyStyleClass("tp-question")} title="문제">[문제]</button>
      <button style={TB_BTN(false)} onClick={() => applyStyleClass("tp-box")} title="박스">[박스]</button>
      <button style={TB_BTN(false)} onClick={() => applyStyleClass("tp-answer")} title="정답">[정답]</button>
      <button style={TB_BTN(false)} onClick={() => applyStyleClass("tp-explanation")} title="해설">[해설]</button>

      <div className="twe-tb-divider" />

      {/* 2단 토글 */}
      <button style={TB_BTN(false)} onClick={toggle2Col} title="2단/1단 토글">2단</button>

      {/* 이미지 / 표 */}
      <button style={TB_BTN(false)} onClick={() => fileInputRef.current?.click()} title="이미지">🖼️</button>
      <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={onImagePick} />
      <button style={TB_BTN(false)}
        onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
        title="표">⊞</button>

      {/* 페이지 분할 */}
      <button style={TB_BTN(false)}
        onClick={() => editor.chain().focus().insertContent('<div class="tp-page-break"></div><p></p>').run()}
        title="페이지 분할">↩페이지</button>
    </div>
  );
}
