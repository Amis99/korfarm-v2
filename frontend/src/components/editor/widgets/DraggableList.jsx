import { useRef, useState } from "react";

/**
 * 드래그&드롭 순서 변경 가능한 리스트
 * @param {Object} props
 * @param {Array} props.items - 아이템 배열
 * @param {Function} props.onReorder - (fromIndex, toIndex) => void
 * @param {Function} props.renderItem - (item, index) => JSX
 */
export default function DraggableList({ items = [], onReorder, renderItem }) {
  const dragIdx = useRef(null);
  const [overIdx, setOverIdx] = useState(null);

  const handleDragStart = (e, idx) => {
    dragIdx.current = idx;
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, idx) => {
    e.preventDefault();
    setOverIdx(idx);
  };

  const handleDrop = (e, idx) => {
    e.preventDefault();
    if (dragIdx.current !== null && dragIdx.current !== idx) {
      onReorder(dragIdx.current, idx);
    }
    dragIdx.current = null;
    setOverIdx(null);
  };

  const handleDragEnd = () => {
    dragIdx.current = null;
    setOverIdx(null);
  };

  return (
    <div>
      {items.map((item, i) => (
        <div
          key={item.id || item.stepId || i}
          className="ce-drag-item"
          draggable
          onDragStart={(e) => handleDragStart(e, i)}
          onDragOver={(e) => handleDragOver(e, i)}
          onDrop={(e) => handleDrop(e, i)}
          onDragEnd={handleDragEnd}
          style={overIdx === i ? { borderTop: "2px solid #ff7f2a" } : undefined}
        >
          <span className="ce-drag-handle" title="드래그하여 순서 변경">⠿</span>
          <div style={{ flex: 1 }}>{renderItem(item, i)}</div>
        </div>
      ))}
    </div>
  );
}
