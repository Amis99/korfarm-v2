import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiPost } from "../utils/adminApi";
import { useAdminList } from "../hooks/useAdminList";
import { LEARNING_CATALOG } from "../data/learning/learningCatalog";
import { LEARNING_TEMPLATES } from "../data/learning/learningTemplates";
import AdminLayout from "../components/AdminLayout";
import "../styles/admin-detail.css";

const CONTENTS = [
  { title: "프로 모드 3챕터", type: "pro_mode", status: "review" },
];

const MODULE_OPTIONS = [
  { key: "worksheet_quiz", label: "공통 퀴즈형" },
  { key: "reading_intensive", label: "정독 훈련" },
  { key: "reading_training", label: "Reading Training" },
  { key: "recall_cards", label: "복기 카드" },
  { key: "confirm_click", label: "확인 학습 클릭" },
  { key: "choice_judgement", label: "선택지 판별" },
  { key: "phoneme_change", label: "음운 변동" },
  { key: "word_formation", label: "단어 형성" },
  { key: "sentence_structure", label: "문장 짜임" },
];

const normalizeContentStatus = (status) => {
  if (!status) return "review";
  if (status === "active") return "live";
  return status;
};

const mapContentList = (items) =>
  items.map((content) => ({
    id: content.id || content.content_id || content.title,
    title: content.title,
    type: content.content_type || content.contentType,
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
  const [moduleKey, setModuleKey] = useState("worksheet_quiz");
  const [sampleId, setSampleId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [previewError, setPreviewError] = useState("");
  const [importLoading, setImportLoading] = useState(false);
  const [importMessage, setImportMessage] = useState("");
  const navigate = useNavigate();

  const filteredContents = useMemo(() => {
    const term = search.trim().toLowerCase();
    return contents.filter((content) => {
      if (statusFilter !== "all" && content.status !== statusFilter) return false;
      if (!term) return true;
      return [content.title, content.type, content.status]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(term));
    });
  }, [contents, search, statusFilter]);

  const handleSampleLoad = (value) => {
    setSampleId(value);
    setTemplateId("");
    const sample = LEARNING_CATALOG.find((item) => item.id === value);
    if (!sample) return;
    setModuleKey(sample.moduleKey);
    setJsonText(JSON.stringify(sample.content, null, 2));
    setPreviewError("");
  };

  const handleTemplateLoad = (value) => {
    setTemplateId(value);
    setSampleId("");
    const template = LEARNING_TEMPLATES.find((item) => item.id === value);
    if (!template) return;
    setModuleKey(template.moduleKey);
    setJsonText(JSON.stringify(template.content, null, 2));
    setPreviewError("");
  };

  const handlePreview = () => {
    setPreviewError("");
    if (!jsonText.trim()) {
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
    if (!jsonText.trim()) {
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
            <table className="admin-detail-table">
              <thead>
                <tr>
                  <th>제목</th>
                  <th>유형</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {filteredContents.map((content) => (
                  <tr key={content.id}>
                    <td>{content.title}</td>
                    <td>{content.type}</td>
                    <td>
                      <span className="status-pill" data-status={content.status}>
                        {content.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-detail-card">
            <h2>학습 JSON 업로드</h2>
            <p>샘플을 불러오거나 JSON을 붙여넣고 미리보기로 확인하세요.</p>
            <div className="admin-detail-toolbar">
              <select
                value={templateId}
                onChange={(e) => handleTemplateLoad(e.target.value)}
              >
                <option value="">표준 양식 불러오기</option>
                {LEARNING_TEMPLATES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
              <select value={sampleId} onChange={(e) => handleSampleLoad(e.target.value)}>
                <option value="">샘플 불러오기</option>
                {LEARNING_CATALOG.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
              <select value={moduleKey} onChange={(e) => setModuleKey(e.target.value)}>
                {MODULE_OPTIONS.map((option) => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
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
