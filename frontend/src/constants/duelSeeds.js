export const DUEL_SEED_TYPES = [
  { key: "seed_wheat", label: "밀", emoji: "🌾", tone: "wheat" },
  { key: "seed_rice", label: "쌀", emoji: "🍚", tone: "rice" },
  { key: "seed_corn", label: "옥수수", emoji: "🌽", tone: "corn" },
  { key: "seed_grape", label: "포도", emoji: "🍇", tone: "grape" },
  { key: "seed_apple", label: "사과", emoji: "🍎", tone: "apple" },
];

export const DUEL_SEED_LABELS = DUEL_SEED_TYPES.reduce((acc, item) => {
  acc[item.key] = item.label;
  return acc;
}, {});

export const DUEL_SEED_EMOJIS = DUEL_SEED_TYPES.reduce((acc, item) => {
  acc[item.key] = item.emoji;
  return acc;
}, {});

export function formatSeedStakeBreakdown(breakdown = {}) {
  return DUEL_SEED_TYPES
    .map((item) => {
      const amount = breakdown?.[item.key] ?? 0;
      return amount > 0 ? { ...item, amount } : null;
    })
    .filter(Boolean);
}
