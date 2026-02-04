import { useRef, useEffect, useState, useCallback } from "react";
import "../styles/manuscript.css";

export default function ManuscriptGrid({ value = "", onChange, readOnly = false, rows = 20, cols = 20 }) {
  const textareaRef = useRef(null);
  const gridRef = useRef(null);

  const totalCells = rows * cols;

  // Split value by \f (form feed) into pages
  const pages = (value || "").split("\f");
  const pageCount = pages.length;

  const [currentPage, setCurrentPage] = useState(0);

  // Reset to page 0 if value changes and current page is out of bounds
  useEffect(() => {
    if (currentPage >= pages.length) {
      setCurrentPage(Math.max(0, pages.length - 1));
    }
  }, [value, pages.length, currentPage]);

  const currentText = pages[currentPage] || "";

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

    while (result.length < totalCells) {
      result.push("");
    }

    return result;
  })();

  const currentPageCharCount = currentText.replace(/\n/g, "").length;
  const totalCharCount = pages.reduce((sum, p) => sum + p.replace(/\n/g, "").length, 0);

  const handleGridClick = () => {
    if (!readOnly && textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const emitChange = useCallback((newPages) => {
    if (onChange) {
      onChange(newPages.join("\f"));
    }
  }, [onChange]);

  const handleChange = (e) => {
    const newPages = [...pages];
    newPages[currentPage] = e.target.value;
    emitChange(newPages);
  };

  const addPage = () => {
    const newPages = [...pages, ""];
    emitChange(newPages);
    setCurrentPage(newPages.length - 1);
  };

  const removePage = () => {
    if (pages.length <= 1) return;
    const lastIdx = pages.length - 1;
    if (pages[lastIdx].replace(/\n/g, "").trim() !== "") return;
    const newPages = pages.slice(0, -1);
    emitChange(newPages);
    if (currentPage >= newPages.length) {
      setCurrentPage(newPages.length - 1);
    }
  };

  const canRemoveLast = pages.length > 1 && pages[pages.length - 1].replace(/\n/g, "").trim() === "";

  return (
    <div className="ms-wrapper">
      {pageCount > 1 && (
        <div className="ms-page-nav">
          <button
            className="ms-page-btn"
            disabled={currentPage <= 0}
            onClick={() => setCurrentPage(currentPage - 1)}
          >
            &#9664;
          </button>
          <span className="ms-page-indicator">{currentPage + 1} / {pageCount}</span>
          <button
            className="ms-page-btn"
            disabled={currentPage >= pageCount - 1}
            onClick={() => setCurrentPage(currentPage + 1)}
          >
            &#9654;
          </button>
        </div>
      )}

      <div
        ref={gridRef}
        className={`ms-grid ${readOnly ? "ms-readonly" : ""}`}
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
        onClick={handleGridClick}
      >
        {cells.map((ch, i) => (
          <div key={i} className={`ms-cell ${ch ? "ms-filled" : ""}`}>
            {ch}
          </div>
        ))}
      </div>

      {!readOnly && (
        <textarea
          ref={textareaRef}
          className="ms-textarea-hidden"
          value={currentText}
          onChange={handleChange}
          maxLength={totalCells}
        />
      )}

      <div className="ms-footer">
        {!readOnly && (
          <div className="ms-page-actions">
            <button className="ms-page-action-btn" onClick={addPage}>+ 페이지 추가</button>
            {canRemoveLast && (
              <button className="ms-page-action-btn ms-page-action-remove" onClick={removePage}>
                마지막 페이지 삭제
              </button>
            )}
          </div>
        )}
        <span className="ms-count">
          {pageCount > 1
            ? `현재 페이지 ${currentPageCharCount}자 / 전체 ${totalCharCount}자`
            : `${currentPageCharCount} / ${totalCells}자`
          }
        </span>
      </div>
    </div>
  );
}
