// 시즌 점수 공식: 작물합×C + 최소작물×B + 총씨앗
export const CROP_VALUE = 50;
export const BALANCE_BONUS = 500;

export function calcSeasonScore(crops, totalSeeds) {
  const a = crops.crop_wheat ?? 0;
  const b = crops.crop_rice ?? 0;
  const c = crops.crop_corn ?? 0;
  const d = crops.crop_grape ?? 0;
  const e = crops.crop_apple ?? 0;
  const cropSum = a + b + c + d + e;
  const minCrop = Math.min(a, b, c, d, e);
  return CROP_VALUE * cropSum + BALANCE_BONUS * minCrop + totalSeeds;
}

export const FORMULA_TEXT = "작물합×50 + 최소작물×500 + 총씨앗";
