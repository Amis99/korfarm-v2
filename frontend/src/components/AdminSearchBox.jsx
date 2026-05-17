import { useState, useRef, useEffect } from "react";

/* 구글 스타일 어드민 공용 검색창
 * - 둥근 모서리 + 그림자 + 호버·포커스 시 그림자 강화
 * - 좌측: 돋보기 아이콘
 * - 우측: 검색 설정 톱니 아이콘 (드롭다운으로 검색 범위 토글)
 *
 * props:
 *  - value, onChange: input value / onChange (이벤트 핸들러 그대로)
 *  - onCompositionStart, onCompositionEnd: 한글 IME 보존용 (선택)
 *  - placeholder: input placeholder
 *  - scope: 현재 선택된 검색 범위 (기본 "all")
 *  - onScopeChange: 검색 범위 변경 핸들러
 *  - scopeOptions: [{ value, label }] — 페이지별로 커스텀 가능. 미지정 시 기본 옵션 사용
 *  - showScopeButton: 톱니 버튼 표시 여부 (기본 true)
 */

const DEFAULT_SCOPE_OPTIONS = [
  { value: "all",      label: "통합 검색" },
  { value: "title",    label: "제목" },
  { value: "area",     label: "영역·세부영역" },
  { value: "body",     label: "본문" },
  { value: "question", label: "문제 (보기·선택지 포함)" },
];

export default function AdminSearchBox({
  value,
  onChange,
  onCompositionStart,
  onCompositionEnd,
  placeholder = "검색",
  scope = "all",
  onScopeChange,
  scopeOptions = DEFAULT_SCOPE_OPTIONS,
  showScopeButton = true,
}) {
  const [scopeOpen, setScopeOpen] = useState(false);
  const wrapRef = useRef(null);

  /* 바깥 클릭 시 드롭다운 닫기 */
  useEffect(() => {
    if (!scopeOpen) return undefined;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setScopeOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [scopeOpen]);

  const handleScopePick = (val) => {
    setScopeOpen(false);
    if (onScopeChange) onScopeChange(val);
  };

  return (
    <div className="admin-search-google" ref={wrapRef}>
      <span className="admin-search-google__icon material-symbols-outlined">
        search
      </span>
      <input
        className="admin-search-google__input"
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onCompositionStart={onCompositionStart}
        onCompositionEnd={onCompositionEnd}
      />
      {showScopeButton && (
        <>
          <button
            type="button"
            className={`admin-search-google__scope-btn ${scopeOpen ? "active" : ""}`}
            onClick={() => setScopeOpen((v) => !v)}
            title="검색 범위 설정"
            aria-haspopup="true"
            aria-expanded={scopeOpen}
          >
            <span className="material-symbols-outlined">tune</span>
          </button>
          {scopeOpen && (
            <div className="admin-search-google__scope-menu" role="menu">
              <div className="admin-search-google__scope-title">검색 범위</div>
              {scopeOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`admin-search-google__scope-item ${scope === opt.value ? "active" : ""}`}
                  onClick={() => handleScopePick(opt.value)}
                  role="menuitemradio"
                  aria-checked={scope === opt.value}
                >
                  <span className="admin-search-google__scope-check material-symbols-outlined">
                    {scope === opt.value ? "check" : ""}
                  </span>
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
