import { useEffect, useMemo, useState } from "react";
import { FREE_TOPIC_KEY, FREE_TOPIC_DEFAULT_LABEL } from "../constants/wisdomFreeTopic";
import "../styles/study-plan.css";

const LEVELS = [
  { id: "saussure1", label: "소쉬르 1" },
  { id: "saussure2", label: "소쉬르 2" },
  { id: "saussure3", label: "소쉬르 3" },
  { id: "frege1", label: "프레게 1" },
  { id: "frege2", label: "프레게 2" },
  { id: "frege3", label: "프레게 3" },
  { id: "russell1", label: "러셀 1" },
  { id: "russell2", label: "러셀 2" },
  { id: "russell3", label: "러셀 3" },
  { id: "wittgenstein1", label: "비트겐슈타인 1" },
  { id: "wittgenstein2", label: "비트겐슈타인 2" },
  { id: "wittgenstein3", label: "비트겐슈타인 3" },
];

/**
 * 지식과 지혜 글쓰기 주제 검색 모달.
 * - 정적 JSON (/wisdom-topics/{level}.json) 12개 로드 → 합치기
 * - 최상단에 "자유 주제" 항목 (모든 레벨 공통)
 * - 검색 + 레벨 필터
 * - 선택 시 onSelect({ topicKey, topicLabel, levelId, isFree })
 */
export default function WisdomTopicSearchModal({ onSelect, onClose, lockedLevelId = null }) {
  const [allTopics, setAllTopics] = useState([]); // [{ levelId, key, label }]
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLevel, setFilterLevel] = useState(lockedLevelId || "");
  const [freeLabelInput, setFreeLabelInput] = useState(""); // 자유 주제 — 어드민이 미리 입력 가능 (선택)

  useEffect(() => {
    let mounted = true;
    Promise.all(
      LEVELS.map((lv) =>
        fetch(`${import.meta.env.BASE_URL}wisdom-topics/${lv.id}.json`)
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => [])
          .then((arr) => (Array.isArray(arr) ? arr : []).map((t) => ({ ...t, levelId: lv.id })))
      )
    )
      .then((groups) => {
        if (!mounted) return;
        setAllTopics(groups.flat());
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const filtered = useMemo(() => {
    let list = allTopics;
    if (filterLevel) list = list.filter((t) => t.levelId === filterLevel);
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((t) => (t.label || "").toLowerCase().includes(q));
    }
    return list;
  }, [allTopics, filterLevel, search]);

  const pickTopic = (t) => {
    onSelect?.({
      topicKey: t.key,
      topicLabel: t.label,
      levelId: t.levelId,
      isFree: false,
    });
    onClose?.();
  };

  const pickFree = () => {
    // 어드민이 자유 주제 라벨을 미리 입력했으면 그걸로, 아니면 default 라벨
    const label = freeLabelInput.trim() || FREE_TOPIC_DEFAULT_LABEL;
    onSelect?.({
      topicKey: FREE_TOPIC_KEY,
      topicLabel: label,
      levelId: lockedLevelId || filterLevel || null,
      isFree: true,
    });
    onClose?.();
  };

  return (
    <div className="sp-reminder-overlay" onClick={onClose}>
      <div className="sp-content-search-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sp-csm-header">
          <h3>지식과 지혜 주제 선택</h3>
          <button className="sp-csm-close" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* 자유 주제 박스 — 항상 상단 노출 */}
        <div style={{
          margin: "0 16px 12px",
          padding: 12,
          background: "rgba(255,193,7,0.08)",
          border: "1.5px dashed rgba(255,167,38,0.5)",
          borderRadius: 8,
        }}>
          <div style={{ fontWeight: 700, color: "#8a6d00", marginBottom: 6 }}>
            자유 주제
          </div>
          <div style={{ fontSize: 12, color: "#666", marginBottom: 8 }}>
            학생이 직접 주제(제목)를 정해 글을 씁니다. 같은 자유 주제끼리 하나의 게시판을 공유합니다.
          </div>
          <input
            type="text"
            value={freeLabelInput}
            onChange={(e) => setFreeLabelInput(e.target.value)}
            placeholder={`표시 라벨 (선택, 비우면 "${FREE_TOPIC_DEFAULT_LABEL}")`}
            style={{
              width: "100%",
              padding: "6px 10px",
              border: "1px solid rgba(31,58,44,0.18)",
              borderRadius: 6,
              fontSize: 13,
              marginBottom: 8,
            }}
          />
          <button
            className="admin-detail-btn primary"
            onClick={pickFree}
            style={{ width: "100%" }}
          >
            자유 주제로 배정
          </button>
        </div>

        <div className="sp-csm-filters">
          <input
            type="text"
            placeholder="주제 키워드 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1 }}
          />
          {!lockedLevelId && (
            <select value={filterLevel} onChange={(e) => setFilterLevel(e.target.value)}>
              <option value="">전체 레벨</option>
              {LEVELS.map((lv) => (
                <option key={lv.id} value={lv.id}>{lv.label}</option>
              ))}
            </select>
          )}
        </div>

        <div className="sp-csm-list">
          {loading ? (
            <p className="sp-csm-empty">불러오는 중...</p>
          ) : filtered.length === 0 ? (
            <p className="sp-csm-empty">조건에 맞는 주제가 없습니다</p>
          ) : (
            filtered.map((t, i) => {
              const lvLabel = LEVELS.find((l) => l.id === t.levelId)?.label || t.levelId;
              return (
                <div
                  key={`${t.levelId}-${t.key}-${i}`}
                  className="sp-csm-item"
                  onClick={() => pickTopic(t)}
                >
                  <span className="sp-csm-item-title">{t.label}</span>
                  <span className="sp-csm-item-area">{lvLabel}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
