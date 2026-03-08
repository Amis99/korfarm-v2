import { useState, useCallback } from "react";
import { useContentEditor } from "../../hooks/useContentEditor";
import ReadingPreview from "./preview/ReadingPreview";
import WorksheetPreview from "./preview/WorksheetPreview";
import AnswerKeyPreview from "./preview/AnswerKeyPreview";
import ChoiceJudgementPreview from "./preview/ChoiceJudgementPreview";
import PhonemeChangePreview from "./preview/PhonemeChangePreview";
import WordFormationPreview from "./preview/WordFormationPreview";
import SentenceStructurePreview from "./preview/SentenceStructurePreview";
import ContentPdfPreview from "./preview/ContentPdfPreview";
import ReadingForm from "./form/ReadingForm";
import WorksheetForm from "./form/WorksheetForm";
import AnswerKeyForm from "./form/AnswerKeyForm";
import ChoiceJudgementForm from "./form/ChoiceJudgementForm";
import PhonemeChangeForm from "./form/PhonemeChangeForm";
import WordFormationForm from "./form/WordFormationForm";
import SentenceStructureForm from "./form/SentenceStructureForm";
import ContentPdfForm from "./form/ContentPdfForm";
import "../../styles/content-editor.css";

const TYPE_LABEL = {
  PRO_READING: "독해 훈련",
  PRO_BACKGROUND: "배경지식",
  PRO_VOCAB: "어휘",
  PRO_LOGIC: "추론",
  PRO_ANSWER: "모범답안",
  PRO_TEST: "테스트",
  CHOICE_JUDGEMENT: "선택지 판별",
  GRAMMAR_PHONEME_CHANGE: "음운 변동",
  GRAMMAR_WORD_FORMATION: "단어 형성",
  GRAMMAR_SENTENCE_STRUCTURE: "문장 짜임",
  CONTENT_PDF: "내용 숙지",
  CONTENT_PDF_QUIZ: "내용 숙지",
};

/* contentType → 에디터 유형 매핑 */
function resolveEditorType(ct) {
  if (!ct) return "worksheet";
  const up = ct.toUpperCase();
  if (up === "PRO_READING" || up.includes("READING_TRAINING")) return "reading";
  if (up === "PRO_ANSWER" || up.includes("ANSWER_KEY")) return "answer";
  if (up === "CHOICE_JUDGEMENT" || up.includes("CHOICE_JUDGEMENT")) return "choice";
  if (up === "GRAMMAR_PHONEME_CHANGE" || up.includes("PHONEME_CHANGE")) return "phoneme";
  if (up === "GRAMMAR_WORD_FORMATION" || up.includes("WORD_FORMATION")) return "wordformation";
  if (up === "GRAMMAR_SENTENCE_STRUCTURE" || up.includes("SENTENCE_STRUCTURE")) return "sentence";
  if (up === "CONTENT_PDF" || up === "CONTENT_PDF_QUIZ" || up.includes("CONTENT_PDF")) return "contentpdf";
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
          {editorType === "choice" && (
            <ChoiceJudgementPreview content={content} onClickPath={handlePreviewClick} focusPath={focusPath} />
          )}
          {editorType === "phoneme" && (
            <PhonemeChangePreview content={content} onClickPath={handlePreviewClick} focusPath={focusPath} />
          )}
          {editorType === "wordformation" && (
            <WordFormationPreview content={content} onClickPath={handlePreviewClick} focusPath={focusPath} />
          )}
          {editorType === "sentence" && (
            <SentenceStructurePreview content={content} onClickPath={handlePreviewClick} focusPath={focusPath} />
          )}
          {editorType === "contentpdf" && (
            <ContentPdfPreview content={content} onClickPath={handlePreviewClick} focusPath={focusPath} />
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
          {editorType === "choice" && (
            <ChoiceJudgementForm editor={editor} focusPath={focusPath} setFocusPath={setFocusPath} />
          )}
          {editorType === "phoneme" && (
            <PhonemeChangeForm editor={editor} focusPath={focusPath} setFocusPath={setFocusPath} />
          )}
          {editorType === "wordformation" && (
            <WordFormationForm editor={editor} focusPath={focusPath} setFocusPath={setFocusPath} />
          )}
          {editorType === "sentence" && (
            <SentenceStructureForm editor={editor} focusPath={focusPath} setFocusPath={setFocusPath} />
          )}
          {editorType === "contentpdf" && (
            <ContentPdfForm editor={editor} focusPath={focusPath} setFocusPath={setFocusPath} />
          )}
        </div>
      </div>
    </div>
  );
}
