import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiGet, apiPost, apiPut } from "../utils/adminApi";
import { API_BASE } from "../utils/api";
import { LEARNING_TEMPLATES } from "../data/learning/learningTemplates";
import { LEARNING_CATALOG } from "../data/learning/learningCatalog";
import { TYPE_LABEL, getLevelLabel, DAILY_LEVELS, levelToFolder } from "../constants/contentTypes";
import AdminLayout from "../components/AdminLayout";
import "../styles/admin-detail.css";

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
      { value: "dailyReading:training:reading_training", label: "독해 훈련 (정독→복기→확인)" },
    ],
  },
  {
    label: "농장 모드",
    items: [
      { value: "farm:vocab:worksheet_quiz", label: "어휘 학습" },
      { value: "farm:vocab_dict:worksheet_quiz", label: "어휘 학습 (사전)" },
      { value: "farm:reading:reading_training", label: "독해 훈련" },
      { value: "farm:content:reading_training", label: "내용 숙지 농장" },
      { value: "farm:grammar_wf:word_formation", label: "문법 - 단어 형성" },
      { value: "farm:grammar_ss:sentence_structure", label: "문법 - 문장 짜임" },
      { value: "farm:grammar_pc:phoneme_change", label: "문법 - 음운 변동" },
      { value: "farm:grammar_pos:worksheet_quiz", label: "문법 - 품사" },
      { value: "farm:background:worksheet_quiz", label: "배경지식 학습" },
      { value: "farm:concept:worksheet_quiz", label: "국어 개념 농장" },
      { value: "farm:logic:logic_reasoning", label: "논리사고력 학습" },
      { value: "farm:writing:worksheet_quiz", label: "서술형 농장" },
      { value: "farm:choice:choice_judgement", label: "선택지 판별 농장" },
    ],
  },
  {
    label: "프로 모드",
    items: [
      { value: "pro:reading:reading_training", label: "프로 독해" },
      { value: "pro:vocab:worksheet_quiz", label: "프로 어휘" },
      { value: "pro:background:worksheet_quiz", label: "프로 배경지식" },
      { value: "pro:logic:logic_reasoning", label: "프로 논리사고력" },
      { value: "pro:answer:worksheet_quiz", label: "프로 모범답안/정답해설" },
    ],
  },
];

const extractModuleKey = (v) => v.split(":").pop();

/* 통합 양식 매핑: 독해/어휘/배경지식은 통합 템플릿으로 연결 */
const TEMPLATE_ID_MAP = {
  dailyReading_training: "reading_training",
  farm_reading: "reading_training",
  pro_reading: "reading_training",
  farm_vocab: "vocab_training",
  farm_vocab_dict: "vocab_training",
  pro_vocab: "vocab_training",
  farm_background: "background_quiz",
  pro_background: "background_quiz",
  farm_logic: "pro_logic",
};

const extractTemplateId = (v) => {
  const parts = v.split(":");
  const raw = `${parts[0]}_${parts[1]}`;
  return TEMPLATE_ID_MAP[raw] || raw;
};

/* 내용 숙지 농장 모듈 값 */
const CONTENT_PDF_MODULE = "farm:content:reading_training";

function AdminContentUploadPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("id");
  const editSource = searchParams.get("source");
  const isEditMode = !!editId;

  /* 단건 / 배치 모드 토글 */
  const [uploadMode, setUploadMode] = useState("single"); // "single" | "batch"

  /* 배치 모드 상태 */
  const batchInputRef = useRef(null);
  const [batchFiles, setBatchFiles] = useState([]); // { file, name, size }
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchResults, setBatchResults] = useState(null); // { imported, failed, results }
  const [batchError, setBatchError] = useState("");

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

  /* 영상 URL */
  const [videoUrl, setVideoUrl] = useState("");

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
          /* DB 콘텐츠 — preview 엔드포인트로 상세 조회 */
          const data = await apiGet(`/v1/admin/content/${editId}/preview`);
          if (!cancelled) {
            setEditMeta({
              id: editId,
              title: data.title || editId,
              type: data.contentType || data.content_type || "",
              jsonPath: "",
            });
            setJsonText(JSON.stringify(data.content || data, null, 2));
            setVideoUrl(data.videoUrl || data.video_url || "");
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
    navigator.clipboard.writeText(jsonText).catch((e) => console.error(e));
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
        area: parsed.area || undefined,
        subArea: parsed.subArea || undefined,
        dayIndex: parsed.dayIndex || undefined,
        moduleKey: parsed.moduleKey || undefined,
        videoUrl: videoUrl || undefined,
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

  /* 배치: 파일 선택 */
  const handleBatchFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setBatchFiles(files.map((f) => ({ file: f, name: f.name, size: f.size })));
    setBatchResults(null);
    setBatchError("");
  };

  /* 배치: 업로드 실행 */
  const handleBatchUpload = async () => {
    if (!batchFiles.length) {
      setBatchError("JSON 파일을 선택해주세요.");
      return;
    }
    setBatchLoading(true);
    setBatchError("");
    setBatchResults(null);
    try {
      const items = [];
      for (let i = 0; i < batchFiles.length; i++) {
        const text = await batchFiles[i].file.text();
        const parsed = JSON.parse(text);
        items.push({
          contentType: parsed.contentType,
          levelId: parsed.levelId || undefined,
          area: parsed.area || undefined,
          subArea: parsed.subArea || undefined,
          dayIndex: parsed.dayIndex ?? undefined,
          moduleKey: parsed.moduleKey || extractModuleKey(selectedModule),
          schemaVersion: parsed.schemaVersion || "1.0",
          content: parsed.payload || parsed,
        });
      }
      const result = await apiPost("/v1/admin/content/batch-import", { items });
      // 파일명을 결과에 매핑
      const enriched = {
        ...result,
        results: (result.results || []).map((r, idx) => ({
          ...r,
          fileName: batchFiles[idx]?.name || `파일 ${idx + 1}`,
        })),
      };
      setBatchResults(enriched);
    } catch (err) {
      setBatchError(err.message || "배치 업로드에 실패했습니다.");
    } finally {
      setBatchLoading(false);
    }
  };

  /* 배치 결과에서 미리보기 (기존 handleServerPreview 패턴) */
  const [batchPreviewLoadingId, setBatchPreviewLoadingId] = useState(null);
  const handleBatchPreview = async (contentId) => {
    setBatchPreviewLoadingId(contentId);
    try {
      const preview = await apiGet(`/v1/admin/content/${contentId}/preview`);
      const previewData = {
        contentType: preview.contentType || preview.content_type,
        payload: preview.content,
      };
      localStorage.setItem("korfarm_preview_content", JSON.stringify(previewData));
      const mk = preview.contentType || preview.content_type || "worksheet_quiz";
      localStorage.setItem("korfarm_preview_module", mk);
      navigate("/admin/content/preview");
    } catch (err) {
      setBatchError(err.message || "미리보기 데이터를 불러오지 못했습니다.");
    } finally {
      setBatchPreviewLoadingId(null);
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
        area: parsed.area || undefined,
        subArea: parsed.subArea || undefined,
        dayIndex: parsed.dayIndex || undefined,
        moduleKey: parsed.moduleKey || undefined,
        videoUrl: videoUrl || undefined,
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
              className="admin-detail-btn secondary admin-upload-back-btn"
              type="button"
              onClick={() => navigate("/admin/content")}
            >
              <span className="material-symbols-outlined admin-upload-back-icon">arrow_back</span>
              {" "}콘텐츠 목록
            </button>
            {isEditMode ? "콘텐츠 편집" : "콘텐츠 업로드"}
          </h1>
        </div>

        {/* 모드 토글 (편집 모드가 아닐 때만) */}
        {!isEditMode && (
          <div className="admin-upload-mode-toggle">
            <button
              className={`admin-detail-btn ${uploadMode === "single" ? "" : "secondary"}`}
              type="button"
              onClick={() => setUploadMode("single")}
            >
              단건 업로드
            </button>
            <button
              className={`admin-detail-btn ${uploadMode === "batch" ? "" : "secondary"}`}
              type="button"
              onClick={() => setUploadMode("batch")}
            >
              배치 업로드
            </button>
          </div>
        )}

        {/* 배치 모드 UI */}
        {!isEditMode && uploadMode === "batch" ? (
          <div className="admin-detail-card admin-batch-card">
            <h3 className="admin-batch-title">배치 업로드 (JSON 파일 복수 선택)</h3>
            <p className="admin-batch-desc">
              학습 1개 = JSON 파일 1개. 각 파일은 contentType, payload 등의 필드를 포함해야 합니다.
            </p>

            {/* 모듈 선택 */}
            <div className="admin-detail-toolbar admin-batch-module-toolbar">
              <select value={selectedModule} onChange={(e) => setSelectedModule(e.target.value)}>
                {MODULE_GROUPS.map((group) => (
                  <optgroup key={group.label} label={group.label}>
                    {group.items.map((item) => (
                      <option key={item.value} value={item.value}>{item.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            {/* 파일 선택 */}
            <div className="admin-batch-file-row">
              <button
                className="admin-detail-btn secondary"
                type="button"
                onClick={() => batchInputRef.current?.click()}
              >
                <span className="material-symbols-outlined admin-upload-back-icon">upload_file</span>
                {" "}JSON 파일 선택
              </button>
              <input
                ref={batchInputRef}
                type="file"
                accept=".json"
                multiple
                onChange={handleBatchFileSelect}
                hidden
              />
              <span className="admin-batch-file-count">
                {batchFiles.length > 0 ? `${batchFiles.length}개 파일 선택됨` : "파일을 선택하세요"}
              </span>
            </div>

            {/* 선택된 파일 목록 */}
            {batchFiles.length > 0 && (
              <table className="admin-batch-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>파일명</th>
                    <th className="text-right">크기</th>
                  </tr>
                </thead>
                <tbody>
                  {batchFiles.map((f, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>{f.name}</td>
                      <td className="text-right">
                        {(f.size / 1024).toFixed(1)} KB
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 업로드 버튼 */}
            <button
              className="admin-detail-btn"
              type="button"
              onClick={handleBatchUpload}
              disabled={batchLoading || !batchFiles.length}
            >
              {batchLoading ? "업로드 중..." : `${batchFiles.length}개 배치 업로드`}
            </button>

            {batchError && <p className="admin-detail-note error admin-batch-error-note">{batchError}</p>}

            {/* 결과 테이블 */}
            {batchResults && (
              <div className="admin-batch-result-section">
                <p className="admin-batch-result-summary">
                  결과: 성공 {batchResults.imported}개 / 실패 {batchResults.failed}개
                </p>
                <table className="admin-batch-result-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>파일명</th>
                      <th>Content ID</th>
                      <th className="text-center">상태</th>
                      <th>에러</th>
                      <th className="text-center">미리보기</th>
                    </tr>
                  </thead>
                  <tbody>
                    {batchResults.results.map((r) => (
                      <tr key={r.index}>
                        <td>{r.index + 1}</td>
                        <td>{r.fileName}</td>
                        <td className="mono">{r.contentId || "-"}</td>
                        <td className="text-center">
                          <span className={`admin-batch-status-pill ${r.success ? "success" : "fail"}`}>
                            {r.success ? "성공" : "실패"}
                          </span>
                        </td>
                        <td className="error-text">{r.error || ""}</td>
                        <td className="text-center">
                          {r.success && r.contentId ? (
                            <button
                              className="admin-detail-btn secondary admin-batch-preview-btn"
                              type="button"
                              disabled={batchPreviewLoadingId === r.contentId}
                              onClick={() => handleBatchPreview(r.contentId)}
                            >
                              {batchPreviewLoadingId === r.contentId ? "..." : "미리보기"}
                            </button>
                          ) : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
        <div className={`admin-detail-card admin-single-card${isEditMode ? " edit-mode" : ""}`}>
          {/* 편집 모드: 콘텐츠 정보 표시 */}
          {isEditMode && editMeta ? (
            <>
              <p className="admin-edit-meta-title">
                <strong>{editMeta.title}</strong>
              </p>
              <p className="admin-edit-meta-type">
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
              <span className="material-symbols-outlined admin-template-icon">download</span>
              {" "}표준 양식
            </button>
          </div>

          {/* PDF 관리 박스 (내용 숙지 농장 또는 CONTENT_PDF_QUIZ 편집) */}
          {showPdfBox ? (
            <div className="admin-pdf-box">
              <strong className="admin-pdf-box-title">PDF 관리</strong>
              {parsedPdfUrl ? (
                <>
                  <p className="admin-pdf-url-line">
                    pdfUrl: <code className="admin-pdf-url-code">{parsedPdfUrl}</code>
                  </p>
                  <a
                    href={parsedPdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="admin-pdf-link"
                  >
                    PDF 미리보기 (새 탭)
                  </a>
                </>
              ) : (
                <p className="admin-pdf-empty">
                  pdfUrl이 아직 설정되지 않았습니다.
                </p>
              )}
              <div className="admin-pdf-upload-row">
                <button
                  className="admin-detail-btn secondary admin-pdf-upload-btn"
                  type="button"
                  disabled={pdfUploading}
                  onClick={() => pdfInputRef.current?.click()}
                >
                  <span className="material-symbols-outlined admin-template-icon">upload_file</span>
                  {pdfUploading ? " 업로드 중..." : " PDF 업로드"}
                </button>
                <input
                  ref={pdfInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfUpload}
                  hidden
                />
                <span className="admin-pdf-upload-hint">
                  업로드하면 JSON의 pdfUrl이 자동으로 갱신됩니다.
                </span>
              </div>
              {pdfUploadMsg ? (
                <p className={`admin-pdf-upload-msg ${pdfUploadMsg.startsWith("업로드 완료") ? "success" : "error"}`}>
                  {pdfUploadMsg}
                </p>
              ) : null}
            </div>
          ) : null}

          {/* 영상 URL 입력 */}
          <div className="admin-pdf-box">
            <strong className="admin-pdf-box-title">영상 URL (유튜브)</strong>
            <input
              type="text"
              className="admin-json-input"
              style={{ height: "auto", minHeight: "unset", padding: "8px 12px", fontFamily: "inherit", fontSize: "14px" }}
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
          </div>

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
          {importMessage ? <p className="admin-detail-note admin-import-success">{importMessage}</p> : null}

          <div className="admin-detail-actions admin-detail-actions-mt">
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
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminContentUploadPage;
