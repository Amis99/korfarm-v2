/**
 * round-trip 검증 — sourceSnapshot 과 현재 Textbook 의 키 집합을 비교해서
 * 사용자가 무언가를 의도치 않게 잃지 않도록 안내한다.
 *
 * 완벽한 의미 비교는 아니지만 "원본의 키가 현재 어딘가에 존재하는지" 정도는 보장.
 */
import type { Block, Textbook } from "../types";

export interface RoundTripReport {
  ok: boolean;
  missingKeys: string[];          // 원본에는 있었는데 현재 어디에도 안 보이는 키 경로
  unknownBlockCount: number;
}

export function roundTripCheck(tb: Textbook): RoundTripReport {
  const snapshot = tb.sourceSnapshot;
  if (!snapshot) {
    return { ok: true, missingKeys: [], unknownBlockCount: countUnknown(tb) };
  }
  const originalKeys = collectKeyPaths(snapshot, "");
  const currentSerialized = JSON.stringify(tb);
  const missing: string[] = [];
  for (const path of originalKeys) {
    const leaf = path.split(".").pop() ?? "";
    if (leaf && !currentSerialized.includes(`"${leaf}"`)) {
      missing.push(path);
    }
  }
  return {
    ok: missing.length === 0,
    missingKeys: missing,
    unknownBlockCount: countUnknown(tb),
  };
}

function collectKeyPaths(value: unknown, prefix: string, out: string[] = []): string[] {
  if (value === null || typeof value !== "object") return out;
  if (Array.isArray(value)) {
    value.forEach((v, i) => collectKeyPaths(v, `${prefix}[${i}]`, out));
    return out;
  }
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const path = prefix ? `${prefix}.${k}` : k;
    out.push(path);
    collectKeyPaths(v, path, out);
  }
  return out;
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
