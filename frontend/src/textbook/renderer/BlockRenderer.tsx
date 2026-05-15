import type { Block, ImageBlock } from "../types";
import {
  AreaHeaderView, BookCoverView, ChapterCoverView, ConceptView, FallbackView,
  ImageView, PageBreakView, PassageFullNTView, PassageFullView, PassageHintView,
  PassageNoteNTView, PassageNoteView, QuestionView, SectionLabelView, SpacerView,
  UnknownBlockView, VocabListView,
} from "./blocks";

/**
 * Block 타입별 컴포넌트 분기.
 * editable=true 면 이미지 등 인터랙티브 블록은 마우스 핸들 활성.
 * 미구현 타입은 FallbackView 가 UnknownBlock 으로 폴백 — 누락 0 보장.
 */
export function BlockRenderer({ block, editable = false, onBlockChange }: {
  block: Block;
  editable?: boolean;
  onBlockChange?: (patch: Partial<Block>) => void;
}) {
  switch (block.type) {
    // 1. 골격
    case "book-cover":      return <BookCoverView block={block} />;
    case "chapter-cover":   return <ChapterCoverView block={block} />;
    case "area-header":     return <AreaHeaderView block={block} />;
    case "section-label":   return <SectionLabelView block={block} />;
    // 2. 본문
    case "concept":         return <ConceptView block={block} />;
    case "vocab-list":      return <VocabListView block={block} />;
    case "passage-note":    return <PassageNoteView block={block} />;
    case "passage-note-nt": return <PassageNoteNTView block={block} />;
    case "passage-full":    return <PassageFullView block={block} />;
    case "passage-full-nt": return <PassageFullNTView block={block} />;
    case "passage-hint":    return <PassageHintView block={block} />;
    // 이미지 — 마우스 리사이즈
    case "image":
      return <ImageView block={block} editable={editable}
                        onChange={onBlockChange as ((p: Partial<ImageBlock>) => void) | undefined} />;
    // 4. 문제
    case "question":        return <QuestionView block={block} />;
    // 8. 흐름 제어
    case "page-break":      return <PageBreakView block={block} />;
    case "spacer":          return <SpacerView block={block} />;
    // 9. Unknown
    case "unknown":         return <UnknownBlockView block={block} />;
    // 키 누락 방지를 위해 keep-together 는 재귀
    case "keep-together":
      return (
        <div className="tb-keep">
          {block.blocks.map((b, i) => (
            <BlockRenderer key={i} block={b} editable={editable} onBlockChange={onBlockChange} />
          ))}
        </div>
      );
    // 미구현 — UnknownBlock 폴백 (누락 0 보장)
    default:
      return <FallbackView block={block} />;
  }
}
