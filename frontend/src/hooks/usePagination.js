import { useState, useEffect, useMemo } from "react";

/**
 * 클라이언트 사이드 페이지네이션 헬퍼.
 *
 * 사용:
 *   const { page, setPage, totalPages, paged } = usePagination(rows, 15);
 *   ...
 *   {paged.map(...)}
 *   <Pagination page={page} totalPages={totalPages} onChange={setPage} />
 *
 * data 가 변하면 page 가 totalPages 를 넘지 않도록 자동 보정.
 */
export default function usePagination(data, pageSize = 15) {
  const [page, setPage] = useState(1);
  const list = Array.isArray(data) ? data : [];
  const totalPages = Math.max(1, Math.ceil(list.length / pageSize));

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const paged = useMemo(
    () => list.slice((page - 1) * pageSize, page * pageSize),
    [list, page, pageSize]
  );

  return { page, setPage, totalPages, paged };
}
