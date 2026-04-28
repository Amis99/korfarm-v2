/**
 * 10대 역량 — 백엔드 CompetencyConstants.kt 와 동기화 필수.
 */
export const COMPETENCIES = [
  "어휘력",
  "문장 독해력",
  "구조 독해력",
  "논리 사고력",
  "어법·문법 능력",
  "국어 개념 적용 능력",
  "국어 관련 배경지식",
  "비문학 배경지식",
  "문제 분석 및 전략 수립 능력",
  "선택지 분석 및 전략 수립 능력",
];

/** 짧은 라벨 (UI 공간 절약) */
export const COMPETENCY_SHORT = {
  "어휘력": "어휘",
  "문장 독해력": "문장",
  "구조 독해력": "구조",
  "논리 사고력": "논리",
  "어법·문법 능력": "문법",
  "국어 개념 적용 능력": "개념",
  "국어 관련 배경지식": "배경(국어)",
  "비문학 배경지식": "배경(비문학)",
  "문제 분석 및 전략 수립 능력": "문제분석",
  "선택지 분석 및 전략 수립 능력": "선지분석",
};

/** 합계 정규화 안 함 — 자유 가중치 (사용자 결정 2026-04-28) */
export function vectorSum(vec) {
  if (!vec) return 0;
  return Object.values(vec).reduce((s, v) => s + (Number(v) || 0), 0);
}

/** 비어 있지 않은 역량 수 */
export function vectorActiveCount(vec) {
  if (!vec) return 0;
  return Object.values(vec).filter((v) => (Number(v) || 0) > 0).length;
}
