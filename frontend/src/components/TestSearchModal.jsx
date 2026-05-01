import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../utils/api";
import "../styles/study-plan.css";

const SERIES_LABEL = {
  chapter: "챕터 테스트",
  diagnostic: "진단 테스트",
  daily_quiz: "일일 퀴즈",
};

const LEVEL_LABEL = {
  SAUSSURE_1: "소쉬르1", SAUSSURE_2: "소쉬르2", SAUSSURE_3: "소쉬르3",
  FREGE_1: "프레게1", FREGE_2: "프레게2", FREGE_3: "프레게3",
  RUSSELL_1: "러셀1", RUSSELL_2: "러셀2", RUSSELL_3: "러셀3",
  WITTGENSTEIN_1: "비트겐슈타인1", WITTGENSTEIN_2: "비트겐슈타인2", WITTGENSTEIN_3: "비트겐슈타인3",
};

/**
 * 테스트 검색 모달.
 * - GET /v1/admin/test-papers 전체 조회
 * - kind === 'diagnostic' 자동 제외
 * - 제목 검색 + 종류·레벨 필터
 * - 선택 시 onSelect({ testId, title, ...})
 */
export default function TestSearchModal({ onSelect, onClose }) {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filterKind, setFilterKind] = useState(""); // "" / chapter / misc
  const [filterLevel, setFilterLevel] = useState("");

  useEffect(() => {
    setLoading(true);
    apiGet("/v1/admin/test-papers")
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        // 진단 제외
        setTests(list.filter((t) => (t.kind || t.series) !== "diagnostic"));
      })
      .catch((e) => setError(e?.message || "테스트 조회 실패"))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = tests;
    if (filterKind) list = list.filter((t) => (t.kind || "misc") === filterKind);
    if (filterLevel) list = list.filter((t) => (t.levelId || t.level_id) === filterLevel);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((t) => (t.title || "").toLowerCase().includes(q));
    }
    return list;
  }, [tests, filterKind, filterLevel, search]);

  const handlePick = (test) => {
    onSelect?.({
      testId: test.testId || test.test_id,
      title: test.title,
      kind: test.kind || "misc",
      levelId: test.levelId || test.level_id,
      totalQuestions: test.totalQuestions || test.total_questions,
    });
    onClose?.();
  };

  return (
    <div className="sp-reminder-overlay" onClick={onClose}>
      <div className="sp-content-search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sp-csm-header">
          <h3>테스트 선택 (진단 제외)</h3>
          <button className="sp-csm-close" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="sp-csm-filters">
          <input
            type="text"
            placeholder="제목 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            style={{ flex: 1 }}
          />
          <select value={filterKind} onChange={(e) => setFilterKind(e.target.value)}>
            <option value="">전체 종류</option>
            <option value="chapter">챕터 테스트</option>
            <option value="misc">기타 (본사·기관)</option>
          </select>
          <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
            <option value="">전체 레벨</option>
            {Object.entries(LEVEL_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
        </div>

        <div className="sp-csm-list">
          {loading ? (
            <p className="sp-csm-empty">불러오는 중...</p>
          ) : error ? (
            <p className="sp-csm-empty" style={{ color: "#c0392b" }}>{error}</p>
          ) : filtered.length === 0 ? (
            <p className="sp-csm-empty">조건에 맞는 테스트가 없습니다</p>
          ) : (
            filtered.map((t) => {
              const tid = t.testId || t.test_id;
              const lvl = LEVEL_LABEL[t.levelId || t.level_id] || (t.levelId || t.level_id || "");
              const kindLabel = SERIES_LABEL[t.kind || t.series] ||
                ((t.kind || "misc") === "chapter" ? "챕터" : "기타");
              return (
                <div
                  key={tid}
                  className="sp-csm-item"
                  onClick={() => handlePick(t)}
                >
                  <span className="sp-csm-item-title">{t.title}</span>
                  <span className="sp-csm-item-area">
                    {kindLabel}{lvl ? ` · ${lvl}` : ""}
                    {t.totalQuestions ? ` · ${t.totalQuestions}문항` : t.total_questions ? ` · ${t.total_questions}문항` : ""}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
