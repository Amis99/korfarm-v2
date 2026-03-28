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
  KNOWLEDGE: "배경지식",
  SCIENCE: "과학",
  CONCEPT: "개념·이론",
  REASONING: "추론",
  DESCRIPTIVE: "서술형",
  JUDGEMENT: "판별",
  CHOICE_JUDGEMENT: "판별",
};

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
    servers: ["FREGE", "RUSSELL", "WITTGENSTEIN"],
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
