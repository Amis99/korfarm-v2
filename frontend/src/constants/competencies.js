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

/**
 * 콘텐츠 타입 / 문제 유형별 default 정답 벡터 — 신규 문항 작성 시 시작점.
 * 사용자가 비주얼 에디터에서 검수·수정 가능. 자유 가중치.
 */
export const DEFAULT_VECTORS = {
  // 어휘
  WORD_TO_MEANING: { "어휘력": 0.7, "문장 독해력": 0.2, "선택지 분석 및 전략 수립 능력": 0.1 },
  MEANING_TO_WORD: { "어휘력": 0.7, "문장 독해력": 0.2, "선택지 분석 및 전략 수립 능력": 0.1 },
  EXAMPLE_BLANK: { "어휘력": 0.5, "문장 독해력": 0.4, "선택지 분석 및 전략 수립 능력": 0.1 },
  HANJA_READING: { "어휘력": 0.6, "국어 관련 배경지식": 0.3, "선택지 분석 및 전략 수립 능력": 0.1 },
  DICT_MEANING: { "어휘력": 0.7, "문장 독해력": 0.2, "국어 관련 배경지식": 0.1 },
  DICT_EXAMPLE: { "어휘력": 0.5, "문장 독해력": 0.4, "국어 관련 배경지식": 0.1 },
  DICT_POLYSEMY: { "어휘력": 0.6, "문장 독해력": 0.3, "선택지 분석 및 전략 수립 능력": 0.1 },
  // 품사
  POS: { "어법·문법 능력": 0.7, "국어 개념 적용 능력": 0.2, "선택지 분석 및 전략 수립 능력": 0.1 },
  POS_TRANSFORM: { "어법·문법 능력": 0.6, "국어 개념 적용 능력": 0.3, "어휘력": 0.1 },
  POS_FUNCTION: { "어법·문법 능력": 0.5, "구조 독해력": 0.3, "국어 개념 적용 능력": 0.2 },
  // 국어 개념
  CONCEPT: { "국어 개념 적용 능력": 0.6, "구조 독해력": 0.2, "국어 관련 배경지식": 0.2 },
  CONCEPT_EXAMPLE: { "국어 개념 적용 능력": 0.5, "문장 독해력": 0.3, "구조 독해력": 0.2 },
  CONCEPT_COMPARE: { "국어 개념 적용 능력": 0.5, "논리 사고력": 0.3, "선택지 분석 및 전략 수립 능력": 0.2 },
  // 일일퀴즈 1~10번 (역량 1~10 매칭)
  DAILY_Q1: { "어휘력": 0.8, "선택지 분석 및 전략 수립 능력": 0.2 },
  DAILY_Q2: { "문장 독해력": 0.8, "선택지 분석 및 전략 수립 능력": 0.2 },
  DAILY_Q3: { "구조 독해력": 0.8, "선택지 분석 및 전략 수립 능력": 0.2 },
  DAILY_Q4: { "논리 사고력": 0.8, "선택지 분석 및 전략 수립 능력": 0.2 },
  DAILY_Q5: { "어법·문법 능력": 0.8, "선택지 분석 및 전략 수립 능력": 0.2 },
  DAILY_Q6: { "국어 개념 적용 능력": 0.7, "구조 독해력": 0.2, "선택지 분석 및 전략 수립 능력": 0.1 },
  DAILY_Q7: { "국어 관련 배경지식": 0.8, "선택지 분석 및 전략 수립 능력": 0.2 },
  DAILY_Q8: { "비문학 배경지식": 0.8, "선택지 분석 및 전략 수립 능력": 0.2 },
  DAILY_Q9: { "문제 분석 및 전략 수립 능력": 0.7, "구조 독해력": 0.2, "선택지 분석 및 전략 수립 능력": 0.1 },
  DAILY_Q10: { "선택지 분석 및 전략 수립 능력": 0.6, "구조 독해력": 0.2, "논리 사고력": 0.2 },
};

/** 콘텐츠 타입 + questionKind + 일일퀴즈 인덱스로 default 벡터 추천 */
export function getDefaultVector({ contentType, questionKind, dailyQuizIndex }) {
  // 일일퀴즈는 1~10 인덱스로 매핑
  if (typeof dailyQuizIndex === "number" && dailyQuizIndex >= 1 && dailyQuizIndex <= 10) {
    return { ...DEFAULT_VECTORS[`DAILY_Q${dailyQuizIndex}`] };
  }
  if (questionKind && DEFAULT_VECTORS[questionKind]) {
    return { ...DEFAULT_VECTORS[questionKind] };
  }
  return null;
}
