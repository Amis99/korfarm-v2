import { useState } from "react";

const LEVEL_LABEL_MAP = {
  saussure1: "소쉬르 1", saussure2: "소쉬르 2", saussure3: "소쉬르 3",
  frege1: "프레게 1", frege2: "프레게 2", frege3: "프레게 3",
  russell1: "러셀 1", russell2: "러셀 2", russell3: "러셀 3",
};

const CONTENT_TYPES = [
  { value: "", label: "전체" },
  { value: "daily_quiz", label: "일일퀴즈" },
  { value: "daily_reading", label: "일일독해" },
  { value: "pro_mode", label: "프로모드" },
  { value: "farm_mode", label: "농장모드" },
];

const AREAS = [
  { value: "", label: "전체" },
  { value: "vocabulary", label: "어휘" },
  { value: "reading_literature", label: "독해(문학)" },
  { value: "reading_nonfiction", label: "독해(비문학)" },
  { value: "background", label: "배경지식" },
  { value: "logic", label: "논리" },
];

function SearchBar({ isPremium, onSearch, onSubscribe, initialQuery = "", initialFilters = {} }) {
  const [query, setQuery] = useState(initialQuery);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [filters, setFilters] = useState({
    contentType: initialFilters.contentType || "",
    levelId: initialFilters.levelId || "",
    area: initialFilters.area || "",
  });

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!isPremium) { onSubscribe?.(); return; }
    if (query.trim().length < 2) return;
    onSearch?.(query.trim(), filters);
  };

  const handleApplyFilters = () => {
    setShowAdvanced(false);
    if (query.trim().length >= 2) {
      onSearch?.(query.trim(), filters);
    }
  };

  return (
    <>
      <form className="search-bar" onSubmit={handleSubmit}>
        <span className="material-symbols-outlined search-bar-icon">search</span>
        <input
          type="text"
          placeholder={isPremium ? "학습 콘텐츠 검색..." : "구독 회원 전용 검색"}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={!isPremium}
          onClick={() => { if (!isPremium) onSubscribe?.(); }}
        />
        {isPremium && (
          <button
            type="button"
            className="search-bar-filter"
            onClick={() => setShowAdvanced(true)}
            title="상세 검색"
          >
            <span className="material-symbols-outlined">tune</span>
          </button>
        )}
        <button type="submit" className="search-bar-submit" disabled={!isPremium}>
          <span className="material-symbols-outlined">search</span>
        </button>
      </form>

      {showAdvanced && (
        <div className="start-modal-overlay" onClick={() => setShowAdvanced(false)}>
          <div className="start-modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <h2>상세 검색</h2>

            <div className="search-adv-field">
              <label className="start-label">학습 유형</label>
              <div className="search-adv-options">
                {CONTENT_TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    className={`search-adv-chip${filters.contentType === t.value ? " --active" : ""}`}
                    onClick={() => setFilters((f) => ({ ...f, contentType: t.value }))}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="search-adv-field">
              <label className="start-label">레벨</label>
              <div className="search-adv-options">
                <button
                  type="button"
                  className={`search-adv-chip${filters.levelId === "" ? " --active" : ""}`}
                  onClick={() => setFilters((f) => ({ ...f, levelId: "" }))}
                >
                  전체
                </button>
                {Object.entries(LEVEL_LABEL_MAP).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={`search-adv-chip${filters.levelId === key ? " --active" : ""}`}
                    onClick={() => setFilters((f) => ({ ...f, levelId: key }))}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="search-adv-field">
              <label className="start-label">영역</label>
              <div className="search-adv-options">
                {AREAS.map((a) => (
                  <button
                    key={a.value}
                    type="button"
                    className={`search-adv-chip${filters.area === a.value ? " --active" : ""}`}
                    onClick={() => setFilters((f) => ({ ...f, area: a.value }))}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button type="button" className="start-modal-close" onClick={handleApplyFilters} style={{ flex: 1 }}>
                적용
              </button>
              <button
                type="button"
                className="start-btn-ghost"
                style={{ marginTop: 0, flex: 1 }}
                onClick={() => {
                  setFilters({ contentType: "", levelId: "", area: "" });
                  setShowAdvanced(false);
                }}
              >
                초기화
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SearchBar;
