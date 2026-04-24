/* ────────────────────────────────────────────────────────────
   contentType 카테고리 시스템 (다중 분류)
   - 백엔드의 ContentEntity.categories(JSON array string)에 저장
   - 한 콘텐츠가 여러 카테고리에 동시 노출 (예: PRO_READING + READING)
   - 정의: 일일 학습 / 농장별 학습 / 프로 모드 / (관리 외)
   ──────────────────────────────────────────────────────────── */

/* 카테고리 한글 라벨 (풀네임) */
export const TYPE_LABEL = {
  // 일일 학습
  DAILY_QUIZ: "일일 퀴즈",
  DAILY_READING: "일일 독해",

  // 농장별 학습
  VOCAB: "어휘",
  READING: "독해",
  STORY: "이야기 농장",
  CLASSIC: "고전 농장",
  GRAMMAR_WORD_FORMATION: "문법 - 단어 형성",
  GRAMMAR_SENTENCE_STRUCTURE: "문법 - 문장 짜임",
  GRAMMAR_PHONEME_CHANGE: "문법 - 음운 변동",
  GRAMMAR_POS: "문법 - 품사",
  BACKGROUND: "배경지식",
  CONCEPT: "국어 개념",
  LOGIC: "논리사고력",
  CHOICE_ANALYSIS: "선택지 분석",

  // 프로 모드
  PRO_READING: "프로 독해",
  PRO_VOCAB: "프로 어휘",
  PRO_BACKGROUND: "프로 배경지식",
  PRO_LOGIC: "프로 논리사고력",

  // 콘텐츠 관리 외 (다른 메뉴에서 관리)
  STUDY_CONTENT: "내용 숙지",
  WRITING: "글쓰기",
  PRO_TEST: "프로 챕터 테스트",
  PRO_ANSWER: "프로 정답해설",

  // ─── 옛 명 alias (DB 마이그레이션 전 데이터 호환용. 추후 제거 가능) ───
  VOCAB_BASIC: "어휘",
  READING_NONFICTION: "독해",
  READING_LITERATURE: "독해 (문학)",
  MORPHEME_ANALYSIS: "문법 - 형태소 분석",
  CONTENT_PDF: "내용 숙지",
  CONTENT_PDF_QUIZ: "내용 숙지",
  BACKGROUND_KNOWLEDGE: "배경지식",
  BACKGROUND_KNOWLEDGE_QUIZ: "배경지식",
  LANGUAGE_CONCEPT: "국어 개념",
  LANGUAGE_CONCEPT_QUIZ: "국어 개념",
  LOGIC_REASONING: "논리사고력",
  LOGIC_REASONING_QUIZ: "논리사고력",
  CHOICE_JUDGEMENT: "선택지 분석",
  WRITING_DESCRIPTIVE: "글쓰기",
  PRO_MANUSCRIPT: "프로 정답해설",
};

/* ────────────────────────────────────────────────────────────
   다중 분류 매핑: 카테고리 → 어떤 (탭, 드롭다운 옵션) 조합에 매칭
   - 콘텐츠의 contentType array 중 하나라도 매칭되면 해당 탭/옵션에 노출
   ──────────────────────────────────────────────────────────── */

export const TABS = [
  { id: "daily", label: "일일 학습", icon: "📅" },
  { id: "farm", label: "농장별 학습", icon: "🌾" },
  { id: "pro", label: "프로 모드", icon: "🎓" },
];

/* 탭별 드롭다운 옵션 (카테고리 키 + 라벨 + 그룹) */
export const TAB_OPTIONS = {
  daily: [
    { value: "DAILY_QUIZ", label: "일일 퀴즈" },
    { value: "DAILY_READING", label: "일일 독해" },
  ],
  farm: [
    { value: "VOCAB", label: "어휘" },
    { value: "READING", label: "독해" },
    { value: "STORY", label: "이야기 농장" },
    { value: "CLASSIC", label: "고전 농장" },
    { value: "GRAMMAR_WORD_FORMATION", label: "문법 - 단어 형성" },
    { value: "GRAMMAR_SENTENCE_STRUCTURE", label: "문법 - 문장 짜임" },
    { value: "GRAMMAR_PHONEME_CHANGE", label: "문법 - 음운 변동" },
    { value: "GRAMMAR_POS", label: "문법 - 품사" },
    { value: "BACKGROUND", label: "배경지식" },
    { value: "CONCEPT", label: "국어 개념" },
    { value: "LOGIC", label: "논리사고력" },
    { value: "CHOICE_ANALYSIS", label: "선택지 분석" },
  ],
  pro: [
    { value: "PRO_READING", label: "프로 독해" },
    { value: "PRO_VOCAB", label: "프로 어휘" },
    { value: "PRO_BACKGROUND", label: "프로 배경지식" },
    { value: "PRO_LOGIC", label: "프로 논리사고력" },
  ],
};

/* ────────────────────────────────────────────────────────────
   농장 ID(FARM_MAP의 id) → 어떤 categories를 매칭할지.
   FarmListPage가 카탈로그 호출 시 ?contentType=A,B,C 콤마 구분으로 전달.
   백엔드는 JSON_OVERLAPS로 categories 배열에서 OR 매칭.
   옛 alias도 포함시켜 마이그레이션 전 데이터와 호환 유지.
   ──────────────────────────────────────────────────────────── */
export const FARM_TO_CATEGORIES = {
  vocab: ["VOCAB", "VOCAB_BASIC"],
  reading: ["READING", "READING_NONFICTION", "READING_LITERATURE"],
  background: ["BACKGROUND", "BACKGROUND_KNOWLEDGE", "BACKGROUND_KNOWLEDGE_QUIZ"],
  story: ["STORY"],
  classic: ["CLASSIC"],
  grammar: [
    "GRAMMAR_WORD_FORMATION",
    "GRAMMAR_SENTENCE_STRUCTURE",
    "GRAMMAR_PHONEME_CHANGE",
    "GRAMMAR_POS",
    "MORPHEME_ANALYSIS",
  ],
  concept: ["CONCEPT", "LANGUAGE_CONCEPT", "LANGUAGE_CONCEPT_QUIZ"],
  logic: ["LOGIC", "LOGIC_REASONING", "LOGIC_REASONING_QUIZ"],
  writing: ["WRITING", "WRITING_DESCRIPTIVE"],
  choice: ["CHOICE_ANALYSIS", "CHOICE_JUDGEMENT"],
  // content 농장은 별도 /v1/learning/study/contents API 사용 — 카탈로그 매핑 불필요
};

/** 농장 ID → categories 배열 (없으면 빈 배열) */
export const getCategoriesForFarm = (farmId) => FARM_TO_CATEGORIES[farmId] || [];

/* 카테고리 → EngineShell moduleKey 공용 매핑
   - 여러 화면에서 중복 선언하던 fallback 매핑을 이곳으로 통합한다.
   - DB에 구체적인 moduleKey가 있으면 우선하되, worksheet_quiz 같은 범용 fallback은
     카테고리 전용 모듈이 있을 때 전용 모듈로 보정한다. */
export const MODULE_KEY_BY_CONTENT_TYPE = {
  // 새 카테고리
  DAILY_QUIZ: "daily_quiz",
  DAILY_READING: "reading_training",
  VOCAB: "worksheet_quiz",
  READING: "reading_training",
  STORY: "reading_training",
  CLASSIC: "reading_training",
  GRAMMAR_WORD_FORMATION: "word_formation",
  GRAMMAR_SENTENCE_STRUCTURE: "sentence_structure",
  GRAMMAR_PHONEME_CHANGE: "phoneme_change",
  GRAMMAR_POS: "worksheet_quiz",
  BACKGROUND: "background_knowledge",
  CONCEPT: "worksheet_quiz",
  LOGIC: "logic_reasoning",
  CHOICE_ANALYSIS: "choice_analysis",
  STUDY_CONTENT: "study_content",
  WRITING: "worksheet_quiz",
  PRO_TEST: "worksheet_quiz",
  PRO_ANSWER: "answer_key",
  PRO_READING: "reading_training",
  PRO_VOCAB: "worksheet_quiz",
  PRO_BACKGROUND: "background_knowledge",
  PRO_LOGIC: "logic_reasoning",

  // 옛 카테고리 alias
  VOCAB_BASIC: "worksheet_quiz",
  VOCAB_DICTIONARY: "worksheet_quiz",
  READING_NONFICTION: "reading_training",
  READING_LITERATURE: "reading_training",
  CONTENT_PDF: "study_content",
  CONTENT_PDF_QUIZ: "study_content",
  CHOICE_JUDGEMENT: "choice_analysis",
  MORPHEME_ANALYSIS: "morpheme_analysis",
  BACKGROUND_KNOWLEDGE: "background_knowledge",
  BACKGROUND_KNOWLEDGE_QUIZ: "background_knowledge",
  LANGUAGE_CONCEPT: "worksheet_quiz",
  LANGUAGE_CONCEPT_QUIZ: "worksheet_quiz",
  LOGIC_REASONING: "logic_reasoning",
  LOGIC_REASONING_QUIZ: "worksheet_quiz",
  WRITING_DESCRIPTIVE: "worksheet_quiz",
  PRO_MANUSCRIPT: "answer_key",
};

const GENERIC_MODULE_KEYS = new Set(["worksheet_quiz"]);

export const normalizeModuleKey = (moduleKey) => {
  if (!moduleKey) return null;
  const normalized = String(moduleKey).trim();
  if (!normalized) return null;
  if (normalized === "choice_judgement") return "choice_analysis";
  return normalized;
};

const normalizeContentTypeKeys = (contentType) => {
  const raw = Array.isArray(contentType) ? contentType : [contentType];
  return raw
    .filter((v) => v != null && String(v).trim().length > 0)
    .map((v) => String(v).trim().toUpperCase());
};

export const resolveModuleKeyForContentType = (contentType, fallback) => {
  const explicit = normalizeModuleKey(fallback);
  const mappedCandidates = normalizeContentTypeKeys(contentType)
    .map((type) => MODULE_KEY_BY_CONTENT_TYPE[type])
    .filter(Boolean);
  const mapped =
    mappedCandidates.find((key) => !GENERIC_MODULE_KEYS.has(key)) ||
    mappedCandidates[0];

  if (explicit) {
    if (!mapped || explicit === mapped) return explicit;
    if (GENERIC_MODULE_KEYS.has(mapped) && !GENERIC_MODULE_KEYS.has(explicit)) return explicit;
    return mapped;
  }
  return mapped || explicit || "worksheet_quiz";
};

/* 카테고리 → 어느 탭에 속하는지 (다중 가능). 콘텐츠 관리에 안 보이는 카테고리는 매핑 없음 */
export const CATEGORY_TO_TABS = {
  // 일일 학습
  DAILY_QUIZ: ["daily"],
  DAILY_READING: ["daily"],

  // 농장별 학습
  VOCAB: ["farm"],
  READING: ["farm"],
  STORY: ["farm"],
  CLASSIC: ["farm"],
  GRAMMAR_WORD_FORMATION: ["farm"],
  GRAMMAR_SENTENCE_STRUCTURE: ["farm"],
  GRAMMAR_PHONEME_CHANGE: ["farm"],
  GRAMMAR_POS: ["farm"],
  BACKGROUND: ["farm"],
  CONCEPT: ["farm"],
  LOGIC: ["farm"],
  CHOICE_ANALYSIS: ["farm"],

  // 옛 alias (호환성)
  VOCAB_BASIC: ["farm"],
  READING_NONFICTION: ["farm"],
  READING_LITERATURE: ["farm"],
  MORPHEME_ANALYSIS: ["farm"],
  BACKGROUND_KNOWLEDGE: ["farm"],
  BACKGROUND_KNOWLEDGE_QUIZ: ["farm"],
  LANGUAGE_CONCEPT: ["farm"],
  LANGUAGE_CONCEPT_QUIZ: ["farm"],
  LOGIC_REASONING: ["farm"],
  LOGIC_REASONING_QUIZ: ["farm"],
  CHOICE_JUDGEMENT: ["farm"],

  // 프로 모드
  PRO_READING: ["pro"],
  PRO_VOCAB: ["pro"],
  PRO_BACKGROUND: ["pro"],
  PRO_LOGIC: ["pro"],

  // 콘텐츠 관리 외 (매핑 없음 → 페이지에서 자동 제외)
  // STUDY_CONTENT, WRITING, PRO_TEST, PRO_ANSWER → 의도적으로 매핑 안 함
};

/** contentType array를 받아 어떤 탭들에 속하는지 반환 (중복 제거) */
export const getCategoryTabs = (contentTypeArray) => {
  if (!Array.isArray(contentTypeArray)) {
    contentTypeArray = contentTypeArray ? [contentTypeArray] : [];
  }
  const tabs = new Set();
  for (const cat of contentTypeArray) {
    const mapped = CATEGORY_TO_TABS[cat];
    if (mapped) mapped.forEach((t) => tabs.add(t));
  }
  return Array.from(tabs);
};

/** 콘텐츠 관리 페이지에 노출되어야 하는지 (어느 탭에라도 매핑되면 true) */
export const isManageableContent = (contentTypeArray) => {
  return getCategoryTabs(contentTypeArray).length > 0;
};

/* 테이블 셀용 축약 라벨 + 그룹 컬러 */
export const TYPE_SHORT = {
  // 일일 학습
  DAILY_QUIZ: { label: "퀴즈", group: "daily" },
  DAILY_READING: { label: "독해", group: "daily" },

  // 농장별 학습
  VOCAB: { label: "어휘", group: "vocab" },
  READING: { label: "독해", group: "reading" },
  STORY: { label: "이야기", group: "reading" },
  CLASSIC: { label: "고전", group: "reading" },
  GRAMMAR_WORD_FORMATION: { label: "단어형성", group: "grammar" },
  GRAMMAR_SENTENCE_STRUCTURE: { label: "문장짜임", group: "grammar" },
  GRAMMAR_PHONEME_CHANGE: { label: "음운변동", group: "grammar" },
  GRAMMAR_POS: { label: "품사", group: "grammar" },
  BACKGROUND: { label: "배경", group: "knowledge" },
  CONCEPT: { label: "개념", group: "knowledge" },
  LOGIC: { label: "논리", group: "logic" },
  CHOICE_ANALYSIS: { label: "분석", group: "choice" },

  // 프로 모드
  PRO_READING: { label: "프로독해", group: "pro" },
  PRO_VOCAB: { label: "프로어휘", group: "pro" },
  PRO_BACKGROUND: { label: "프로배경", group: "pro" },
  PRO_LOGIC: { label: "프로논리", group: "pro" },

  // 옛 alias
  VOCAB_BASIC: { label: "어휘", group: "vocab" },
  READING_NONFICTION: { label: "독해", group: "reading" },
  READING_LITERATURE: { label: "문학", group: "reading" },
  MORPHEME_ANALYSIS: { label: "형태소", group: "grammar" },
  BACKGROUND_KNOWLEDGE: { label: "배경", group: "knowledge" },
  BACKGROUND_KNOWLEDGE_QUIZ: { label: "배경", group: "knowledge" },
  LANGUAGE_CONCEPT: { label: "개념", group: "knowledge" },
  LANGUAGE_CONCEPT_QUIZ: { label: "개념", group: "knowledge" },
  LOGIC_REASONING: { label: "논리", group: "logic" },
  LOGIC_REASONING_QUIZ: { label: "논리", group: "logic" },
  CHOICE_JUDGEMENT: { label: "분석", group: "choice" },
  STUDY_CONTENT: { label: "내용", group: "content" },
  CONTENT_PDF: { label: "내용", group: "content" },
  CONTENT_PDF_QUIZ: { label: "내용", group: "content" },
  WRITING: { label: "글쓰기", group: "writing" },
  WRITING_DESCRIPTIVE: { label: "글쓰기", group: "writing" },
  PRO_TEST: { label: "프로테스트", group: "pro" },
  PRO_ANSWER: { label: "프로답안", group: "pro" },
  PRO_MANUSCRIPT: { label: "프로답안", group: "pro" },
};

export const getTypeShort = (type) => TYPE_SHORT[type] || { label: type, group: "other" };

/* 레벨 축약 (소1, 프2, 러3, 비1 ...) */
export const LEVEL_SHORT = {
  SAUSSURE_1: "소1", SAUSSURE_2: "소2", SAUSSURE_3: "소3",
  FREGE_1: "프1", FREGE_2: "프2", FREGE_3: "프3",
  RUSSELL_1: "러1", RUSSELL_2: "러2", RUSSELL_3: "러3",
  WITTGENSTEIN_1: "비1", WITTGENSTEIN_2: "비2", WITTGENSTEIN_3: "비3",
};

export const getLevelShort = (level) => LEVEL_SHORT[level] || level || "-";

/* 레벨 라벨 헬퍼 */
export const LEVEL_LABEL_MAP = {
  SAUSSURE_1: "소쉬르 1", SAUSSURE_2: "소쉬르 2", SAUSSURE_3: "소쉬르 3",
  FREGE_1: "프레게 1", FREGE_2: "프레게 2", FREGE_3: "프레게 3",
  RUSSELL_1: "러셀 1", RUSSELL_2: "러셀 2", RUSSELL_3: "러셀 3",
  WITTGENSTEIN_1: "비트겐슈타인 1", WITTGENSTEIN_2: "비트겐슈타인 2", WITTGENSTEIN_3: "비트겐슈타인 3",
};

export const getLevelLabel = (level) => LEVEL_LABEL_MAP[level] || level;

export const DAILY_LEVELS = [
  "SAUSSURE_1", "SAUSSURE_2", "SAUSSURE_3",
  "FREGE_1", "FREGE_2", "FREGE_3",
  "RUSSELL_1", "RUSSELL_2", "RUSSELL_3",
  "WITTGENSTEIN_1", "WITTGENSTEIN_2", "WITTGENSTEIN_3",
];

export const levelToFolder = (level) => level.toLowerCase().replace("_", "");
