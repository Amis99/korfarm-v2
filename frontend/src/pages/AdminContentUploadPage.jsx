import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiGet, apiPost, apiPut } from "../utils/adminApi";
import { LEARNING_TEMPLATES } from "../data/learning/learningTemplates";
import { LEARNING_CATALOG } from "../data/learning/learningCatalog";
import AdminLayout from "../components/AdminLayout";
import "../styles/admin-detail.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

/* 레벨 라벨 헬퍼 */
const LEVEL_LABEL_MAP = {
  SAUSSURE_1: "소쉬르 1", SAUSSURE_2: "소쉬르 2", SAUSSURE_3: "소쉬르 3",
  FREGE_1: "프레게 1", FREGE_2: "프레게 2", FREGE_3: "프레게 3",
  RUSSELL_1: "러셀 1", RUSSELL_2: "러셀 2", RUSSELL_3: "러셀 3",
  WITTGENSTEIN_1: "비트겐슈타인 1", WITTGENSTEIN_2: "비트겐슈타인 2", WITTGENSTEIN_3: "비트겐슈타인 3",
};
const getLevelLabel = (level) => LEVEL_LABEL_MAP[level] || level;
const levelToFolder = (level) => level.toLowerCase().replace("_", "");

const DAILY_LEVELS = [
  "SAUSSURE_1","SAUSSURE_2","SAUSSURE_3",
  "FREGE_1","FREGE_2","FREGE_3",
  "RUSSELL_1","RUSSELL_2","RUSSELL_3",
  "WITTGENSTEIN_1","WITTGENSTEIN_2","WITTGENSTEIN_3",
];

const STATIC_CONTENTS = [
  ...LEARNING_CATALOG.map((item) => ({
    id: item.contentId,
    title: item.title,
    type: item.contentType,
    levelId: item.targetLevel,
    chapterId: "",
    status: "active",
    source: "static",
    jsonPath: item.jsonPath,
  })),
  ...DAILY_LEVELS.map((level) => ({
    id: `dq-${level.toLowerCase()}`,
    title: `일일 퀴즈 - ${getLevelLabel(level)}`,
    type: "DAILY_QUIZ",
    levelId: level,
    chapterId: "",
    status: "active",
    source: "static",
    jsonPath: `/daily-quiz/${levelToFolder(level)}/001.json`,
  })),
  ...DAILY_LEVELS.map((level) => ({
    id: `dr-${level.toLowerCase()}`,
    title: `일일 독해 - ${getLevelLabel(level)}`,
    type: "DAILY_READING",
    levelId: level,
    chapterId: "",
    status: "active",
    source: "static",
    jsonPath: `/daily-reading/${levelToFolder(level)}/001.json`,
  })),
];

const TYPE_LABEL = {
  DAILY_QUIZ: "일일 퀴즈",
  DAILY_READING: "일일 독해",
  VOCAB_BASIC: "어휘 기본",
  VOCAB_DICTIONARY: "어휘 사전",
  GRAMMAR_WORD_FORMATION: "문법 - 단어 형성",
  GRAMMAR_SENTENCE_STRUCTURE: "문법 - 문장 짜임",
  GRAMMAR_PHONEME_CHANGE: "문법 - 음운 변동",
  GRAMMAR_POS: "문법 - 품사",
  READING_NONFICTION: "독해 비문학",
  READING_LITERATURE: "독해 문학",
  CONTENT_PDF: "내용 숙지",
  CONTENT_PDF_QUIZ: "내용 숙지 퀴즈",
  BACKGROUND_KNOWLEDGE: "배경지식",
  BACKGROUND_KNOWLEDGE_QUIZ: "배경지식 퀴즈",
  LANGUAGE_CONCEPT: "국어 개념",
  LANGUAGE_CONCEPT_QUIZ: "국어 개념 퀴즈",
  LOGIC_REASONING: "논리사고력",
  LOGIC_REASONING_QUIZ: "논리사고력 퀴즈",
  CHOICE_JUDGEMENT: "선택지 판별",
  WRITING_DESCRIPTIVE: "서술형",
};

const MODULE_GROUPS = [
  {
    label: "일일 퀴즈",
    items: [
      { value: "dailyQuiz:quiz:worksheet_quiz", label: "공통 퀴즈형" },
    ],
  },
  {
    label: "일일 독해",
    items: [
      { value: "dailyReading:intensive:reading_intensive", label: "정독 훈련" },
      { value: "dailyReading:training:reading_training", label: "독해 훈련 (Reading Training)" },
      { value: "dailyReading:recall:recall_cards", label: "복기 카드" },
      { value: "dailyReading:confirm:confirm_click", label: "확인 학습 클릭" },
    ],
  },
  {
    label: "농장 모드",
    items: [
      { value: "farm:vocab:worksheet_quiz", label: "어휘 농장" },
      { value: "farm:reading:reading_training", label: "독해 농장" },
      { value: "farm:content:reading_training", label: "내용 숙지 농장" },
      { value: "farm:grammar_wf:word_formation", label: "문법 - 단어 형성" },
      { value: "farm:grammar_ss:sentence_structure", label: "문법 - 문장 짜임" },
      { value: "farm:grammar_pc:phoneme_change", label: "문법 - 음운 변동" },
      { value: "farm:grammar_pos:worksheet_quiz", label: "문법 - 품사" },
      { value: "farm:background:worksheet_quiz", label: "배경지식 농장" },
      { value: "farm:concept:worksheet_quiz", label: "국어 개념 농장" },
      { value: "farm:logic:worksheet_quiz", label: "논리사고력 농장" },
      { value: "farm:writing:worksheet_quiz", label: "서술형 농장" },
      { value: "farm:choice:choice_judgement", label: "선택지 판별 농장" },
    ],
  },
  {
    label: "프로 모드",
    items: [
      { value: "pro:default:worksheet_quiz", label: "프로 모드 (준비 중)", disabled: true },
    ],
  },
];

const extractModuleKey = (v) => v.split(":").pop();

const extractTemplateId = (v) => {
  const parts = v.split(":");
  return `${parts[0]}_${parts[1]}`;
};

/* 내용 숙지 농장 모듈 값 */
const CONTENT_PDF_MODULE = "farm:content:reading_training";

function AdminContentUploadPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  const editSource = searchParams.get("source");
  const isEditMode = !!editId;

  /* 편집 모드에서 로드된 콘텐츠 메타 */
  const [editMeta, setEditMeta] = useState(null);

  /* JSON 편집 */
  const [jsonText, setJsonText] = useState("");
  const [jsonLoading, setJsonLoading] = useState(false);
  const [jsonError, setJsonError] = useState("");

  /* 모듈 선택 (신규 업로드) */
  const [selectedModule, setSelectedModule] = useState("dailyQuiz:quiz:worksheet_quiz");
  const moduleKey = extractModuleKey(selectedModule);
  const templateId = extractTemplateId(selectedModule);
  const currentTemplate = LEARNING_TEMPLATES.find((t) => t.id === templateId);

  /* 미리보기/등록 */
  const [previewError, setPreviewError] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importMessage, setImportMessage] = useState("");

  /* PDF 업로드 */
  const pdfInputRef = useRef(null);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfUploadMsg, setPdfUploadMsg] = useState("");

  /* PDF 관련 모듈인지 판단 */
  const isPdfModule = selectedModule === CONTENT_PDF_MODULE;
  const isPdfContent = editMeta?.type === "CONTENT_PDF_QUIZ";
  const showPdfBox = isPdfModule || isPdfContent;

  /* 편집 모드: 콘텐츠 JSON 자동 로드 */
  useEffect(() => {
    if (!editId) return;
    let cancelled = false;
    (async () => {
      setJsonLoading(true);
      setJsonError("");
      try {
        if (editSource === "static") {
          /* STATIC_CONTENTS에서 찾아서 fetch */
          const found = STATIC_CONTENTS.find((c) => c.id === editId);
          if (!found) throw new Error("해당 static 콘텐츠를 찾을 수 없습니다.");
          setEditMeta(found);
          const resp = await fetch(import.meta.env.BASE_URL + found.jsonPath.replace(/^\//, ""));
          if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
          const data = await resp.json();
          if (!cancelled) setJsonText(JSON.stringify(data, null, 2));
        } else {
          /* DB 콘텐츠 */
          const data = await apiGet(`/v1/admin/content/${editId}`);
          if (!cancelled) {
            setEditMeta({
              id: editId,
              title: data.title || editId,
              type: data.contentType || data.content_type || "",
              jsonPath: "",
            });
            setJsonText(JSON.stringify(data, null, 2));
          }
        }
      } catch (err) {
        if (!cancelled) setJsonError(err.message || "JSON을 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setJsonLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [editId, editSource]);

  /* pdfUrl 파싱 (내용 숙지 관련 콘텐츠) */
  const parsedPdfUrl = useMemo(() => {
    if (!showPdfBox) return null;
    if (!jsonText) return null;
    try {
      const parsed = JSON.parse(jsonText);
      return parsed?.payload?.pdfUrl || parsed?.pdfUrl || null;
    } catch {
      return null;
    }
  }, [showPdfBox, jsonText]);

  /* PDF 업로드 (presign 흐름) */
  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setPdfUploadMsg("PDF 파일만 업로드할 수 있습니다.");
      return;
    }
    setPdfUploading(true);
    setPdfUploadMsg("");
    try {
      const presign = await apiPost("/v1/files/presign", {
        purpose: "content_pdf",
        filename: file.name,
        mime: "application/pdf",
        size: file.size,
      });
      const { fileId, uploadUrl } = presign?.data ?? presign;
      /* presign URL로 실제 파일 업로드 */
      if (uploadUrl && !uploadUrl.startsWith("local://")) {
        await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": "application/pdf" }, body: file });
      }
      /* JSON 내 pdfUrl 자동 갱신 */
      const newPdfUrl = `${API_BASE}/v1/files/${fileId}/download`;
      try {
        const parsed = JSON.parse(jsonText);
        if (parsed.payload) {
          parsed.payload.pdfUrl = newPdfUrl;
        } else {
          parsed.pdfUrl = newPdfUrl;
        }
        setJsonText(JSON.stringify(parsed, null, 2));
      } catch {
        /* JSON 파싱 실패 시 빈 JSON이면 pdfUrl만 세팅 */
        if (!jsonText.trim()) {
          setJsonText(JSON.stringify({ pdfUrl: newPdfUrl }, null, 2));
        }
      }
      setPdfUploadMsg(`업로드 완료 (fileId: ${fileId})`);
    } catch (err) {
      setPdfUploadMsg(`업로드 실패: ${err.message || err}`);
    } finally {
      setPdfUploading(false);
      if (pdfInputRef.current) pdfInputRef.current.value = "";
    }
  };

  /* 클립보드 복사 */
  const handleCopyJson = () => {
    if (!jsonText) return;
    navigator.clipboard.writeText(jsonText).catch(() => {});
  };

  /* 표준 양식 다운로드 */
  const handleDownloadTemplate = () => {
    if (!currentTemplate) return;
    const json = JSON.stringify(currentTemplate.content, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${templateId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* 미리보기 */
  const handlePreview = () => {
    setPreviewError("");
    if (!(jsonText || "").trim()) {
      setPreviewError("JSON 내용을 입력해 주세요.");
      return;
    }
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.contentType || !parsed.payload) {
        setPreviewError("contentType과 payload가 포함된 JSON이어야 합니다.");
        return;
      }
      localStorage.setItem("korfarm_preview_content", JSON.stringify(parsed));
      localStorage.setItem("korfarm_preview_module", moduleKey);
      navigate("/admin/content/preview");
    } catch (err) {
      setPreviewError(`JSON 파싱 실패: ${err.message}`);
    }
  };

  /* 콘텐츠 신규 등록 */
  const handleImport = async () => {
    setPreviewError("");
    setImportMessage("");
    if (!(jsonText || "").trim()) {
      setPreviewError("JSON 내용을 입력해 주세요.");
      return;
    }
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.contentType || !parsed.payload) {
        setPreviewError("contentType과 payload가 포함된 JSON이어야 합니다.");
        return;
      }
      setImportLoading(true);
      await apiPost("/v1/admin/content/import", {
        contentType: parsed.contentType,
        levelId: parsed.levelId || undefined,
        chapterId: parsed.chapterId || undefined,
        schemaVersion: parsed.schemaVersion || "1.0",
        content: parsed.payload,
      });
      setImportMessage("콘텐츠가 등록되었습니다.");
      setJsonText("");
    } catch (err) {
      setPreviewError(err.message || `등록 실패: ${err}`);
    } finally {
      setImportLoading(false);
    }
  };

  /* 기존 콘텐츠 수정 (PUT) */
  const [updateLoading, setUpdateLoading] = useState(false);
  const handleUpdate = async () => {
    setPreviewError("");
    setImportMessage("");
    if (!(jsonText || "").trim()) {
      setPreviewError("JSON 내용을 입력해 주세요.");
      return;
    }
    try {
      const parsed = JSON.parse(jsonText);
      if (!parsed.contentType || !parsed.payload) {
        setPreviewError("contentType과 payload가 포함된 JSON이어야 합니다.");
        return;
      }
      setUpdateLoading(true);
      await apiPut(`/v1/admin/content/${editId}`, {
        contentType: parsed.contentType,
        levelId: parsed.levelId || undefined,
        chapterId: parsed.chapterId || undefined,
        schemaVersion: parsed.schemaVersion || "1.0",
        content: parsed.payload,
      });
      setImportMessage("콘텐츠가 수정되었습니다.");
    } catch (err) {
      setPreviewError(err.message || `수정 실패: ${err}`);
    } finally {
      setUpdateLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>
            <button
              className="admin-detail-btn secondary"
              type="button"
              style={{ marginRight: 12, fontSize: 13, padding: "4px 12px" }}
              onClick={() => navigate("/admin/content")}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: "middle" }}>arrow_back</span>
              {" "}콘텐츠 목록
            </button>
            {isEditMode ? "콘텐츠 편집" : "콘텐츠 업로드"}
          </h1>
        </div>

        <div className="admin-detail-card" style={{ marginTop: 24 }}>
          {/* 편집 모드: 콘텐츠 정보 표시 */}
          {isEditMode && editMeta ? (
            <>
              <p style={{ fontSize: 13, color: "var(--admin-muted)", marginBottom: 4 }}>
                <strong>{editMeta.title}</strong>
              </p>
              <p style={{ fontSize: 12, color: "var(--admin-muted)", marginBottom: 8 }}>
                유형: {TYPE_LABEL[editMeta.type] || editMeta.type}
                {editMeta.jsonPath ? ` | 경로: ${editMeta.jsonPath}` : ""}
              </p>

            </>
          ) : null}

          {/* 모듈 선택 + 표준 양식 (항상 표시) */}
          <div className="admin-detail-toolbar">
            <select value={selectedModule} onChange={(e) => setSelectedModule(e.target.value)}>
              {MODULE_GROUPS.map((group) => (
                <optgroup key={group.label} label={group.label}>
                  {group.items.map((item) => (
                    <option key={item.value} value={item.value} disabled={item.disabled}>
                      {item.label}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <button
              className="admin-detail-btn secondary admin-template-dl-btn"
              type="button"
              disabled={!currentTemplate}
              onClick={handleDownloadTemplate}
              title={currentTemplate ? `${currentTemplate.title} 표준 양식 다운로드` : "템플릿 없음"}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: "middle" }}>download</span>
              {" "}표준 양식
            </button>
          </div>

          {/* PDF 관리 박스 (내용 숙지 농장 또는 CONTENT_PDF_QUIZ 편집) */}
          {showPdfBox ? (
            <div style={{
              background: "rgba(59, 130, 199, 0.1)",
              border: "1px solid rgba(59, 130, 199, 0.3)",
              borderRadius: 10,
              padding: "10px 14px",
              marginBottom: 12,
              fontSize: 12,
            }}>
              <strong style={{ color: "#8bb8e8" }}>PDF 관리</strong>
              {parsedPdfUrl ? (
                <>
                  <p style={{ margin: "6px 0 4px", wordBreak: "break-all" }}>
                    pdfUrl: <code style={{ color: "#9dd6b0" }}>{parsedPdfUrl}</code>
                  </p>
                  <a
                    href={parsedPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#8bb8e8", textDecoration: "underline" }}
                  >
                    PDF 미리보기 (새 탭)
                  </a>
                </>
              ) : (
                <p style={{ margin: "6px 0 0", color: "var(--admin-muted)" }}>
                  pdfUrl이 아직 설정되지 않았습니다.
                </p>
              )}
              <div style={{ marginTop: 8, display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  className="admin-detail-btn secondary"
                  type="button"
                  style={{ fontSize: 12, padding: "4px 12px" }}
                  disabled={pdfUploading}
                  onClick={() => pdfInputRef.current?.click()}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: "middle" }}>upload_file</span>
                  {pdfUploading ? " 업로드 중..." : " PDF 업로드"}
                </button>
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfUpload}
                  hidden
                />
                <span style={{ color: "var(--admin-muted)" }}>
                  업로드하면 JSON의 pdfUrl이 자동으로 갱신됩니다.
                </span>
              </div>
              {pdfUploadMsg ? (
                <p style={{ margin: "6px 0 0", color: pdfUploadMsg.startsWith("업로드 완료") ? "#27ae60" : "#e74c3c" }}>
                  {pdfUploadMsg}
                </p>
              ) : null}
            </div>
          ) : null}

          {/* JSON 편집 영역 */}
          {jsonLoading ? (
            <p className="admin-detail-note">JSON 로딩 중...</p>
          ) : jsonError ? (
            <p className="admin-detail-note error">{jsonError}</p>
          ) : (
            <textarea
              className="admin-json-input"
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder="JSON을 입력하세요"
              rows={16}
            />
          )}

          {previewError ? <p className="admin-detail-note error">{previewError}</p> : null}
          {importMessage ? <p className="admin-detail-note" style={{ color: "#27ae60" }}>{importMessage}</p> : null}

          <div className="admin-detail-actions" style={{ marginTop: 8 }}>
            {isEditMode ? (
              <button className="admin-detail-btn secondary" type="button" onClick={handleCopyJson}>
                복사
              </button>
            ) : null}
            <button className="admin-detail-btn secondary" type="button" onClick={handlePreview}>
              미리보기
            </button>
            {isEditMode && editSource !== "static" ? (
              <button
                className="admin-detail-btn"
                type="button"
                onClick={handleUpdate}
                disabled={updateLoading}
              >
                {updateLoading ? "수정 중..." : "콘텐츠 수정"}
              </button>
            ) : (
              <button
                className="admin-detail-btn"
                type="button"
                onClick={handleImport}
                disabled={importLoading}
              >
                {importLoading ? "등록 중..." : "콘텐츠 등록"}
              </button>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminContentUploadPage;
