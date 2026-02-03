import vocabBasicWordToMeaning from "./samples/vocab_basic_word_to_meaning.json";
import vocabDictionaryFill from "./samples/vocab_dictionary_fill.json";
import readingLiteratureTraining from "./samples/reading_literature_training.json";
import readingNonfictionTraining from "./samples/reading_nonfiction_training.json";
import contentPdfQuiz from "./samples/content_pdf_quiz.json";
import grammarWordFormation from "./samples/grammar_word_formation.json";
import grammarSentenceStructure from "./samples/grammar_sentence_structure.json";
import grammarPhonemeChange from "./samples/grammar_phoneme_change.json";
import grammarPosQuiz from "./samples/grammar_pos_quiz.json";
import backgroundKnowledgeQuiz from "./samples/background_knowledge_quiz.json";
import languageConceptQuiz from "./samples/language_concept_quiz.json";
import logicReasoningQuiz from "./samples/logic_reasoning_quiz.json";
import descriptivePractice from "./samples/descriptive_practice.json";
import choiceJudgement from "./samples/choice_judgement.json";
import readingNonfictionIntensive from "./samples/reading_nonfiction_intensive.json";
import readingNonfictionRecall from "./samples/reading_nonfiction_recall.json";
import readingNonfictionConfirm from "./samples/reading_nonfiction_confirm.json";

export const SUB_AREA_LABELS = {
  BASIC: "기본",
  DICTIONARY: "사전",
  NONFICTION: "비문학",
  NONFICTION_PHILOSOPHY: "비문학",
  NONFICTION_SOCIAL: "비문학",
  NONFICTION_INTENSIVE: "정독",
  NONFICTION_RECALL: "내용 회상",
  NONFICTION_CONFIRM: "내용 확인",
  LITERATURE: "문학",
  PDF: "PDF",
  WORD_FORMATION: "단어 형성",
  SENTENCE_STRUCTURE: "문장 구조",
  PHONEME_CHANGE: "음운 변동",
  POS: "품사",
  KNOWLEDGE: "배경지식",
  CONCEPT: "개념·이론",
  REASONING: "추론",
  DESCRIPTIVE: "서술형",
  JUDGEMENT: "판별",
};

export const LEARNING_CATALOG = [
  {
    id: "vocab-basic-word",
    category: "어휘 학습",
    title: vocabBasicWordToMeaning.title,
    description: vocabBasicWordToMeaning.description,
    contentType: vocabBasicWordToMeaning.contentType,
    moduleKey: "worksheet_quiz",
    content: vocabBasicWordToMeaning,
  },
  {
    id: "vocab-dictionary-fill",
    category: "어휘 학습",
    title: vocabDictionaryFill.title,
    description: vocabDictionaryFill.description,
    contentType: vocabDictionaryFill.contentType,
    moduleKey: "worksheet_quiz",
    content: vocabDictionaryFill,
  },
  {
    id: "reading-training",
    category: "독해 연습",
    title: readingNonfictionTraining.title,
    description: readingNonfictionTraining.description,
    contentType: readingNonfictionTraining.contentType,
    moduleKey: "reading_training",
    content: readingNonfictionTraining,
  },
  {
    id: "reading-literature-training",
    category: "독해 연습",
    title: readingLiteratureTraining.title,
    description: readingLiteratureTraining.description,
    contentType: readingLiteratureTraining.contentType,
    moduleKey: "reading_training",
    content: readingLiteratureTraining,
  },
  {
    id: "reading-nonfiction-intensive",
    category: "독해 연습",
    title: readingNonfictionIntensive.title,
    description: readingNonfictionIntensive.description,
    contentType: readingNonfictionIntensive.contentType,
    moduleKey: "reading_intensive",
    content: readingNonfictionIntensive,
  },
  {
    id: "reading-nonfiction-recall",
    category: "독해 연습",
    title: readingNonfictionRecall.title,
    description: readingNonfictionRecall.description,
    contentType: readingNonfictionRecall.contentType,
    moduleKey: "recall_cards",
    content: readingNonfictionRecall,
  },
  {
    id: "reading-nonfiction-confirm",
    category: "독해 연습",
    title: readingNonfictionConfirm.title,
    description: readingNonfictionConfirm.description,
    contentType: readingNonfictionConfirm.contentType,
    moduleKey: "confirm_click",
    content: readingNonfictionConfirm,
  },
  {
    id: "content-pdf-quiz",
    category: "내용 숙지 학습",
    title: contentPdfQuiz.title,
    description: contentPdfQuiz.description,
    contentType: contentPdfQuiz.contentType,
    moduleKey: "worksheet_quiz",
    content: contentPdfQuiz,
  },
  {
    id: "grammar-word-formation",
    category: "문법 연습",
    title: grammarWordFormation.title,
    description: grammarWordFormation.description,
    contentType: grammarWordFormation.contentType,
    moduleKey: "word_formation",
    content: grammarWordFormation,
  },
  {
    id: "grammar-sentence-structure",
    category: "문법 연습",
    title: grammarSentenceStructure.title,
    description: grammarSentenceStructure.description,
    contentType: grammarSentenceStructure.contentType,
    moduleKey: "sentence_structure",
    content: grammarSentenceStructure,
  },
  {
    id: "grammar-phoneme-change",
    category: "문법 연습",
    title: grammarPhonemeChange.title,
    description: grammarPhonemeChange.description,
    contentType: grammarPhonemeChange.contentType,
    moduleKey: "phoneme_change",
    content: grammarPhonemeChange,
  },
  {
    id: "grammar-pos-quiz",
    category: "문법 연습",
    title: grammarPosQuiz.title,
    description: grammarPosQuiz.description,
    contentType: grammarPosQuiz.contentType,
    moduleKey: "worksheet_quiz",
    content: grammarPosQuiz,
  },
  {
    id: "background-knowledge",
    category: "배경지식 퀴즈",
    title: backgroundKnowledgeQuiz.title,
    description: backgroundKnowledgeQuiz.description,
    contentType: backgroundKnowledgeQuiz.contentType,
    moduleKey: "worksheet_quiz",
    content: backgroundKnowledgeQuiz,
  },
  {
    id: "language-concept",
    category: "국어 개념 및 이론 퀴즈",
    title: languageConceptQuiz.title,
    description: languageConceptQuiz.description,
    contentType: languageConceptQuiz.contentType,
    moduleKey: "worksheet_quiz",
    content: languageConceptQuiz,
  },
  {
    id: "logic-reasoning",
    category: "논리사고력",
    title: logicReasoningQuiz.title,
    description: logicReasoningQuiz.description,
    contentType: logicReasoningQuiz.contentType,
    moduleKey: "worksheet_quiz",
    content: logicReasoningQuiz,
  },
  {
    id: "descriptive-practice",
    category: "서술형 연습",
    title: descriptivePractice.title,
    description: descriptivePractice.description,
    contentType: descriptivePractice.contentType,
    moduleKey: "worksheet_quiz",
    content: descriptivePractice,
  },
  {
    id: "choice-judgement",
    category: "선택지 판별 연습",
    title: choiceJudgement.title,
    description: choiceJudgement.description,
    contentType: choiceJudgement.contentType,
    moduleKey: "choice_judgement",
    content: choiceJudgement,
  },
];

export const LEARNING_CATEGORIES = LEARNING_CATALOG.reduce((acc, item) => {
  if (!acc[item.category]) {
    acc[item.category] = [];
  }
  acc[item.category].push(item);
  return acc;
}, {});

export const getLearningById = (id) =>
  LEARNING_CATALOG.find((item) => item.id === id);

/* ── 농장별 모드 데이터 ── */

export const FARM_MAP = {
  vocab: {
    id: "vocab",
    name: "어휘 농장",
    emoji: "\uD83C\uDF3E",
    description: "낱말과 뜻, 사전 활용까지",
    color: "#e8a742",
    contentTypes: ["VOCAB_BASIC", "VOCAB_DICTIONARY"],
  },
  reading: {
    id: "reading",
    name: "독해 농장",
    emoji: "\uD83D\uDCD6",
    description: "비문학·문학 지문 독해 훈련",
    color: "#5a9e6f",
    contentTypes: ["READING_NONFICTION", "READING_LITERATURE", "READING_NONFICTION_INTENSIVE", "READING_NONFICTION_RECALL", "READING_NONFICTION_CONFIRM"],
  },
  content: {
    id: "content",
    name: "내용 숙지 농장",
    emoji: "\uD83D\uDCCB",
    description: "PDF·텍스트 내용 확인 학습",
    color: "#7b8fb2",
    contentTypes: ["CONTENT_PDF", "CONTENT_PDF_QUIZ"],
  },
  grammar: {
    id: "grammar",
    name: "문법 농장",
    emoji: "\uD83D\uDD24",
    description: "단어 형성, 문장 구조, 음운 변동, 품사",
    color: "#b07545",
    contentTypes: [
      "GRAMMAR_WORD_FORMATION",
      "GRAMMAR_SENTENCE_STRUCTURE",
      "GRAMMAR_PHONEME_CHANGE",
      "GRAMMAR_POS",
    ],
  },
  background: {
    id: "background",
    name: "배경지식 농장",
    emoji: "\uD83C\uDF0D",
    description: "교양과 배경지식 퀴즈",
    color: "#6a8db5",
    contentTypes: ["BACKGROUND_KNOWLEDGE", "BACKGROUND_KNOWLEDGE_QUIZ"],
  },
  concept: {
    id: "concept",
    name: "국어 개념 및 이론 농장",
    emoji: "\uD83D\uDCA1",
    description: "국어 핵심 개념과 이론 학습",
    color: "#9b6fb0",
    contentTypes: ["LANGUAGE_CONCEPT", "LANGUAGE_CONCEPT_QUIZ"],
  },
  logic: {
    id: "logic",
    name: "논리사고력 농장",
    emoji: "\uD83E\uDDE9",
    description: "추론과 논리적 사고 훈련",
    color: "#c75a5a",
    contentTypes: ["LOGIC_REASONING", "LOGIC_REASONING_QUIZ"],
  },
  writing: {
    id: "writing",
    name: "서술형 농장",
    emoji: "\u270D\uFE0F",
    description: "서술형 문제 풀이 연습",
    color: "#4a8a7a",
    contentTypes: ["WRITING_DESCRIPTIVE"],
  },
  choice: {
    id: "choice",
    name: "선택지 판별 농장",
    emoji: "\u2705",
    description: "선택지 적절성 판별 훈련",
    color: "#d48a3c",
    contentTypes: ["CHOICE_JUDGEMENT"],
  },
};

export const FARM_LIST = Object.values(FARM_MAP);

export const getFarmById = (farmId) => FARM_MAP[farmId] || null;

export const getLearningItemsByFarm = (farmId) => {
  const farm = FARM_MAP[farmId];
  if (!farm) return [];
  return LEARNING_CATALOG.filter((item) =>
    farm.contentTypes.includes(item.contentType)
  );
};
