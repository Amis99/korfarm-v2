/**
 * JSON 업로드 파서.
 *
 * 핵심 원칙: 어떤 입력이 들어와도 한 글자도 잃지 않는다.
 *  1. Textbook 자체 스키마(payload.schemaVersion === 1) 면 그대로 채용 + 유효성 보강
 *  2. 디자인 하네스 옛 스키마({ meta, sections: [...] }) 면 자동 변환
 *  3. 어느 것도 아니면 단일 페이지에 UnknownBlock 으로 통째 박는다
 *
 * 그리고 항상 `sourceSnapshot` 에 원본을 그대로 보관해서 round-trip 보장.
 */
import {
  type Block,
  type Page,
  type Series,
  type Textbook,
  type UnknownBlock,
  defaultBgPalette,
  defaultFooter,
  defaultHeader,
} from "../types";
import { blankPage, nextPageId } from "./blank";

export interface ParseOptions {
  textbookId: string;
  orgId: string | null;
  fallbackTitle?: string;
}

export interface ParseResult {
  textbook: Textbook;
  warnings: string[];           // 사용자에게 안내할 비치명 경고
  unknownCount: number;         // UnknownBlock 으로 보존된 노드 수
}

/** 입력 JSON 의 schemaVersion 이 1 인지 빠르게 확인. */
function isOurSchema(json: unknown): boolean {
  if (!json || typeof json !== "object") return false;
  const o = json as Record<string, unknown>;
  return o.schemaVersion === 1 && Array.isArray(o.pages);
}

/** 디자인 하네스 일반 스키마: { meta: {...}, sections: [...] }. */
function isLegacyGeneralSchema(json: unknown): boolean {
  if (!json || typeof json !== "object") return false;
  const o = json as Record<string, unknown>;
  return !!o.meta && Array.isArray(o.sections);
}

/** 비트겐슈타인 챕터 스키마: 폴더 안의 reading_NN/literature_NN/grammar/pattern 합본. */
function isLegacyBitChapter(json: unknown): boolean {
  if (!json || typeof json !== "object") return false;
  const o = json as Record<string, unknown>;
  return Array.isArray(o.readings) || Array.isArray(o.literatures) || !!o.grammar || !!o.pattern;
}

/** 메인 진입점. */
export function parseUpload(json: unknown, opts: ParseOptions): ParseResult {
  const warnings: string[] = [];

  if (isOurSchema(json)) {
    const tb = json as Textbook;
    // id/orgId 는 호출 컨텍스트로 강제 덮어쓰기 — 위장 방지
    const merged: Textbook = {
      ...tb,
      textbookId: opts.textbookId,
      orgId: opts.orgId,
      sourceSnapshot: json,
      pageSize: "A4",
      pages: tb.pages.length > 0 ? tb.pages : [blankPage()],
      imagePool: tb.imagePool ?? [],
      header: tb.header ?? defaultHeader(),
      footer: tb.footer ?? defaultFooter(),
      bgPalette: tb.bgPalette ?? defaultBgPalette(tb.series ?? "custom"),
      status: tb.status ?? "draft",
    };
    return { textbook: merged, warnings, unknownCount: 0 };
  }

  if (isLegacyGeneralSchema(json)) {
    const o = json as { meta?: { title?: string; level?: string; chapter?: number };
                        sections: unknown[] };
    const series = inferSeriesFromLevel(o.meta?.level);
    const title = o.meta?.title ?? opts.fallbackTitle ?? "(제목 없음)";
    const page: Page = {
      pageId: nextPageId(),
      background: { kind: "preset", ref: defaultBgPalette(series).plain },
      blocks: o.sections.map((s) => sectionToUnknown(s)),
    };
    warnings.push(
      `디자인 하네스 옛 스키마를 자동 변환했습니다. 각 섹션은 UnknownBlock 으로 보존됩니다 ` +
      `(에디터에서 정식 블록으로 변환 가능).`
    );
    return buildTextbookFromPages([page], {
      textbookId: opts.textbookId,
      orgId: opts.orgId,
      title,
      series,
      level: parseLevelNumber(o.meta?.level),
      volume: 1,
      sourceSnapshot: json,
      warnings,
    });
  }

  if (isLegacyBitChapter(json)) {
    const title = opts.fallbackTitle ?? "비트겐슈타인 챕터";
    const page: Page = {
      pageId: nextPageId(),
      background: { kind: "preset", ref: "wit_plain" },
      blocks: [unknownFromRaw(json, "비트겐슈타인 옛 챕터 스키마 — 미분해 보존")],
    };
    warnings.push(
      `비트겐슈타인 옛 챕터 스키마는 통째 UnknownBlock 으로 보존됩니다 ` +
      `(추후 BitGrammarSet/BitLiteratureSet/BitReadingSet/BitPatternSet 으로 분해 가능).`
    );
    return buildTextbookFromPages([page], {
      textbookId: opts.textbookId,
      orgId: opts.orgId,
      title,
      series: "wittgenstein",
      level: 10,
      volume: 1,
      sourceSnapshot: json,
      warnings,
    });
  }

  // 알 수 없는 입력 — 한 페이지에 통째 박아 절대 누락 X
  warnings.push(
    `알 수 없는 JSON 스키마입니다. 통째로 UnknownBlock 한 개에 보존됐습니다.`
  );
  const page: Page = {
    pageId: nextPageId(),
    background: { kind: "preset", ref: "sau_plain" },
    blocks: [unknownFromRaw(json, "알 수 없는 스키마 — 원본 보존")],
  };
  return buildTextbookFromPages([page], {
    textbookId: opts.textbookId,
    orgId: opts.orgId,
    title: opts.fallbackTitle ?? "(제목 없음)",
    series: "custom",
    level: 1,
    volume: 1,
    sourceSnapshot: json,
    warnings,
  });
}

// ─── 헬퍼 ─────────────────────────────────────────────────────────

function sectionToUnknown(section: unknown): UnknownBlock {
  const o = (section ?? {}) as Record<string, unknown>;
  const type = (o.type as string | undefined) ?? "unknown";
  return unknownFromRaw(section, `디자인 하네스 옛 섹션 (type=${type})`);
}

function unknownFromRaw(raw: unknown, note: string): UnknownBlock {
  return {
    type: "unknown",
    original: raw,
    raw: safeStringify(raw),
    note,
  };
}

function safeStringify(value: unknown): string {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function inferSeriesFromLevel(level: string | undefined): Series {
  if (!level) return "custom";
  if (level.startsWith("소쉬")) return "saussure";
  if (level.startsWith("프레")) return "frege";
  if (level.startsWith("러셀")) return "russell";
  if (level.startsWith("비트")) return "wittgenstein";
  const lower = level.toLowerCase();
  if (lower.startsWith("sau")) return "saussure";
  if (lower.startsWith("fre")) return "frege";
  if (lower.startsWith("rus")) return "russell";
  if (lower.startsWith("wit")) return "wittgenstein";
  return "custom";
}

function parseLevelNumber(level: string | undefined): number {
  if (!level) return 1;
  const m = level.match(/(\d+)/);
  return m && m[1] ? parseInt(m[1], 10) : 1;
}

function buildTextbookFromPages(
  pages: Page[],
  meta: {
    textbookId: string;
    orgId: string | null;
    title: string;
    series: Series;
    level: number;
    volume: number;
    sourceSnapshot: unknown;
    warnings: string[];
  }
): ParseResult {
  const tb: Textbook = {
    textbookId: meta.textbookId,
    orgId: meta.orgId,
    title: meta.title,
    series: meta.series,
    level: meta.level,
    volume: meta.volume,
    chapterRange: [1, 4],
    pageSize: "A4",
    bgPalette: defaultBgPalette(meta.series),
    header: defaultHeader(),
    footer: defaultFooter(),
    pages,
    imagePool: [],
    sourceSnapshot: meta.sourceSnapshot,
    schemaVersion: 1,
    status: "draft",
  };
  const unknownCount = countUnknown(tb);
  return { textbook: tb, warnings: meta.warnings, unknownCount };
}

function countUnknown(tb: Textbook): number {
  let n = 0;
  const visit = (blocks: Block[]) => {
    for (const b of blocks) {
      if (b.type === "unknown") n += 1;
      else if (b.type === "keep-together") visit(b.blocks);
    }
  };
  for (const p of tb.pages) visit(p.blocks);
  return n;
}
