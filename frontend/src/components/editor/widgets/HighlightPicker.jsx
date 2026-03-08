import { useState, useCallback } from "react";

/**
 * 하이라이트 범위 편집기
 * - "하이라이트 설정" 클릭 → 선택 모드 활성화
 * - 미리보기 지문에서 텍스트 드래그 → onAdd 콜백
 * - 기존 하이라이트 목록 표시 + 삭제
 *
 * @param {Array} ranges - [{ paragraphId, start, end }]
 * @param {Array} paragraphs - [{ id, text }]
 * @param {Function} onAdd - (range) => void
 * @param {Function} onRemove - (index) => void
 * @param {string} selectContainerId - 선택 영역 컨테이너 DOM id
 */
export default function HighlightPicker({ ranges = [], paragraphs = [], onAdd, onRemove, selectContainerId }) {
  const [selectMode, setSelectMode] = useState(false);

  const handleMouseUp = useCallback(() => {
    if (!selectMode) return;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) return;

    const range = sel.getRangeAt(0);
    const container = document.getElementById(selectContainerId);
    if (!container || !container.contains(range.commonAncestorContainer)) return;

    /* 선택 범위에서 paragraphId와 offset 추출 */
    const startNode = range.startContainer;
    const endNode = range.endContainer;

    const findParagraph = (node) => {
      let cur = node;
      while (cur && cur !== container) {
        if (cur.dataset && cur.dataset.paragraphId) return cur;
        cur = cur.parentElement;
      }
      return null;
    };

    const startPara = findParagraph(startNode);
    const endPara = findParagraph(endNode);
    if (!startPara || !endPara) return;

    /* 단일 단락 내 선택만 지원 */
    if (startPara.dataset.paragraphId !== endPara.dataset.paragraphId) {
      alert("하이라이트는 단일 단락 내에서만 설정할 수 있습니다.");
      sel.removeAllRanges();
      return;
    }

    const paraId = startPara.dataset.paragraphId;
    const paraText = startPara.textContent || "";

    /* TreeWalker로 정확한 문자 offset 계산 */
    const getCharOffset = (container, targetNode, targetOffset) => {
      const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
      let offset = 0;
      let node;
      while ((node = walker.nextNode())) {
        if (node === targetNode) return offset + targetOffset;
        offset += node.textContent.length;
      }
      return offset;
    };

    const start = getCharOffset(startPara, startNode, range.startOffset);
    const end = getCharOffset(endPara, endNode, range.endOffset);

    if (start === end) return;

    const selectedText = paraText.slice(start, end);
    onAdd({ paragraphId: paraId, start, end, _text: selectedText });
    sel.removeAllRanges();
  }, [selectMode, selectContainerId, onAdd]);

  /* 선택 모드 토글 시 이벤트 등록 */
  const toggleSelectMode = () => {
    const next = !selectMode;
    setSelectMode(next);
    const container = document.getElementById(selectContainerId);
    if (container) {
      if (next) {
        container.classList.add("ce-select-mode");
        container.addEventListener("mouseup", handleMouseUp);
      } else {
        container.classList.remove("ce-select-mode");
        container.removeEventListener("mouseup", handleMouseUp);
      }
    }
  };

  /* 범위의 텍스트 미리보기 */
  const getRangeText = (r) => {
    if (r._text) return r._text;
    const para = paragraphs.find((p) => p.id === r.paragraphId);
    if (!para) return `P${r.paragraphId}: ${r.start}-${r.end}`;
    return para.text.slice(r.start, r.end);
  };

  return (
    <div>
      <button
        className={`ce-btn ${selectMode ? "ce-btn-primary" : "ce-btn-secondary"}`}
        onClick={toggleSelectMode}
        style={{ marginBottom: 8 }}
      >
        {selectMode ? "선택 모드 종료" : "하이라이트 설정"}
      </button>
      {selectMode && (
        <div style={{ fontSize: 11, color: "#ffb84d", marginBottom: 8 }}>
          미리보기 지문에서 텍스트를 드래그하세요
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {ranges.map((r, i) => (
          <span key={i} className="ce-highlight-range">
            "{getRangeText(r).slice(0, 20)}{getRangeText(r).length > 20 ? "..." : ""}"
            <button className="ce-highlight-del" onClick={() => onRemove(i)}>×</button>
          </span>
        ))}
      </div>
    </div>
  );
}
