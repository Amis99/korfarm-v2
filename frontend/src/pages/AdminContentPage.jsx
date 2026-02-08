import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../utils/adminApi";
import { useAdminList } from "../hooks/useAdminList";
import { LEARNING_TEMPLATES } from "../data/learning/learningTemplates";
import AdminLayout from "../components/AdminLayout";
import "../styles/admin-detail.css";

const CONTENTS = [];

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

/* 선택된 모듈에 해당하는 표준 JSON 템플릿 ID (group_subModule) */
const extractTemplateId = (v) => {
  const parts = v.split(":");
  return `${parts[0]}_${parts[1]}`;
};

/* 상태값 정규화 */
const normalizeContentStatus = (status) => {
  if (!status) return "review";
  if (status === "active") return "live";
  return status;
};

/* 상태 한글 라벨 */
const STATUS_LABEL = {
  review: "검토",
  scheduled: "예정",
  live: "배포",
  draft: "초안",
};

/* contentType 한글 라벨 */
const TYPE_LABEL = {
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
  const [jsonText, setJsonText] = useState("");
  const [selectedModule, setSelectedModule] = useState("dailyQuiz:quiz:worksheet_quiz");
  const moduleKey = extractModuleKey(selectedModule);
  const [previewError, setPreviewError] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  /* 서버 콘텐츠 미리보기 상태 */
  const [previewLoadingId, setPreviewLoadingId] = useState(null);
  const [serverPreviewError, setServerPreviewError] = useState("");
  const navigate = useNavigate();

  const filteredContents = useMemo(() => {
    const term = search.trim().toLowerCase();
    return contents.filter((content) => {
      if (statusFilter !== "all" && content.status !== statusFilter) return false;
      if (!term) return true;
      return [content.title, content.type, content.status, content.levelId, content.chapterId]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(term));
    });
  }, [contents, search, statusFilter]);

  /* 서버에 등록된 콘텐츠를 미리보기 (preview API 호출) */
  const handleServerPreview = async (contentId) => {
    if (!contentId) return;
    setPreviewLoadingId(contentId);
    setServerPreviewError("");
    try {
      const preview = await apiGet(`/v1/admin/content/${contentId}/preview`);
      /* EngineShell이 기대하는 형태로 변환 */
      const previewData = {
        contentType: preview.contentType || preview.content_type,
        payload: preview.content,
      };
      localStorage.setItem("korfarm_preview_content", JSON.stringify(previewData));
      /* contentType을 moduleKey로 사용 */
      const mk = preview.contentType || preview.content_type || "worksheet_quiz";
      localStorage.setItem("korfarm_preview_module", mk);
      navigate("/admin/content/preview");
    } catch (err) {
      setServerPreviewError(err.message || "미리보기 데이터를 불러오지 못했습니다.");
    } finally {
      setPreviewLoadingId(null);
    }
  };

  const templateId = extractTemplateId(selectedModule);
  const currentTemplate = LEARNING_TEMPLATES.find((t) => t.id === templateId);

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

  return (
    <AdminLayout>
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>콘텐츠 관리</h1>
        </div>
        <div className="admin-detail-grid">
          <div className="admin-detail-card">
            <h2>콘텐츠 파이프라인</h2>
            <div className="admin-detail-toolbar">
              <div className="admin-detail-search">
                <span className="material-symbols-outlined">search</span>
                <input
                  placeholder="콘텐츠 검색"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="admin-detail-filters">
                {["all", "review", "scheduled", "live"].map((f) => (
                  <button
                    key={f}
                    className={`admin-filter ${statusFilter === f ? "active" : ""}`}
                    type="button"
                    onClick={() => setStatusFilter(f)}
                  >
                    {f === "all" ? "전체" : f === "review" ? "검토" : f === "scheduled" ? "예정" : "배포"}
                  </button>
                ))}
              </div>
            </div>
            {loading ? <p className="admin-detail-note">콘텐츠를 불러오는 중...</p> : null}
            {error ? <p className="admin-detail-note error">{error}</p> : null}
            {serverPreviewError ? <p className="admin-detail-note error">{serverPreviewError}</p> : null}
            <table className="admin-detail-table">
              <thead>
                <tr>
                  <th>제목</th>
                  <th>유형</th>
                  <th>레벨/챕터</th>
                  <th>상태</th>
                  <th style={{ width: "80px" }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {filteredContents.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", color: "var(--admin-muted)" }}>
                      {contents.length === 0 ? "등록된 콘텐츠가 없습니다." : "검색 결과가 없습니다."}
                    </td>
                  </tr>
                ) : null}
                {filteredContents.map((content) => (
                  <tr key={content.id}>
                    <td>{content.title}</td>
                    <td>{TYPE_LABEL[content.type] || content.type}</td>
                    <td>
                      {content.levelId || content.chapterId
                        ? [content.levelId, content.chapterId].filter(Boolean).join(" / ")
                        : "-"}
                    </td>
                    <td>
                      <span className="status-pill" data-status={content.status}>
                        {STATUS_LABEL[content.status] || content.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="admin-detail-btn secondary"
                        type="button"
                        style={{ padding: "4px 10px", fontSize: "12px" }}
                        disabled={previewLoadingId === content.id}
                        onClick={() => handleServerPreview(content.id)}
                      >
                        {previewLoadingId === content.id ? "로딩..." : "미리보기"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-detail-card">
            <h2>학습 JSON 업로드</h2>
            <p>모듈을 선택하고 JSON을 붙여넣은 뒤 미리보기로 확인하세요.</p>
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
            <textarea
              className="admin-json-input"
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              placeholder="JSON을 입력하세요"
              rows={12}
            />
            {previewError ? <p className="admin-detail-note error">{previewError}</p> : null}
            {importMessage ? <p className="admin-detail-note" style={{ color: "#27ae60" }}>{importMessage}</p> : null}
            <div className="admin-detail-actions">
              <button className="admin-detail-btn" type="button" onClick={handlePreview}>
                미리보기
              </button>
              <button
                className="admin-detail-btn"
                type="button"
                onClick={handleImport}
                disabled={importLoading}
              >
                {importLoading ? "등록 중..." : "콘텐츠 등록"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminContentPage;
