/* 문제은행(QB) 영역/세부영역/소스 코드 라벨 — 단일 소스 */

export const AREA_LABELS = {
  LIT: "문학", READ: "독서", GRAM: "문법", SPEAK: "화법",
  WRITE: "작문", MEDIA: "매체", INTEGRATED: "복합",
};

export const SUB_AREA_LABELS = {
  LIT_MODERN_POETRY: "현대시", LIT_CLASSIC_POETRY: "고전시가",
  LIT_MODERN_NOVEL: "현대소설", LIT_CLASSIC_PROSE: "고전산문",
  LIT_ESSAY: "수필", LIT_DRAMA: "극",
  READ_HUMANITIES: "인문", READ_SOCIETY: "사회",
  READ_SCI_TECH: "과학기술", READ_ART: "예술", READ_CROSS: "통합",
  GRAM_PHONOLOGY: "음운", GRAM_WORD: "단어", GRAM_SENTENCE: "문장",
  GRAM_DISCOURSE: "담화", GRAM_HISTORY: "국어사",
  SPEAK_GENERAL: "화법 일반", WRITE_GENERAL: "작문 일반",
  MEDIA_LANGUAGE: "매체 언어", INTEGRATED_MULTI: "복합 지문",
};

export const SOURCE_LABELS = {
  TEXTBOOK: "교과서", SELF_STUDY: "자습서", EVAL_WORKBOOK: "평가문제집",
  PAST_EXAM: "기출", SCHOOL_EXAM: "학교 내신", ETC: "기타",
};

// 문제 유형 — 독서(비문학)
export const READ_QUESTION_TYPE_LABELS = {
  READ_TITLE_TOPIC: "표제/주제",
  READ_DEVELOPMENT: "내용 전개 방식",
  READ_NOT_MENTIONED: "언급되지 않은 내용",
  READ_CONTENT_INFERENCE: "내용 일치/추론",
  READ_CONDITIONAL: "조건형",
  READ_PERSPECTIVE: "관점 적용형",
  READ_COMPARISON: "비교형",
  READ_CASE_APPLICATION: "사례 적용 보기형",
  READ_SUPPLEMENTARY: "보충 심화 보기형",
  READ_VOCABULARY: "어휘",
};

// 문제 유형 — 문학
export const LIT_QUESTION_TYPE_LABELS = {
  LIT_CONCEPTUAL: "개념형",
  LIT_CONTENT: "내용형",
  LIT_INTERPRETATION: "내용/해석형",
  LIT_BOGI: "내용/해석/보기형",
  LIT_COMPARATIVE: "비교형",
  LIT_CONDITIONAL: "조건형",
};

// 오답 선택지 패턴 — 독서
export const READ_WRONG_PATTERN_LABELS = {
  MIXING: "섞어치기",
  NEGATION: "부정 표현/상대어",
  WHO_WHOSE_WHOM: "주체/객체 바꾸기",
  ORDER_DIRECTION: "순서/방향",
  CAUSALITY: "인과 왜곡",
  INTENT: "의도/목적 왜곡",
  CORRELATION: "상관관계 반전",
  NECESSARY_CONDITION: "필요조건 부정",
  COMBINE_SEPARATE: "결합/분리",
  CONDITION_DISTORT: "조건 왜곡",
};

// 오답 선택지 패턴 — 문학
export const LIT_WRONG_PATTERN_LABELS = {
  GOOD_BAD: "긍정/부정 왜곡",
  AB_SWAP: "비교 대상 혼동",
  WHO_WHOSE_WHOM: "주체/객체 왜곡",
  ORDER_DIRECTION: "순서/방향 왜곡",
  INTENT_PURPOSE: "의도/목적 왜곡",
};

// 전체 문제 유형 (기존 + 신규)
export const QUESTION_TYPE_LABELS = {
  CONTENT: "내용 이해", INFERENCE: "추론", THEME: "주제/제목",
  STRUCTURE: "구조/전개", EXPRESSION: "표현상 특징", TONE_ATTITUDE: "태도/정서",
  VOCAB: "어휘", GRAMMAR: "문법/어법", CORRECTNESS: "적절/부적절 판단",
  ORDER: "순서 배열", INSERT: "문장 삽입", SUMMARY: "요약",
  APPLICATION: "적용", COMPARISON: "비교/대조", CRITIQUE: "비판/평가",
  WRITING: "쓰기", SPEAKING: "화법", MEDIA: "매체",
  ...READ_QUESTION_TYPE_LABELS,
  ...LIT_QUESTION_TYPE_LABELS,
};
