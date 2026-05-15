/**
 * 빈 교재 골격 — "새 교재" 누른 직후 시작 상태.
 */
import {
  defaultBgPalette,
  defaultFooter,
  defaultHeader,
  type Page,
  type Series,
  type Textbook,
} from "../types";

let pageIdCounter = 0;
export function nextPageId(): string {
  pageIdCounter += 1;
  return `pg_${Date.now().toString(36)}_${pageIdCounter}`;
}

export function blankPage(): Page {
  return {
    pageId: nextPageId(),
    background: { kind: "preset", ref: "sau_plain" },
    blocks: [],
  };
}

export function blankTextbook(opts: {
  textbookId: string;
  title: string;
  orgId: string | null;
  series?: Series;
  level?: number;
  volume?: number;
}): Textbook {
  const series: Series = opts.series ?? "custom";
  return {
    textbookId: opts.textbookId,
    orgId: opts.orgId,
    title: opts.title,
    series,
    level: opts.level ?? 1,
    volume: opts.volume ?? 1,
    chapterRange: [1, 4],
    pageSize: "A4",
    bgPalette: defaultBgPalette(series),
    header: defaultHeader(),
    footer: defaultFooter(),
    pages: [blankPage()],
    imagePool: [],
    schemaVersion: 1,
    status: "draft",
  };
}
