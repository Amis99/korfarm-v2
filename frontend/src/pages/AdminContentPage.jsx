import { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../utils/adminApi";
import { useAdminList } from "../hooks/useAdminList";
import { LEARNING_CATALOG } from "../data/learning/learningCatalog";
import { LEARNING_TEMPLATES } from "../data/learning/learningTemplates";
import { Link } from "react-router-dom";
import {
  TYPE_LABEL, TYPE_SHORT, getTypeShort,
  LEVEL_SHORT, getLevelShort,
  LEVEL_LABEL_MAP, getLevelLabel, DAILY_LEVELS, levelToFolder,
} from "../constants/contentTypes";
import AdminLayout from "../components/AdminLayout";
import "../styles/admin-detail.css";

const CONTENTS = [];
const PER_PAGE = 20;

/* contentType → EngineShell moduleKey 변환 */
const CONTENT_TYPE_TO_MODULE = {
  VOCAB_BASIC: "worksheet_quiz",
  VOCAB_DICTIONARY: "worksheet_quiz",
  READING_NONFICTION: "reading_training",
  READING_LITERATURE: "reading_training",
  CONTENT_PDF: "content_pdf",
  CONTENT_PDF_QUIZ: "content_pdf",
  CHOICE_JUDGEMENT: "choice_judgement",
  GRAMMAR_PHONEME_CHANGE: "phoneme_change",
  GRAMMAR_WORD_FORMATION: "word_formation",
  GRAMMAR_SENTENCE_STRUCTURE: "sentence_structure",
  GRAMMAR_POS: "worksheet_quiz",
  BACKGROUND_KNOWLEDGE: "worksheet_quiz",
  BACKGROUND_KNOWLEDGE_QUIZ: "worksheet_quiz",
  LANGUAGE_CONCEPT: "worksheet_quiz",
  LANGUAGE_CONCEPT_QUIZ: "worksheet_quiz",
  LOGIC_REASONING: "worksheet_quiz",
  LOGIC_REASONING_QUIZ: "worksheet_quiz",
  WRITING_DESCRIPTIVE: "worksheet_quiz",
  DAILY_QUIZ: "worksheet_quiz",
  DAILY_READING: "reading_training",
  PRO_READING: "reading_training",
  PRO_BACKGROUND: "worksheet_quiz",
  PRO_VOCAB: "worksheet_quiz",
  PRO_LOGIC: "worksheet_quiz",
  PRO_ANSWER: "answer_key",
  PRO_TEST: "worksheet_quiz",
};
const resolveModuleKey = (contentType, fallback) =>
  fallback || CONTENT_TYPE_TO_MODULE[contentType] || "worksheet_quiz";

/* static JSON 콘텐츠 목록 */
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
    moduleKey: item.moduleKey,
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
    moduleKey: "worksheet_quiz",
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
    moduleKey: "reading_training",
  })),
];

/* 상태값 정규화: 활성/비활성 2단계 */
const normalizeContentStatus = (status) => {
  if (!status) return "inactive";
  if (["active", "live", "static", "scheduled"].includes(status)) return "active";
  return "inactive";
};

/* 상태 한글 라벨 */
const STATUS_LABEL = { active: "활성", inactive: "비활성" };

/* jsonPath에서 day 번호 추출 (/daily-quiz/saussure1/041.json → "#041") */
const extractDay = (jsonPath) => {
  if (!jsonPath) return "";
  const m = jsonPath.match(/\/(\d{3})\.json$/);
  return m ? `#${m[1]}` : "";
};

/* 목록 API 응답 → 테이블 데이터 변환 */
const mapContentList = (items) =>
  items.map((content) => ({
    id: content.contentId || content.content_id || content.id || content.title,
    title: content.title,
    type: content.contentType || content.content_type || content.type || "",
    levelId: content.levelId || content.level_id || "",
    chapterId: content.chapterId || content.chapter_id || "",
    status: normalizeContentStatus(content.status),
  }));

/* 템플릿 그룹 분류 */
const TEMPLATE_GROUPS = [
  { label: "일일 학습", prefix: "daily" },
  { label: "농장 모드", prefix: "farm" },
  { label: "프로 모드", prefix: "pro" },
];

function AdminContentPage() {
  const { data: contents, loading, error } = useAdminList(
    "/v1/admin/content",
    CONTENTS,
    mapContentList
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  /* 서버 콘텐츠 미리보기 상태 */
  const [previewLoadingId, setPreviewLoadingId] = useState(null);
  const [serverPreviewError, setServerPreviewError] = useState("");
  /* 페이지네이션 */
  const [currentPage, setCurrentPage] = useState(1);
  /* 표준 양식 드롭다운 */
  const [showTemplatePanel, setShowTemplatePanel] = useState(false);
  const templatePanelRef = useRef(null);
  const navigate = useNavigate();

  /* 표준 양식 패널 외부 클릭 닫힘 */
  useEffect(() => {
    if (!showTemplatePanel) return;
    const handler = (e) => {
      if (templatePanelRef.current && !templatePanelRef.current.contains(e.target)) {
        setShowTemplatePanel(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showTemplatePanel]);

  /* 템플릿 JSON 다운로드 */
  const handleDownloadTemplate = (template) => {
    const json = JSON.stringify(template.content, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${template.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* DB 콘텐츠 + static 콘텐츠 병합 */
  const allContents = useMemo(() => {
    const dbItems = contents.map((c) => ({ ...c, source: "db" }));
    return [...STATIC_CONTENTS, ...dbItems];
  }, [contents]);

  const filteredContents = useMemo(() => {
    const term = search.trim().toLowerCase();
    return allContents.filter((content) => {
      if (statusFilter !== "all" && content.status !== statusFilter) return false;
      if (typeFilter !== "all") {
        const merged = typeFilter === "CONTENT_PDF"
          ? (content.type !== "CONTENT_PDF" && content.type !== "CONTENT_PDF_QUIZ")
          : content.type !== typeFilter;
        if (merged) return false;
      }
      if (!term) return true;
      return [content.title, content.type, content.status, content.levelId, content.chapterId]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(term));
    });
  }, [allContents, search, statusFilter, typeFilter]);

  /* 페이지네이션 계산 */
  const totalPages = Math.max(1, Math.ceil(filteredContents.length / PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedContents = filteredContents.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  /* 필터 변경 시 1페이지 리셋 */
  const handleStatusFilter = (f) => { setStatusFilter(f); setCurrentPage(1); };
  const handleTypeFilter = (e) => { setTypeFilter(e.target.value); setCurrentPage(1); };
  const handleSearchChange = (e) => { setSearch(e.target.value); setCurrentPage(1); };

  /* 콘텐츠 미리보기 (DB → API, static → 정적 파일) */
  const handleServerPreview = async (content) => {
    if (!content?.id) return;
    setPreviewLoadingId(content.id);
    setServerPreviewError("");
    try {
      let previewData;
      let moduleKey;
      if (content.source === "static" && content.jsonPath) {
        const base = import.meta.env.BASE_URL || "/";
        const url = `${base}${content.jsonPath.replace(/^\//, "")}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`정적 파일 로드 실패: ${res.status}`);
        const fileData = await res.json();
        previewData = fileData;
        moduleKey = resolveModuleKey(fileData.contentType, content.moduleKey);
      } else {
        const preview = await apiGet(`/v1/admin/content/${content.id}/preview`);
        const ct = preview.contentType || preview.content_type || "";
        previewData = { contentType: ct, payload: preview.content };
        moduleKey = resolveModuleKey(ct, preview.moduleKey || preview.module_key);
      }
      localStorage.setItem("korfarm_preview_content", JSON.stringify(previewData));
      localStorage.setItem("korfarm_preview_module", moduleKey);
      navigate("/admin/content/preview");
    } catch (err) {
      setServerPreviewError(err.message || "미리보기 데이터를 불러오지 못했습니다.");
    } finally {
      setPreviewLoadingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>콘텐츠 관리</h1>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div ref={templatePanelRef} style={{ position: "relative" }}>
              <button
                className="admin-detail-btn secondary"
                type="button"
                onClick={() => setShowTemplatePanel((v) => !v)}
              >
                표준 양식 {showTemplatePanel ? "\u25B2" : "\u25BC"}
              </button>
              {showTemplatePanel && (
                <div className="admin-template-dropdown">
                  {TEMPLATE_GROUPS.map((group) => {
                    const items = LEARNING_TEMPLATES.filter((t) => t.id.startsWith(group.prefix));
                    if (items.length === 0) return null;
                    return (
                      <div key={group.prefix} className="admin-template-group">
                        <div className="admin-template-group-title">{group.label}</div>
                        {items.map((t) => (
                          <div key={t.id} className="admin-template-item">
                            <div className="admin-template-item-info">
                              <span className="admin-template-item-name">{t.title}</span>
                              <span className="admin-template-item-key">{t.moduleKey}</span>
                            </div>
                            <button
                              className="admin-detail-btn secondary xs"
                              type="button"
                              onClick={() => handleDownloadTemplate(t)}
                            >
                              다운로드
                            </button>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <button
              className="admin-detail-btn"
              type="button"
              onClick={() => navigate("/admin/content/upload")}
            >
              콘텐츠 업로드
            </button>
          </div>
        </div>
        <div className="admin-detail-card admin-single-card edit-mode">
          <div className="admin-detail-toolbar">
            <div className="admin-detail-search">
              <span className="material-symbols-outlined">search</span>
              <input
                placeholder="콘텐츠 검색"
                value={search}
                onChange={handleSearchChange}
              />
            </div>
            <div className="admin-detail-filters">
              {["all", "active", "inactive"].map((f) => (
                <button
                  key={f}
                  className={`admin-filter ${statusFilter === f ? "active" : ""}`}
                  type="button"
                  onClick={() => handleStatusFilter(f)}
                >
                  {f === "all" ? "전체" : STATUS_LABEL[f] || f}
                </button>
              ))}
              <select
                value={typeFilter}
                onChange={handleTypeFilter}
                className="admin-type-filter-select"
              >
                <option value="all">유형: 전체</option>
                {Object.entries(TYPE_LABEL)
                  .filter(([key]) => key === key.toUpperCase() && key !== "CONTENT_PDF_QUIZ")
                  .map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
              </select>
            </div>
          </div>
          {loading ? <p className="admin-detail-note">콘텐츠를 불러오는 중...</p> : null}
          {error ? <p className="admin-detail-note error">{error}</p> : null}
          {serverPreviewError ? <p className="admin-detail-note error">{serverPreviewError}</p> : null}
          <table className="admin-detail-table">
            <thead>
              <tr>
                <th>제목</th>
                <th className="admin-th-type">유형</th>
                <th className="admin-th-level">레벨</th>
                <th className="admin-th-status">상태</th>
                <th className="admin-th-actions">관리</th>
              </tr>
            </thead>
            <tbody>
              {pagedContents.length === 0 && !loading ? (
                <tr>
                  <td colSpan={5} className="admin-content-status-cell">
                    {allContents.length === 0 ? "등록된 콘텐츠가 없습니다." : "검색 결과가 없습니다."}
                  </td>
                </tr>
              ) : null}
              {pagedContents.map((content) => {
                const ts = getTypeShort(content.type);
                const day = extractDay(content.jsonPath);
                const levelFull = LEVEL_LABEL_MAP[content.levelId] || content.levelId || "";
                const typeFull = TYPE_LABEL[content.type] || content.type || "";
                return (
                  <tr key={content.id}>
                    <td>
                      <Link
                        to={`/admin/content/edit?id=${content.id}${content.source === "static" ? `&source=static&jsonPath=${encodeURIComponent(content.jsonPath)}&type=${encodeURIComponent(content.type)}&title=${encodeURIComponent(content.title)}` : ""}`}
                        className="admin-content-title-link"
                        title={content.title}
                      >
                        {content.title}
                      </Link>
                      {day ? <span className="admin-content-day">{day}</span> : null}
                    </td>
                    <td>
                      <span className="type-pill admin-tooltip-wrap" data-group={ts.group}>
                        {ts.label}
                        {typeFull && <span className="admin-tooltip">{typeFull}</span>}
                      </span>
                    </td>
                    <td>
                      <span className="level-pill admin-tooltip-wrap">
                        {getLevelShort(content.levelId)}
                        {levelFull && <span className="admin-tooltip">{levelFull}</span>}
                      </span>
                    </td>
                    <td>
                      <span className="admin-tooltip-wrap" style={{ cursor: "default" }}>
                        <span
                          className="status-dot"
                          data-status={content.status}
                        />
                        <span className="admin-tooltip">{STATUS_LABEL[content.status] || content.status}</span>
                      </span>
                    </td>
                    <td>
                      <span className="admin-content-actions-cell">
                        <button
                          className="admin-icon-btn admin-tooltip-wrap"
                          type="button"
                          disabled={previewLoadingId === content.id}
                          onClick={() => handleServerPreview(content)}
                        >
                          {previewLoadingId === content.id ? "..." : "\uD83D\uDC41"}
                          <span className="admin-tooltip">미리보기</span>
                        </button>
                        <button
                          className="admin-icon-btn admin-tooltip-wrap"
                          type="button"
                          onClick={() => {
                            const params = new URLSearchParams({ id: content.id });
                            if (content.source === "static") params.set("source", "static");
                            navigate(`/admin/content/upload?${params.toString()}`);
                          }}
                        >
                          {"{ }"}
                          <span className="admin-tooltip">JSON 편집</span>
                        </button>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* 페이지네이션 (윈도우 방식) */}
          {totalPages > 1 ? (
            <div className="admin-pagination">
              <button disabled={safePage <= 1} onClick={() => setCurrentPage(1)} title="처음">&laquo;</button>
              <button disabled={safePage <= 1} onClick={() => setCurrentPage((p) => p - 1)} title="이전">&lsaquo;</button>
              {(() => {
                const winStart = Math.max(1, safePage - 4);
                const winEnd = Math.min(totalPages, winStart + 9);
                const adjustedStart = Math.max(1, winEnd - 9);
                return Array.from({ length: winEnd - adjustedStart + 1 }, (_, i) => adjustedStart + i).map((p) => (
                  <button
                    key={p}
                    className={p === safePage ? "active" : ""}
                    onClick={() => setCurrentPage(p)}
                  >
                    {p}
                  </button>
                ));
              })()}
              <button disabled={safePage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)} title="다음">&rsaquo;</button>
              <button disabled={safePage >= totalPages} onClick={() => setCurrentPage(totalPages)} title="마지막">&raquo;</button>
            </div>
          ) : null}
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminContentPage;
