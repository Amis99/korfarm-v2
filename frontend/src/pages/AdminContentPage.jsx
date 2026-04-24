import { useMemo, useState, useRef, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { apiGet, apiDelete } from "../utils/adminApi";
import { useAdminList } from "../hooks/useAdminList";
import { FARM_MAP } from "../data/learning/learningCatalog";
import { LEARNING_TEMPLATES } from "../data/learning/learningTemplates";
import { Link } from "react-router-dom";
import {
  TYPE_LABEL, TYPE_SHORT, getTypeShort,
  LEVEL_SHORT, getLevelShort,
  LEVEL_LABEL_MAP, getLevelLabel, DAILY_LEVELS,
  TABS, TAB_OPTIONS, CATEGORY_TO_TABS, getCategoryTabs, isManageableContent,
  resolveModuleKeyForContentType,
} from "../constants/contentTypes";
import AdminLayout from "../components/AdminLayout";
import "../styles/admin-detail.css";

const CONTENTS = [];
const PER_PAGE = 20;

/* static JSON 콘텐츠 목록
 * 일일 학습/농장 모드 정적 콘텐츠는 모두 DB로 마이그레이션 또는 폐기됨.
 * 향후 다시 정적 항목이 필요하면 여기에 추가. 현재는 비어있음.
 */
const STATIC_CONTENTS = [];

/* 탭 정의는 contentTypes.js의 TABS / TAB_OPTIONS / CATEGORY_TO_TABS 사용 (다중 분류) */

/* level_id → 4대 레벨 그룹 (대소문자 모두 매칭) */
const getLevelGroup = (levelId) => {
  if (!levelId) return null;
  const lower = levelId.toLowerCase();
  if (lower.startsWith("saussure")) return "saussure";
  if (lower.startsWith("frege")) return "frege";
  if (lower.startsWith("russell")) return "russell";
  if (lower.startsWith("wittgenstein")) return "wittgenstein";
  return null;
};

const LEVEL_GROUPS = [
  { id: "all", label: "전체 레벨" },
  { id: "saussure", label: "소쉬르 (초1~3)" },
  { id: "frege", label: "프레게 (초4~6)" },
  { id: "russell", label: "러셀 (중1~3)" },
  { id: "wittgenstein", label: "비트겐슈타인 (고1~3)" },
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

/* 목록 API 응답 → 테이블 데이터 변환.
   contentType은 이제 array (다중 분류). 단일 string으로 와도 array로 wrapping. */
const normalizeContentTypeArray = (raw) => {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string" && raw.length > 0) return [raw];
  return [];
};
const mapContentList = (items) =>
  items.map((content) => {
    const ctRaw = content.contentType ?? content.content_type ?? content.type ?? null;
    const types = normalizeContentTypeArray(ctRaw);
    return {
      id: content.contentId || content.content_id || content.id || content.title,
      title: content.title,
      types,                        // array
      type: types[0] || "",        // primary (테이블 셀 라벨용)
      levelId: content.levelId || content.level_id || "",
      chapterId: content.chapterId || content.chapter_id || "",
      area: content.area || "",
      status: normalizeContentStatus(content.status),
    };
  });

/* 템플릿 그룹 분류 (글쓰기/내용숙지/프로답안 제외 — 콘텐츠 학습이 아님) */
const TEMPLATE_GROUPS = [
  { label: "일일 학습", ids: ["dailyQuiz_quiz", "daily_reading"] },
  { label: "농장별 학습", ids: [
    "farm_vocab", "farm_reading", "farm_story", "farm_classic",
    "farm_grammar_wf", "farm_grammar_ss", "farm_grammar_pc", "farm_grammar_pos",
    "farm_background", "farm_concept", "farm_logic", "farm_choice_analysis"
  ]},
  { label: "프로 모드", ids: ["pro_reading", "pro_vocab", "pro_background", "pro_logic"] },
];

function AdminContentPage() {
  const { data: contents, loading, error } = useAdminList(
    "/v1/admin/content",
    CONTENTS,
    mapContentList
  );
  /* 필터/페이지를 URL 쿼리 파라미터에 보존 */
  const [params, setParams] = useSearchParams();
  const search = params.get("q") || "";
  const statusFilter = params.get("status") || "all";
  const typeFilter = params.get("type") || "all";
  const tabFilter = params.get("tab") || "daily";  // 일일/농장/프로 (기본 일일)
  const levelGroupFilter = params.get("levelGroup") || "all";
  const sortKey = params.get("sort") || "title";
  const sortDir = params.get("dir") || "asc";
  const currentPage = Number(params.get("page")) || 1;
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const updateParams = (updates) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([k, v]) => {
        if (!v || v === "all" || (k === "page" && v <= 1)) next.delete(k);
        else next.set(k, v);
      });
      return next;
    }, { replace: true });
  };

  /* 검색 입력: 한글 IME 보존을 위해 로컬 state + composition 가드 + 디바운스 */
  const [searchInput, setSearchInput] = useState(search);
  const composingRef = useRef(false);
  const searchDebounceRef = useRef(null);
  // URL → 로컬 state 동기화 (뒤로가기 등 외부 변경 반영)
  useEffect(() => {
    if (!composingRef.current) {
      setSearchInput(search);
    }
  }, [search]);
  // 컴포넌트 unmount 시 디바운스 정리
  useEffect(() => () => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
  }, []);
  /* 서버 콘텐츠 미리보기 상태 */
  const [previewLoadingId, setPreviewLoadingId] = useState(null);
  const [serverPreviewError, setServerPreviewError] = useState("");
  /* 표준 양식 드롭다운 */
  const [showTemplatePanel, setShowTemplatePanel] = useState(false);
  const templatePanelRef = useRef(null);
  const navigate = useNavigate();

  /* 현재 필터 상태를 from 파라미터로 인코딩 */
  const fromParam = encodeURIComponent(`/admin/content${params.toString() ? `?${params.toString()}` : ""}`);

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

  /* DB 콘텐츠 + static 콘텐츠 병합 + 학습 콘텐츠가 아닌 것 자동 제외 */
  const allContents = useMemo(() => {
    const dbItems = contents.map((c) => ({ ...c, source: "db" }));
    return [...STATIC_CONTENTS, ...dbItems].filter((c) => isManageableContent(c.types));
  }, [contents]);

  /* 통계 (요약 카드용) */
  const stats = useMemo(() => {
    const total = allContents.length;
    const active = allContents.filter((c) => c.status === "active").length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [allContents]);

  /* 탭별 카운트 (한 콘텐츠가 여러 탭에 동시 카운트될 수 있음 — 다중 분류 특성) */
  const tabCounts = useMemo(() => {
    const counts = {};
    for (const tab of TABS) counts[tab.id] = 0;
    for (const c of allContents) {
      const tabs = getCategoryTabs(c.types);
      for (const t of tabs) counts[t] = (counts[t] || 0) + 1;
    }
    return counts;
  }, [allContents]);

  const filteredContents = useMemo(() => {
    const term = search.trim().toLowerCase();
    let result = allContents.filter((content) => {
      if (statusFilter !== "all" && content.status !== statusFilter) return false;
      // 탭 필터 — 콘텐츠의 카테고리 array 중 하나라도 현재 탭에 매핑되면 통과
      const tabs = getCategoryTabs(content.types);
      if (!tabs.includes(tabFilter)) return false;
      // 레벨 그룹
      if (levelGroupFilter !== "all") {
        if (getLevelGroup(content.levelId) !== levelGroupFilter) return false;
      }
      // 드롭다운 옵션 (탭 종속) — 콘텐츠의 카테고리 array 중 하나라도 옵션값과 일치
      if (typeFilter !== "all") {
        if (!content.types.includes(typeFilter)) return false;
      }
      if (!term) return true;
      const typesStr = (content.types || []).join(" ");
      return [content.title, typesStr, content.status, content.levelId, content.chapterId]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(term));
    });
    // 정렬
    const dir = sortDir === "desc" ? -1 : 1;
    const cmp = (a, b) => {
      const va = (a[sortKey] ?? "").toString().toLowerCase();
      const vb = (b[sortKey] ?? "").toString().toLowerCase();
      if (va < vb) return -1 * dir;
      if (va > vb) return 1 * dir;
      return 0;
    };
    result = [...result].sort(cmp);
    return result;
  }, [allContents, search, statusFilter, typeFilter, tabFilter, levelGroupFilter, sortKey, sortDir]);

  /* 페이지네이션 계산 */
  const totalPages = Math.max(1, Math.ceil(filteredContents.length / PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedContents = filteredContents.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  /* 정렬 핸들러 */
  const handleSort = (key) => {
    if (sortKey === key) {
      updateParams({ dir: sortDir === "asc" ? "desc" : "asc" });
    } else {
      updateParams({ sort: key, dir: "asc" });
    }
  };
  const sortIcon = (key) => {
    if (sortKey !== key) return "";
    return sortDir === "asc" ? " ▲" : " ▼";
  };

  /* 체크박스 + 벌크 액션 */
  const togglePageSelectAll = () => {
    const next = new Set(selectedIds);
    const allChecked = pagedContents.every((c) => next.has(c.id));
    if (allChecked) {
      pagedContents.forEach((c) => next.delete(c.id));
    } else {
      pagedContents.forEach((c) => next.add(c.id));
    }
    setSelectedIds(next);
  };
  const toggleSelectOne = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };
  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`${selectedIds.size}개 콘텐츠를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
    let ok = 0, fail = 0;
    for (const id of selectedIds) {
      try {
        await apiDelete(`/v1/admin/content/${id}`);
        ok++;
      } catch {
        fail++;
      }
    }
    alert(`삭제 완료: 성공 ${ok}건, 실패 ${fail}건`);
    setSelectedIds(new Set());
    window.location.reload();
  };

  /* 필터 변경 시 1페이지 리셋 */
  const handleStatusFilter = (f) => updateParams({ status: f, page: "" });
  const handleTypeFilter = (e) => updateParams({ type: e.target.value, page: "" });
  const commitSearch = (value) => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      updateParams({ q: value, page: "" });
    }, 300);
  };
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    // IME composition 중에는 URL 업데이트 보류 → composition 끝나면 commit
    if (!composingRef.current) {
      commitSearch(value);
    }
  };
  const handleSearchCompositionStart = () => {
    composingRef.current = true;
  };
  const handleSearchCompositionEnd = (e) => {
    composingRef.current = false;
    commitSearch(e.target.value);
  };

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
        moduleKey = resolveModuleKeyForContentType(fileData.contentType, content.moduleKey);
      } else {
        const preview = await apiGet(`/v1/admin/content/${content.id}/preview`);
        // contentType은 이제 array (다중 분류). string으로 와도 wrap.
        const ctRaw = preview.contentType ?? preview.content_type ?? "";
        const ct = Array.isArray(ctRaw) ? ctRaw : (ctRaw ? [ctRaw] : []);
        const rawContent = preview.content || {};
        // rawContent는 표준 양식 inner JSON (contentId, title, payload: {...} 등 포함)
        // 일일학습/독해는 rawContent.payload에 실제 학습 데이터, 그 외는 rawContent 자체가 payload
        const innerPayload = rawContent.payload != null ? rawContent.payload : rawContent;
        previewData = {
          contentType: ct,
          targetLevel: preview.levelId || preview.level_id || rawContent.targetLevel || "",
          area: preview.area || rawContent.area || "",
          subArea: preview.subArea || preview.sub_area || rawContent.subArea || "",
          title: preview.title || rawContent.title || "",
          timeLimitSec: rawContent.timeLimitSec ?? rawContent.time_limit_sec,
          seedReward: rawContent.seedReward || rawContent.seed_reward,
          assets: rawContent.assets,
          payload: innerPayload,
        };
        moduleKey = resolveModuleKeyForContentType(
          [...ct, rawContent.contentType || rawContent.content_type].filter(Boolean),
          preview.moduleKey || preview.module_key
        );
      }
      localStorage.setItem("korfarm_preview_content", JSON.stringify(previewData));
      localStorage.setItem("korfarm_preview_module", moduleKey);
      navigate(`/admin/content/preview?from=${fromParam}`);
    } catch (err) {
      setServerPreviewError(err.message || "미리보기 데이터를 불러오지 못했습니다.");
    } finally {
      setPreviewLoadingId(null);
    }
  };

  /* 콘텐츠 삭제 */
  const handleDeleteContent = async (content) => {
    if (!window.confirm(`"${content.title}" 콘텐츠를 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`)) return;
    try {
      await apiDelete(`/v1/admin/content/${content.id}`);
      window.location.reload();
    } catch (err) {
      alert(`삭제 실패: ${err.message}`);
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
                    const items = LEARNING_TEMPLATES.filter((t) => group.ids.includes(t.id));
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
        {/* 요약 카드 */}
        <div className="admin-content-stats">
          <div className="admin-content-stat-card">
            <div className="admin-content-stat-label">전체</div>
            <div className="admin-content-stat-value">{stats.total.toLocaleString()}</div>
          </div>
          <div className="admin-content-stat-card active">
            <div className="admin-content-stat-label">활성</div>
            <div className="admin-content-stat-value">{stats.active.toLocaleString()}</div>
          </div>
          <div className="admin-content-stat-card inactive">
            <div className="admin-content-stat-label">비활성</div>
            <div className="admin-content-stat-value">{stats.inactive.toLocaleString()}</div>
          </div>
        </div>

        {/* 탭: 일일 학습 / 농장별 학습 / 프로 모드 */}
        <div className="admin-content-farm-tabs">
          {TABS.map((tab) => {
            const active = tabFilter === tab.id;
            const count = tabCounts[tab.id] ?? 0;
            return (
              <button
                key={tab.id}
                type="button"
                className={`admin-content-farm-tab ${active ? "active" : ""}`}
                onClick={() => updateParams({ tab: tab.id, type: "", page: "" })}
              >
                <span className="admin-content-farm-icon">{tab.icon}</span>
                <span className="admin-content-farm-label">{tab.label}</span>
                <span className="admin-content-farm-count">{count.toLocaleString()}</span>
              </button>
            );
          })}
        </div>

        <div className="admin-detail-card admin-single-card edit-mode">
          <div className="admin-detail-toolbar admin-content-toolbar">
            <div className="admin-detail-search">
              <span className="material-symbols-outlined">search</span>
              <input
                placeholder="제목·유형·레벨 검색"
                value={searchInput}
                onChange={handleSearchChange}
                onCompositionStart={handleSearchCompositionStart}
                onCompositionEnd={handleSearchCompositionEnd}
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
                value={levelGroupFilter}
                onChange={(e) => updateParams({ levelGroup: e.target.value, page: "" })}
                className="admin-type-filter-select"
              >
                {LEVEL_GROUPS.map((g) => (
                  <option key={g.id} value={g.id}>{g.label}</option>
                ))}
              </select>
              <select
                value={typeFilter}
                onChange={handleTypeFilter}
                className="admin-type-filter-select"
              >
                <option value="all">세부 유형: 전체</option>
                {(TAB_OPTIONS[tabFilter] || []).map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 벌크 액션 바 */}
          {selectedIds.size > 0 && (
            <div className="admin-content-bulk-bar">
              <span className="admin-content-bulk-count">{selectedIds.size}개 선택됨</span>
              <button type="button" className="admin-detail-btn danger" onClick={handleBulkDelete}>
                🗑 일괄 삭제
              </button>
              <button type="button" className="admin-detail-btn secondary" onClick={() => setSelectedIds(new Set())}>
                선택 해제
              </button>
            </div>
          )}
          {loading ? <p className="admin-detail-note">콘텐츠를 불러오는 중...</p> : null}
          {error ? <p className="admin-detail-note error">{error}</p> : null}
          {serverPreviewError ? <p className="admin-detail-note error">{serverPreviewError}</p> : null}
          <table className="admin-detail-table">
            <thead>
              <tr>
                <th className="admin-th-checkbox">
                  <input
                    type="checkbox"
                    checked={pagedContents.length > 0 && pagedContents.every((c) => selectedIds.has(c.id))}
                    onChange={togglePageSelectAll}
                    title="현재 페이지 전체 선택"
                  />
                </th>
                <th className="admin-th-sortable" onClick={() => handleSort("title")} style={{ cursor: "pointer" }}>
                  제목{sortIcon("title")}
                </th>
                <th className="admin-th-type admin-th-sortable" onClick={() => handleSort("type")} style={{ cursor: "pointer" }}>
                  유형{sortIcon("type")}
                </th>
                <th className="admin-th-level admin-th-sortable" onClick={() => handleSort("levelId")} style={{ cursor: "pointer" }}>
                  레벨{sortIcon("levelId")}
                </th>
                <th className="admin-th-type">농장</th>
                <th className="admin-th-status admin-th-sortable" onClick={() => handleSort("status")} style={{ cursor: "pointer" }}>
                  상태{sortIcon("status")}
                </th>
                <th className="admin-th-actions">관리</th>
              </tr>
            </thead>
            <tbody>
              {pagedContents.length === 0 && !loading ? (
                <tr>
                  <td colSpan={7} className="admin-content-status-cell">
                    {allContents.length === 0 ? "등록된 콘텐츠가 없습니다." : "검색 결과가 없습니다."}
                  </td>
                </tr>
              ) : null}
              {pagedContents.map((content) => {
                const types = content.types || [];
                const ts = getTypeShort(types[0] || content.type);
                const day = extractDay(content.jsonPath);
                const levelFull = LEVEL_LABEL_MAP[content.levelId] || content.levelId || "";
                const typeFull = types.map((t) => TYPE_LABEL[t] || t).join(" · ");
                return (
                  <tr key={content.id}>
                    <td className="admin-th-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(content.id)}
                        onChange={() => toggleSelectOne(content.id)}
                      />
                    </td>
                    <td>
                      <Link
                        to={`/admin/content/edit?id=${content.id}${content.source === "static" ? `&source=static&jsonPath=${encodeURIComponent(content.jsonPath)}&type=${encodeURIComponent(content.type)}&title=${encodeURIComponent(content.title)}` : ""}&from=${fromParam}`}
                        className="admin-content-title-link"
                        title={content.title}
                      >
                        {content.title}
                      </Link>
                      {day ? <span className="admin-content-day">{day}</span> : null}
                    </td>
                    <td>
                      <span className="type-pill admin-tooltip-wrap" data-group={ts.group}>
                        {ts.label}{types.length > 1 ? ` +${types.length - 1}` : ""}
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
                      <span className="type-pill" style={{ fontSize: 11 }}>
                        {FARM_MAP[content.area]?.name || content.area || "-"}
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
                            const params = new URLSearchParams({ id: content.id, mode: "json", from: fromParam });
                            if (content.source === "static") {
                              params.set("source", "static");
                              params.set("jsonPath", content.jsonPath);
                              params.set("type", content.type);
                              params.set("title", content.title);
                            }
                            navigate(`/admin/content/edit?${params.toString()}`);
                          }}
                        >
                          {"{ }"}
                          <span className="admin-tooltip">JSON 편집</span>
                        </button>
                        <button
                          className="admin-icon-btn admin-tooltip-wrap"
                          type="button"
                          style={{ color: "#e04040" }}
                          onClick={() => handleDeleteContent(content)}
                        >
                          🗑
                          <span className="admin-tooltip">삭제</span>
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
              <button disabled={safePage <= 1} onClick={() => updateParams({ page: "" })} title="처음">&laquo;</button>
              <button disabled={safePage <= 1} onClick={() => updateParams({ page: safePage - 1 })} title="이전">&lsaquo;</button>
              {(() => {
                const winStart = Math.max(1, safePage - 4);
                const winEnd = Math.min(totalPages, winStart + 9);
                const adjustedStart = Math.max(1, winEnd - 9);
                return Array.from({ length: winEnd - adjustedStart + 1 }, (_, i) => adjustedStart + i).map((p) => (
                  <button
                    key={p}
                    className={p === safePage ? "active" : ""}
                    onClick={() => updateParams({ page: p })}
                  >
                    {p}
                  </button>
                ));
              })()}
              <button disabled={safePage >= totalPages} onClick={() => updateParams({ page: safePage + 1 })} title="다음">&rsaquo;</button>
              <button disabled={safePage >= totalPages} onClick={() => updateParams({ page: totalPages })} title="마지막">&raquo;</button>
            </div>
          ) : null}
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminContentPage;
