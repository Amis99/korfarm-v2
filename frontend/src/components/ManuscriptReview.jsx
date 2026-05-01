import { useState, useCallback, useRef } from "react";
import "../styles/manuscript.css";

/**
 * 첨삭 전용 원고지 컴포넌트.
 * - 관리자 모드(readOnly=false): 드래그로 영역 선택 → 번호 + 빨간 밑줄, 첨삭줄에 코멘트 입력
 * - 학생/학부모 모드(readOnly=true): 밑줄 + 번호 표시, 클릭/터치로 코멘트 펼침/접힘
 */
export default function ManuscriptReview({
  value = "",
  cols = 20,
  rows = 25,
  annotations = [],
  onAnnotationsChange,
  readOnly = false,
}) {
  const totalCells = rows * cols;
  const pages = (value || "").split("\f");
  const pageCount = pages.length;

  const [currentPage, setCurrentPage] = useState(0);
  const safePage = currentPage >= pages.length ? 0 : currentPage;
  const currentText = pages[safePage] || "";

  // 드래그 상태
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const isDragging = useRef(false);

  // 학생 뷰 펼침/접힘
  const [expandedIds, setExpandedIds] = useState(new Set());

  // 셀 데이터 생성 (ManuscriptGrid와 동일 로직)
  const cells = (() => {
    const text = currentText;
    const result = [];
    let cellIdx = 0;
    for (let i = 0; i < text.length && cellIdx < totalCells; i++) {
      const ch = text[i];
      if (ch === "\n") {
        const remainder = cellIdx % cols;
        if (remainder !== 0) {
          for (let pad = remainder; pad < cols; pad++) {
            result.push("");
            cellIdx++;
          }
        }
      } else {
        result.push(ch);
        cellIdx++;
      }
    }
    while (result.length < totalCells) result.push("");
    return result;
  })();

  const charCount = currentText.replace(/\n/g, "").length;
  const totalCharCount = pages.reduce((sum, p) => sum + p.replace(/\n/g, "").length, 0);

  // 현재 페이지의 어노테이션
  const currentPageAnnotations = annotations.filter((a) => a.page === safePage);

  // 셀에 해당하는 어노테이션 찾기
  const getAnnotationForCell = useCallback(
    (cellIdx) => {
      return currentPageAnnotations.find(
        (a) => cellIdx >= a.startIdx && cellIdx <= a.endIdx
      );
    },
    [currentPageAnnotations]
  );

  // 드래그 범위 확인
  const isInDragRange = (cellIdx) => {
    if (dragStart === null || dragEnd === null) return false;
    const s = Math.min(dragStart, dragEnd);
    const e = Math.max(dragStart, dragEnd);
    return cellIdx >= s && cellIdx <= e;
  };

  // --- 관리자 모드: 드래그 ---
  const dragEndRef = useRef(null);

  const handleCellPointerDown = (cellIdx, e) => {
    if (readOnly) return;
    if (getAnnotationForCell(cellIdx)) return;
    e.preventDefault();
    isDragging.current = true;
    dragEndRef.current = cellIdx;
    setDragStart(cellIdx);
    setDragEnd(cellIdx);
  };

  // 터치 드래그 대응: pointermove에서 elementFromPoint로 셀 탐지
  const handlePointerMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const el = document.elementFromPoint(e.clientX, e.clientY);
    if (!el) return;
    const cellEl = el.closest("[data-cell-idx]");
    if (!cellEl) return;
    const idx = Number(cellEl.dataset.cellIdx);
    if (!isNaN(idx) && idx !== dragEndRef.current) {
      dragEndRef.current = idx;
      setDragEnd(idx);
    }
  };

  const handlePointerUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    if (dragStart === null) return;

    const start = Math.min(dragStart, dragEndRef.current ?? dragStart);
    const end = Math.max(dragStart, dragEndRef.current ?? dragStart);

    // 빈 셀만 있으면 무시
    const hasContent = cells.slice(start, end + 1).some((ch) => ch !== "");
    // 기존 어노테이션과 겹치면 무시
    const overlaps = currentPageAnnotations.some(
      (a) => start <= a.endIdx && end >= a.startIdx
    );

    if (hasContent && !overlaps) {
      const nextId =
        annotations.length > 0
          ? Math.max(...annotations.map((a) => a.id)) + 1
          : 1;
      const newAnn = {
        id: nextId,
        page: safePage,
        startIdx: start,
        endIdx: end,
        comment: "",
      };
      onAnnotationsChange?.([...annotations, newAnn]);
    }

    setDragStart(null);
    setDragEnd(null);
    dragEndRef.current = null;
  };

  // 어노테이션 삭제 (번호 재정렬)
  const removeAnnotation = (annId) => {
    const filtered = annotations.filter((a) => a.id !== annId);
    const renumbered = filtered.map((a, i) => ({ ...a, id: i + 1 }));
    onAnnotationsChange?.(renumbered);
  };

  // 어노테이션 코멘트 수정
  const updateAnnotationComment = (annId, text) => {
    onAnnotationsChange?.(
      annotations.map((a) => (a.id === annId ? { ...a, comment: text } : a))
    );
  };

  // 학생 뷰 펼침/접힘
  const toggleExpand = (annId) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(annId)) next.delete(annId);
      else next.add(annId);
      return next;
    });
  };

  return (
    <div
      className="ms-review-wrapper"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={() => {
        if (isDragging.current) handlePointerUp();
      }}
    >
      {/* 페이지 네비게이션 */}
      {pageCount > 1 && (
        <div className="ms-page-nav">
          <button
            className="ms-page-btn"
            disabled={safePage <= 0}
            onClick={() => setCurrentPage(safePage - 1)}
          >
            &#9664;
          </button>
          <span className="ms-page-indicator">
            {safePage + 1} / {pageCount}
          </span>
          <button
            className="ms-page-btn"
            disabled={safePage >= pageCount - 1}
            onClick={() => setCurrentPage(safePage + 1)}
          >
            &#9654;
          </button>
        </div>
      )}

      {/* 행별 렌더링 */}
      {Array.from({ length: rows }, (_, rowIdx) => {
        const rowStart = rowIdx * cols;
        const rowEnd = rowStart + cols - 1;
        // 이 행에서 시작하는 어노테이션
        const rowAnnotations = currentPageAnnotations.filter(
          (a) => Math.floor(a.startIdx / cols) === rowIdx
        );

        return (
          <div key={rowIdx}>
            {/* 그리드 행 */}
            <div
              className="ms-review-row"
              style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
            >
              {cells.slice(rowStart, rowStart + cols).map((ch, colIdx) => {
                const cellIdx = rowStart + colIdx;
                const ann = getAnnotationForCell(cellIdx);
                const isFirst = ann && ann.startIdx === cellIdx;
                const dragging = isInDragRange(cellIdx);

                return (
                  <div
                    key={cellIdx}
                    data-cell-idx={cellIdx}
                    className={[
                      "ms-review-cell",
                      ch && "ms-filled",
                      ann && "ms-annotated",
                      dragging && "ms-selecting",
                      readOnly && ann && "ms-clickable",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onPointerDown={(e) => handleCellPointerDown(cellIdx, e)}
                    onClick={() => readOnly && ann && toggleExpand(ann.id)}
                  >
                    {isFirst && (
                      <span className="ms-ann-badge">{ann.id}</span>
                    )}
                    {ch}
                  </div>
                );
              })}
            </div>

            {/* 첨삭줄 */}
            <div
              className={`ms-correction-line ${
                rowAnnotations.length > 0 ? "ms-has-items" : ""
              }`}
            >
              {rowAnnotations.map((ann) => {
                const isExpanded = expandedIds.has(ann.id);
                return (
                  <div
                    key={ann.id}
                    className={`ms-correction-item ${
                      readOnly && !isExpanded ? "ms-collapsed" : "ms-expanded"
                    }`}
                  >
                    <span
                      className="ms-expand-badge ms-ann-badge"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (readOnly) toggleExpand(ann.id);
                      }}
                    >
                      {ann.id}
                    </span>
                    {readOnly ? (
                      <span className="ms-correction-text">{ann.comment}</span>
                    ) : (
                      <>
                        <textarea
                          value={ann.comment}
                          onChange={(e) =>
                            updateAnnotationComment(ann.id, e.target.value)
                          }
                          placeholder="첨삭 코멘트 입력..."
                          rows={Math.max(1, Math.ceil((ann.comment?.length || 0) / 40))}
                        />
                        <button
                          className="ms-ann-remove"
                          onClick={() => removeAnnotation(ann.id)}
                        >
                          &times;
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* 하단 border */}
      <div style={{ borderBottom: "2px solid #b8a99a" }} />

      {/* 글자 수 */}
      <div className="ms-footer">
        <span className="ms-count">
          {pageCount > 1
            ? `현재 페이지 ${charCount}자 / 전체 ${totalCharCount}자`
            : `${charCount}자`}
        </span>
      </div>
    </div>
  );
}
