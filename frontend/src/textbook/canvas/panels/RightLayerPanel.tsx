/**
 * 우측 — 레이어 패널. z 순서, 잠금/숨김 토글.
 */
import type { CanvasElement, CanvasPage } from "../types";

export function RightLayerPanel({
  page, selectedIds, onSelect, onChange,
}: {
  page: CanvasPage | null;
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  onChange: (id: string, patch: Partial<CanvasElement>) => void;
}) {
  if (!page) return <div style={{ padding: 10, fontSize: 11, color: "#888" }}>페이지를 선택하세요</div>;
  // 위가 앞(zIndex 큼)
  const sorted = [...page.elements].sort((a, b) => b.zIndex - a.zIndex);
  return (
    <div style={{ padding: 10, height: "100%", overflowY: "auto" }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: "#555", marginBottom: 6 }}>레이어</div>
      {sorted.length === 0 ? (
        <div style={{ fontSize: 11, color: "#888" }}>요소를 추가하면 여기에 나열됩니다.</div>
      ) : (
        sorted.map((el) => (
          <div key={el.id}
               onClick={() => onSelect([el.id])}
               style={{
                 display: "flex", alignItems: "center", gap: 6,
                 padding: "4px 6px", marginBottom: 2, borderRadius: 3,
                 background: selectedIds.includes(el.id) ? "#e8f4ec" : "transparent",
                 border: selectedIds.includes(el.id) ? "1px solid #2d6a4f" : "1px solid transparent",
                 cursor: "pointer", fontSize: 11,
               }}>
            <button type="button" title={el.hidden ? "보이기" : "숨기기"}
                    onClick={(e) => { e.stopPropagation(); onChange(el.id, { hidden: !el.hidden } as any); }}
                    style={miniIconBtn}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                {el.hidden ? "visibility_off" : "visibility"}
              </span>
            </button>
            <button type="button" title={el.locked ? "잠금 해제" : "잠금"}
                    onClick={(e) => { e.stopPropagation(); onChange(el.id, { locked: !el.locked } as any); }}
                    style={miniIconBtn}>
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                {el.locked ? "lock" : "lock_open"}
              </span>
            </button>
            <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {labelOf(el)}
            </span>
            <span style={{ fontSize: 9, color: "#999" }}>z{el.zIndex}</span>
          </div>
        ))
      )}
    </div>
  );
}

const miniIconBtn: React.CSSProperties = {
  background: "transparent", border: "none", padding: 0, cursor: "pointer",
  display: "flex", alignItems: "center", color: "#666",
};

function labelOf(el: CanvasElement): string {
  switch (el.type) {
    case "text":    return `T  ${((el as any).content || "").slice(0, 18) || "(빈 텍스트)"}`;
    case "image":   return `🖼  ${(el as any).alt || "이미지"}`;
    case "shape":   return `◇  ${(el as any).shape}`;
    case "sticker": return `${(el as any).value}  스티커`;
    case "domain":  return `▤  ${(el as any).domainKind}`;
    case "group":   return `◐  그룹 (${(el as any).childIds?.length ?? 0})`;
    case "unknown": return `?  Unknown`;
  }
}
