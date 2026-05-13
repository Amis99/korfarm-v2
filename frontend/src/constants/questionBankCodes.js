/* 문제은행(QB) 영역/세부영역/소스 코드 라벨 — 단일 소스
 *
 * 분류 마스터(classification_master V0100) 와 동기화.
 * 문제 유형: 조창훈 독서 R1~R9 / 문학 L1~L6 — 국문 prefix(독·문).
 * 함정 패턴: 18 패턴 가이드(2026-05-13) — 비문학 D1~D10 / 문학 L1~L8.
 */

export const AREA_LABELS = {
  READ: "독서(비문학)", LIT: "문학", GRAM: "문법",
  SPEAK: "화법", WRITE: "작문", MEDIA: "매체",
  VOCAB: "어휘",
};

// 분류 마스터의 sub_area 코드와 1:1 매칭
export const SUB_AREA_LABELS = {
  // 독서 (비문학)
  READ_HUMANITIES: "인문", READ_SOCIETY: "사회",
  READ_SCIENCE: "과학", READ_TECH: "기술", READ_ART: "예술", READ_ETC: "기타",
  // 문학
  LIT_MODERN_POETRY: "현대시", LIT_CLASSIC_POETRY: "고전시가",
  LIT_MODERN_NOVEL: "현대소설", LIT_CLASSIC_PROSE: "고전산문",
  LIT_ESSAY: "수필", LIT_DRAMA: "극",
  // 문법
  GRAM_PHONOLOGY: "음운", GRAM_WORD: "단어", GRAM_SENTENCE: "문장",
  GRAM_DISCOURSE: "담화", GRAM_HISTORY: "국어사",
  // 화법
  SPEAK_PRESENT: "발표/강연", SPEAK_DEBATE: "토론", SPEAK_DISCUSS: "토의",
  SPEAK_NEGOTIATE: "협상", SPEAK_INTERVIEW: "대담", SPEAK_ETC: "기타",
  // 작문
  WRITE_PROPOSAL: "건의문", WRITE_ARGUMENT: "논설문", WRITE_REPORT: "보고서",
  WRITE_LIFE: "생활문", WRITE_EXPLAIN: "설명문", WRITE_REVIEW: "비평/감상문",
  WRITE_ETC: "기타",
  // 매체
  MEDIA_PRINT: "인쇄 매체 (신문/잡지)", MEDIA_BROADCAST: "방송/영상 매체",
  MEDIA_INTERNET: "인터넷/소셜 매체", MEDIA_AD: "광고",
  MEDIA_DIGITAL: "디지털/뉴미디어", MEDIA_CONVERGENCE: "융합 매체",
  MEDIA_ETC: "기타",
};

export const SOURCE_LABELS = {
  TEXTBOOK: "교과서", SELF_STUDY: "자습서", EVAL_WORKBOOK: "평가문제집",
  PAST_EXAM: "기출", SCHOOL_EXAM: "학교 내신", ETC: "기타",
};

// 문제 유형 — 독서(비문학) · 국문 prefix (조창훈 R1~R9)
export const READ_QUESTION_TYPE_LABELS = {
  "독R1": "표제·제목·주제",
  "독R2": "내용 전개 방식",
  "독R3": "언급되지 않은 내용",
  "독R4": "내용 일치·추론",
  "독R5": "조건형 (특정 부분 이유·기능)",
  "독R6": "관점 적용형 (보기 입장 동의/반대)",
  "독R7": "비교형 (두 대상 공통·차이점)",
  "독R8": "사례 적용 보기형",
  "독R9": "보충 심화 보기형",
};

// 문제 유형 — 문학 · 국문 prefix (조창훈 L1~L6)
export const LIT_QUESTION_TYPE_LABELS = {
  "문L1": "개념형 (갈래·성격·기법 등 추상)",
  "문L2": "내용형 (인물 행동·사건 사실)",
  "문L3": "내용/해석형 (구절 의미·의도·심리)",
  "문L4": "내용/해석/보기형 (보기 이론 적용)",
  "문L5": "비교형 (인물·시어·소재 비교)",
  "문L6": "조건형 (특정 부분 지정)",
};

// 문제 유형 — 문법·화법·작문·매체 (별도 자료 부재, 기존 H/M/G 유지)
export const GRAM_QUESTION_TYPE_LABELS = {
  G1: "음운·형태", G2: "단어·품사", G3: "문장 구조",
  G4: "의미·화용", G5: "어문 규정",
};
export const SPEAK_QUESTION_TYPE_LABELS = {
  H1: "대화·토론", H2: "연설·발표", H3: "협상·면담",
  H4: "매체 통합 화법", H5: "어휘·표현 화법",
  H6: "비언어/반언어", H7: "고쳐 말하기", H8: "기타",
};
export const MEDIA_QUESTION_TYPE_LABELS = {
  M1: "인쇄 매체", M2: "방송·영상 매체",
  M3: "인터넷/뉴미디어", M4: "광고·홍보",
};

// 오답 선택지 함정 패턴 — 비문학 D1~D10 (18패턴 가이드 2026-05-13)
export const READ_WRONG_PATTERN_LABELS = {
  D1: "D1 섞어치기 — A·B 속성 자리바꿈",
  D2: "D2 부정 표현·상대어 — 반대말 도입·내포 의미축 대립",
  D3: "D3 후즈훔 — 행위 주체·객체·소유 자리바꿈",
  D4: "D4 순서·방향 — 단계 순서·이동 방향 반전",
  D5: "D5 인과 — 원인↔결과 뒤집기·엉뚱한 원인",
  D6: "D6 의도·목적 — 인물 의도 왜곡(표지 필수)",
  D7: "D7 상관관계 — 비례·반비례 부호 반전",
  D8: "D8 필요조건 — \"P여야 Q\" 잘못 설정",
  D9: "D9 결합·분리 — A·B 결합/분리 왜곡",
  D10: "D10 케이스 — 발동조건+결과 쌍 매칭 왜곡",
};

// 오답 선택지 함정 패턴 — 문학 L1~L8
export const LIT_WRONG_PATTERN_LABELS = {
  L1: "L1 Good vs Bad — 시어/태도/정서 가치 평가 뒤집기",
  L2: "L2 대립항 섞기 — 자연↔속세 등 속성 자리바꿈",
  L3: "L3 후즈훔 — 화자·인물 주체·객체·소유 자리바꿈",
  L4: "L4 순서·방향 — 사건 선후·시선·생각 반전",
  L5: "L5 의도·목적 — 인물 행동 의도 왜곡(표지 필수)",
  L6: "L6 인과 — 사건 인과 부정·역전·무관 결합",
  L7: "L7 결합·분리 — 별개 합침/유기 분리·층위 분리",
  L8: "L8 사실/비사실 — 꿈·비유·가정·고사를 실제 경험으로 단정",
};

// 전체 문제 유형 (모든 영역 통합)
export const QUESTION_TYPE_LABELS = {
  ...READ_QUESTION_TYPE_LABELS,
  ...LIT_QUESTION_TYPE_LABELS,
  ...GRAM_QUESTION_TYPE_LABELS,
  ...SPEAK_QUESTION_TYPE_LABELS,
  ...MEDIA_QUESTION_TYPE_LABELS,
};
