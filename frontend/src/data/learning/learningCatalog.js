import { LEVEL_LABEL_MAP, DAILY_LEVELS } from "../../constants/contentTypes";

export const LEVELS = DAILY_LEVELS;
export const LEVEL_LABELS = LEVEL_LABEL_MAP;

/** profile.level_id (예: "russell1") → UPPER_SNAKE (예: "RUSSELL_1") 변환 */
export function profileLevelToUpper(levelId) {
  if (!levelId) return "";
  const m = levelId.match(/^([a-z]+)(\d+)$/i);
  if (!m) return levelId.toUpperCase();
  return `${m[1].toUpperCase()}_${m[2]}`;
}

export const SERVERS = ["FREGE", "SAUSSURE", "RUSSELL", "WITTGENSTEIN"];

export const SERVER_LABELS = {
  FREGE: "프레게",
  SAUSSURE: "소쉬르",
  RUSSELL: "러셀",
  WITTGENSTEIN: "비트겐슈타인",
};

/** "RUSSELL_1" → "RUSSELL", "FREGE_3" → "FREGE" */
export function getServerFromLevel(levelId) {
  if (!levelId) return "";
  const idx = levelId.lastIndexOf("_");
  return idx > 0 ? levelId.substring(0, idx) : levelId;
}

/** profile.level_id (예: "russell1") → 서버명 (예: "RUSSELL") */
export function profileLevelToServer(levelId) {
  const upper = profileLevelToUpper(levelId);
  return getServerFromLevel(upper);
}

/** 콘텐츠의 targetLevel이 선택한 서버에 속하는지 판별 */
export function levelBelongsToServer(targetLevel, server) {
  if (!server) return true;
  if (!targetLevel) return false;
  return targetLevel.startsWith(server);
}

export const SUB_AREA_LABELS = {
  BASIC: "기본",
  DICTIONARY: "사전",
  NONFICTION: "비문학",
  NONFICTION_PHILOSOPHY: "비문학",
  NONFICTION_SOCIAL: "비문학",
  LITERATURE: "문학",
  PDF: "PDF",
  WORD_FORMATION: "단어 형성",
  SENTENCE_STRUCTURE: "문장 구조",
  PHONEME_CHANGE: "음운 변동",
  POS: "품사",
  MORPHEME: "형태소",
  KNOWLEDGE: "배경지식",
  SCIENCE: "과학",
  CONCEPT: "개념·이론",
  REASONING: "추론",
  DESCRIPTIVE: "서술형",
  JUDGEMENT: "판별",
  CHOICE_JUDGEMENT: "판별",
};

/* ── 농장 모드 정적 콘텐츠 카탈로그 (관리자 콘텐츠 목록에서 사용) ── */
export const LEARNING_CATALOG = [
  { id: "vocab-basic-word", title: "어휘 기본 학습 01", contentType: "VOCAB_BASIC", targetLevel: "RUSSELL_1", contentId: "b0e8b260-d386-4ad4-a2e6-b062ff545f4f", moduleKey: "worksheet_quiz", jsonPath: "/farm/vocab/vocab_basic_word_to_meaning.json" },
  { id: "reading-training", title: "비문학 독해 훈련", contentType: "READING_NONFICTION", targetLevel: "FREGE_1", contentId: "sample-reading-nonfiction-training", moduleKey: "reading_training", jsonPath: "/farm/reading/reading_nonfiction_training.json" },
  { id: "reading-literature-training", title: "문학 독해 훈련", contentType: "READING_LITERATURE", targetLevel: "FREGE_1", contentId: "sample-reading-literature-training", moduleKey: "reading_training", jsonPath: "/farm/reading/reading_literature_training.json" },
  { id: "content-pdf-quiz", title: "내용 숙지 학습 01", contentType: "CONTENT_PDF_QUIZ", targetLevel: "RUSSELL_1", contentId: "70eeb8fa-9163-4075-bbb3-2f1625a96f46", moduleKey: "content_pdf", jsonPath: "/farm/content/content_pdf_quiz.json" },
  { id: "grammar-sentence-structure", title: "문장의 짜임 분석 01", contentType: "GRAMMAR_SENTENCE_STRUCTURE", targetLevel: "RUSSELL_1", contentId: "2727d7ec-da5f-4099-ada7-7e98e6c8c104", moduleKey: "sentence_structure", jsonPath: "/farm/grammar/grammar_sentence_structure.json" },
  { id: "grammar-phoneme-change", title: "음운 변동 분석 01", contentType: "GRAMMAR_PHONEME_CHANGE", targetLevel: "RUSSELL_1", contentId: "dfae52aa-2e61-4937-bb39-15dfd8d0df6d", moduleKey: "phoneme_change", jsonPath: "/farm/grammar/grammar_phoneme_change.json" },
  ...Array.from({ length: 37 }, (_, i) => {
    const nn = String(i + 1).padStart(2, "0");
    return { id: `grammar-phoneme-change-${nn}`, title: `음운 변동 분석 ${nn}`, contentType: "GRAMMAR_PHONEME_CHANGE", targetLevel: "RUSSELL_1", contentId: `phoneme-change-${nn}`, moduleKey: "phoneme_change", jsonPath: `/farm/grammar/grammar_phoneme_change_${nn}.json` };
  }),
  { id: "background-knowledge", title: "배경지식 퀴즈 01", contentType: "BACKGROUND_KNOWLEDGE_QUIZ", targetLevel: "RUSSELL_1", contentId: "cc43b636-28fe-4751-9f5c-85c5baeefa78", moduleKey: "worksheet_quiz", jsonPath: "/farm/background/background_knowledge_quiz.json" },
  { id: "language-concept", title: "국어 개념 퀴즈 01", contentType: "LANGUAGE_CONCEPT_QUIZ", targetLevel: "RUSSELL_1", contentId: "4f10135c-b92c-4dce-95ae-f92c0be78819", moduleKey: "worksheet_quiz", jsonPath: "/farm/concept/language_concept_quiz.json" },
  { id: "logic-reasoning", title: "논리사고력 01", contentType: "LOGIC_REASONING_QUIZ", targetLevel: "RUSSELL_1", contentId: "28a3fdc1-6a3e-4725-ab49-4050548e9760", moduleKey: "worksheet_quiz", jsonPath: "/farm/logic/logic_reasoning_quiz.json" },
  { id: "descriptive-practice", title: "서술형 연습 01", contentType: "WRITING_DESCRIPTIVE", targetLevel: "RUSSELL_1", contentId: "077ba09b-974c-4f28-b1bf-b236cad4cb8e", moduleKey: "worksheet_quiz", jsonPath: "/farm/writing/descriptive_practice.json" },
  { id: "choice-judgement", title: "선택지 판별 연습 01", contentType: "CHOICE_JUDGEMENT", targetLevel: "RUSSELL_1", contentId: "a0054d75-7602-4b58-94e4-1417568d0ffe", moduleKey: "choice_judgement", jsonPath: "/farm/choice/choice_judgement.json" },
];

/* ── 농장별 모드 데이터 ── */

export const FARM_MAP = {
  vocab: {
    id: "vocab",
    name: "어휘 농장",
    emoji: "\uD83C\uDF3E",
    description: "낱말과 뜻, 사전 활용까지",
    color: "#e8a742",
    seedType: "seed_wheat",
    servers: "all",
  },
  reading: {
    id: "reading",
    name: "독해 농장",
    emoji: "\uD83D\uDCD6",
    description: "비문학·문학 지문 독해 훈련",
    color: "#5a9e6f",
    seedType: "seed_rice",
    servers: "all",
  },
  background: {
    id: "background",
    name: "배경지식 농장",
    emoji: "\uD83C\uDF0D",
    description: "교양과 배경지식 퀴즈",
    color: "#6a8db5",
    seedType: "seed_corn",
    servers: "all",
  },
  story: {
    id: "story",
    name: "이야기 농장",
    emoji: "\uD83D\uDCDA",
    description: "소설·수필·동화 독해",
    color: "#e07a5f",
    seedType: "seed_rice",
    servers: ["SAUSSURE", "FREGE"],
  },
  classic: {
    id: "classic",
    name: "고전 농장",
    emoji: "\uD83D\uDCDC",
    description: "고전 시가·산문 독해",
    color: "#a67b5b",
    seedType: "seed_rice",
    servers: ["SAUSSURE", "FREGE"],
  },
  content: {
    id: "content",
    name: "내용 숙지 농장",
    emoji: "\uD83D\uDCCB",
    description: "PDF·텍스트 내용 확인 학습",
    color: "#7b8fb2",
    seedType: "seed_rice",
    servers: ["RUSSELL", "WITTGENSTEIN"],
  },
  grammar: {
    id: "grammar",
    name: "문법 농장",
    emoji: "\uD83D\uDD24",
    description: "단어 형성, 문장 구조, 음운 변동, 품사",
    color: "#b07545",
    seedType: "seed_wheat",
    servers: ["FREGE", "RUSSELL", "WITTGENSTEIN"],
  },
  concept: {
    id: "concept",
    name: "국어 개념 및 이론 농장",
    emoji: "\uD83D\uDCA1",
    description: "국어 핵심 개념과 이론 학습",
    color: "#9b6fb0",
    seedType: "seed_corn",
    servers: ["RUSSELL", "WITTGENSTEIN"],
  },
  logic: {
    id: "logic",
    name: "논리사고력 농장",
    emoji: "\uD83E\uDDE9",
    description: "추론과 논리적 사고 훈련",
    color: "#c75a5a",
    seedType: "seed_grape",
    servers: ["SAUSSURE", "FREGE", "RUSSELL", "WITTGENSTEIN"],
  },
  writing: {
    id: "writing",
    name: "서술형 농장",
    emoji: "\u270D\uFE0F",
    description: "서술형 문제 풀이 연습",
    color: "#4a8a7a",
    seedType: "seed_apple",
    servers: ["RUSSELL", "WITTGENSTEIN"],
  },
  choice: {
    id: "choice",
    name: "선택지 판별 농장",
    emoji: "\u2705",
    description: "선택지 적절성 판별 훈련",
    color: "#d48a3c",
    seedType: "seed_grape",
    servers: ["WITTGENSTEIN"],
  },
};

export const FARM_LIST = Object.values(FARM_MAP);

export const getFarmById = (farmId) => FARM_MAP[farmId] || null;

/** 서버에 해당하는 농장 목록 반환 */
export function getFarmsForServer(server) {
  if (!server) return FARM_LIST;
  return FARM_LIST.filter(
    (f) => f.servers === "all" || f.servers?.includes(server)
  );
}
