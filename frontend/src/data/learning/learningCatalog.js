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
