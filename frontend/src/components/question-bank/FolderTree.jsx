import { useState } from "react";

const SUB_AREA_LABELS = {
  LIT_MODERN_POETRY: "현대시", LIT_CLASSIC_POETRY: "고전시가",
  LIT_MODERN_NOVEL: "현대소설", LIT_CLASSIC_PROSE: "고전산문",
  LIT_ESSAY: "수필", LIT_DRAMA: "극",
  READ_HUMANITIES: "인문", READ_SOCIETY: "사회",
  READ_SCI_TECH: "과학기술", READ_ART: "예술", READ_CROSS: "통합",
  GRAM_PHONOLOGY: "음운", GRAM_WORD: "단어", GRAM_SENTENCE: "문장",
  GRAM_DISCOURSE: "담화", GRAM_HISTORY: "국어사",
  SPEAK_GENERAL: "화법 일반", WRITE_GENERAL: "작문 일반",
  MEDIA_LANGUAGE: "매체 언어", INTEGRATED_MULTI: "복합 지문",
};

function FolderTree({ data, areaLabels, selected, onSelect }) {
  const [expanded, setExpanded] = useState({});

  const toggleExpand = (key) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const areas = Object.keys(data);
  const totalCount = Object.values(data).reduce(
    (sum, subs) => sum + Object.values(subs).reduce((s, c) => s + c, 0), 0
  );

  return (
    <div>
      <div className="qb-tree-title">영역 탐색</div>
      <div
        className={`qb-tree-item ${!selected ? "active" : ""}`}
        onClick={() => onSelect(null)}
      >
        <span className="material-symbols-outlined">folder</span>
        전체
        <span className="qb-tree-count">{totalCount}</span>
      </div>
      {areas.map((area) => {
        const subs = data[area];
        const areaCount = Object.values(subs).reduce((s, c) => s + c, 0);
        const isExpanded = expanded[area];
        const isSelected = selected?.area === area && !selected?.sub;

        return (
          <div key={area}>
            <div
              className={`qb-tree-item ${isSelected ? "active" : ""}`}
              onClick={() => {
                toggleExpand(area);
                onSelect({ area });
              }}
            >
              <span className="material-symbols-outlined">
                {isExpanded ? "folder_open" : "folder"}
              </span>
              {areaLabels[area] || area}
              <span className="qb-tree-count">{areaCount}</span>
            </div>
            {isExpanded && (
              <div className="qb-tree-children">
                {Object.entries(subs).map(([sub, count]) => (
                  <div
                    key={sub}
                    className={`qb-tree-item ${
                      selected?.area === area && selected?.sub === sub ? "active" : ""
                    }`}
                    onClick={() => onSelect({ area, sub })}
                  >
                    <span className="material-symbols-outlined">description</span>
                    {SUB_AREA_LABELS[sub] || sub}
                    <span className="qb-tree-count">{count}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default FolderTree;
