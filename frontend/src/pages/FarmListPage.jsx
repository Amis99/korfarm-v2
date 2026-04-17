import { useState, useMemo, useEffect, useCallback } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  getFarmById,
  SUB_AREA_LABELS,
  LEVEL_LABELS,
  SERVERS,
  SERVER_LABELS,
  getServerFromLevel,
  profileLevelToServer,
  levelBelongsToServer,
} from "../data/learning/learningCatalog";
import { apiGet, apiPost } from "../utils/api";
import { TYPE_LABEL, getCategoriesForFarm } from "../constants/contentTypes";
import VideoModal from "../components/VideoModal";
import "../styles/farm-mode.css";
import "../styles/start.css";
import "../styles/video-modal.css";

const STATUS_LABELS = {
  NONE: "학습전",
  STARTED: "진행중",
  COMPLETED: "완료",
};

const STATUS_CLASS = {
  NONE: "none",
  STARTED: "started",
  COMPLETED: "completed",
};

const PER_PAGE = 20;

function FarmListPage() {
  const { farmId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const farm = getFarmById(farmId);

  // URL query param 또는 프로필 서버로 초기값 설정
  const urlServer = searchParams.get("server") || "";
  const [serverFilter, setServerFilter] = useState(urlServer);
  const [profileLevelApplied, setProfileLevelApplied] = useState(Boolean(urlServer));
  const [subAreaFilter, setSubAreaFilter] = useState("");
  const [contentTypeFilter, setContentTypeFilter] = useState("");
  const [searchText, setSearchText] = useState("");
  const [searchDebounced, setSearchDebounced] = useState("");
  const [sort, setSort] = useState("title");
  const [page, setPage] = useState(1);
  const [progress, setProgress] = useState(null);
  const [progressModal, setProgressModal] = useState(null);
  const [pageProgress, setPageProgress] = useState(null);
  const [pageProgressLoading, setPageProgressLoading] = useState(false);
  const [pageProgressError, setPageProgressError] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);

  // URL에 server가 없으면 프로필 서버를 기본값으로 설정
  useEffect(() => {
    if (profileLevelApplied) return;
    apiGet("/v1/auth/me")
      .then((profile) => {
        const raw = profile.level_id || profile.levelId || "";
        const server = profileLevelToServer(raw);
        if (SERVERS.includes(server)) setServerFilter(server);
        setProfileLevelApplied(true);
      })
      .catch(() => setProfileLevelApplied(true));
  }, [profileLevelApplied]);

  // 검색 디바운스
  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(searchText), 300);
    return () => clearTimeout(timer);
  }, [searchText]);

  // DB 카탈로그에서 해당 농장 콘텐츠 조회
  const [dbItems, setDbItems] = useState([]);
  const [dbLoading, setDbLoading] = useState(false);

  useEffect(() => {
    if (!farm) return;
    setDbLoading(true);
    // 내용 숙지 농장은 study_contents API 사용
    if (farmId === "content") {
      apiGet("/v1/learning/study/contents")
        .then((data) => {
          const items = (Array.isArray(data) ? data : []).map((item) => ({
            id: item.id,
            contentId: item.id,
            title: item.title,
            contentType: "STUDY_CONTENT",
            targetLevel: item.levelId,
            subArea: "STUDY_CONTENT",
            moduleKey: "study_content",
            videoUrl: null,
            isStudyContent: true,
            questionCount: item.questionCount,
            seenRatio: item.seenRatio,
            accuracy: item.accuracy,
            totalSessions: item.totalSessions,
          }));
          setDbItems(items);
        })
        .catch(() => setDbItems([]))
        .finally(() => setDbLoading(false));
      return;
    }
    const params = new URLSearchParams();
    if (serverFilter) {
      // levelId 필터: 서버별 레벨 범위 (예: RUSSELL → RUSSELL_1, RUSSELL_2, RUSSELL_3)
    }
    if (searchDebounced) params.set("search", searchDebounced);
    if (subAreaFilter) params.set("subArea", subAreaFilter);
    // 다중 카테고리 매칭: 사용자가 유형 필터 선택 시 그 값만 사용,
    // 미선택 시 농장 ID에 매핑된 categories 전체를 콤마로 묶어 전달.
    // 백엔드는 JSON_OVERLAPS로 categories(JSON 배열)에서 OR 매칭하므로
    // 한 콘텐츠가 여러 농장에 동시 노출됨 (예: categories=["READING","STORY"]).
    if (contentTypeFilter) {
      params.set("contentType", contentTypeFilter);
    } else {
      const farmCategories = getCategoriesForFarm(farmId);
      if (farmCategories.length > 0) {
        params.set("contentType", farmCategories.join(","));
      }
    }
    const qs = params.toString();
    const url = `/v1/learning/catalog/${farmId}${qs ? `?${qs}` : ""}`;
    apiGet(url)
      .then((data) => {
        const items = (Array.isArray(data) ? data : []).map((item) => ({
          id: item.contentId,
          contentId: item.contentId,
          title: item.title,
          contentType: item.contentType,
          targetLevel: item.levelId,
          subArea: item.subArea,
          moduleKey: item.moduleKey || "worksheet_quiz",
          videoUrl: item.videoUrl || null,
        }));
        setDbItems(items);
      })
      .catch(() => setDbItems([]))
      .finally(() => setDbLoading(false));
  }, [farmId, farm, searchDebounced, subAreaFilter, contentTypeFilter]);

  // 학습 진행 통계 조회
  useEffect(() => {
    if (!dbItems.length) return;
    const contentIds = dbItems.map((item) => item.contentId).filter(Boolean);
    if (!contentIds.length) return;
    apiPost("/v1/learning/farm/progress", { content_ids: contentIds })
      .then((data) => setProgress(data))
      .catch((e) => console.error(e));
  }, [dbItems]);

  // progressModal이 열릴 때 page-progress API 호출
  useEffect(() => {
    if (!progressModal) {
      setPageProgress(null);
      return;
    }
    setPageProgressLoading(true);
    setPageProgressError(false);
    apiPost("/v1/learning/farm/page-progress", {
      contentId: progressModal.contentId,
    })
      .then((res) => {
        setPageProgress(res?.data || res);
        setPageProgressLoading(false);
      })
      .catch(() => {
        setPageProgress(null);
        setPageProgressError(true);
        setPageProgressLoading(false);
      });
  }, [progressModal]);

  // 세부영역 + 콘텐츠유형 목록 수집
  const subAreas = useMemo(() => {
    const set = new Set();
    dbItems.forEach((item) => { if (item.subArea) set.add(item.subArea); });
    return [...set];
  }, [dbItems]);

  const contentTypes = useMemo(() => {
    const set = new Set();
    dbItems.forEach((item) => { if (item.contentType) set.add(item.contentType); });
    return [...set];
  }, [dbItems]);

  // 필터 + 정렬
  const filtered = useMemo(() => {
    let list = [...dbItems];
    if (serverFilter) {
      list = list.filter((item) => levelBelongsToServer(item.targetLevel, serverFilter));
    }
    list.sort((a, b) => {
      if (sort === "title") return a.title.localeCompare(b.title, "ko");
      if (sort === "level") {
        const ai = SERVERS.indexOf(getServerFromLevel(a.targetLevel));
        const bi = SERVERS.indexOf(getServerFromLevel(b.targetLevel));
        return ai - bi;
      }
      if (sort === "type") return (a.contentType || "").localeCompare(b.contentType || "");
      return 0;
    });
    return list;
  }, [dbItems, serverFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  // 필터 변경 시 1페이지로
  const handleServerChange = (v) => { setServerFilter(v); setPage(1); };
  const handleSubAreaChange = (v) => { setSubAreaFilter(v); setPage(1); };
  const handleContentTypeChange = (v) => { setContentTypeFilter(v); setPage(1); };

  if (!farm) {
    return (
      <div className="farm">
        <div className="farm-topbar">
          <div className="farm-topbar-inner">
            <Link to="/farm-mode" className="farm-back">
              <span className="material-symbols-outlined">arrow_back</span>
              돌아가기
            </Link>
            <h1 className="farm-topbar-title">농장을 찾을 수 없습니다</h1>
          </div>
        </div>
        <div className="farm-empty">
          <div className="farm-empty-icon">🔍</div>
          <p>존재하지 않는 농장입니다.</p>
          <Link to="/farm-mode" className="farm-empty-back">
            농장 목록으로 돌아가기
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="farm">
      {/* 상단바 */}
      <div className="farm-topbar">
        <div className="farm-topbar-inner">
          <Link to="/farm-mode" className="farm-back">
            <span className="material-symbols-outlined">arrow_back</span>
            돌아가기
          </Link>
          <h1 className="farm-topbar-title">{farm.name}</h1>
        </div>
      </div>

      {/* 배너 */}
      <div className="farm-banner">
        <div className="farm-banner-icon">{farm.emoji}</div>
        <div className="farm-banner-info">
          <h2>{farm.name}</h2>
          <p>
            {farm.description} · 총{" "}
            <span className="farm-banner-count">{filtered.length}개</span> 학습
          </p>
        </div>
      </div>

      {/* 검색바 */}
      <div className="farm-filters" style={{ flexDirection: "column", gap: 8 }}>
        <div style={{ display: "flex", gap: 8, width: "100%", alignItems: "center" }}>
          <span className="material-symbols-outlined" style={{ color: "#8a9e8d" }}>search</span>
          <input
            type="text"
            className="farm-filter-select"
            style={{ flex: 1, minWidth: 0 }}
            placeholder="제목 검색..."
            value={searchText}
            onChange={(e) => { setSearchText(e.target.value); setPage(1); }}
          />
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <select
            className="farm-filter-select"
            value={serverFilter}
            onChange={(e) => handleServerChange(e.target.value)}
          >
            <option value="">전체 서버</option>
            {SERVERS.map((sv) => (
              <option key={sv} value={sv}>
                {SERVER_LABELS[sv]}
              </option>
            ))}
          </select>

          {subAreas.length > 1 && (
            <select
              className="farm-filter-select"
              value={subAreaFilter}
              onChange={(e) => handleSubAreaChange(e.target.value)}
            >
              <option value="">전체 영역</option>
              {subAreas.map((sa) => (
                <option key={sa} value={sa}>
                  {SUB_AREA_LABELS[sa] || sa}
                </option>
              ))}
            </select>
          )}

          {contentTypes.length > 1 && (
            <select
              className="farm-filter-select"
              value={contentTypeFilter}
              onChange={(e) => handleContentTypeChange(e.target.value)}
            >
              <option value="">전체 유형</option>
              {contentTypes.map((ct) => (
                <option key={ct} value={ct}>{TYPE_LABEL[ct] || ct}</option>
              ))}
            </select>
          )}

          <select
            className="farm-filter-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="title">제목순</option>
            <option value="level">레벨순</option>
            <option value="type">유형순</option>
          </select>
        </div>
      </div>

      {/* 테이블 */}
      <div className="farm-body">
        {dbLoading ? (
          <div className="farm-empty">
            <p>불러오는 중...</p>
          </div>
        ) : paged.length === 0 ? (
          <div className="farm-empty">
            <div className="farm-empty-icon">📭</div>
            <p>조건에 맞는 학습이 없습니다.</p>
          </div>
        ) : (
          <>
            <table className="farm-table">
              <thead>
                <tr>
                  <th className="farm-th-num">#</th>
                  <th>제목</th>
                  <th className="farm-th-level">레벨</th>
                  <th className="farm-th-area">영역</th>
                  <th className="farm-th-count">학습수</th>
                  <th className="farm-th-count">완료</th>
                  <th className="farm-th-status">상태</th>
                  <th className="farm-th-video">영상</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((item, idx) => {
                  const rowNum = (currentPage - 1) * PER_PAGE + idx + 1;
                  const level = item.targetLevel;
                  const subArea = item.subArea;
                  const cid = item.contentId;
                  const stats = progress?.stats?.[cid];
                  const myStatus = progress?.myStatus?.[cid]?.status || "NONE";
                  return (
                    <tr
                      key={item.id}
                      className="farm-row"
                      onClick={() => {
                        if (item.isStudyContent) {
                          navigate(`/study-learning/${item.contentId}`);
                        } else if (farmId === "content") {
                          setProgressModal(item);
                        } else {
                          navigate(`/learning/${item.contentId}`);
                        }
                      }}
                    >
                      <td className="farm-td-num">{rowNum}</td>
                      <td className="farm-td-title">{item.title}</td>
                      <td className="farm-td-level">
                        {LEVEL_LABELS[level] || level || "-"}
                      </td>
                      <td className="farm-td-area">
                        {SUB_AREA_LABELS[subArea] || subArea || "-"}
                      </td>
                      <td className="farm-td-count">
                        {stats?.startCount ?? 0}
                      </td>
                      <td className="farm-td-count">
                        {stats?.completeCount ?? 0}
                      </td>
                      <td className="farm-td-status">
                        <span
                          className={`farm-status-badge ${STATUS_CLASS[myStatus] || "none"}`}
                        >
                          {STATUS_LABELS[myStatus] || "학습전"}
                        </span>
                      </td>
                      <td className="farm-td-video">
                        <button
                          className="video-play-btn"
                          title={item.videoUrl ? "영상 보기" : "영상 없음"}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (item.videoUrl) setVideoUrl(item.videoUrl);
                          }}
                          disabled={!item.videoUrl}
                        >
                          <span className="material-symbols-outlined">play_circle</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="farm-paging">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  이전
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (num) => (
                    <button
                      key={num}
                      className={num === currentPage ? "active" : ""}
                      onClick={() => setPage(num)}
                    >
                      {num}
                    </button>
                  )
                )}
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {videoUrl && (
        <VideoModal url={videoUrl} onClose={() => setVideoUrl(null)} />
      )}

      {progressModal && (
        <div className="result-overlay" onClick={() => setProgressModal(null)}>
          <div className="result-card farm-progress-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="farm-progress-title">{progressModal.title}</h3>
            {pageProgressLoading ? (
              <p className="farm-progress-loading">불러오는 중...</p>
            ) : pageProgress ? (
              <>
                <p className="farm-progress-page-count">
                  {pageProgress.lastCompletedPage || 0} 페이지 완료
                </p>
                <div className="progress-bar farm-progress-bar">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${Math.min(100, ((pageProgress.lastCompletedPage || 0) / (pageProgress.pageResults?.length || 1)) * 100)}%` }}
                  />
                </div>
                {pageProgress.pageResults?.length > 0 && (
                  <div className="farm-progress-results">
                    {pageProgress.pageResults.map((r) => (
                      <div key={r.pageNo} className="farm-progress-row">
                        <span>{r.pageNo}페이지</span>
                        <span>정확도 {r.accuracy}% · 씨앗 {r.earnedSeed}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="farm-progress-actions">
                  <button
                    type="button"
                    className="start-btn-secondary"
                    onClick={() => {
                      setProgressModal(null);
                      navigate(`/learning/${progressModal.contentId}?startPage=1`);
                    }}
                  >
                    처음부터
                  </button>
                  <button
                    type="button"
                    className="start-btn-primary"
                    onClick={() => {
                      setProgressModal(null);
                      navigate(`/learning/${progressModal.contentId}?startPage=${(pageProgress.lastCompletedPage || 0) + 1}`);
                    }}
                  >
                    이어서 학습
                  </button>
                </div>
              </>
            ) : (
              <div className="farm-progress-actions">
                {pageProgressError && (
                  <p style={{ color: "#c0564e", fontSize: 13, marginBottom: 8 }}>
                    진행 정보를 불러오지 못했습니다.
                  </p>
                )}
                <button
                  type="button"
                  className="start-btn-primary"
                  onClick={() => {
                    setProgressModal(null);
                    navigate(`/learning/${progressModal.contentId}`);
                  }}
                >
                  학습 시작
                </button>
              </div>
            )}
            <button
              type="button"
              className="start-btn-ghost"
              onClick={() => setProgressModal(null)}
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default FarmListPage;
