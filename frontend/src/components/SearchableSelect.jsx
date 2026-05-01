import { useEffect, useMemo, useRef, useState } from "react";
import "../styles/searchable-select.css";

const HANGUL_BASE = 0xac00;
const CHOSUNG = [
  "ㄱ", "ㄲ", "ㄴ", "ㄷ", "ㄸ",
  "ㄹ", "ㅁ", "ㅂ", "ㅃ", "ㅅ",
  "ㅆ", "ㅇ", "ㅈ", "ㅉ", "ㅊ",
  "ㅋ", "ㅌ", "ㅍ", "ㅎ",
];

/** 한글 문자열의 초성만 추출. 한글이 아닌 글자는 그대로 둠 */
function getChosung(text) {
  let result = "";
  for (const ch of text) {
    const code = ch.charCodeAt(0);
    if (code >= 0xac00 && code <= 0xd7a3) {
      const idx = Math.floor((code - HANGUL_BASE) / (21 * 28));
      result += CHOSUNG[idx];
    } else {
      result += ch;
    }
  }
  return result;
}

/** 검색어와 옵션 라벨이 매칭되는지. 일반 부분일치 + 초성 일치 모두 지원 */
function matches(label, query) {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const text = (label || "").toLowerCase();
  if (text.includes(q)) return true;
  // 초성 검색: 검색어에 한글 자음(ㄱ-ㅎ) 또는 초성 영역이 포함된 경우
  if (/[ㄱ-ㅎ]/.test(q)) {
    return getChosung(text).includes(q);
  }
  return false;
}

/**
 * 검색 가능한 단일 선택 dropdown.
 * options: [{ value, label }]
 * 한글 초성 검색 지원 (예: "ㄱㅇㄴ" → "국어농장" 매칭).
 */
export default function SearchableSelect({
  options = [],
  value = "",
  onChange,
  placeholder = "선택",
  disabled = false,
  minWidth = 160,
  emptyOptionLabel = null, // null 이면 "전체" 옵션 미노출. 문자열이면 빈 값을 그 라벨로 표시
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setSearch("");
      }
    };
    // click 이벤트로 등록 — mousedown 은 li onClick 과 타이밍 충돌 가능
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, [open]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const filtered = useMemo(() => {
    if (!search.trim()) return options;
    return options.filter((o) => matches(o.label, search));
  }, [options, search]);

  const selected = options.find((o) => o.value === value);
  const triggerLabel = selected ? selected.label : (emptyOptionLabel || placeholder);

  const pick = (next) => {
    onChange?.(next);
    setOpen(false);
    setSearch("");
  };

  return (
    <div
      ref={containerRef}
      className={`searchable-select ${disabled ? "is-disabled" : ""}`}
      style={{ minWidth }}
    >
      <button
        type="button"
        className={`searchable-select-trigger ${open ? "open" : ""}`}
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) setOpen((v) => !v);
        }}
        disabled={disabled}
      >
        <span className={!selected && !emptyOptionLabel ? "searchable-select-placeholder" : ""}>
          {triggerLabel}
        </span>
        <span className="searchable-select-arrow">{open ? "▲" : "▼"}</span>
      </button>
      {open && !disabled && (
        <div className="searchable-select-dropdown">
          <div className="searchable-select-search">
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="검색 (초성 가능)"
            />
          </div>
          <ul className="searchable-select-list">
            {emptyOptionLabel && (
              <li
                className={`searchable-select-item ${value === "" ? "is-selected" : ""}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  pick("");
                }}
              >
                {emptyOptionLabel}
              </li>
            )}
            {filtered.length === 0 && (
              <li className="searchable-select-empty">일치하는 항목이 없습니다</li>
            )}
            {filtered.map((o) => (
              <li
                key={o.value}
                className={`searchable-select-item ${o.value === value ? "is-selected" : ""}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  pick(o.value);
                }}
                title={o.label}
              >
                {o.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
