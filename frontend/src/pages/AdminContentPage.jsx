import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../utils/adminApi";
import { useAdminList } from "../hooks/useAdminList";
import { LEARNING_CATALOG } from "../data/learning/learningCatalog";
import AdminLayout from "../components/AdminLayout";
import "../styles/admin-detail.css";

const CONTENTS = [];
const PER_PAGE = 20;

/* 레벨 라벨 헬퍼 */
const LEVEL_LABEL_MAP = {
  SAUSSURE_1: "소쉬르 1", SAUSSURE_2: "소쉬르 2", SAUSSURE_3: "소쉬르 3",
  FREGE_1: "프레게 1", FREGE_2: "프레게 2", FREGE_3: "프레게 3",
  RUSSELL_1: "러셀 1", RUSSELL_2: "러셀 2", RUSSELL_3: "러셀 3",
  WITTGENSTEIN_1: "비트겐슈타인 1", WITTGENSTEIN_2: "비트겐슈타인 2", WITTGENSTEIN_3: "비트겐슈타인 3",
};
const getLevelLabel = (level) => LEVEL_LABEL_MAP[level] || level;

/* 레벨 → 폴더명 변환 (SAUSSURE_1 → saussure1) */
const levelToFolder = (level) => level.toLowerCase().replace("_", "");

const DAILY_LEVELS = [
  "SAUSSURE_1","SAUSSURE_2","SAUSSURE_3",
  "FREGE_1","FREGE_2","FREGE_3",
  "RUSSELL_1","RUSSELL_2","RUSSELL_3",
  "WITTGENSTEIN_1","WITTGENSTEIN_2","WITTGENSTEIN_3",
];

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

/* 상태값 정규화: 활성/비활성 2단계 */
const normalizeContentStatus = (status) => {
  if (!status) return "inactive";
  if (["active", "live", "static", "scheduled"].includes(status)) return "active";
  return "inactive";
};

/* 상태 한글 라벨 */
const STATUS_LABEL = { active: "활성", inactive: "비활성" };

/* contentType 한글 라벨 (필터 드롭다운용 - 풀네임) */
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
  CONTENT_PDF_QUIZ: "내용 숙지",
  BACKGROUND_KNOWLEDGE: "배경지식",
  BACKGROUND_KNOWLEDGE_QUIZ: "배경지식 퀴즈",
  LANGUAGE_CONCEPT: "국어 개념",
  LANGUAGE_CONCEPT_QUIZ: "국어 개념 퀴즈",
  LOGIC_REASONING: "논리사고력",
  LOGIC_REASONING_QUIZ: "논리사고력 퀴즈",
  CHOICE_JUDGEMENT: "선택지 판별",
  WRITING_DESCRIPTIVE: "서술형",
  DUEL_QUESTION: "대결 문제",
  /* 레거시 moduleKey 기반 (DB 콘텐츠 호환) */
  worksheet_quiz: "공통 퀴즈형",
  reading_intensive: "정독 훈련",
  reading_training: "Reading Training",
  recall_cards: "복기 카드",
  confirm_click: "확인 학습 클릭",
  choice_judgement: "선택지 판별",
  phoneme_change: "음운 변동",
  word_formation: "단어 형성",
  sentence_structure: "문장 짜임",
  pro_mode: "프로 모드",
};

/* 테이블 셀용 축약 라벨 + 그룹 컬러 */
const TYPE_SHORT = {
  DAILY_QUIZ:  { label: "퀴즈", group: "daily" },
  DAILY_READING: { label: "독해", group: "daily" },
  VOCAB_BASIC: { label: "어휘", group: "vocab" },
  VOCAB_DICTIONARY: { label: "사전", group: "vocab" },
  GRAMMAR_WORD_FORMATION: { label: "단어형성", group: "grammar" },
  GRAMMAR_SENTENCE_STRUCTURE: { label: "문장짜임", group: "grammar" },
  GRAMMAR_PHONEME_CHANGE: { label: "음운변동", group: "grammar" },
  GRAMMAR_POS: { label: "품사", group: "grammar" },
  READING_NONFICTION: { label: "비문학", group: "reading" },
  READING_LITERATURE: { label: "문학", group: "reading" },
  CONTENT_PDF: { label: "내용숙지", group: "content" },
  CONTENT_PDF_QUIZ: { label: "내용숙지", group: "content" },
  BACKGROUND_KNOWLEDGE: { label: "배경", group: "knowledge" },
  BACKGROUND_KNOWLEDGE_QUIZ: { label: "배경퀴즈", group: "knowledge" },
  LANGUAGE_CONCEPT: { label: "개념", group: "knowledge" },
  LANGUAGE_CONCEPT_QUIZ: { label: "개념퀴즈", group: "knowledge" },
  LOGIC_REASONING: { label: "논리", group: "logic" },
  LOGIC_REASONING_QUIZ: { label: "논리퀴즈", group: "logic" },
  CHOICE_JUDGEMENT: { label: "판별", group: "choice" },
  WRITING_DESCRIPTIVE: { label: "서술형", group: "writing" },
  DUEL_QUESTION: { label: "대결", group: "duel" },
};
const getTypeShort = (type) => TYPE_SHORT[type] || { label: type, group: "other" };

/* 레벨 축약 (소1, 프2, 러3, 비1 ...) */
const LEVEL_SHORT = {
  SAUSSURE_1: "소1", SAUSSURE_2: "소2", SAUSSURE_3: "소3",
  FREGE_1: "프1", FREGE_2: "프2", FREGE_3: "프3",
  RUSSELL_1: "러1", RUSSELL_2: "러2", RUSSELL_3: "러3",
  WITTGENSTEIN_1: "비1", WITTGENSTEIN_2: "비2", WITTGENSTEIN_3: "비3",
};
const getLevelShort = (level) => LEVEL_SHORT[level] || level || "-";

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
  const navigate = useNavigate();

  /* 대결 문제 카운트 */
  const DUEL_SERVERS = [
    { id: "saussure", label: "소쉬르" },
    { id: "frege", label: "프레게" },
    { id: "russell", label: "러셀" },
    { id: "wittgenstein", label: "비트겐슈타인" },
  ];
  const [duelCounts, setDuelCounts] = useState({});
  useEffect(() => {
    apiGet("/v1/admin/duel/questions/count")
      .then((data) => setDuelCounts(data || {}))
      .catch(() => {});
  }, []);

  /* DB 콘텐츠 + static 콘텐츠 + 대결 문제 병합 */
  const allContents = useMemo(() => {
    const dbItems = contents.map((c) => ({ ...c, source: "db" }));
    const duelItems = DUEL_SERVERS.map((s) => {
      const c = duelCounts[s.id] || {};
      const total = c.total || 0;
      const quiz = c.quiz || 0;
      const reading = c.reading || 0;
      return {
        id: `duel-${s.id}`,
        title: `대결 문제 - ${s.label}` + (total ? ` (퀴즈 ${quiz}, 독해 ${reading})` : ""),
        type: "DUEL_QUESTION",
        levelId: "",
        chapterId: s.id,
        status: total > 0 ? "active" : "inactive",
        source: "duel",
      };
    });
    return [...STATIC_CONTENTS, ...duelItems, ...dbItems];
  }, [contents, duelCounts]);

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

  /* 행 클릭 → 업로드/편집 페이지 이동 */
  const handleRowClick = (content) => {
    if (content.source === "duel") {
      navigate(`/admin/duel/questions`);
      return;
    }
    const params = new URLSearchParams({ id: content.id });
    if (content.source === "static") params.set("source", "static");
    navigate(`/admin/content/upload?${params.toString()}`);
  };

  /* 서버에 등록된 콘텐츠를 미리보기 (preview API 호출) */
  const handleServerPreview = async (contentId) => {
    if (!contentId) return;
    setPreviewLoadingId(contentId);
    setServerPreviewError("");
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
          <button
            className="admin-detail-btn"
            type="button"
            onClick={() => navigate("/admin/content/upload")}
          >
            콘텐츠 업로드
          </button>
        </div>
        <div className="admin-detail-card" style={{ marginTop: 24 }}>
          <h2>콘텐츠 파이프라인</h2>
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
                <th style={{ width: 70 }}>유형</th>
                <th style={{ width: 40 }}>레벨</th>
                <th style={{ width: 48 }}>상태</th>
                <th style={{ width: 66 }}>관리</th>
              </tr>
            </thead>
            <tbody>
              {pagedContents.length === 0 && !loading ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", color: "var(--admin-muted)" }}>
                    {allContents.length === 0 ? "등록된 콘텐츠가 없습니다." : "검색 결과가 없습니다."}
                  </td>
                </tr>
              ) : null}
              {pagedContents.map((content) => {
                const ts = getTypeShort(content.type);
                const day = extractDay(content.jsonPath);
                return (
                  <tr
                    key={content.id}
                    className="clickable-row"
                    onClick={() => handleRowClick(content)}
                  >
                    <td>
                      {content.title}
                      {day ? <span style={{ color: "var(--admin-muted)", marginLeft: 6, fontSize: 11 }}>{day}</span> : null}
                    </td>
                    <td>
                      <span className="type-pill" data-group={ts.group}>{ts.label}</span>
                    </td>
                    <td>
                      <span className="level-pill">{getLevelShort(content.levelId)}</span>
                    </td>
                    <td>
                      <span className="status-pill" data-status={content.status}>
                        {STATUS_LABEL[content.status] || content.status}
                      </span>
                    </td>
                    <td>
                      {content.source === "duel" ? (
                        <button
                          className="admin-detail-btn secondary"
                          type="button"
                          style={{ padding: "4px 10px", fontSize: "12px" }}
                          onClick={(e) => { e.stopPropagation(); navigate("/admin/duel/questions"); }}
                        >
                          관리
                        </button>
                      ) : (
                        <button
                          className="admin-detail-btn secondary"
                          type="button"
                          style={{ padding: "4px 10px", fontSize: "12px" }}
                          disabled={previewLoadingId === content.id}
                          onClick={(e) => { e.stopPropagation(); handleServerPreview(content.id); }}
                        >
                          {previewLoadingId === content.id ? "..." : "미리보기"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* 페이지네이션 */}
          {totalPages > 1 ? (
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 12 }}>
              <button
                className="admin-detail-btn secondary"
                style={{ fontSize: 12, padding: "4px 10px" }}
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => p - 1)}
              >
                이전
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`admin-detail-btn ${p === safePage ? "" : "secondary"}`}
                  style={{ fontSize: 12, padding: "4px 10px", minWidth: 32 }}
                  onClick={() => setCurrentPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                className="admin-detail-btn secondary"
                style={{ fontSize: 12, padding: "4px 10px" }}
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => p + 1)}
              >
                다음
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminContentPage;
