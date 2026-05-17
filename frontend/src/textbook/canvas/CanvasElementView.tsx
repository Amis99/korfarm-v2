/**
 * 캔버스 위의 요소 한 개를 렌더.
 * 위치·크기·회전·opacity 는 외부(Moveable)가 transform 으로 제어.
 * 이 컴포넌트는 "콘텐츠" 만 그린다.
 */
import { useEffect, useRef } from "react";
import type {
  CanvasElement, ImageElement, ShapeElement, StickerElement,
  TextElement, UnknownElement, DomainElement,
} from "./types";
import { DomainRenderer } from "./DomainRenderer";

export function CanvasElementView({
  element,
  editing = false,
  onTextChange,
}: {
  element: CanvasElement;
  /** Phase 5 — 텍스트 인플레이스 편집 활성 여부 (외부에서 더블클릭 시 true) */
  editing?: boolean;
  /** 텍스트 편집 종료 (blur) 시 새 content 콜백 */
  onTextChange?: (content: string) => void;
}) {
  switch (element.type) {
    case "text":    return <TextEl el={element} editing={editing} onTextChange={onTextChange} />;
    case "image":   return <ImageEl el={element} />;
    case "shape":   return <ShapeEl el={element} />;
    case "sticker": return <StickerEl el={element} />;
    case "domain":  return <DomainEl el={element} />;
    case "group":   return <div style={{ width: "100%", height: "100%" }} />;
    case "unknown": return <UnknownEl el={element} />;
  }
}

const MM = 3.7795;

function TextEl({ el, editing, onTextChange }: {
  el: TextElement;
  editing?: boolean;
  onTextChange?: (content: string) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  // editing true 가 되는 순간 텍스트 끝으로 포커스 + 전체 선택
  useEffect(() => {
    if (!editing) return;
    const node = ref.current;
    if (!node) return;
    node.focus();
    // 전체 선택
    const range = document.createRange();
    range.selectNodeContents(node);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
  }, [editing]);

  return (
    <div
      ref={ref}
      contentEditable={!!editing}
      suppressContentEditableWarning
      onBlur={(e) => {
        if (!editing || !onTextChange) return;
        // innerText 가 줄바꿈을 \n 로 보존하므로 그대로 사용
        const next = (e.currentTarget as HTMLDivElement).innerText ?? "";
        if (next !== el.content) onTextChange(next);
      }}
      // 편집 중 keydown 으로 부모(Moveable) 충돌 방지
      onKeyDown={(e) => { if (editing) e.stopPropagation(); }}
      onMouseDown={(e) => { if (editing) e.stopPropagation(); }}
      style={{
        width: "100%", height: "100%",
        fontFamily: el.fontFamily ?? "inherit",
        fontSize: `${el.fontSize}pt`,
        fontWeight: el.fontWeight ?? "normal",
        fontStyle: el.fontStyle ?? "normal",
        color: el.color,
        background: el.backgroundColor ?? "transparent",
        textAlign: el.align,
        lineHeight: el.lineHeight ?? 1.4,
        letterSpacing: el.letterSpacing ? `${el.letterSpacing}em` : undefined,
        textDecoration: el.textDecoration ?? "none",
        padding: el.padding ? `${el.padding}mm` : 0,
        boxSizing: "border-box",
        overflow: "hidden",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
        outline: editing ? "1.5px dashed #2d6a4f" : "none",
        cursor: editing ? "text" : "inherit",
        userSelect: editing ? "text" : "none",
      }}
    >{el.content}</div>
  );
}

function ImageEl({ el }: { el: ImageElement }) {
  const src = el.url || (el.assetId ? `/v1/files/${el.assetId}/download` : "");
  const filterCss = el.filter && el.filter !== "none"
    ? (el.filter === "grayscale" ? "grayscale(1)"
      : el.filter === "sepia" ? "sepia(0.7)"
      : el.filter === "blur" ? "blur(2px)" : "none")
    : "none";
  if (!src) {
    return (
      <div style={{ width: "100%", height: "100%", background: "#eee",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#888", fontSize: 12 }}>
        이미지 (업로드 필요)
      </div>
    );
  }
  return (
    <img src={src} alt={el.alt ?? ""}
         style={{
           width: "100%", height: "100%",
           objectFit: el.objectFit ?? "cover",
           filter: filterCss,
           display: "block",
           userSelect: "none",
           pointerEvents: "none",
         }} draggable={false} />
  );
}

function ShapeEl({ el }: { el: ShapeElement }) {
  const stroke = el.stroke; const sw = el.strokeWidth;
  switch (el.shape) {
    case "rect":
      return <div style={{
        width: "100%", height: "100%",
        background: el.fill,
        border: `${sw}px solid ${stroke}`,
        borderRadius: el.borderRadius ? `${el.borderRadius}mm` : 0,
        boxSizing: "border-box",
      }} />;
    case "ellipse":
      return <div style={{
        width: "100%", height: "100%",
        background: el.fill,
        border: `${sw}px solid ${stroke}`,
        borderRadius: "50%",
        boxSizing: "border-box",
      }} />;
    case "triangle":
      return (
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <polygon points="50,5 95,95 5,95" fill={el.fill} stroke={stroke} strokeWidth={sw} />
        </svg>
      );
    case "line":
      return (
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line x1="0" y1="50" x2="100" y2="50" stroke={stroke} strokeWidth={sw * 2} />
        </svg>
      );
    case "arrow":
      return (
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <marker id={`arrow-${el.id}`} viewBox="0 0 10 10" refX="9" refY="5"
                    markerWidth="6" markerHeight="6" orient="auto">
              <path d="M 0 0 L 10 5 L 0 10 z" fill={stroke} />
            </marker>
          </defs>
          <line x1="0" y1="50" x2="92" y2="50" stroke={stroke} strokeWidth={sw * 2}
                markerEnd={`url(#arrow-${el.id})`} />
        </svg>
      );
  }
}

function StickerEl({ el }: { el: StickerElement }) {
  if (el.source === "emoji") {
    return (
      <div style={{
        width: "100%", height: "100%",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: `min(${el.w * MM * 0.6}px, ${el.h * MM * 0.7}px)`,
        userSelect: "none",
      }}>{el.value}</div>
    );
  }
  return (
    <img src={el.value} alt="" draggable={false}
         style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }} />
  );
}

function DomainEl({ el }: { el: DomainElement }) {
  // 도메인 풀 렌더 — DomainRenderer 가 종류별 박스/표/문항 표시 (2026-05-17)
  return <DomainRenderer el={el} />;
}

function UnknownEl({ el }: { el: UnknownElement }) {
  return (
    <div style={{
      width: "100%", height: "100%", boxSizing: "border-box",
      background: "#fff5e6", border: "1px dashed #d68910",
      padding: "2mm", overflow: "hidden",
      fontFamily: "monospace", fontSize: 9, color: "#7e5109",
    }}>
      <div style={{ fontWeight: 600 }}>⚠ {el.note ?? "Unknown"}</div>
      <div style={{ whiteSpace: "pre-wrap" }}>{el.raw.slice(0, 200)}</div>
    </div>
  );
}

function domainLabel(k: string): string {
  const map: Record<string, string> = {
    "passage-note": "지문(메모란)", "passage-full": "지문(풀폭)", "passage-hint": "지문 안내",
    "concept": "개념", "vocab-list": "어휘 목록",
    "question": "문제",
    "area-header": "영역 헤더", "section-label": "섹션 라벨",
    "summary-table": "요약표", "structure-diagram": "구조도",
    "answer-explain": "해설", "model-answer": "모범 답안",
  };
  return map[k] ?? k;
}
