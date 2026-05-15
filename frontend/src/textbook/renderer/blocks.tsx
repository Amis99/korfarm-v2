/**
 * Block 컴포넌트 모음.
 *
 * 핵심 블록은 정밀 렌더, 미구현/Unknown 은 UnknownBlockView 로 폴백.
 * → 미구현 타입이 와도 화면에는 항상 무언가 표시되고 누락 X.
 */
import { Rnd } from "react-rnd";
import type {
  AreaHeader,
  Block,
  BookCover,
  ChapterCover,
  ConceptBox,
  ImageBlock,
  PageBreak,
  PassageFull,
  PassageFullNT,
  PassageHint,
  PassageNote,
  PassageNoteNT,
  QuestionBlock,
  SectionLabel,
  Spacer,
  UnknownBlock,
  VocabList,
} from "../types";

// 1mm ≈ 3.7795px (96dpi 기준)
const MM_TO_PX = 3.7795;

// ─── 1. 골격 ────────────────────────────────────────────────────

export function BookCoverView({ block }: { block: BookCover }) {
  return (
    <div className="tb-book-cover">
      <h1>{block.series.toUpperCase()}</h1>
      <div className="meta">Level {block.level} · 권 {block.volume}</div>
      <div className="meta">Chapter {block.chapterRange[0]}–{block.chapterRange[1]}</div>
      {block.subtitle && <div className="meta">{block.subtitle}</div>}
      {block.badgeText && <div className="meta">[{block.badgeText}]</div>}
    </div>
  );
}

export function ChapterCoverView({ block }: { block: ChapterCover }) {
  return (
    <div className="tb-chapter-cover">
      <div className="num">{String(block.chapterNumber).padStart(2, "0")}</div>
      <div className="label">{block.chapterLabel ?? `Chapter ${block.chapterNumber}`}</div>
      <h2>{block.chapterName}</h2>
      {block.intro && <div className="intro">{block.intro}</div>}
      {block.areaList.length > 0 && (
        <ul style={{ marginTop: "16pt", textAlign: "left", maxWidth: "120mm" }}>
          {block.areaList.map((a, i) => (
            <li key={i} style={{ color: a.color ?? "#444", margin: "4pt 0" }}>
              <strong>{a.area}</strong> — {a.subtitle}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const AREA_COLORS: Record<string, string> = {
  vocab: "#16a085", grammar: "#27ae60", concept: "#2980b9",
  literature: "#8e44ad", nonfiction: "#d35400", weekly: "#c0392b", etc: "#7f8c8d",
};

export function AreaHeaderView({ block }: { block: AreaHeader }) {
  const color = block.color ?? AREA_COLORS[block.area] ?? "#2C3E70";
  return (
    <div className="tb-area-header" style={{ "--area-color": color } as React.CSSProperties}>
      <div className="name">{labelFor(block.area)}</div>
      <div className="sub">{block.subtitle}</div>
    </div>
  );
}

function labelFor(area: AreaHeader["area"]): string {
  switch (area) {
    case "vocab": return "어휘";
    case "grammar": return "문법";
    case "concept": return "개념";
    case "literature": return "문학";
    case "nonfiction": return "비문학";
    case "weekly": return "실력 확인";
    case "etc": return "기타";
  }
}

export function SectionLabelView({ block }: { block: SectionLabel }) {
  const color = block.area ? AREA_COLORS[block.area] ?? "#2C3E70" : "#2C3E70";
  const kindLabel = kindLabelOf(block.kind);
  return (
    <div className="tb-section-label" style={{ "--area-color": color } as React.CSSProperties}>
      {kindLabel}
      {block.subtitle && <span style={{ color: "#777", fontWeight: 400 }}> {block.subtitle}</span>}
    </div>
  );
}

function kindLabelOf(k: SectionLabel["kind"]): string {
  switch (k) {
    case "passage": return "지문";
    case "activity": return "활동";
    case "question": return "문제";
    case "writing": return "글쓰기";
    case "explain": return "해설";
    case "structure": return "구조";
  }
}

// ─── 2. 본문 ────────────────────────────────────────────────────

export function ConceptView({ block }: { block: ConceptBox }) {
  return (
    <div className="tb-concept">
      <div>{block.text}</div>
      {block.examples && block.examples.length > 0 && (
        <ul style={{ marginTop: "4pt", paddingLeft: "16pt" }}>
          {block.examples.map((ex, i) => <li key={i}>{ex}</li>)}
        </ul>
      )}
    </div>
  );
}

function PassageBody({ text, isVerse }: { text: PassageNote["text"]; isVerse?: boolean }) {
  const lines = typeof text === "string"
    ? text.split(/\n+/)
    : Array.isArray(text)
      ? text
      : Object.values(text);
  return (
    <>
      {lines.map((line, i) => (
        <p key={i} style={{ margin: "0 0 6pt", whiteSpace: isVerse ? "pre-line" : "normal" }}>
          {String(line)}
        </p>
      ))}
    </>
  );
}

export function PassageNoteView({ block }: { block: PassageNote }) {
  return (
    <div className="tb-passage-note">
      <div className="body">
        {block.title && <div className="tpr-passage-label">{block.title}</div>}
        <PassageBody text={block.text} isVerse={block.isVerse} />
        {(block.author || block.source) && (
          <div style={{ fontSize: "9pt", color: "#888", marginTop: "4pt", textAlign: "right" }}>
            {block.author}{block.source ? ` / ${block.source}` : ""}
          </div>
        )}
      </div>
      <div className="memo">
        <div className="cat">메모</div>
      </div>
    </div>
  );
}

export function PassageNoteNTView({ block }: { block: PassageNoteNT }) {
  return (
    <div className="tb-passage-note-nt">
      <div className="body">
        <PassageBody text={block.text} isVerse={block.isVerse} />
      </div>
      <div className="memo"><div className="cat">메모</div></div>
    </div>
  );
}

export function PassageFullView({ block }: { block: PassageFull }) {
  return (
    <div className="tb-passage-full">
      {block.title && <div className="title">{block.title}</div>}
      <PassageBody text={block.text} isVerse={block.isVerse} />
    </div>
  );
}

export function PassageFullNTView({ block }: { block: PassageFullNT }) {
  return (
    <div className="tb-passage-full-nt">
      <PassageBody text={block.text} isVerse={block.isVerse} />
    </div>
  );
}

export function PassageHintView({ block }: { block: PassageHint }) {
  return (
    <div className="tb-passage-hint">
      {block.title && <strong>{block.title} </strong>}
      <span>{block.body}</span>
    </div>
  );
}

export function VocabListView({ block }: { block: VocabList }) {
  return (
    <table className="tb-vocab">
      <tbody>
        {block.items.map((item) => (
          <tr key={item.number}>
            <td style={{ width: "30pt", textAlign: "center" }}>
              <span className="num">{item.number}</span>
            </td>
            <td>
              <div className="word">
                {item.word}{item.hanja ? ` (${item.hanja})` : ""}
                {item.pos && <span style={{ fontSize: "9pt", color: "#888" }}> {item.pos}</span>}
              </div>
              <div className="meaning">{item.meaning}</div>
              {item.example && <div className="example">예: {item.example}</div>}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── 3. 문제 (한 덩이) ──────────────────────────────────────────

export function QuestionView({ block }: { block: QuestionBlock }) {
  const cls = block.qType === "shortAnswer" ? "tb-question short"
            : block.qType === "essay" ? "tb-question essay"
            : "tb-question";
  return (
    <div className={`${cls} tb-keep`}>
      <div className="stem">
        <span className="num">{String(block.number).padStart(2, "0")}</span>
        <span dangerouslySetInnerHTML={{ __html: underlineNegation(block.stem) }} />
      </div>
      {block.box && <div className="box">{block.box}</div>}
      {block.conditions && block.conditions.length > 0 && (
        <div className="cond">
          <ol style={{ margin: 0, paddingLeft: "20pt" }}>
            {block.conditions.map((c, i) => <li key={i}>{c}</li>)}
          </ol>
        </div>
      )}
      {block.choices && block.choices.length > 0 && (
        <ol className="choices">
          {block.choices.map((c) => (
            <li key={c.id}>
              <span style={{ marginRight: "6pt" }}>{c.id}</span>{c.text}
            </li>
          ))}
        </ol>
      )}
      {block.qType === "shortAnswer" && block.answerLines && (
        <>{Array.from({ length: block.answerLines.lines }).map((_, i) => (
          <div key={i} className="answer-lines" />
        ))}</>
      )}
      {block.qType === "essay" && block.answerNote && (
        <div className="answer-note">
          {block.answerNote.label && <div className="label">{block.answerNote.label}</div>}
          {Array.from({ length: block.answerNote.lines }).map((_, i) => (
            <div key={i} className="answer-lines" />
          ))}
        </div>
      )}
    </div>
  );
}

function underlineNegation(stem: string): string {
  const safe = escapeHtml(stem);
  return safe.replace(/(않은|없는|아닌|다른\s*하나)/g, "<u>$1</u>");
}
function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// ─── 이미지 (마우스 리사이즈/정렬) ──────────────────────────────

export function ImageView({ block, editable = false, onChange }: {
  block: ImageBlock;
  editable?: boolean;
  onChange?: (patch: Partial<ImageBlock>) => void;
}) {
  const widthMm = block.widthMm || 60;
  const url = block.url || (block.assetId ? `/v1/files/${block.assetId}/download` : "");
  const alignment = block.alignment ?? "center";
  const justify = alignment === "left" ? "flex-start" : alignment === "right" ? "flex-end" : "center";

  if (!editable || !onChange) {
    return (
      <div style={{ display: "flex", justifyContent: justify, margin: "8pt 0" }}>
        <figure style={{ margin: 0, textAlign: alignment }}>
          <img src={url} alt={block.alt ?? ""}
               style={{ width: `${widthMm}mm`, height: block.heightMm ? `${block.heightMm}mm` : "auto",
                        maxWidth: "100%", display: "block" }} />
          {block.caption && (
            <figcaption style={{ fontSize: 9, color: "#888", marginTop: 4 }}>{block.caption}</figcaption>
          )}
        </figure>
      </div>
    );
  }

  // editable — 마우스 리사이즈 가능 (Rnd 의 코너 핸들)
  const widthPx = widthMm * MM_TO_PX;
  const heightPx = block.heightMm ? block.heightMm * MM_TO_PX : undefined;
  return (
    <div style={{ display: "flex", justifyContent: justify, margin: "8pt 0" }}>
      <figure style={{ margin: 0, textAlign: alignment }} onClick={(e) => e.stopPropagation()}>
        <Rnd
          size={{ width: widthPx, height: heightPx ?? "auto" }}
          position={{ x: 0, y: 0 }}
          disableDragging
          enableResizing={{ right: true, bottom: true, bottomRight: true, top: false, left: false, topRight: false, bottomLeft: false, topLeft: false }}
          minWidth={20}
          maxWidth={210 * MM_TO_PX}        // A4 폭 한계
          onResizeStop={(_e, _dir, ref) => {
            const newWidthMm = ref.offsetWidth / MM_TO_PX;
            const newHeightMm = ref.offsetHeight / MM_TO_PX;
            onChange({ widthMm: Math.round(newWidthMm * 10) / 10,
                       heightMm: Math.round(newHeightMm * 10) / 10 });
          }}
          style={{ position: "relative", display: "inline-block",
                   border: "1px dashed #2d6a4f" }}
          resizeHandleStyles={{
            right: { width: 6, right: -3, background: "transparent" },
            bottom: { height: 6, bottom: -3, background: "transparent" },
            bottomRight: {
              width: 12, height: 12, right: -6, bottom: -6,
              background: "#2d6a4f", borderRadius: "50%",
              cursor: "nwse-resize",
            },
          }}
        >
          {url
            ? <img src={url} alt={block.alt ?? ""}
                   style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
            : <div style={{ width: "100%", height: 60, background: "#f0f0f0",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#888", fontSize: 11 }}>(이미지 없음)</div>}
        </Rnd>
        {block.caption && (
          <figcaption style={{ fontSize: 9, color: "#888", marginTop: 4 }}>{block.caption}</figcaption>
        )}
      </figure>
    </div>
  );
}

// ─── 4. 흐름 제어 ───────────────────────────────────────────────

export function PageBreakView(_: { block: PageBreak }) {
  return <div className="tb-page-break" aria-label="페이지 나눔" />;
}
export function SpacerView({ block }: { block: Spacer }) {
  return <div className="tb-spacer" style={{ height: `${block.heightMm}mm` }} />;
}

// ─── 5. Unknown (누락 보존) ─────────────────────────────────────

export function UnknownBlockView({ block }: { block: UnknownBlock }) {
  return (
    <div className="tb-unknown">
      <div className="tb-unknown-note">⚠ {block.note ?? "알 수 없는 블록 — 원본 보존됨"}</div>
      <div>{block.raw.length > 600 ? block.raw.slice(0, 600) + "…" : block.raw}</div>
    </div>
  );
}

// ─── 미구현 블록 폴백 ───────────────────────────────────────────

/** 아직 정밀 렌더가 없는 타입을 UnknownBlockView 로 표시. */
export function FallbackView({ block }: { block: Block }) {
  const note = `'${block.type}' 타입은 아직 정밀 렌더가 없습니다 — 원본 보존`;
  const raw = (() => {
    try { return JSON.stringify(block, null, 2); } catch { return String(block); }
  })();
  return <UnknownBlockView block={{ type: "unknown", original: block, raw, note }} />;
}
