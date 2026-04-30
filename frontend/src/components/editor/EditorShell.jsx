import { useState, useCallback, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useContentEditor } from "../../hooks/useContentEditor";
import { AREA_LABELS, SUB_AREA_LABELS } from "../../constants/questionBankCodes";
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
import BackgroundPreview from "./preview/BackgroundPreview";
import BackgroundForm from "./form/BackgroundForm";
import DailyQuizDocEditor from "./dailyquiz/DailyQuizDocEditor";
import DailyReadingDocEditor from "./dailyreading/DailyReadingDocEditor";
import BackgroundDocEditor from "./background/BackgroundDocEditor";
import VocabDocEditor from "./vocab/VocabDocEditor";
import PhonemeChangeDocEditor from "./grammar/PhonemeChangeDocEditor";
import WordFormationDocEditor from "./grammar/WordFormationDocEditor";
import SentenceStructureDocEditor from "./grammar/SentenceStructureDocEditor";
import MorphemeAnalysisDocEditor from "./grammar/MorphemeAnalysisDocEditor";
import { resolveModuleKeyForContentType } from "../../constants/contentTypes";
import "../../styles/content-editor.css";
import "../../styles/dailyquiz-doc-editor.css";
import "../../styles/dailyreading-doc-editor.css";
import "../../styles/background-doc-editor.css";
import "../../styles/grammar-doc-editor.css";

const TYPE_LABEL = {
  PRO_READING: "독해 훈련",
  PRO_BACKGROUND: "배경지식",
  BACKGROUND_KNOWLEDGE: "배경지식",
  BACKGROUND_KNOWLEDGE_QUIZ: "배경지식",
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
  READING_NONFICTION: "독해 훈련",
  READING_LITERATURE: "독해 훈련 (문학)",
  READING_TRAINING: "독해 훈련",
  DAILY_READING: "독해 훈련",
  VOCAB_BASIC: "어휘 학습",
  BACKGROUND_KNOWLEDGE_QUIZ: "배경지식 퀴즈",
};

/* contentType (string OR array) → 에디터 유형 매핑.
   array면 각 카테고리 중 하나라도 match되는 첫 결과 반환. */
function resolveEditorType(ct) {
  if (!ct) return "worksheet";
  const arr = Array.isArray(ct) ? ct : [ct];
  // 우선순위: 워드 프로세서형(daily-quiz / daily-reading / background-doc / vocab-doc / grammar) > reading 좌우 분할 > 기타.
  for (const v of arr) {
    if (typeof v !== "string") continue;
    const up = v.toUpperCase();
    // 일일퀴즈 + 동일 패턴 (선택지 분석)
    if (up === "DAILY_QUIZ" || up.includes("DAILY_QUIZ") ||
        up === "CHOICE_ANALYSIS" || up === "CHOICE_JUDGEMENT") return "daily-quiz";
    // 일일독해 + 동일 패턴 (PRO/READING/STORY/CLASSIC)
    if (up === "DAILY_READING" || up.includes("DAILY_READING") ||
        up === "PRO_READING" || up === "READING" || up === "STORY" || up === "CLASSIC" ||
        up === "READING_NONFICTION" || up === "READING_LITERATURE" ||
        up.includes("READING_TRAINING")) return "daily-reading";
    // 배경지식·추론 + 내용 숙지 (사용자 지시: STUDY_CONTENT 는 배경지식 모듈과 거의 동일)
    if (up === "PRO_BACKGROUND" || up === "BACKGROUND" || up === "BACKGROUND_KNOWLEDGE" ||
        up === "BACKGROUND_KNOWLEDGE_QUIZ" || up === "PRO_LOGIC" || up === "LOGIC" ||
        up === "STUDY_CONTENT" || up === "CONTENT_PDF" || up === "CONTENT_PDF_QUIZ" ||
        up.includes("BACKGROUND") || up.includes("LOGIC") || up.includes("CONTENT_PDF")) return "background-doc";
    // 어휘 + 품사 (워크시트 구조 동일, questionKind 만 다름)
    if (up === "PRO_VOCAB" || up === "VOCAB_BASIC" || up === "VOCAB" ||
        up === "GRAMMAR_POS" || up.includes("VOCAB")) return "vocab-doc";
    // 문법 4종 — 워드 프로세서형 (단순 분기)
    if (up.includes("PHONEME_CHANGE")) return "phoneme-doc";
    if (up.includes("WORD_FORMATION")) return "wordformation-doc";
    if (up.includes("SENTENCE_STRUCTURE")) return "sentence-doc";
    if (up.includes("MORPHEME_ANALYSIS") || up.includes("MORPHEME")) return "morpheme-doc";
  }
  for (const v of arr) {
    if (typeof v !== "string") continue;
    const up = v.toUpperCase();
    if (up === "PRO_READING" || up === "DAILY_READING" || up === "READING" ||
        up === "READING_NONFICTION" || up === "READING_LITERATURE" || up === "STORY" || up === "CLASSIC" ||
        up.includes("READING_TRAINING")) return "reading";
    if (up === "PRO_ANSWER" || up.includes("ANSWER_KEY")) return "answer";
    if (up === "CHOICE_ANALYSIS" || up === "CHOICE_JUDGEMENT") return "choice";
    if (up === "GRAMMAR_PHONEME_CHANGE" || up.includes("PHONEME_CHANGE")) return "phoneme";
    if (up === "GRAMMAR_WORD_FORMATION" || up.includes("WORD_FORMATION")) return "wordformation";
    if (up === "GRAMMAR_SENTENCE_STRUCTURE" || up.includes("SENTENCE_STRUCTURE")) return "sentence";
    if (up === "STUDY_CONTENT" || up === "CONTENT_PDF" || up === "CONTENT_PDF_QUIZ" || up.includes("CONTENT_PDF")) return "contentpdf";
  }
  return "worksheet";
}

export default function EditorShell({ contentId, staticInfo }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const backPath = searchParams.get("from") || "/admin/content";
  const initialMode = searchParams.get("mode"); // "json" 이면 JSON 모드로 시작
  const editor = useContentEditor(contentId, staticInfo);
  const { meta, content, loading, error, saving, dirty, metaDirty, saveMsg, canUndo, isStatic } = editor;
  const [metaOpen, setMetaOpen] = useState(false);

  /* 영역 → 세부영역 필터링 (테스트 관리와 동일 정책 — 코드 prefix 매칭) */
  const subAreaOptions = useMemo(() => {
    const area = meta?.area || "";
    if (!area) return Object.entries(SUB_AREA_LABELS);
    return Object.entries(SUB_AREA_LABELS).filter(([code]) => code.startsWith(`${area}_`));
  }, [meta?.area]);

  /* JSON 모드 */
  const [showJson, setShowJson] = useState(initialMode === "json");
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState("");
  /* JSON 텍스트가 content와 일치하지 않을 때 true (적용 안 누른 상태) */
  const [jsonDirty, setJsonDirty] = useState(false);

  /* JSON 모드 진입 시 현재 content를 텍스트로 변환 */
  const handleToggleJson = useCallback(() => {
    if (!showJson && content) {
      setJsonText(JSON.stringify(content, null, 2));
      setJsonError("");
      setJsonDirty(false);
    }
    setShowJson((v) => !v);
  }, [showJson, content]);

  /* DAILY_QUIZ 등 json-only 타입 OR ?mode=json 진입 시 자동으로 JSON 모드 강제 */
  const editorTypeEarly = resolveEditorType(meta?.contentType);
  const isJsonOnly = editorTypeEarly === "json-only";
  const shouldStartJson = isJsonOnly || initialMode === "json";
  useEffect(() => {
    if (shouldStartJson && content && !showJson) {
      setJsonText(JSON.stringify(content, null, 2));
      setJsonError("");
      setJsonDirty(false);
      setShowJson(true);
    } else if (shouldStartJson && content && showJson && !jsonText) {
      // mode=json으로 진입했지만 content가 늦게 로드되는 경우
      setJsonText(JSON.stringify(content, null, 2));
      setJsonDirty(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldStartJson, content]);

  /* JSON 텍스트 변경 */
  const handleJsonChange = useCallback((e) => {
    const text = e.target.value;
    setJsonText(text);
    setJsonDirty(true);
    try {
      JSON.parse(text);
      setJsonError("");
    } catch (err) {
      setJsonError("JSON 파싱 오류: " + err.message);
    }
  }, []);

  /* JSON 적용 */
  const handleApplyJson = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonText);
      editor.setContentDirect(parsed);
      setJsonError("");
      setJsonDirty(false);
      // json-only 모드가 아니면 비주얼로 복귀
      if (!isJsonOnly) setShowJson(false);
    } catch (err) {
      setJsonError("JSON 파싱 오류: " + err.message);
    }
  }, [jsonText, editor, isJsonOnly]);

  /* 저장 가드: JSON 모드에서 적용 안 누른 경우 경고 */
  const handleSaveGuarded = useCallback(async () => {
    if (showJson && jsonDirty) {
      const ok = window.confirm(
        "JSON 텍스트를 수정했지만 'JSON 적용'을 누르지 않았습니다.\n\n[확인] = JSON을 먼저 적용한 뒤 저장\n[취소] = 적용 없이 종료 (수정 내용 무시됨)"
      );
      if (!ok) return;
      // 적용 시도
      try {
        const parsed = JSON.parse(jsonText);
        editor.setContentDirect(parsed);
        setJsonDirty(false);
        // setContentDirect는 상태 갱신이므로 다음 render 후 save
        setTimeout(() => editor.save(), 50);
        return;
      } catch (err) {
        setJsonError("JSON 파싱 오류: " + err.message);
        return;
      }
    }
    editor.save();
  }, [showJson, jsonDirty, jsonText, editor]);

  /* 목록으로 돌아가기 */
  const handleBack = useCallback(() => {
    if (dirty && !window.confirm("변경사항이 저장되지 않았습니다. 목록으로 이동하시겠습니까?")) return;
    navigate(backPath);
  }, [dirty, navigate, backPath]);

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
  const isDailyQuiz = editorType === "daily-quiz";
  const isDailyReading = editorType === "daily-reading";
  const isBackgroundDoc = editorType === "background-doc";
  const isVocabDoc = editorType === "vocab-doc";
  const isPhonemeDoc = editorType === "phoneme-doc";
  const isWordformationDoc = editorType === "wordformation-doc";
  const isSentenceDoc = editorType === "sentence-doc";
  const isMorphemeDoc = editorType === "morpheme-doc";
  const isGrammarDoc = isPhonemeDoc || isWordformationDoc || isSentenceDoc || isMorphemeDoc;
  const isDocEditor = isDailyQuiz || isDailyReading || isBackgroundDoc || isVocabDoc || isGrammarDoc;
  // contentType이 array면 라벨도 배열 처리 — " · "로 join
  const ctArrayDisplay = Array.isArray(meta?.contentType)
    ? meta.contentType
    : (meta?.contentType ? [meta.contentType] : []);
  const typeLabel = ctArrayDisplay.map((c) => TYPE_LABEL[c] || c).join(" · ") || "";

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 60px)" }}>
      {/* 툴바 */}
      <div className="ce-toolbar">
        <button className="ce-back-btn" onClick={handleBack} title="콘텐츠 목록으로">
          ← 목록
        </button>
        <div className="ce-toolbar-title" style={{ display: "flex", alignItems: "center", gap: 8, flex: 1, minWidth: 0 }}>
          <input
            type="text"
            value={meta?.title || ""}
            onChange={(e) => editor.updateMeta("title", e.target.value)}
            disabled={isStatic}
            placeholder={contentId}
            title="학습 제목 (수정 가능)"
            style={{
              flex: 1,
              minWidth: 120,
              maxWidth: 480,
              padding: "6px 10px",
              fontSize: 14,
              fontWeight: 700,
              background: "#0f1714",
              color: "#e8efe9",
              border: "1px solid #2a3a30",
              borderRadius: 6,
              outline: "none",
            }}
            onFocus={(e) => (e.target.style.borderColor = "#5fa97a")}
            onBlur={(e) => (e.target.style.borderColor = "#2a3a30")}
          />
          <span className="ce-toolbar-badge">{typeLabel}</span>
          {dirty && <span className="ce-toolbar-badge dirty">변경됨</span>}
        </div>
        {saveMsg && <span className="ce-save-msg">{saveMsg}</span>}
        {error && <span style={{ color: "#ff6b6b", fontSize: 12 }}>{error}</span>}
        <button
          className={`ce-btn ${showJson ? "ce-btn-primary" : "ce-btn-secondary"}`}
          onClick={handleToggleJson}
          disabled={isJsonOnly}
          title={isJsonOnly ? "DAILY_QUIZ는 JSON 전용 모드입니다" : "JSON 직접 편집"}
          style={{ fontFamily: "monospace", fontWeight: 700 }}
        >
          {"{ }"}
        </button>
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
          disabled={(!dirty && !jsonDirty) || saving}
          onClick={handleSaveGuarded}
        >
          {saving ? "저장 중..." : "저장"}
        </button>
      </div>

      {/* 메타데이터 편집 패널 */}
      {meta && (
        <div className="ce-meta-panel">
          <button className="ce-meta-toggle" onClick={() => setMetaOpen((v) => !v)}>
            <span className={`arrow ${metaOpen ? "open" : ""}`}>▸</span>
            메타데이터
            {metaDirty && <span className="ce-meta-dirty-badge">변경됨</span>}
          </button>
          {metaOpen && (
            <div className="ce-meta-grid">
              <div className="ce-meta-field">
                <label>콘텐츠 유형 (contentType array)</label>
                <div className="ce-meta-readonly">
                  {Array.isArray(meta.contentType)
                    ? (meta.contentType.length > 0 ? meta.contentType.join(", ") : "-")
                    : (meta.contentType || "-")}
                </div>
              </div>
              <div className="ce-meta-field">
                <label>레벨 (levelId)</label>
                <input
                  type="text"
                  value={meta.levelId || ""}
                  onChange={(e) => editor.updateMeta("levelId", e.target.value)}
                  disabled={isStatic}
                  placeholder="level_..."
                />
              </div>
              <div className="ce-meta-field">
                <label>챕터 (chapterId)</label>
                <input
                  type="text"
                  value={meta.chapterId || ""}
                  onChange={(e) => editor.updateMeta("chapterId", e.target.value)}
                  disabled={isStatic}
                  placeholder="chapter_..."
                />
              </div>
              <div className="ce-meta-field">
                <label>영역 (area)</label>
                <select
                  value={meta.area || ""}
                  onChange={(e) => {
                    const newArea = e.target.value;
                    editor.updateMeta("area", newArea);
                    // 영역 변경 시 기존 세부영역이 새 영역에 속하지 않으면 reset
                    const sub = meta.subArea || "";
                    if (sub && !sub.startsWith(`${newArea}_`)) {
                      editor.updateMeta("subArea", "");
                    }
                  }}
                  disabled={isStatic}
                  title="영역 (테스트 관리와 동일 코드 체계)"
                >
                  <option value="">-- 영역 선택 --</option>
                  {Object.entries(AREA_LABELS).map(([code, label]) => (
                    <option key={code} value={code}>{label} ({code})</option>
                  ))}
                  {/* 옛 비표준 값 보존 — 사용자가 새로 선택할 때까지 표시 */}
                  {meta.area && !AREA_LABELS[meta.area] && (
                    <option value={meta.area}>{meta.area} (비표준)</option>
                  )}
                </select>
              </div>
              <div className="ce-meta-field">
                <label>세부 영역 (subArea)</label>
                <select
                  value={meta.subArea || ""}
                  onChange={(e) => editor.updateMeta("subArea", e.target.value)}
                  disabled={isStatic || !meta.area}
                  title={meta.area ? "세부 영역" : "먼저 영역을 선택하세요"}
                >
                  <option value="">{meta.area ? "-- 세부영역 선택 --" : "-- 영역 먼저 선택 --"}</option>
                  {subAreaOptions.map(([code, label]) => (
                    <option key={code} value={code}>{label} ({code})</option>
                  ))}
                  {/* 옛 비표준 값 보존 */}
                  {meta.subArea && !SUB_AREA_LABELS[meta.subArea] && (
                    <option value={meta.subArea}>{meta.subArea} (비표준)</option>
                  )}
                </select>
              </div>
              <div className="ce-meta-field">
                <label>일차 (dayIndex) — 일일퀴즈/일일독해 학생 매칭 키</label>
                <input
                  type="number"
                  value={meta.dayIndex ?? ""}
                  onChange={(e) => editor.updateMeta("dayIndex", e.target.value)}
                  disabled={isStatic}
                  placeholder="1~365"
                  min="1"
                  max="365"
                />
              </div>
              <div className="ce-meta-field">
                <label>모듈 키 (moduleKey)</label>
                <input
                  type="text"
                  value={meta.moduleKey || ""}
                  onChange={(e) => editor.updateMeta("moduleKey", e.target.value)}
                  disabled={isStatic}
                  placeholder="예: background"
                />
              </div>
              <div className="ce-meta-field full-width">
                <label>비디오 URL (videoUrl)</label>
                <input
                  type="text"
                  value={meta.videoUrl || ""}
                  onChange={(e) => editor.updateMeta("videoUrl", e.target.value)}
                  disabled={isStatic}
                  placeholder="https://..."
                />
              </div>
            </div>
          )}
        </div>
      )}

      {!showJson && isDocEditor ? (
        /* 워드 프로세서형 단일 페이지 에디터 (좌우 분할 X) */
        <div className="ce-doc-pane">
          {isDailyQuiz && <DailyQuizDocEditor editor={editor} />}
          {isDailyReading && <DailyReadingDocEditor editor={editor} />}
          {isBackgroundDoc && <BackgroundDocEditor editor={editor} />}
          {isVocabDoc && <VocabDocEditor editor={editor} />}
          {isPhonemeDoc && <PhonemeChangeDocEditor editor={editor} />}
          {isWordformationDoc && <WordFormationDocEditor editor={editor} />}
          {isSentenceDoc && <SentenceStructureDocEditor editor={editor} />}
          {isMorphemeDoc && <MorphemeAnalysisDocEditor editor={editor} />}
        </div>
      ) : showJson ? (
        /* JSON 직접 편집 모드 */
        <div className="ce-json-pane">
          {isJsonOnly && (
            <div style={{
              padding: "8px 12px",
              marginBottom: 8,
              background: "#1e2a25",
              border: "1px solid #4a6750",
              borderRadius: 6,
              color: "#a6cfb6",
              fontSize: 12,
            }}>
              ⓘ <strong>{typeLabel}</strong>는 비주얼 편집을 지원하지 않으므로 JSON으로만 수정합니다.
              JSON을 수정한 뒤 <strong>JSON 적용</strong>을 누르고, 상단의 <strong>저장</strong>을 눌러야 서버에 반영됩니다.
            </div>
          )}
          <textarea
            className="ce-json-textarea"
            value={jsonText}
            onChange={handleJsonChange}
            spellCheck={false}
          />
          {jsonError && <div className="ce-json-error">{jsonError}</div>}
          {jsonDirty && !jsonError && (
            <div className="ce-json-warn">
              ⚠ JSON이 수정되었지만 아직 적용되지 않았습니다. <strong>"JSON 적용"</strong>을 누른 뒤 저장하세요.
            </div>
          )}
          <div className="ce-json-actions">
            <button
              className={`ce-btn ${jsonDirty ? "ce-btn-primary" : "ce-btn-secondary"}`}
              disabled={!!jsonError || !jsonDirty}
              onClick={handleApplyJson}
            >
              {jsonDirty ? "JSON 적용 ✓" : "JSON 적용"}
            </button>
            {!isJsonOnly && (
              <button
                className="ce-btn ce-btn-secondary"
                onClick={() => setShowJson(false)}
              >
                비주얼 편집으로 돌아가기
              </button>
            )}
          </div>
        </div>
      ) : (
        /* 좌우 분할 (비주얼 편집) */
        <div className="ce-split">
          <div className="ce-preview-pane">
            <div className="ce-preview-label">
              미리보기
              <button
                type="button"
                className="ce-btn ce-btn-secondary"
                style={{ marginLeft: 12, padding: "2px 10px", fontSize: 12 }}
                onClick={() => {
                  // 현재 편집 중인 content를 학생 화면(EngineShell)으로 미리보기
                  // 학생 모듈 변경(클릭 트리거 모달, 매핑 정규화)이 자동 반영됨
                  if (!content) return;
                  const ctRaw = meta?.contentType ?? "";
                  const ct = Array.isArray(ctRaw) ? ctRaw : (ctRaw ? [ctRaw] : []);
                  const previewData = {
                    contentType: ct,
                    targetLevel: meta?.targetLevel || meta?.levelId || "",
                    area: meta?.area || "",
                    subArea: meta?.subArea || "",
                    title: meta?.title || "",
                    timeLimitSec: content?.timeLimitSec ?? content?.time_limit_sec,
                    seedReward: content?.seedReward || content?.seed_reward,
                    assets: content?.assets,
                    payload: content,
                  };
                  const moduleKey = resolveModuleKeyForContentType(ct, meta?.moduleKey);
                  try {
                    localStorage.setItem("korfarm_preview_content", JSON.stringify(previewData));
                    localStorage.setItem("korfarm_preview_module", moduleKey);
                    const fromHere = encodeURIComponent(window.location.pathname + window.location.search);
                    navigate(`/admin/content/preview?from=${fromHere}`);
                  } catch (err) {
                    alert("미리보기 데이터 저장 실패: " + err.message);
                  }
                }}
              >
                학생 화면으로 미리보기 ↗
              </button>
            </div>
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
            {editorType === "background" && (
              <BackgroundPreview content={content} onClickPath={handlePreviewClick} focusPath={focusPath} />
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
            {editorType === "background" && (
              <BackgroundForm editor={editor} focusPath={focusPath} setFocusPath={setFocusPath} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
