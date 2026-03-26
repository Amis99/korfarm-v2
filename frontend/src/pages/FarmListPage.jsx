import { useState, useMemo, useEffect } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  getFarmById,
  getLearningItemsByFarm,
  SUB_AREA_LABELS,
  LEVEL_LABELS,
  SERVERS,
  SERVER_LABELS,
  getServerFromLevel,
  profileLevelToServer,
  levelBelongsToServer,
} from "../data/learning/learningCatalog";
import { apiGet, apiPost } from "../utils/api";
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
  const [areaFilter, setAreaFilter] = useState("");
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

  const staticItems = useMemo(() => getLearningItemsByFarm(farmId), [farmId]);
  const [dbItems, setDbItems] = useState([]);

  // DB 카탈로그에서 해당 농장 콘텐츠 조회
  useEffect(() => {
    if (!farm) return;
    // area 파라미터를 농장 contentTypes의 첫번째로 사용
    const contentTypes = farm.contentTypes || [];
    if (!contentTypes.length) return;
    // 각 contentType별로 DB 콘텐츠 조회
    Promise.all(
      contentTypes.map((ct) =>
        apiGet(`/v1/learning/catalog/${farmId}?contentType=${ct}`).catch(() => [])
      )
    )
      .then((results) => {
        const flat = results.flat();
        // 정적 카탈로그에 이미 있는 contentId는 제외
        const staticIds = new Set(staticItems.map((i) => i.contentId));
        const newItems = flat
          .filter((item) => !staticIds.has(item.contentId))
          .map((item) => ({
            id: item.contentId,
            contentId: item.contentId,
            category: item.area || "",
            title: item.title,
            contentType: item.contentType,
            targetLevel: item.levelId,
            subArea: item.subArea,
            moduleKey: item.moduleKey || "worksheet_quiz",
            videoUrl: item.videoUrl || null,
          }));
        setDbItems(newItems);
      })
      .catch(() => setDbItems([]));
  }, [farmId, farm, staticItems]);

  const allItems = useMemo(() => [...staticItems, ...dbItems], [staticItems, dbItems]);

  // 학습 진행 통계 조회
  useEffect(() => {
    if (!allItems.length) return;
    const contentIds = allItems.map((item) => item.contentId).filter(Boolean);
    if (!contentIds.length) return;
    apiPost("/v1/learning/farm/progress", { content_ids: contentIds })
      .then((data) => setProgress(data))
      .catch((e) => console.error(e));
  }, [allItems]);

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

  // 세부영역 목록 수집
  const subAreas = useMemo(() => {
    const set = new Set();
    allItems.forEach((item) => {
      if (item.subArea) set.add(item.subArea);
    });
    return [...set];
  }, [allItems]);

  // 필터 + 정렬
  const filtered = useMemo(() => {
    let list = [...allItems];
    if (serverFilter) {
      list = list.filter((item) => levelBelongsToServer(item.targetLevel, serverFilter));
    }
    if (areaFilter) {
      list = list.filter((item) => item.subArea === areaFilter);
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
  }, [allItems, serverFilter, areaFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PER_PAGE, currentPage * PER_PAGE);

  // 필터 변경 시 1페이지로
  const handleServerChange = (v) => { setServerFilter(v); setPage(1); };
  const handleAreaChange = (v) => { setAreaFilter(v); setPage(1); };

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
            <span className="farm-banner-count">{allItems.length}개</span> 학습
          </p>
        </div>
      </div>

      {/* 필터바 */}
      <div className="farm-filters">
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
            value={areaFilter}
            onChange={(e) => handleAreaChange(e.target.value)}
          >
            <option value="">전체 영역</option>
            {subAreas.map((sa) => (
              <option key={sa} value={sa}>
                {SUB_AREA_LABELS[sa] || sa}
              </option>
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

      {/* 테이블 */}
      <div className="farm-body">
        {paged.length === 0 ? (
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
                        if (farmId === "content") {
                          setProgressModal(item);
                        } else {
                          navigate(`/learning/${item.id}`);
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
                      navigate(`/learning/${progressModal.id}?startPage=1`);
                    }}
                  >
                    처음부터
                  </button>
                  <button
                    type="button"
                    className="start-btn-primary"
                    onClick={() => {
                      setProgressModal(null);
                      navigate(`/learning/${progressModal.id}?startPage=${(pageProgress.lastCompletedPage || 0) + 1}`);
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
                    navigate(`/learning/${progressModal.id}`);
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
