import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAdminList } from "../hooks/useAdminList";
import { LEARNING_CATALOG } from "../data/learning/learningCatalog";
import { LEARNING_TEMPLATES } from "../data/learning/learningTemplates";
import "../styles/admin-detail.css";

const CONTENTS = [
  { title: "프로 모드 3챕터", type: "pro_mode", status: "review" },
  { title: "일일 독해 세트 0214", type: "daily_reading", status: "scheduled" },
  { title: "맞춤 리포트", type: "daily_quiz", status: "live" },
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
  if (!status) {
    return "review";
  }
  if (status === "active") {
    return "live";
  }
  return status;
};

const mapContentList = (items) =>
  items.map((content) => ({
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
  const navigate = useNavigate();

  const filteredContents = useMemo(() => {
    const term = search.trim().toLowerCase();
    return contents.filter((content) => {
      if (statusFilter !== "all" && content.status !== statusFilter) {
        return false;
      }
      if (!term) {
        return true;
      }
      return [content.title, content.type, content.status]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term));
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

  return (
    <div className="admin-detail-page">
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>콘텐츠 관리</h1>
          <div className="admin-detail-actions">
            <button className="admin-detail-btn" type="button">
              콘텐츠 등록
            </button>
            <Link className="admin-detail-btn secondary" to="/admin">
              대시보드
            </Link>
          </div>
        </div>
        <div className="admin-detail-nav">
          <Link to="/admin/orgs">기관</Link>
          <Link to="/admin/classes">반</Link>
          <Link to="/admin/students">학생</Link>
          <Link to="/admin/parents">학부모 관리</Link>
          <Link to="/admin/content">콘텐츠</Link>
          <Link to="/admin/assignments">과제</Link>
          <Link to="/admin/seasons">시즌</Link>
          <Link to="/admin/shop/products">상품</Link>
          <Link to="/admin/shop/orders">주문</Link>
          <Link to="/admin/payments">결제</Link>
          <Link to="/admin/reports">보고</Link>
          <Link to="/admin/flags">플래그</Link>
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
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <div className="admin-detail-filters">
                <button
                  className={`admin-filter ${statusFilter === "all" ? "active" : ""}`}
                  type="button"
                  onClick={() => setStatusFilter("all")}
                >
                  전체
                </button>
                <button
                  className={`admin-filter ${statusFilter === "review" ? "active" : ""}`}
                  type="button"
                  onClick={() => setStatusFilter("review")}
                >
                  검토
                </button>
                <button
                  className={`admin-filter ${statusFilter === "scheduled" ? "active" : ""}`}
                  type="button"
                  onClick={() => setStatusFilter("scheduled")}
                >
                  예정
                </button>
                <button
                  className={`admin-filter ${statusFilter === "live" ? "active" : ""}`}
                  type="button"
                  onClick={() => setStatusFilter("live")}
                >
                  배포
                </button>
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
                  <tr key={content.title}>
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
                onChange={(event) => handleTemplateLoad(event.target.value)}
              >
                <option value="">표준 양식 불러오기</option>
                {LEARNING_TEMPLATES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
              <select value={sampleId} onChange={(event) => handleSampleLoad(event.target.value)}>
                <option value="">샘플 불러오기</option>
                {LEARNING_CATALOG.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </select>
              <select value={moduleKey} onChange={(event) => setModuleKey(event.target.value)}>
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
              onChange={(event) => setJsonText(event.target.value)}
              placeholder="JSON을 입력하세요"
              rows={12}
            />
            {previewError ? <p className="admin-detail-note error">{previewError}</p> : null}
            <div className="admin-detail-actions">
              <button className="admin-detail-btn" type="button" onClick={handlePreview}>
                미리보기
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminContentPage;
