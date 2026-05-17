/**
 * flow 모드(schemaVersion=1) → 캔버스 모드(schemaVersion=2) 단발성 변환.
 *
 * 1차 정책 (2026-05-17):
 *  - 각 flow Block 을 캔버스 풀폭(190mm) DomainElement 로 변환
 *  - 페이지마다 위에서 아래로 일렬 배치, 한 블록 기본 높이 30mm + 여백 5mm
 *  - 페이지 높이 초과 시 새 페이지 자동 추가
 *  - 매핑 안 되는 타입은 UnknownElement 로 보존 (raw=JSON.stringify(block))
 *  - sourceSnapshot 은 원본 flow 통째로 보존
 *
 * 변환 후 사용자가 캔버스에서 자유 재배치.
 */
import type { Textbook as FlowTextbook, Page as FlowPage } from "../types";
import type { CanvasTextbook, CanvasPage, CanvasElement, DomainKind } from "./types";
import { newElementId, blankCanvasPage } from "./types";

const PAGE_W_MM = 210;
const PAGE_H_MM = 297;
const MARGIN_MM = 10;
const BLOCK_W_MM = PAGE_W_MM - MARGIN_MM * 2;
const BLOCK_H_MM = 30;
const GAP_MM = 5;

const TYPE_TO_DOMAIN: Record<string, DomainKind> = {
  "passage-note": "passage-note",
  "passage-note-nt": "passage-note",
  "passage-full": "passage-full",
  "passage-full-nt": "passage-full",
  "passage-hint": "passage-hint",
  "concept": "concept",
  "vocab-list": "vocab-list",
  "question": "question",
  "area-header": "area-header",
  "section-label": "section-label",
  "summary-table": "summary-table",
  "structure-diagram": "structure-diagram",
  "answer-explain": "answer-explain",
  "model-answer": "model-answer",
};

export function flowToCanvas(flow: FlowTextbook): CanvasTextbook {
  const pages: CanvasPage[] = [];
  for (const fpage of flow.pages) {
    pages.push(...convertPage(fpage));
  }
  if (pages.length === 0) pages.push(blankCanvasPage());

  return {
    textbookId: flow.textbookId,
    orgId: flow.orgId,
    title: flow.title,
    series: flow.series,
    level: flow.level,
    volume: flow.volume,
    chapterRange: flow.chapterRange,
    pageSize: "A4",
    pageWidthMm: PAGE_W_MM,
    pageHeightMm: PAGE_H_MM,
    header: flow.header,
    footer: flow.footer,
    pages,
    imagePool: flow.imagePool ?? [],
    sourceSnapshot: flow.sourceSnapshot ?? flow,
    schemaVersion: 2,
    studentPdfFileId: flow.studentPdfFileId,
    answerPdfFileId: flow.answerPdfFileId,
    status: flow.status,
    createdBy: flow.createdBy,
    createdAt: flow.createdAt,
    updatedAt: flow.updatedAt,
  };
}

function convertPage(fpage: FlowPage): CanvasPage[] {
  const pages: CanvasPage[] = [];
  let current: CanvasPage = {
    pageId: fpage.pageId,
    background: fpage.background ?? { kind: "none" },
    elements: [],
  };
  let y = MARGIN_MM;
  let zIndex = 0;

  const blocks = Array.isArray(fpage.blocks) ? fpage.blocks : [];
  for (const block of blocks) {
    if (y + BLOCK_H_MM + MARGIN_MM > PAGE_H_MM) {
      pages.push(current);
      current = blankCanvasPage();
      y = MARGIN_MM;
      zIndex = 0;
    }
    const el = convertBlock(block, y, zIndex);
    current.elements.push(el);
    y += BLOCK_H_MM + GAP_MM;
    zIndex += 1;
  }
  pages.push(current);
  return pages;
}

function convertBlock(block: any, y: number, zIndex: number): CanvasElement {
  const type = block?.type as string | undefined;
  const base = {
    id: newElementId(type ?? "blk"),
    x: MARGIN_MM, y,
    w: BLOCK_W_MM, h: BLOCK_H_MM,
    rotation: 0, zIndex, opacity: 1,
  };
  const domainKind = type ? TYPE_TO_DOMAIN[type] : undefined;
  if (domainKind) {
    return { ...base, type: "domain", domainKind, props: block };
  }
  // 매핑 없는 타입 — UnknownElement 로 보존
  return {
    ...base,
    type: "unknown",
    original: block,
    raw: safeStringify(block),
    note: type ? `미매핑: ${type}` : "type 없음",
  };
}

function safeStringify(v: unknown): string {
  try { return JSON.stringify(v, null, 2); } catch { return String(v); }
}

/** flow 페이로드 객체인지 판정. schemaVersion 또는 blocks/pages 시그니처로. */
export function isFlowTextbook(payload: any): boolean {
  if (!payload || typeof payload !== "object") return false;
  if (payload.schemaVersion === 1) return true;
  if (payload.schemaVersion === 2) return false;
  // schemaVersion 없는 옛 데이터 — pages[].blocks 가 있으면 flow 로 간주
  const pages = payload.pages;
  if (Array.isArray(pages) && pages.length > 0) {
    const first = pages[0];
    if (first && Array.isArray(first.blocks)) return true;
  }
  return false;
}
