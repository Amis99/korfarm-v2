import type {
  Block, HeaderFooterConfig, Page, SlotContent, Textbook,
} from "../types";
import { BlockRenderer } from "./BlockRenderer";

/**
 * A4 페이지 1장. 사이즈는 절대 변하지 않는다 (210x297mm 고정).
 * - 짝수 페이지: outer=좌, inner=우
 * - 홀수 페이지: outer=우, inner=좌
 * - mode="student" 면 정답·해설 블록 숨김
 * - 각 블록은 data-block-index 로 감싸서 클릭 선택 + 강조 가능.
 */
export function PagePreview({
  page, pageIndex, textbook, mode = "preview", selectedBlockIndex, onBlockChange,
}: {
  page: Page;
  pageIndex: number;             // 0-based
  textbook: Textbook;
  mode?: "preview" | "student";
  selectedBlockIndex?: number | null;
  onBlockChange?: (idx: number, patch: Partial<Block>) => void;
}) {
  const isEven = pageIndex % 2 === 0;
  const pageClass = `tb-page ${isEven ? "even" : "odd"} ${mode === "student" ? "student-mode" : ""}`;
  return (
    <article className={pageClass} data-page-index={pageIndex}>
      <Header config={textbook.header} pageNumber={pageIndex + 1} textbook={textbook} />
      <PageBody page={page} selectedBlockIndex={selectedBlockIndex ?? null} onBlockChange={onBlockChange} />
      <Footer config={textbook.footer} pageNumber={pageIndex + 1} textbook={textbook} />
    </article>
  );
}

function BlockSlot({ block, globalIndex, selected, onBlockChange }: {
  block: Block; globalIndex: number; selected: boolean;
  onBlockChange?: (idx: number, patch: Partial<Block>) => void;
}) {
  return (
    <div
      data-block-index={globalIndex}
      style={{
        cursor: "pointer",
        outline: selected ? "2px solid #2d6a4f" : "2px solid transparent",
        outlineOffset: 2,
        borderRadius: 3,
        transition: "outline-color 120ms",
      }}
    >
      <BlockRenderer
        block={block}
        editable={!!onBlockChange}
        onBlockChange={onBlockChange ? (patch) => onBlockChange(globalIndex, patch) : undefined}
      />
    </div>
  );
}

function PageBody({ page, selectedBlockIndex, onBlockChange }: {
  page: Page; selectedBlockIndex: number | null;
  onBlockChange?: (idx: number, patch: Partial<Block>) => void;
}) {
  const ranges = (page.multicolRanges ?? []).slice().sort((a, b) => a.from - b.from);
  if (ranges.length === 0) {
    return (
      <div className="tb-page-body">
        {page.blocks.map((b, i) => (
          <BlockSlot key={i} block={b} globalIndex={i} selected={i === selectedBlockIndex} onBlockChange={onBlockChange} />
        ))}
      </div>
    );
  }

  // multicol chunk — 전체 인덱스 보존을 위해 startIdx 같이 보관
  const chunks: Array<{ kind: "single" | "multi"; blocks: Block[]; startIdx: number; columns?: 2 | 3 }> = [];
  let cursor = 0;
  for (const r of ranges) {
    if (cursor < r.from) {
      chunks.push({ kind: "single", blocks: page.blocks.slice(cursor, r.from), startIdx: cursor });
    }
    chunks.push({
      kind: "multi", blocks: page.blocks.slice(r.from, r.to + 1),
      startIdx: r.from, columns: r.columns,
    });
    cursor = r.to + 1;
  }
  if (cursor < page.blocks.length) {
    chunks.push({ kind: "single", blocks: page.blocks.slice(cursor), startIdx: cursor });
  }

  return (
    <div className="tb-page-body">
      {chunks.map((c, i) =>
        c.kind === "single" ? (
          <div key={i}>
            {c.blocks.map((b, j) => (
              <BlockSlot key={j} block={b} globalIndex={c.startIdx + j}
                         selected={c.startIdx + j === selectedBlockIndex} onBlockChange={onBlockChange} />
            ))}
          </div>
        ) : (
          <div key={i} className={`tb-multicol ${c.columns === 3 ? "cols-3" : ""}`}>
            {c.blocks.map((b, j) => (
              <BlockSlot key={j} block={b} globalIndex={c.startIdx + j}
                         selected={c.startIdx + j === selectedBlockIndex} onBlockChange={onBlockChange} />
            ))}
          </div>
        )
      )}
    </div>
  );
}

function Header({ config, pageNumber, textbook }: { config: HeaderFooterConfig; pageNumber: number; textbook: Textbook }) {
  return (
    <header className="tb-page-header">
      <div className="tb-slot-outer"><SlotView slot={config.outer} pageNumber={pageNumber} textbook={textbook} /></div>
      <div className="tb-slot-inner"><SlotView slot={config.inner} pageNumber={pageNumber} textbook={textbook} /></div>
    </header>
  );
}

function Footer({ config, pageNumber, textbook }: { config: HeaderFooterConfig; pageNumber: number; textbook: Textbook }) {
  return (
    <footer className="tb-page-footer">
      <div className="tb-slot-outer"><SlotView slot={config.outer} pageNumber={pageNumber} textbook={textbook} /></div>
      <div className="tb-slot-inner"><SlotView slot={config.inner} pageNumber={pageNumber} textbook={textbook} /></div>
    </footer>
  );
}

function SlotView({ slot, pageNumber, textbook }: { slot: SlotContent; pageNumber: number; textbook: Textbook }) {
  switch (slot.kind) {
    case "none": return null;
    case "logo":
      return <span style={{ fontWeight: 700, fontSize: "11pt", color: "#2d6a4f" }}>국어농장</span>;
    case "pageNumber":
      return <span>{pageNumber}</span>;
    case "areaName":
      return <span>{textbook.title}</span>;
    case "chapterName":
      return <span>Chapter {textbook.chapterRange[0]}–{textbook.chapterRange[1]}</span>;
    case "image": {
      const asset = textbook.imagePool.find((a) => a.assetId === slot.assetId);
      return asset
        ? <img src={asset.url} alt="" style={{ height: `${slot.height ?? 8}mm`, verticalAlign: "middle" }} />
        : null;
    }
    case "text":
      return <span>{slot.text}</span>;
  }
}
