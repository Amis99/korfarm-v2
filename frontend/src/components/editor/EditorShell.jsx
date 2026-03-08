import { useState, useCallback } from "react";
import { useContentEditor } from "../../hooks/useContentEditor";
import ReadingPreview from "./preview/ReadingPreview";
import WorksheetPreview from "./preview/WorksheetPreview";
import AnswerKeyPreview from "./preview/AnswerKeyPreview";
import ReadingForm from "./form/ReadingForm";
import WorksheetForm from "./form/WorksheetForm";
import AnswerKeyForm from "./form/AnswerKeyForm";
import "../../styles/content-editor.css";

const TYPE_LABEL = {
  PRO_READING: "독해 훈련",
  PRO_BACKGROUND: "배경지식",
  PRO_VOCAB: "어휘",
  PRO_LOGIC: "추론",
  PRO_ANSWER: "모범답안",
  PRO_TEST: "테스트",
};

/* contentType → 에디터 유형 매핑 */
function resolveEditorType(ct) {
  if (!ct) return "worksheet";
  const up = ct.toUpperCase();
  if (up === "PRO_READING" || up.includes("READING_TRAINING")) return "reading";
  if (up === "PRO_ANSWER" || up.includes("ANSWER_KEY")) return "answer";
  return "worksheet";
}

export default function EditorShell({ contentId }) {
  const editor = useContentEditor(contentId);
  const { meta, content, loading, error, saving, dirty, saveMsg, canUndo } = editor;

  /* 미리보기↔폼 연동: focusPath */
  const [focusPath, setFocusPath] = useState(null);

  const handlePreviewClick = useCallback((path) => {
    setFocusPath(path);
    /* 폼 쪽에서 해당 경로 요소로 스크롤 */
    setTimeout(() => {
      const el = document.querySelector(`[data-field-path="${path}"]`);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }, []);

  if (loading) return <div className="ce-status">불러오는 중...</div>;
  if (error && !content) return <div className="ce-status error">{error}</div>;

  const editorType = resolveEditorType(meta?.contentType);
  const typeLabel = TYPE_LABEL[meta?.contentType?.toUpperCase()] || meta?.contentType || "";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 60px)" }}>
      {/* 툴바 */}
      <div className="ce-toolbar">
        <div className="ce-toolbar-title">
          <strong>{meta?.title || contentId}</strong>
          <span className="ce-toolbar-badge">{typeLabel}</span>
          {dirty && <span className="ce-toolbar-badge dirty">변경됨</span>}
        </div>
        {saveMsg && <span className="ce-save-msg">{saveMsg}</span>}
        {error && <span style={{ color: "#ff6b6b", fontSize: 12 }}>{error}</span>}
        <button
          className="ce-btn ce-btn-secondary"
          disabled={!canUndo}
          onClick={editor.undo}
          title="실행 취소"
        >
          ↩ 취소
        </button>
        <button
          className="ce-btn ce-btn-secondary"
          disabled={!dirty}
          onClick={editor.revert}
          title="원본으로 되돌리기"
        >
          되돌리기
        </button>
        <button
          className="ce-btn ce-btn-primary"
          disabled={!dirty || saving}
          onClick={editor.save}
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>

      {/* 좌우 분할 */}
      <div className="ce-split">
        <div className="ce-preview-pane">
          <div className="ce-preview-label">미리보기</div>
          {editorType === "reading" && (
            <ReadingPreview content={content} onClickPath={handlePreviewClick} focusPath={focusPath} />
          )}
          {editorType === "worksheet" && (
            <WorksheetPreview content={content} onClickPath={handlePreviewClick} focusPath={focusPath} />
          )}
          {editorType === "answer" && (
            <AnswerKeyPreview content={content} onClickPath={handlePreviewClick} focusPath={focusPath} />
          )}
        </div>
        <div className="ce-form-pane">
          {editorType === "reading" && (
            <ReadingForm editor={editor} focusPath={focusPath} setFocusPath={setFocusPath} />
          )}
          {editorType === "worksheet" && (
            <WorksheetForm editor={editor} focusPath={focusPath} setFocusPath={setFocusPath} />
          )}
          {editorType === "answer" && (
            <AnswerKeyForm editor={editor} focusPath={focusPath} setFocusPath={setFocusPath} />
          )}
        </div>
      </div>
    </div>
  );
}
