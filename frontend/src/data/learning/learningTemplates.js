import dailyQuizQuiz from "./templates/dailyQuiz_quiz.json";
import readingTraining from "./templates/reading_training.json";
import vocabTraining from "./templates/vocab_training.json";
import backgroundQuiz from "./templates/background_quiz.json";
import farmGrammarWf from "./templates/farm_grammar_wf.json";
import farmGrammarSs from "./templates/farm_grammar_ss.json";
import farmGrammarPc from "./templates/farm_grammar_pc.json";
import farmGrammarPos from "./templates/farm_grammar_pos.json";
import farmConcept from "./templates/farm_concept.json";
import farmLogic from "./templates/farm_logic.json";
import farmChoiceAnalysis from "./templates/farm_choice_analysis.json";

/**
 * 학습 콘텐츠 표준양식 목록 — 다중 분류 카테고리(contentType array) 시스템
 * - id: "{group}_{subtype}" 형식
 * - contentType: array (한 콘텐츠가 여러 카테고리에 동시 노출)
 *   예: 일일 독해 → ["DAILY_READING","READING"] (자동으로 농장 독해에도)
 *       프로 독해 → ["PRO_READING","READING"] (자동으로 농장 독해에도)
 * - 글쓰기/내용 숙지/프로 답안은 콘텐츠 학습 아님 → 다른 메뉴에서 관리, 여기서 제거
 */
export const LEARNING_TEMPLATES = [
  // 일일 학습
  { id: "dailyQuiz_quiz", contentType: ["DAILY_QUIZ"], title: "일일 퀴즈", moduleKey: "daily_quiz", content: dailyQuizQuiz },
  { id: "dailyReading_training", contentType: ["DAILY_READING", "READING"], title: "일일 독해", moduleKey: "reading_training", content: readingTraining },

  // 농장별 학습
  { id: "farm_vocab", contentType: ["VOCAB"], title: "어휘", moduleKey: "worksheet_quiz", content: vocabTraining },
  { id: "farm_reading", contentType: ["READING"], title: "독해", moduleKey: "reading_training", content: readingTraining },
  { id: "farm_story", contentType: ["READING", "STORY"], title: "이야기 농장", moduleKey: "reading_training", content: readingTraining },
  { id: "farm_classic", contentType: ["READING", "CLASSIC"], title: "고전 농장", moduleKey: "reading_training", content: readingTraining },
  { id: "farm_grammar_wf", contentType: ["GRAMMAR_WORD_FORMATION"], title: "문법 - 단어 형성", moduleKey: "word_formation", content: farmGrammarWf },
  { id: "farm_grammar_ss", contentType: ["GRAMMAR_SENTENCE_STRUCTURE"], title: "문법 - 문장 짜임", moduleKey: "sentence_structure", content: farmGrammarSs },
  { id: "farm_grammar_pc", contentType: ["GRAMMAR_PHONEME_CHANGE"], title: "문법 - 음운 변동", moduleKey: "phoneme_change", content: farmGrammarPc },
  { id: "farm_grammar_pos", contentType: ["GRAMMAR_POS"], title: "문법 - 품사", moduleKey: "worksheet_quiz", content: farmGrammarPos },
  { id: "farm_background", contentType: ["BACKGROUND"], title: "배경지식", moduleKey: "worksheet_quiz", content: backgroundQuiz },
  { id: "farm_concept", contentType: ["CONCEPT"], title: "국어 개념", moduleKey: "worksheet_quiz", content: farmConcept },
  { id: "farm_logic", contentType: ["LOGIC"], title: "논리사고력", moduleKey: "logic_reasoning", content: farmLogic },
  { id: "farm_choice_analysis", contentType: ["CHOICE_ANALYSIS"], title: "선택지 분석", moduleKey: "choice_analysis", content: farmChoiceAnalysis },

  // 프로 모드 — 농장별 학습에도 자동 노출
  { id: "pro_reading", contentType: ["PRO_READING", "READING"], title: "프로 독해", moduleKey: "reading_training", content: readingTraining },
  { id: "pro_vocab", contentType: ["PRO_VOCAB", "VOCAB"], title: "프로 어휘", moduleKey: "worksheet_quiz", content: vocabTraining },
  { id: "pro_background", contentType: ["PRO_BACKGROUND", "BACKGROUND"], title: "프로 배경지식", moduleKey: "worksheet_quiz", content: backgroundQuiz },
  { id: "pro_logic", contentType: ["PRO_LOGIC", "LOGIC"], title: "프로 논리사고력", moduleKey: "logic_reasoning", content: farmLogic },
];
