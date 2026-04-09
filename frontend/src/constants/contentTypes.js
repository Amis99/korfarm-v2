/* contentType 한글 라벨 (풀네임) */
export const TYPE_LABEL = {
  DAILY_QUIZ: "일일 퀴즈",
  DAILY_READING: "일일 독해",
  VOCAB_BASIC: "어휘 학습",
  GRAMMAR_WORD_FORMATION: "형태소와 단어의 형성",
  MORPHEME_ANALYSIS: "형태소와 단어의 형성",
  GRAMMAR_SENTENCE_STRUCTURE: "문법 - 문장 짜임",
  GRAMMAR_PHONEME_CHANGE: "문법 - 음운 변동",
  GRAMMAR_POS: "문법 - 품사",
  READING_NONFICTION: "독해 훈련",
  READING_LITERATURE: "독해 훈련 (문학)",
  CONTENT_PDF: "내용 숙지",
  CONTENT_PDF_QUIZ: "내용 숙지",
  BACKGROUND_KNOWLEDGE: "배경지식",
  BACKGROUND_KNOWLEDGE_QUIZ: "배경지식 퀴즈",
  LANGUAGE_CONCEPT: "국어 개념",
  LANGUAGE_CONCEPT_QUIZ: "국어 개념 퀴즈",
  LOGIC_REASONING: "논리사고력",
  LOGIC_REASONING_QUIZ: "논리사고력 퀴즈",
  CHOICE_ANALYSIS: "선택지 분석",
  CHOICE_JUDGEMENT: "선택지 분석",
  WRITING_DESCRIPTIVE: "서술형",
  PRO_READING: "프로 독해",
  PRO_VOCAB: "프로 어휘",
  PRO_BACKGROUND: "프로 배경지식",
  PRO_LOGIC: "프로 논리사고력",
  PRO_ANSWER: "프로 모범답안/정답해설",
  /* 레거시 moduleKey 기반 (DB 콘텐츠 호환) */
  worksheet_quiz: "공통 퀴즈형",
  reading_training: "독해 훈련",
  choice_analysis: "선택지 분석",
  choice_judgement: "선택지 분석",
  phoneme_change: "음운 변동",
  word_formation: "단어 형성",
  sentence_structure: "문장 짜임",
  pro_mode: "프로 모드",
};

/* 테이블 셀용 축약 라벨 + 그룹 컬러 */
export const TYPE_SHORT = {
  DAILY_QUIZ: { label: "퀴즈", group: "daily" },
  DAILY_READING: { label: "독해", group: "daily" },
  VOCAB_BASIC: { label: "어휘", group: "vocab" },
  GRAMMAR_WORD_FORMATION: { label: "형태소/단어", group: "grammar" },
  MORPHEME_ANALYSIS: { label: "형태소/단어", group: "grammar" },
  GRAMMAR_SENTENCE_STRUCTURE: { label: "문장짜임", group: "grammar" },
  GRAMMAR_PHONEME_CHANGE: { label: "음운변동", group: "grammar" },
  GRAMMAR_POS: { label: "품사", group: "grammar" },
  READING_NONFICTION: { label: "비문학", group: "reading" },
  READING_LITERATURE: { label: "문학", group: "reading" },
  CONTENT_PDF: { label: "내용숙지", group: "content" },
  CONTENT_PDF_QUIZ: { label: "내용숙지", group: "content" },
  BACKGROUND_KNOWLEDGE: { label: "배경", group: "knowledge" },
  BACKGROUND_KNOWLEDGE_QUIZ: { label: "배경퀴즈", group: "knowledge" },
  LANGUAGE_CONCEPT: { label: "개념", group: "knowledge" },
  LANGUAGE_CONCEPT_QUIZ: { label: "개념퀴즈", group: "knowledge" },
  LOGIC_REASONING: { label: "논리", group: "logic" },
  LOGIC_REASONING_QUIZ: { label: "논리퀴즈", group: "logic" },
  CHOICE_ANALYSIS: { label: "분석", group: "choice" },
  CHOICE_JUDGEMENT: { label: "분석", group: "choice" },
  WRITING_DESCRIPTIVE: { label: "서술형", group: "writing" },
  PRO_READING: { label: "프로독해", group: "pro" },
  PRO_VOCAB: { label: "프로어휘", group: "pro" },
  PRO_BACKGROUND: { label: "프로배경", group: "pro" },
  PRO_LOGIC: { label: "프로논리", group: "pro" },
  PRO_ANSWER: { label: "프로답안", group: "pro" },
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
