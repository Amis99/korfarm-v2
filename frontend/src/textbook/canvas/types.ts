/**
 * 캔바 스타일 — 자유 캔버스 도메인.
 *
 * 모든 요소는 페이지 좌상단 기준 절대 좌표(mm). 회전·zIndex·opacity·잠금·숨김 가능.
 * PDF 출력은 Typst 의 #place / #rotate 로 1:1 매핑.
 */

import type { HeaderFooterConfig, ImageAsset, PageBackground, Series } from "../types";
export type { HeaderFooterConfig, ImageAsset, PageBackground, Series };

export type ElementId = string;

// ─── 공통 기반 ────────────────────────────────────────────────

export interface BaseElement {
  id: ElementId;
  x: number;            // mm
  y: number;            // mm
  w: number;            // mm
  h: number;            // mm
  rotation: number;     // degrees
  zIndex: number;
  opacity: number;      // 0~1
  locked?: boolean;
  hidden?: boolean;
}

// ─── 텍스트 ──────────────────────────────────────────────────

export interface TextElement extends BaseElement {
  type: "text";
  content: string;                              // 마크다운 또는 평문
  fontFamily?: string;
  fontSize: number;                             // pt
  fontWeight?: "normal" | "bold" | number;
  fontStyle?: "normal" | "italic";
  color: string;                                // hex
  backgroundColor?: string;
  align: "left" | "center" | "right" | "justify";
  lineHeight?: number;                          // em
  letterSpacing?: number;                       // em
  textDecoration?: "none" | "underline" | "line-through";
  padding?: number;                             // mm
}

// ─── 이미지 ──────────────────────────────────────────────────

export interface ImageElement extends BaseElement {
  type: "image";
  assetId: string;
  url?: string;
  alt?: string;
  opacityFilter?: never;                        // (이미 BaseElement.opacity 사용)
  filter?: "none" | "grayscale" | "sepia" | "blur";
  cropX?: number; cropY?: number; cropW?: number; cropH?: number;
  objectFit?: "cover" | "contain" | "fill";
}

// ─── 도형 ────────────────────────────────────────────────────

export type ShapeKind = "rect" | "ellipse" | "triangle" | "line" | "arrow";

export interface ShapeElement extends BaseElement {
  type: "shape";
  shape: ShapeKind;
  fill: string;
  stroke: string;
  strokeWidth: number;
  borderRadius?: number;                        // rect 전용 (mm)
}

// ─── 스티커 (이모지 또는 외부 이미지) ───────────────────────

export interface StickerElement extends BaseElement {
  type: "sticker";
  source: "emoji" | "url";
  value: string;                                // emoji char 또는 url
}

// ─── 도메인 블록 (지문·문제·표 등을 단일 요소로 캡슐화) ─────

export type DomainKind =
  | "passage-note" | "passage-full" | "passage-hint"
  | "concept" | "vocab-list"
  | "question"
  | "area-header" | "section-label"
  | "summary-table" | "structure-diagram"
  | "answer-explain" | "model-answer";

export interface DomainElement extends BaseElement {
  type: "domain";
  domainKind: DomainKind;
  props: Record<string, unknown>;               // 도메인별 raw payload
}

// ─── 그룹 ────────────────────────────────────────────────────

export interface GroupElement extends BaseElement {
  type: "group";
  childIds: ElementId[];                        // 그룹 멤버
}

// ─── Unknown (누락 보존) ────────────────────────────────────

export interface UnknownElement extends BaseElement {
  type: "unknown";
  original: unknown;
  raw: string;
  note?: string;
}

// ─── 유니언 ──────────────────────────────────────────────────

export type CanvasElement =
  | TextElement | ImageElement | ShapeElement | StickerElement
  | DomainElement | GroupElement | UnknownElement;

export type CanvasElementType = CanvasElement["type"];

// ─── 페이지·교재 ────────────────────────────────────────────

export interface CanvasPage {
  pageId: string;
  background: PageBackground;
  elements: CanvasElement[];                    // z 순서는 zIndex 로
}

export interface CanvasTextbook {
  textbookId: string;
  orgId: string | null;
  title: string;
  series: Series;
  level: number;
  volume: number;
  chapterRange: [number, number];
  pageSize: "A4";
  pageWidthMm: 210;
  pageHeightMm: 297;
  bgPalette?: unknown;                          // 호환 보존
  header: HeaderFooterConfig;
  footer: HeaderFooterConfig;
  pages: CanvasPage[];
  imagePool: ImageAsset[];
  sourceSnapshot?: unknown;
  schemaVersion: 2;                             // 신 캔버스 모델
  studentPdfFileId?: string;
  answerPdfFileId?: string;
  status: "draft" | "ready";
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

// ─── 헬퍼 ────────────────────────────────────────────────────

let _idCounter = 0;
export function newElementId(prefix: string = "el"): ElementId {
  _idCounter += 1;
  return `${prefix}_${Date.now().toString(36)}_${_idCounter}`;
}

export function defaultBase(zIndex: number = 0): Omit<BaseElement, "id"> {
  return { x: 30, y: 30, w: 80, h: 30, rotation: 0, zIndex, opacity: 1 };
}

export function blankCanvasPage(pageId?: string): CanvasPage {
  return {
    pageId: pageId ?? newElementId("pg"),
    background: { kind: "none" },
    elements: [],
  };
}

export function blankCanvasTextbook(opts: {
  textbookId: string; title: string; orgId: string | null;
  series?: Series; level?: number; volume?: number;
}): CanvasTextbook {
  return {
    textbookId: opts.textbookId,
    orgId: opts.orgId,
    title: opts.title,
    series: opts.series ?? "custom",
    level: opts.level ?? 1,
    volume: opts.volume ?? 1,
    chapterRange: [1, 4],
    pageSize: "A4",
    pageWidthMm: 210,
    pageHeightMm: 297,
    header: { outer: { kind: "logo" }, inner: { kind: "areaName" } },
    footer: { outer: { kind: "pageNumber" }, inner: { kind: "chapterName" } },
    pages: [blankCanvasPage()],
    imagePool: [],
    schemaVersion: 2,
    status: "draft",
  };
}

/** 기본 요소 팩토리 — 좌측 패널에서 사용. */
export function createDefaultElement(type: CanvasElementType, zIndex: number = 0): CanvasElement {
  const base = { ...defaultBase(zIndex), id: newElementId(type) };
  switch (type) {
    case "text":
      return { ...base, w: 80, h: 20, type: "text",
               content: "텍스트를 입력하세요", fontSize: 14, color: "#222",
               align: "left", padding: 2 };
    case "image":
      return { ...base, w: 60, h: 40, type: "image", assetId: "", url: "", alt: "" };
    case "shape":
      return { ...base, w: 60, h: 40, type: "shape", shape: "rect",
               fill: "#e8f4ec", stroke: "#2d6a4f", strokeWidth: 1, borderRadius: 2 };
    case "sticker":
      return { ...base, w: 20, h: 20, type: "sticker", source: "emoji", value: "⭐" };
    case "domain":
      return { ...base, w: 120, h: 60, type: "domain", domainKind: "passage-full", props: {} };
    case "group":
      return { ...base, w: 100, h: 50, type: "group", childIds: [] };
    case "unknown":
      return { ...base, w: 100, h: 30, type: "unknown", original: null, raw: "" };
  }
}
