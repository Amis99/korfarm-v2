import { useState, useEffect } from "react";
import { apiGet } from "../utils/api";
import "../styles/study-plan.css";

export default function KorfarmContentSearchModal({ onSelect, onClose }) {
  const [areas, setAreas] = useState([]);
  const [selectedArea, setSelectedArea] = useState("");
  const [subAreas, setSubAreas] = useState([]);
  const [selectedSubArea, setSelectedSubArea] = useState("");
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  // 영역 목록 로드
  useEffect(() => {
    apiGet("/v1/learning/catalog")
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.areas || [];
        setAreas(list);
      })
      .catch(() => setAreas([]));
  }, []);

  // 하위 영역 로드
  useEffect(() => {
    if (!selectedArea) { setSubAreas([]); setItems([]); return; }
    apiGet(`/v1/learning/catalog/${encodeURIComponent(selectedArea)}`)
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.subAreas || data?.items || [];
        setSubAreas(list);
      })
      .catch(() => setSubAreas([]));
  }, [selectedArea]);

  // 콘텐츠 로드
  useEffect(() => {
    if (!selectedArea) return;
    setLoading(true);
    const path = selectedSubArea
      ? `/v1/learning/catalog/${encodeURIComponent(selectedArea)}/${encodeURIComponent(selectedSubArea)}`
      : `/v1/learning/catalog/${encodeURIComponent(selectedArea)}`;
    apiGet(path)
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.items || data?.subAreas || [];
        setItems(list);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [selectedArea, selectedSubArea]);

  const filtered = search.trim()
    ? items.filter((it) => (it.title || it.name || it.label || "").includes(search))
    : items;

  const handleSelect = (item) => {
    onSelect({
      contentId: item.contentId || item.id,
      title: item.title || item.name || item.label || "",
    });
    onClose();
  };

  return (
    <div className="sp-reminder-overlay" onClick={onClose}>
      <div
        className="sp-content-search-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sp-csm-header">
          <h3>국어농장 콘텐츠 검색</h3>
          <button className="sp-csm-close" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="sp-csm-filters">
          <select
            value={selectedArea}
            onChange={(e) => { setSelectedArea(e.target.value); setSelectedSubArea(""); }}
          >
            <option value="">영역 선택</option>
            {areas.map((a, i) => (
              <option key={i} value={a.area || a.name || a}>
                {a.area || a.name || a}
              </option>
            ))}
          </select>
          {subAreas.length > 0 && subAreas[0]?.subArea && (
            <select
              value={selectedSubArea}
              onChange={(e) => setSelectedSubArea(e.target.value)}
            >
              <option value="">하위 영역 전체</option>
              {subAreas.filter((s) => s.subArea).map((s, i) => (
                <option key={i} value={s.subArea}>{s.subArea}</option>
              ))}
            </select>
          )}
          <input
            type="text"
            placeholder="제목 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="sp-csm-list">
          {loading ? (
            <p className="sp-csm-empty">불러오는 중...</p>
          ) : filtered.length === 0 ? (
            <p className="sp-csm-empty">검색 결과가 없습니다.</p>
          ) : (
            filtered.map((item, i) => (
              <div
                key={item.contentId || item.id || i}
                className="sp-csm-item"
                onClick={() => handleSelect(item)}
              >
                <span className="sp-csm-item-title">
                  {item.title || item.name || item.label}
                </span>
                {item.area && (
                  <span className="sp-csm-item-area">{item.area}</span>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
