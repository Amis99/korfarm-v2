import { useState, useEffect, useMemo } from "react";
import { apiGet } from "../utils/api";
import { apiGetCamel } from "../utils/adminApi";
import { TYPE_LABEL, LEVEL_LABEL_MAP } from "../constants/contentTypes";
import { FARM_MAP } from "../data/learning/learningCatalog";
import "../styles/study-plan.css";

// levelId ("russell1", "RUSSELL_1" 등 다양한 case) → 한국어 레벨명
function levelLabel(lv) {
  if (!lv) return "";
  const norm = String(lv).toUpperCase().replace(/[\s-]/g, "_");
  const withUnderscore = norm.replace(/^([A-Z]+?)(\d+)$/, "$1_$2");
  return LEVEL_LABEL_MAP[withUnderscore] || LEVEL_LABEL_MAP[norm] || lv;
}

// (미리보기는 모달 내부에서 in-place 로 표시 — 새 탭은 sessionStorage 토큰 격리로 로그인 풀림)

const TABS = [
  { key: "all", label: "종합 검색" },
  { key: "farm", label: "농장별 모드" },
  { key: "pro", label: "프로 모드" },
  { key: "study", label: "내용 숙지" },
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

// area(대문자/소문자 섞임) → 학생 화면 농장명
function farmName(area) {
  if (!area) return "";
  const key = String(area).toLowerCase();
  return FARM_MAP[key]?.name || area;
}

// FARM_MAP 의 11 농장 ID 만 학습 콘텐츠로 인정.
// 일일퀴즈는 area 가 ART·SCIENCE·HUMANITIES·LANGUAGE 등 주제별로 들어가 있어 농장 X.
// 정답해설(area=ANSWER)·원고(area=MANUSCRIPT)·일일독해(한국어 area) 도 학습 콘텐츠 아님.
const VALID_FARM_KEYS = new Set(Object.keys(FARM_MAP).map((k) => k.toLowerCase()));
function isValidFarmArea(area) {
  if (!area) return false;
  return VALID_FARM_KEYS.has(String(area).toLowerCase());
}

export default function KorfarmContentSearchModal({ onSelect, onClose }) {
  const [tab, setTab] = useState("all");

  // 미리보기 패널 (모달 내부에서 in-place)
  const [previewData, setPreviewData] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState("");

  const openPreview = async (contentId) => {
    if (!contentId) return;
    setPreviewLoading(true);
    setPreviewError("");
    setPreviewData(null);
    try {
      const data = await apiGetCamel(`/v1/learning/content/${encodeURIComponent(contentId)}`);
      setPreviewData(data);
    } catch (e) {
      setPreviewError(e.message || "미리보기를 불러오지 못했습니다");
    } finally {
      setPreviewLoading(false);
    }
  };
  const closePreview = () => {
    setPreviewData(null);
    setPreviewError("");
  };

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

  // ── 프로 모드 ── (레벨 → 챕터 → 챕터 콘텐츠)
  const [proLevel, setProLevel] = useState("");
  const [proChapters, setProChapters] = useState([]);
  const [proLoading, setProLoading] = useState(false);
  const [proSelectedChapter, setProSelectedChapter] = useState("");
  const [proItems, setProItems] = useState([]);
  const [proItemsLoading, setProItemsLoading] = useState(false);

  // ── 내용 숙지 ── 본사/기관 필터
  const [studyItems, setStudyItems] = useState([]);
  const [studySearch, setStudySearch] = useState("");
  const [studyOwnerFilter, setStudyOwnerFilter] = useState("all"); // all | hq(public) | org(my)
  const [studyLoading, setStudyLoading] = useState(false);

  // 농장 영역 목록 — FARM_MAP 의 11 농장만 (학습이 아닌 ART/ANSWER/MANUSCRIPT 등 제외)
  useEffect(() => {
    apiGetCamel("/v1/learning/catalog")
      .then((data) => {
        const farms = data?.farms || [];
        const valid = farms
          .filter(f => isValidFarmArea(f.area))
          .map(f => ({ area: f.area, count: f.totalCount || f.items?.length || 0 }));
        // 같은 농장이 대소문자 다르게 들어와 있으면 합산
        const merged = new Map();
        for (const f of valid) {
          const k = String(f.area).toLowerCase();
          if (merged.has(k)) merged.get(k).count += f.count;
          else merged.set(k, { ...f, area: k });
        }
        // FARM_MAP 정의 순서로 정렬
        const ordered = Object.keys(FARM_MAP).map(k => merged.get(k)).filter(Boolean);
        setFarmAreas(ordered);
      })
      .catch(() => setFarmAreas([]));
  }, []);

  // 종합 검색
  useEffect(() => {
    if (tab !== "all" || allSearch.trim().length < 2) { setAllItems([]); return; }
    const timer = setTimeout(() => {
      setAllLoading(true);
      const NON_LEARN = new Set(["PRO_ANSWER", "PRO_MANUSCRIPT"]);
      const dropNonLearn = (list) => list.filter(it => {
        const ct = (it.contentType || it.content_type || "").toString().toUpperCase();
        return !NON_LEARN.has(ct);
      });
      apiGetCamel(`/v1/learning/catalog/search?q=${encodeURIComponent(allSearch.trim())}`)
        .then((data) => setAllItems(dropNonLearn(Array.isArray(data) ? data : [])))
        .catch(() => {
          // search API가 없으면 전체 카탈로그에서 필터
          apiGetCamel("/v1/admin/content")
            .then((data) => {
              const list = Array.isArray(data) ? data : [];
              const term = allSearch.trim().toLowerCase();
              setAllItems(dropNonLearn(list.filter(it => (it.title || "").toLowerCase().includes(term))).slice(0, 50));
            })
            .catch(() => setAllItems([]));
        })
        .finally(() => setAllLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [tab, allSearch]);

  // 농장별 콘텐츠 — 정답해설(PRO_ANSWER)·원고(PRO_MANUSCRIPT)·일일학습(DAILY_*)은 학습 X 라 제외
  useEffect(() => {
    if (tab !== "farm" || !selectedArea) { setFarmItems([]); return; }
    setFarmLoading(true);
    apiGetCamel(`/v1/learning/catalog/${encodeURIComponent(selectedArea)}`)
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        const filtered = list.filter((it) => {
          const ct = (it.contentType || it.content_type || "").toString().toUpperCase();
          if (!ct) return true;
          if (ct === "PRO_ANSWER" || ct === "PRO_MANUSCRIPT") return false;
          if (ct === "DAILY_QUIZ" || ct === "DAILY_READING") return false;
          return true;
        });
        setFarmItems(filtered);
      })
      .catch(() => setFarmItems([]))
      .finally(() => setFarmLoading(false));
  }, [tab, selectedArea]);

  // 프로 모드 챕터 — 어드민 endpoint (레벨별 필터)
  useEffect(() => {
    if (tab !== "pro" || !proLevel) { setProChapters([]); setProSelectedChapter(""); return; }
    setProLoading(true);
    apiGetCamel(`/v1/admin/pro/chapters?levelId=${encodeURIComponent(proLevel)}`)
      .then((data) => setProChapters(Array.isArray(data) ? data : []))
      .catch(() => setProChapters([]))
      .finally(() => setProLoading(false));
    setProSelectedChapter("");
    setProItems([]);
  }, [tab, proLevel]);

  // 챕터 선택 시 그 챕터의 콘텐츠 목록
  useEffect(() => {
    if (tab !== "pro" || !proSelectedChapter) { setProItems([]); return; }
    setProItemsLoading(true);
    apiGetCamel(`/v1/admin/pro/chapters/${encodeURIComponent(proSelectedChapter)}/content-status`)
      .then((data) => {
        // content-status 응답에서 등록된 콘텐츠 추출
        const items = data?.items || data?.contents || [];
        setProItems(Array.isArray(items) ? items.filter(it => it.contentId || it.id) : []);
      })
      .catch(() => setProItems([]))
      .finally(() => setProItemsLoading(false));
  }, [tab, proSelectedChapter]);

  // 내용 숙지 — 어드민 listForAdmin (HQ 전체 / ORG 자기 기관 + PUBLIC)
  useEffect(() => {
    if (tab !== "study") return;
    setStudyLoading(true);
    apiGetCamel("/v1/admin/study/contents")
      .then((data) => setStudyItems(Array.isArray(data) ? data : []))
      .catch(() => setStudyItems([]))
      .finally(() => setStudyLoading(false));
  }, [tab]);

  const farmFiltered = farmSearch.trim()
    ? farmItems.filter(it => (it.title || "").includes(farmSearch))
    : farmItems;

  const studyFiltered = studyItems
    .filter((it) => {
      if (studyOwnerFilter === "hq") return it.visibility === "PUBLIC";
      if (studyOwnerFilter === "org") return it.visibility === "ORG";
      return true; // all
    })
    .filter((it) => {
      if (!studySearch.trim()) return true;
      return (it.title || "").toLowerCase().includes(studySearch.trim().toLowerCase());
    });

  const handleSelect = (item) => {
    onSelect({
      contentId: item.contentId || item.id,
      title: item.title || item.name || item.label || "",
      contentType: item.contentType || "",
    });
    onClose();
  };

  // 공통 row 렌더 — 제목 + 레벨 칩 + 영역 칩 + 미리보기 버튼
  const renderItemRow = (item, key, opts = {}) => {
    const cid = item.contentId || item.id;
    const ct = item.contentType || item.content_type || opts.fallbackType || "";
    const lv = item.levelId || item.level_id;
    const subRight = opts.right || (TYPE_LABEL[ct] || ct);
    return (
      <div key={key} className="sp-csm-item" onClick={() => handleSelect({
        contentId: cid, title: item.title || "", contentType: ct,
      })}>
        <span className="sp-csm-item-title">{item.title}</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {lv && <span className="sp-csm-item-area" style={{ background: "#fdf2e3", color: "#e07a1a" }}>{levelLabel(lv)}</span>}
          {subRight && <span className="sp-csm-item-area">{subRight}</span>}
          {cid && (
            <button
              type="button"
              title="미리보기 (새 탭)"
              onClick={(e) => { e.stopPropagation(); openPreview(cid); }}
              style={{ background: "none", border: "1px solid #cbd5e0", borderRadius: 4, padding: "2px 6px", cursor: "pointer", fontSize: 13 }}
            >
              👁
            </button>
          )}
        </span>
      </div>
    );
  };

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
                : allItems.map((item, i) => renderItemRow(item, item.contentId || i))}
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
                  <option key={i} value={a.area}>{farmName(a.area)} ({a.count}개)</option>
                ))}
              </select>
              <input type="text" placeholder="제목 검색..." value={farmSearch} onChange={(e) => setFarmSearch(e.target.value)} />
            </div>
            <div className="sp-csm-list">
              {farmLoading ? <p className="sp-csm-empty">불러오는 중...</p>
                : farmFiltered.length === 0 ? <p className="sp-csm-empty">농장을 선택하세요</p>
                : farmFiltered.map((item, i) => renderItemRow(item, item.contentId || i))}
            </div>
          </>
        )}

        {/* ── 프로 모드 ── 레벨 → 챕터 → 콘텐츠 */}
        {tab === "pro" && (
          <>
            <div className="sp-csm-filters">
              <select value={proLevel} onChange={(e) => setProLevel(e.target.value)}>
                <option value="">레벨 선택</option>
                {LEVEL_LIST.map(lv => (
                  <option key={lv} value={lv}>{LEVEL_LABELS[lv]}</option>
                ))}
              </select>
              <select
                value={proSelectedChapter}
                onChange={(e) => setProSelectedChapter(e.target.value)}
                disabled={!proLevel || proChapters.length === 0}
              >
                <option value="">챕터 선택</option>
                {proChapters.map((ch) => (
                  <option key={ch.id} value={ch.id}>
                    Ch.{ch.chapterNo || "?"} {ch.title || ""}
                  </option>
                ))}
              </select>
            </div>
            <div className="sp-csm-list">
              {proLoading ? <p className="sp-csm-empty">챕터 불러오는 중...</p>
                : !proLevel ? <p className="sp-csm-empty">레벨을 선택하세요</p>
                : proChapters.length === 0 ? <p className="sp-csm-empty">해당 레벨에 프로 모드 챕터가 없습니다</p>
                : !proSelectedChapter ? <p className="sp-csm-empty">챕터를 선택하세요</p>
                : proItemsLoading ? <p className="sp-csm-empty">콘텐츠 불러오는 중...</p>
                : proItems.length === 0 ? <p className="sp-csm-empty">이 챕터에 등록된 콘텐츠가 없습니다</p>
                : proItems.map((item, i) => renderItemRow(item, item.contentId || item.id || i, { fallbackType: "PRO_CONTENT" }))}
            </div>
          </>
        )}

        {/* ── 내용 숙지 ── */}
        {tab === "study" && (
          <>
            <div className="sp-csm-filters">
              <select value={studyOwnerFilter} onChange={(e) => setStudyOwnerFilter(e.target.value)}>
                <option value="all">전체</option>
                <option value="hq">본사 콘텐츠 (전체 공개)</option>
                <option value="org">기관 콘텐츠 (자기 기관)</option>
              </select>
              <input type="text" placeholder="제목 검색..." value={studySearch} onChange={(e) => setStudySearch(e.target.value)} style={{ flex: 1 }} />
            </div>
            <div className="sp-csm-list">
              {studyLoading ? <p className="sp-csm-empty">불러오는 중...</p>
                : studyFiltered.length === 0 ? <p className="sp-csm-empty">등록된 내용 숙지 콘텐츠가 없습니다</p>
                : studyFiltered.map((item) => renderItemRow(
                    { ...item, contentId: item.id, contentType: "STUDY_CONTENT" },
                    item.id,
                    {
                      right: `${item.visibility === "PUBLIC" ? "전체 공개" : (item.ownerOrgName || "기관 한정")} · ${item.questionCount || 0}문제`,
                    }
                  ))}
            </div>
          </>
        )}

        {/* 미리보기 — 모달 내부 in-place 패널 */}
        {(previewLoading || previewError || previewData) && (
          <div
            onClick={(e) => { if (e.target === e.currentTarget) closePreview(); }}
            style={{
              position: "absolute", inset: 0, background: "rgba(0,0,0,0.4)",
              display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10,
              borderRadius: 12,
            }}
          >
            <div style={{ background: "#fff", borderRadius: 8, width: "92%", maxHeight: "82%", overflow: "auto", padding: 16, boxShadow: "0 4px 24px rgba(0,0,0,0.2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <strong>콘텐츠 미리보기</strong>
                <button onClick={closePreview} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer" }}>✕</button>
              </div>
              {previewLoading && <p style={{ color: "#666" }}>불러오는 중…</p>}
              {previewError && <p style={{ color: "#c00" }}>{previewError}</p>}
              {previewData && (() => {
                const c = previewData.content || {};
                const payload = c.payload || c;
                // ── 지문 추출 ──
                // 1) payload.passage 가 객체 + paragraphs 배열 (PRO_READING 등)
                // 2) payload.passage 가 string
                // 3) payload.passages[0].text
                // 4) bodyMarkdown / markdown / body
                // 5) recall.cards[] (회상 카드)
                let sharedPassage = "";
                if (payload.passage && typeof payload.passage === "object") {
                  const paras = payload.passage.paragraphs || payload.passage.items || [];
                  sharedPassage = paras.map(p => p.text || p.content || "").filter(Boolean).join("\n\n");
                } else if (typeof payload.passage === "string") {
                  sharedPassage = payload.passage;
                } else if (Array.isArray(payload.passages) && payload.passages[0]) {
                  sharedPassage = payload.passages[0].text || payload.passages[0].content || "";
                } else if (payload.bodyMarkdown || payload.markdown || payload.body) {
                  sharedPassage = payload.bodyMarkdown || payload.markdown || payload.body;
                } else if (typeof payload["보기"] === "string") {
                  sharedPassage = payload["보기"];
                } else if (Array.isArray(payload.recall?.cards)) {
                  sharedPassage = payload.recall.cards
                    .map((card, i) => `${i + 1}. ${card.text || card.content || ""}`)
                    .join("\n");
                }
                // ── 발문 추출 ──
                const questions =
                  (Array.isArray(payload.questions) && payload.questions) ||
                  (Array.isArray(c.questions) && c.questions) ||
                  (Array.isArray(payload.items) && payload.items) ||
                  (Array.isArray(payload.confirm?.questions) && payload.confirm.questions) ||
                  (Array.isArray(payload.intensive?.questions) && payload.intensive.questions) ||
                  [];
                return (
                  <div style={{ fontSize: 13, lineHeight: 1.6 }}>
                    <div style={{ marginBottom: 6 }}>
                      <strong style={{ fontSize: 15 }}>{previewData.title || "(제목 없음)"}</strong>
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
                      {previewData.levelId && <span className="sp-csm-item-area" style={{ background: "#fdf2e3", color: "#e07a1a" }}>{levelLabel(previewData.levelId)}</span>}
                      {previewData.area && <span className="sp-csm-item-area">{farmName(previewData.area)}</span>}
                      {previewData.subArea && <span className="sp-csm-item-area">{previewData.subArea}</span>}
                      {previewData.dayIndex != null && <span className="sp-csm-item-area">Day {previewData.dayIndex}</span>}
                      {Array.isArray(previewData.contentType) && previewData.contentType.map((t, i) => (
                        <span key={i} className="sp-csm-item-area">{TYPE_LABEL[t] || t}</span>
                      ))}
                      {typeof previewData.contentType === "string" && (
                        <span className="sp-csm-item-area">{TYPE_LABEL[previewData.contentType] || previewData.contentType}</span>
                      )}
                    </div>
                    {sharedPassage && (
                      <div style={{
                        background: "#fafaf3", borderLeft: "3px solid #2f7a3e",
                        padding: "10px 14px", marginBottom: 12, borderRadius: 4,
                        whiteSpace: "pre-wrap", fontSize: 13,
                      }}>
                        {String(sharedPassage)}
                      </div>
                    )}
                    {questions.length === 0 && !sharedPassage && (
                      <p style={{ color: "#888" }}>표시할 지문·문제가 없습니다.</p>
                    )}
                    {/* 지문이 없고 발문만 있을 때 — 발문 모음 형태 */}
                    {!sharedPassage && questions.length > 0 && (
                      <div style={{ marginBottom: 10, fontSize: 12, color: "#555" }}>
                        지문이 없는 콘텐츠 — 발문/문제 목록만 표시합니다.
                      </div>
                    )}
                    {questions.map((q, qi) => {
                      const stem = q.stem || q.prompt || q.question || q.title || `문제 ${qi + 1}`;
                      const qPassage = (typeof q.passage === "string" && q.passage) ||
                        (q.passage?.paragraphs?.map(p => p.text).join("\n\n")) || "";
                      const choices = q.choices || q.options || [];
                      const answerId = q.answerId || q.answer || q.correctId;
                      const explanation = q.explanation || q.commentary || q.answerText || "";
                      return (
                        <div key={q.id || qi} style={{
                          border: "1px solid #e2e8f0", borderRadius: 6,
                          padding: "10px 12px", marginBottom: 10, background: "#fff",
                        }}>
                          <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>문제 {qi + 1}</div>
                          {qPassage && (
                            <div style={{ background: "#f5f7fa", padding: "8px 10px", borderRadius: 4, marginBottom: 6, whiteSpace: "pre-wrap", fontSize: 12 }}
                              dangerouslySetInnerHTML={{ __html: String(qPassage).replace(/\n/g, "<br/>") }} />
                          )}
                          <div style={{ fontWeight: 600, marginBottom: 6 }}
                            dangerouslySetInnerHTML={{ __html: String(stem).replace(/\n/g, "<br/>") }} />
                          {Array.isArray(choices) && choices.length > 0 && (
                            <ol style={{ paddingLeft: 22, margin: "4px 0" }}>
                              {choices.map((ch, ci) => {
                                const cid = ch.id || ch.choiceId || ch.code;
                                const text = ch.text || ch.label || (typeof ch === "string" ? ch : "");
                                const isAns = answerId && cid === answerId;
                                return (
                                  <li key={cid || ci} style={{
                                    marginBottom: 2, padding: "1px 6px",
                                    background: isAns ? "#fef3c7" : "transparent",
                                    borderRadius: 3,
                                  }}>
                                    {text} {isAns && <span style={{ color: "#b45309", fontSize: 11 }}>← 정답</span>}
                                  </li>
                                );
                              })}
                            </ol>
                          )}
                          {!Array.isArray(choices) && answerId && (
                            <div style={{ fontSize: 12, color: "#b45309" }}>정답: {answerId}</div>
                          )}
                          {explanation && (
                            <div style={{ borderTop: "1px dashed #e2e8f0", marginTop: 6, paddingTop: 6, fontSize: 12, color: "#555" }}>
                              <strong style={{ color: "#2f7a3e" }}>해설</strong> {String(explanation).slice(0, 600)}
                              {String(explanation).length > 600 && "…"}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
