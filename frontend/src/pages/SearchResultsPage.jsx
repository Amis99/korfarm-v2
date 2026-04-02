import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiGet } from "../utils/api";
import SearchBar from "../components/SearchBar";
import "../styles/start.css";
import { TYPE_LABEL } from "../constants/contentTypes";

const CONTENT_TYPE_LABELS = {
  daily_quiz: "일일퀴즈",
  daily_reading: "일일독해",
  pro_mode: "프로모드",
  farm_mode: "농장모드",
  ...TYPE_LABEL,
};

const LEVEL_LABEL_MAP = {
  saussure1: "소쉬르 1", saussure2: "소쉬르 2", saussure3: "소쉬르 3",
  frege1: "프레게 1", frege2: "프레게 2", frege3: "프레게 3",
  russell1: "러셀 1", russell2: "러셀 2", russell3: "러셀 3",
};

const FILTER_TABS = [
  { value: "", label: "전체" },
  { value: "daily_quiz", label: "일일퀴즈" },
  { value: "daily_reading", label: "일일독해" },
  { value: "pro_mode", label: "프로모드" },
  { value: "farm_mode", label: "농장모드" },
];

function filtersToParams(filters) {
  let s = "";
  if (filters.contentType) s += `&contentType=${encodeURIComponent(filters.contentType)}`;
  if (filters.levelId) s += `&levelId=${encodeURIComponent(filters.levelId)}`;
  if (filters.area) s += `&area=${encodeURIComponent(filters.area)}`;
  return s;
}

function SearchResultsPage() {
  const navigate = useNavigate();
  const { isPremium } = useAuth();
  const [params] = useSearchParams();

  const q = params.get("q") || "";
  const contentType = params.get("contentType") || "";
  const levelId = params.get("levelId") || "";
  const area = params.get("area") || "";
  const page = parseInt(params.get("page") || "0", 10);

  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [subActive, setSubActive] = useState(false);
  const [subLoading, setSubLoading] = useState(true);

  useEffect(() => {
    apiGet("/v1/subscription")
      .then((sub) => {
        const st = sub?.status;
        if (st === "active" || st === "canceled") setSubActive(true);
      })
      .catch(() => {})
      .finally(() => setSubLoading(false));
  }, []);

  const hasSub = isPremium || subActive || subLoading;

  const doSearch = useCallback(() => {
    if (!q || q.length < 2 || !hasSub) return;
    setLoading(true);
    setError(null);
    let url = `/v1/learning/search?q=${encodeURIComponent(q)}&page=${page}&size=20`;
    if (contentType) url += `&contentType=${encodeURIComponent(contentType)}`;
    if (levelId) url += `&levelId=${encodeURIComponent(levelId)}`;
    if (area) url += `&area=${encodeURIComponent(area)}`;
    apiGet(url)
      .then(setResults)
      .catch((e) => setError(e.message || "검색 중 오류가 발생했습니다"))
      .finally(() => setLoading(false));
  }, [q, contentType, levelId, area, page, hasSub]);

  useEffect(() => { doSearch(); }, [doSearch]);

  const handleSearch = (query, filters) => {
    navigate(`/search?q=${encodeURIComponent(query)}${filtersToParams(filters)}`);
  };

  const handleFilterTab = (ct) => {
    const base = `/search?q=${encodeURIComponent(q)}`;
    const f = { contentType: ct, levelId, area };
    navigate(`${base}${filtersToParams(f)}`);
  };

  const goPage = (p) => {
    const base = `/search?q=${encodeURIComponent(q)}`;
    const f = { contentType, levelId, area };
    navigate(`${base}${filtersToParams(f)}&page=${p}`);
  };

  const navigateToContent = (item) => {
    if (item.contentType === "daily_quiz") {
      navigate("/daily-quiz");
    } else if (item.contentType === "daily_reading") {
      navigate("/daily-reading");
    } else if (item.contentType === "pro_mode") {
      navigate(`/learning/${item.contentId}`);
    } else if (item.contentType === "farm_mode") {
      navigate(`/learning/${item.contentId}`);
    } else {
      navigate(`/learning/${item.contentId}`);
    }
  };

  // 무료 회원 paywall
  if (!subLoading && !hasSub) {
    return (
      <div className="start-page">
        <div className="search-results-page">
          <div className="search-paywall">
            <span className="material-symbols-outlined" style={{ fontSize: 64, color: "#ccc" }}>lock</span>
            <h2>구독 회원 전용 기능</h2>
            <p>검색 기능은 구독 회원만 이용할 수 있습니다.</p>
            <button
              type="button"
              className="start-modal-close"
              style={{ marginTop: 16, padding: "12px 28px", fontSize: 15 }}
              onClick={() => navigate("/subscription")}
            >
              구독 안내 보기
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="start-page">
      <div className="search-results-page">
        <SearchBar
          isPremium={hasSub}
          onSearch={handleSearch}
          onSubscribe={() => navigate("/subscription")}
          initialQuery={q}
          initialFilters={{ contentType, levelId, area }}
        />

        <div className="search-filters">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.value}
              type="button"
              className={`search-filter-tab${contentType === tab.value ? " --active" : ""}`}
              onClick={() => handleFilterTab(tab.value)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {loading && (
          <div style={{ textAlign: "center", padding: 40, color: "#8a7468" }}>검색 중...</div>
        )}

        {error && (
          <div style={{ textAlign: "center", padding: 40, color: "#c0392b" }}>{error}</div>
        )}

        {!loading && !error && results && results.items?.length === 0 && (
          <div className="search-empty">
            <span className="material-symbols-outlined" style={{ fontSize: 48, color: "#ccc" }}>search_off</span>
            <p>검색 결과가 없습니다</p>
            <p style={{ fontSize: 13, color: "#999" }}>다른 검색어로 시도해보세요</p>
          </div>
        )}

        {!loading && !error && results && results.items?.length > 0 && (
          <>
            <div className="search-result-count">
              총 {results.totalCount?.toLocaleString()}건
            </div>
            <div className="search-result-list">
              {results.items.map((item) => (
                <div
                  key={item.contentId}
                  className="search-result-item"
                  onClick={() => navigateToContent(item)}
                >
                  <div className="search-result-meta">
                    <span className="search-badge --type">
                      {CONTENT_TYPE_LABELS[item.contentType] || item.contentType}
                    </span>
                    {item.levelId && (
                      <span className="search-badge --level">
                        {LEVEL_LABEL_MAP[item.levelId] || item.levelId}
                      </span>
                    )}
                    {item.area && (
                      <span className="search-badge --area">{item.area}</span>
                    )}
                  </div>
                  <div className="search-result-title">{item.title}</div>
                </div>
              ))}
            </div>

            {results.totalPages > 1 && (
              <div className="search-pagination">
                <button
                  type="button"
                  disabled={page <= 0}
                  onClick={() => goPage(page - 1)}
                >
                  이전
                </button>
                <span>{page + 1} / {results.totalPages}</span>
                <button
                  type="button"
                  disabled={page + 1 >= results.totalPages}
                  onClick={() => goPage(page + 1)}
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default SearchResultsPage;
