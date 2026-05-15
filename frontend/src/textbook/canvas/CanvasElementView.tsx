/**
 * 캔버스 위의 요소 한 개를 렌더.
 * 위치·크기·회전·opacity 는 외부(Moveable)가 transform 으로 제어.
 * 이 컴포넌트는 "콘텐츠" 만 그린다.
 */
import type {
  CanvasElement, ImageElement, ShapeElement, StickerElement,
  TextElement, UnknownElement, DomainElement,
} from "./types";

export function CanvasElementView({ element }: { element: CanvasElement }) {
  switch (element.type) {
    case "text":    return <TextEl el={element} />;
    case "image":   return <ImageEl el={element} />;
    case "shape":   return <ShapeEl el={element} />;
    case "sticker": return <StickerEl el={element} />;
    case "domain":  return <DomainEl el={element} />;
    case "group":   return <div style={{ width: "100%", height: "100%" }} />;
    case "unknown": return <UnknownEl el={element} />;
  }
}

const MM = 3.7795;

function TextEl({ el }: { el: TextElement }) {
  return (
    <div style={{
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
    }}>{el.content}</div>
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
  // 1차 — 도메인 요소는 미리보기 캔버스 안에선 단순 박스 라벨 + 핵심 텍스트로.
  // 자세한 내부 렌더는 Inspector 또는 별도 모달.
  const title = (el.props as any).title ?? (el.props as any).chapterName ?? domainLabel(el.domainKind);
  const body = (el.props as any).text ?? (el.props as any).body ?? (el.props as any).stem ?? "";
  return (
    <div style={{
      width: "100%", height: "100%", boxSizing: "border-box",
      border: "1px dashed #2d6a4f", borderRadius: 3, padding: "4mm",
      background: "rgba(232,244,236,0.4)", overflow: "hidden",
    }}>
      <div style={{ fontSize: 8, color: "#2d6a4f", textTransform: "uppercase",
                    letterSpacing: 0.05, marginBottom: 2 }}>{el.domainKind}</div>
      {title && <div style={{ fontWeight: 600, marginBottom: 4 }}>{String(title)}</div>}
      <div style={{ fontSize: 10, color: "#444", whiteSpace: "pre-wrap" }}>
        {typeof body === "string" ? body.slice(0, 200) : JSON.stringify(body).slice(0, 200)}
      </div>
    </div>
  );
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
