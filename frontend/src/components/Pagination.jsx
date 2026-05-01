import "../styles/pagination.css";

/**
 * 공용 페이지네이션 — 어드민/학생/학부모 모든 리스트 페이지의 단일 컴포넌트.
 * 윈도우 10 단위 + 이전/다음 + (윈도우 벗어날 시) 처음/마지막.
 *
 * Props:
 *   page          현재 페이지 (1-based)
 *   totalPages    총 페이지 수
 *   onChange(p)   페이지 변경 콜백
 *   windowSize    한 번에 보여줄 번호 버튼 개수 (기본 10)
 *   className     컨테이너 추가 클래스
 *
 * totalPages <= 1 이면 아무것도 렌더하지 않음.
 */
export default function Pagination({
  page,
  totalPages,
  onChange,
  windowSize = 10,
  className = "",
}) {
  if (!totalPages || totalPages <= 1) return null;

  const safePage = Math.min(Math.max(1, page || 1), totalPages);
  const half = Math.floor(windowSize / 2);
  let start = Math.max(1, safePage - half);
  let end = Math.min(totalPages, start + windowSize - 1);
  if (end - start + 1 < windowSize) {
    start = Math.max(1, end - windowSize + 1);
  }
  const numbers = [];
  for (let i = start; i <= end; i += 1) numbers.push(i);

  const go = (p) => {
    const next = Math.min(Math.max(1, p), totalPages);
    if (next !== safePage) onChange?.(next);
  };

  return (
    <div className={`admin-pagination ${className}`.trim()}>
      {start > 1 && (
        <button type="button" onClick={() => go(1)}>처음</button>
      )}
      <button type="button" disabled={safePage <= 1} onClick={() => go(safePage - 1)}>
        이전
      </button>
      {numbers.map((n) => (
        <button
          key={n}
          type="button"
          className={n === safePage ? "active" : ""}
          onClick={() => go(n)}
        >
          {n}
        </button>
      ))}
      <button type="button" disabled={safePage >= totalPages} onClick={() => go(safePage + 1)}>
        다음
      </button>
      {end < totalPages && (
        <button type="button" onClick={() => go(totalPages)}>마지막</button>
      )}
    </div>
  );
}
