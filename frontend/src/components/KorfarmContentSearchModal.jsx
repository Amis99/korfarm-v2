import { useState, useEffect, useMemo } from "react";
import { apiGet } from "../utils/api";
import { TYPE_LABEL } from "../constants/contentTypes";
import "../styles/study-plan.css";

const TABS = [
  { key: "all", label: "종합 검색" },
  { key: "farm", label: "농장별 모드" },
  { key: "daily", label: "일일 학습" },
  { key: "pro", label: "프로 모드" },
];

const LEVEL_LIST = [
  "SAUSSURE_1","SAUSSURE_2","SAUSSURE_3",
  "FREGE_1","FREGE_2","FREGE_3",
  "RUSSELL_1","RUSSELL_2","RUSSELL_3",
  "WITTGENSTEIN_1","WITTGENSTEIN_2","WITTGENSTEIN_3",
];

const LEVEL_LABELS = {
  SAUSSURE_1:"소쉬르1",SAUSSURE_2:"소쉬르2",SAUSSURE_3:"소쉬르3",
  FREGE_1:"프레게1",FREGE_2:"프레게2",FREGE_3:"프레게3",
  RUSSELL_1:"러셀1",RUSSELL_2:"러셀2",RUSSELL_3:"러셀3",
  WITTGENSTEIN_1:"비트겐슈타인1",WITTGENSTEIN_2:"비트겐슈타인2",WITTGENSTEIN_3:"비트겐슈타인3",
};

export default function KorfarmContentSearchModal({ onSelect, onClose }) {
  const [tab, setTab] = useState("all");

  // ── 종합 검색 ──
  const [allSearch, setAllSearch] = useState("");
  const [allItems, setAllItems] = useState([]);
  const [allLoading, setAllLoading] = useState(false);

  // ── 농장별 모드 ──
  const [farmAreas, setFarmAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState("");
  const [farmItems, setFarmItems] = useState([]);
  const [farmSearch, setFarmSearch] = useState("");
  const [farmLoading, setFarmLoading] = useState(false);

  // ── 일일 학습 ──
  const [dailyLevel, setDailyLevel] = useState("");

  // ── 프로 모드 ──
  const [proLevel, setProLevel] = useState("");
  const [proItems, setProItems] = useState([]);
  const [proLoading, setProLoading] = useState(false);

  // 농장 영역 목록
  useEffect(() => {
    apiGet("/v1/learning/catalog")
      .then((data) => {
        const farms = data?.farms || [];
        setFarmAreas(farms.map(f => ({ area: f.area, count: f.totalCount || f.items?.length || 0 })));
      })
      .catch(() => setFarmAreas([]));
  }, []);

  // 종합 검색
  useEffect(() => {
    if (tab !== "all" || allSearch.trim().length < 2) { setAllItems([]); return; }
    const timer = setTimeout(() => {
      setAllLoading(true);
      apiGet(`/v1/learning/catalog/search?q=${encodeURIComponent(allSearch.trim())}`)
        .then((data) => setAllItems(Array.isArray(data) ? data : []))
        .catch(() => {
          // search API가 없으면 전체 카탈로그에서 필터
          apiGet("/v1/admin/content")
            .then((data) => {
              const list = Array.isArray(data) ? data : [];
              const term = allSearch.trim().toLowerCase();
              setAllItems(list.filter(it => (it.title || "").toLowerCase().includes(term)).slice(0, 50));
            })
            .catch(() => setAllItems([]));
        })
        .finally(() => setAllLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [tab, allSearch]);

  // 농장별 콘텐츠
  useEffect(() => {
    if (tab !== "farm" || !selectedArea) { setFarmItems([]); return; }
    setFarmLoading(true);
    apiGet(`/v1/learning/catalog/${encodeURIComponent(selectedArea)}`)
      .then((data) => setFarmItems(Array.isArray(data) ? data : []))
      .catch(() => setFarmItems([]))
      .finally(() => setFarmLoading(false));
  }, [tab, selectedArea]);

  // 프로 모드 챕터
  useEffect(() => {
    if (tab !== "pro" || !proLevel) { setProItems([]); return; }
    setProLoading(true);
    apiGet(`/v1/learning/catalog/pro?levelId=${encodeURIComponent(proLevel)}`)
      .then((data) => setProItems(Array.isArray(data) ? data : []))
      .catch(() => setProItems([]))
      .finally(() => setProLoading(false));
  }, [tab, proLevel]);

  const AREA_LABELS = {
    GRAMMAR:"문법",VOCAB:"어휘",READING:"독해",BACKGROUND:"배경지식",
    LOGIC:"논리사고력",WRITING:"서술형",CONCEPT:"국어개념",
    CONTENT:"내용숙지",FUSION:"융합",GENERAL:"일반",
  };

  const farmFiltered = farmSearch.trim()
    ? farmItems.filter(it => (it.title || "").includes(farmSearch))
    : farmItems;

  const handleSelect = (item) => {
    onSelect({
      contentId: item.contentId || item.id,
      title: item.title || item.name || item.label || "",
      contentType: item.contentType || "",
    });
    onClose();
  };

  // 일일 학습 항목 생성
  const dailyItems = useMemo(() => {
    if (!dailyLevel) return [];
    return [
      { id: `daily-quiz-${dailyLevel}`, title: `일일 퀴즈 (${LEVEL_LABELS[dailyLevel]})`, contentType: "DAILY_QUIZ", contentId: `daily-quiz-${dailyLevel.toLowerCase()}` },
      { id: `daily-reading-${dailyLevel}`, title: `일일 독해 (${LEVEL_LABELS[dailyLevel]})`, contentType: "DAILY_READING", contentId: `daily-reading-${dailyLevel.toLowerCase()}` },
    ];
  }, [dailyLevel]);

  return (
    <div className="sp-reminder-overlay" onClick={onClose}>
      <div className="sp-content-search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sp-csm-header">
          <h3>국어농장 콘텐츠 선택</h3>
          <button className="sp-csm-close" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* 탭 */}
        <div className="sp-csm-tabs">
          {TABS.map(t => (
            <button key={t.key} className={`sp-csm-tab ${tab === t.key ? "active" : ""}`} onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {/* ── 종합 검색 ── */}
        {tab === "all" && (
          <>
            <div className="sp-csm-filters">
              <input type="text" placeholder="제목으로 검색 (2글자 이상)..." value={allSearch} onChange={(e) => setAllSearch(e.target.value)} autoFocus style={{ flex: 1 }} />
            </div>
            <div className="sp-csm-list">
              {allLoading ? <p className="sp-csm-empty">검색 중...</p>
                : allSearch.trim().length < 2 ? <p className="sp-csm-empty">검색어를 2글자 이상 입력하세요</p>
                : allItems.length === 0 ? <p className="sp-csm-empty">검색 결과가 없습니다</p>
                : allItems.map((item, i) => (
                  <div key={item.contentId || item.content_id || i} className="sp-csm-item" onClick={() => handleSelect({
                    contentId: item.contentId || item.content_id || item.id,
                    title: item.title || "",
                    contentType: item.contentType || item.content_type || "",
                  })}>
                    <span className="sp-csm-item-title">{item.title}</span>
                    <span className="sp-csm-item-area">{TYPE_LABEL[item.contentType || item.content_type] || item.contentType || item.content_type || ""}</span>
                  </div>
                ))}
            </div>
          </>
        )}

        {/* ── 농장별 모드 ── */}
        {tab === "farm" && (
          <>
            <div className="sp-csm-filters">
              <select value={selectedArea} onChange={(e) => setSelectedArea(e.target.value)}>
                <option value="">농장 선택</option>
                {farmAreas.map((a, i) => (
                  <option key={i} value={a.area}>{AREA_LABELS[a.area] || a.area} ({a.count}개)</option>
                ))}
              </select>
              <input type="text" placeholder="제목 검색..." value={farmSearch} onChange={(e) => setFarmSearch(e.target.value)} />
            </div>
            <div className="sp-csm-list">
              {farmLoading ? <p className="sp-csm-empty">불러오는 중...</p>
                : farmFiltered.length === 0 ? <p className="sp-csm-empty">농장을 선택하세요</p>
                : farmFiltered.map((item, i) => (
                  <div key={item.contentId || i} className="sp-csm-item" onClick={() => handleSelect(item)}>
                    <span className="sp-csm-item-title">{item.title}</span>
                    <span className="sp-csm-item-area">{TYPE_LABEL[item.contentType] || item.contentType}</span>
                  </div>
                ))}
            </div>
          </>
        )}

        {/* ── 일일 학습 ── */}
        {tab === "daily" && (
          <>
            <div className="sp-csm-filters">
              <select value={dailyLevel} onChange={(e) => setDailyLevel(e.target.value)}>
                <option value="">레벨 선택</option>
                {LEVEL_LIST.map(lv => (
                  <option key={lv} value={lv}>{LEVEL_LABELS[lv]}</option>
                ))}
              </select>
            </div>
            <div className="sp-csm-list">
              {!dailyLevel ? <p className="sp-csm-empty">레벨을 선택하세요</p>
                : dailyItems.map((item) => (
                  <div key={item.id} className="sp-csm-item" onClick={() => handleSelect(item)}>
                    <span className="sp-csm-item-title">{item.title}</span>
                    <span className="sp-csm-item-area">{item.contentType === "DAILY_QUIZ" ? "일일 퀴즈" : "일일 독해"}</span>
                  </div>
                ))}
            </div>
          </>
        )}

        {/* ── 프로 모드 ── */}
        {tab === "pro" && (
          <>
            <div className="sp-csm-filters">
              <select value={proLevel} onChange={(e) => setProLevel(e.target.value)}>
                <option value="">레벨 선택</option>
                {LEVEL_LIST.map(lv => (
                  <option key={lv} value={lv}>{LEVEL_LABELS[lv]}</option>
                ))}
              </select>
            </div>
            <div className="sp-csm-list">
              {proLoading ? <p className="sp-csm-empty">불러오는 중...</p>
                : !proLevel ? <p className="sp-csm-empty">레벨을 선택하세요</p>
                : proItems.length === 0 ? <p className="sp-csm-empty">해당 레벨에 프로 모드 콘텐츠가 없습니다</p>
                : proItems.map((item, i) => (
                  <div key={item.contentId || i} className="sp-csm-item" onClick={() => handleSelect(item)}>
                    <span className="sp-csm-item-title">{item.title}</span>
                    <span className="sp-csm-item-area">{TYPE_LABEL[item.contentType] || "프로 모드"}</span>
                  </div>
                ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
