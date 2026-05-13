const DUEL_HAPTIC_PATTERNS = {
  tap: 12,
  select: 16,
  ready: [18, 22, 18],
  correct: 30,
  wrong: [24, 34, 24],
  start: [34, 26, 44],
  win: [42, 32, 62],
};

export function playDuelHaptic(type = "tap") {
  if (typeof window === "undefined" || typeof navigator === "undefined") return false;
  if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return false;
  if (typeof navigator.vibrate !== "function") return false;

  const pattern = DUEL_HAPTIC_PATTERNS[type] || DUEL_HAPTIC_PATTERNS.tap;
  try {
    navigator.vibrate(pattern);
    return true;
  } catch {
    return false;
  }
}
