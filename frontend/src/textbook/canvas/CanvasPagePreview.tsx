/**
 * A4 페이지 1장의 캔버스. 절대 좌표(mm) 기반.
 * - 모든 요소는 absolute + transform translate + rotate
 * - Moveable 로 드래그·리사이즈·회전 (선택된 요소만)
 * - 줌은 wrapper 의 scale 로
 * - 스마트 가이드: Moveable 의 snappable + bounds + verticalGuidelines/horizontalGuidelines
 */
import { useMemo, useRef } from "react";
import Moveable from "react-moveable";
import { CanvasElementView } from "./CanvasElementView";
import type { CanvasElement, CanvasPage } from "./types";

const MM = 3.7795;  // 1mm @ 96dpi (편집 화면 기준)

export function CanvasPagePreview({
  page, pageWidthMm, pageHeightMm, zoom = 1,
  selectedIds, onSelect, onChangeElement,
  guidelinesX, guidelinesY,
}: {
  page: CanvasPage;
  pageWidthMm: number;
  pageHeightMm: number;
  zoom?: number;
  selectedIds: string[];
  onSelect: (ids: string[], shiftKey?: boolean) => void;
  onChangeElement: (id: string, patch: Partial<CanvasElement>) => void;
  guidelinesX?: number[];      // 페이지 내부 px 좌표
  guidelinesY?: number[];
}) {
  const pageRef = useRef<HTMLDivElement | null>(null);

  // 정렬된 요소 — z 순서대로
  const sorted = useMemo(
    () => [...page.elements].filter((e) => !e.hidden).sort((a, b) => a.zIndex - b.zIndex),
    [page.elements]
  );

  // 선택된 DOM target 들
  const targets = useMemo(() => {
    return selectedIds
      .map((id) => document.querySelector(`[data-el-id="${id}"]`) as HTMLElement | null)
      .filter((el): el is HTMLElement => !!el);
  }, [selectedIds, sorted]);   // sorted 변경 시 DOM 재취득

  const widthPx = pageWidthMm * MM;
  const heightPx = pageHeightMm * MM;

  return (
    <div className="canvas-page-wrap" style={{
      transform: `scale(${zoom})`, transformOrigin: "top center",
      transition: "transform 100ms",
      padding: 20,
    }}>
      <div
        ref={pageRef}
        className="canvas-page"
        onMouseDown={(e) => {
          // 빈 공간 클릭 → 선택 해제 (단, 요소 위 클릭이면 무시)
          if (e.target === e.currentTarget) onSelect([], e.shiftKey);
        }}
        style={{
          position: "relative",
          width: widthPx, height: heightPx,
          background: "#fff",
          boxShadow: "0 2px 16px rgba(0,0,0,0.12)",
          margin: "0 auto",
          overflow: "hidden",
          userSelect: "none",
        }}
      >
        {/* 페이지 배경 */}
        <PageBackground bg={page.background} />

        {/* 요소들 */}
        {sorted.map((el) => (
          <ElementNode key={el.id} element={el}
                       selected={selectedIds.includes(el.id)}
                       onMouseDown={(e) => {
                         e.stopPropagation();
                         if (e.shiftKey) onSelect([...selectedIds, el.id], true);
                         else if (!selectedIds.includes(el.id)) onSelect([el.id]);
                       }} />
        ))}

        {/* Moveable — 드래그·리사이즈·회전·스냅 */}
        {targets.length > 0 && (
          <Moveable
            target={targets}
            container={pageRef.current}
            draggable
            resizable
            rotatable
            snappable
            snapDirections={{ top: true, left: true, bottom: true, right: true, center: true, middle: true }}
            elementSnapDirections={{ top: true, left: true, bottom: true, right: true, center: true, middle: true }}
            verticalGuidelines={guidelinesX ?? [0, widthPx / 2, widthPx]}
            horizontalGuidelines={guidelinesY ?? [0, heightPx / 2, heightPx]}
            snapThreshold={5}
            keepRatio={false}
            throttleDrag={0}
            throttleResize={0}
            throttleRotate={0}
            origin={false}
            zoom={1}
            onDrag={({ target, beforeTranslate }) => {
              const t = target as HTMLElement;
              t.style.transform =
                `translate(${beforeTranslate[0]}px, ${beforeTranslate[1]}px) ` +
                `rotate(${getRotation(t)}deg)`;
              (t as any)._tx = beforeTranslate;
            }}
            onDragEnd={({ target }) => {
              const t = target as HTMLElement;
              const tx = (t as any)._tx ?? [0, 0];
              const id = t.getAttribute("data-el-id")!;
              const el = page.elements.find((e) => e.id === id);
              if (!el) return;
              onChangeElement(id, { x: el.x + tx[0] / MM, y: el.y + tx[1] / MM } as any);
              t.style.transform = `translate(0,0) rotate(${el.rotation}deg)`;
            }}
            onResize={({ target, width, height, drag }) => {
              const t = target as HTMLElement;
              t.style.width = `${width}px`;
              t.style.height = `${height}px`;
              t.style.transform =
                `translate(${drag.beforeTranslate[0]}px, ${drag.beforeTranslate[1]}px) ` +
                `rotate(${getRotation(t)}deg)`;
              (t as any)._tx = drag.beforeTranslate;
              (t as any)._size = { w: width, h: height };
            }}
            onResizeEnd={({ target }) => {
              const t = target as HTMLElement;
              const tx = (t as any)._tx ?? [0, 0];
              const sz = (t as any)._size ?? { w: t.offsetWidth, h: t.offsetHeight };
              const id = t.getAttribute("data-el-id")!;
              const el = page.elements.find((e) => e.id === id);
              if (!el) return;
              onChangeElement(id, {
                x: el.x + tx[0] / MM,
                y: el.y + tx[1] / MM,
                w: sz.w / MM,
                h: sz.h / MM,
              } as any);
              t.style.transform = `translate(0,0) rotate(${el.rotation}deg)`;
            }}
            onRotate={({ target, beforeRotate }) => {
              const t = target as HTMLElement;
              t.style.transform = `translate(0,0) rotate(${beforeRotate}deg)`;
              (t as any)._rotation = beforeRotate;
            }}
            onRotateEnd={({ target }) => {
              const t = target as HTMLElement;
              const r = (t as any)._rotation ?? 0;
              const id = t.getAttribute("data-el-id")!;
              onChangeElement(id, { rotation: r } as any);
            }}
          />
        )}
      </div>
    </div>
  );
}

function ElementNode({ element, selected, onMouseDown }: {
  element: CanvasElement;
  selected: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  return (
    <div
      data-el-id={element.id}
      onMouseDown={onMouseDown}
      style={{
        position: "absolute",
        left: `${element.x * MM}px`,
        top: `${element.y * MM}px`,
        width: `${element.w * MM}px`,
        height: `${element.h * MM}px`,
        transform: `rotate(${element.rotation}deg)`,
        transformOrigin: "center",
        opacity: element.opacity ?? 1,
        cursor: element.locked ? "not-allowed" : "move",
        outline: selected ? "1.5px solid #2d6a4f" : "1.5px solid transparent",
        outlineOffset: 1,
        boxSizing: "border-box",
        pointerEvents: element.locked ? "none" : "auto",
      }}
    >
      <CanvasElementView element={element} />
    </div>
  );
}

function PageBackground({ bg }: { bg: CanvasPage["background"] }) {
  if (bg.kind === "none") return null;
  if (bg.kind === "image") {
    return <img src={(bg as any).url ?? ""} alt=""
                style={{ position: "absolute", inset: 0, width: "100%", height: "100%",
                         objectFit: "cover", opacity: (bg as any).opacity ?? 1,
                         pointerEvents: "none" }} draggable={false} />;
  }
  return null;
}

function getRotation(target: HTMLElement): number {
  const tr = target.style.transform;
  const m = tr.match(/rotate\(([-\d.]+)deg\)/);
  return m && m[1] ? parseFloat(m[1]) : 0;
}
