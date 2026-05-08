/**
 * 분석표·진행률 표시용 공통 포매팅 헬퍼.
 */

/** 0~100 범위로 클램프. null/undefined/NaN 은 0. */
export function clampPct(v) {
  const n = Number(v ?? 0);
  if (Number.isNaN(n)) return 0;
  return Math.min(100, Math.max(0, n));
}

/** clampPct + toFixed(decimals) */
export function formatPct(v, decimals = 0) {
  return clampPct(v).toFixed(decimals);
}
