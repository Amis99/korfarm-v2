import dailyQuizQuiz from "./templates/dailyQuiz_quiz.json";
import readingTraining from "./templates/reading_training.json";
import vocabTraining from "./templates/vocab_training.json";
import backgroundQuiz from "./templates/background_quiz.json";
import farmContent from "./templates/farm_content.json";
import farmGrammarWf from "./templates/farm_grammar_wf.json";
import farmGrammarSs from "./templates/farm_grammar_ss.json";
import farmGrammarPc from "./templates/farm_grammar_pc.json";
import farmGrammarPos from "./templates/farm_grammar_pos.json";
import farmConcept from "./templates/farm_concept.json";
import farmLogic from "./templates/farm_logic.json";
import farmWriting from "./templates/farm_writing.json";
import farmChoice from "./templates/farm_choice.json";
import proAnswer from "./templates/pro_answer.json";

/**
 * 학습 콘텐츠 표준양식 목록
 * - MODULE_GROUPS 드롭다운과 1:1 대응
 * - id: "{group}_{subtype}" 형식 (드롭다운 value에서 자동 추출)
 * - contentType: DB에 등록되는 실제 콘텐츠 타입 키
 */
export const LEARNING_TEMPLATES = [
  // 일일 퀴즈
  { id: "dailyQuiz_quiz", contentType: "DAILY_QUIZ", title: "일일 퀴즈", moduleKey: "daily_quiz", content: dailyQuizQuiz },
  // 일일 독해
  { id: "dailyReading_training", contentType: "DAILY_READING", title: "일일 독해", moduleKey: "reading_training", content: readingTraining },
  // 농장 모드
  { id: "farm_vocab", contentType: "VOCAB_BASIC", title: "어휘 학습", moduleKey: "worksheet_quiz", content: vocabTraining },
  { id: "farm_reading", contentType: "READING_NONFICTION", title: "독해 훈련", moduleKey: "reading_training", content: readingTraining },
  { id: "farm_story", contentType: "READING_LITERATURE", title: "이야기 농장", moduleKey: "reading_training", content: readingTraining },
  { id: "farm_classic", contentType: "READING_LITERATURE", title: "고전 농장", moduleKey: "reading_training", content: readingTraining },
  { id: "farm_content", contentType: "CONTENT_PDF_QUIZ", title: "내용 숙지 농장", moduleKey: "content_pdf", content: farmContent },
  { id: "farm_grammar_wf", contentType: "GRAMMAR_WORD_FORMATION", title: "문법 - 단어 형성", moduleKey: "word_formation", content: farmGrammarWf },
  { id: "farm_grammar_ss", contentType: "GRAMMAR_SENTENCE_STRUCTURE", title: "문법 - 문장 짜임", moduleKey: "sentence_structure", content: farmGrammarSs },
  { id: "farm_grammar_pc", contentType: "GRAMMAR_PHONEME_CHANGE", title: "문법 - 음운 변동", moduleKey: "phoneme_change", content: farmGrammarPc },
  { id: "farm_grammar_pos", contentType: "GRAMMAR_POS", title: "문법 - 품사", moduleKey: "worksheet_quiz", content: farmGrammarPos },
  { id: "farm_background", contentType: "BACKGROUND_KNOWLEDGE_QUIZ", title: "배경지식 학습", moduleKey: "worksheet_quiz", content: backgroundQuiz },
  { id: "farm_concept", contentType: "LANGUAGE_CONCEPT_QUIZ", title: "국어 개념 농장", moduleKey: "worksheet_quiz", content: farmConcept },
  { id: "farm_logic", contentType: "LOGIC_REASONING_QUIZ", title: "논리사고력 학습", moduleKey: "logic_reasoning", content: farmLogic },
  { id: "farm_writing", contentType: "WRITING_DESCRIPTIVE", title: "서술형 농장", moduleKey: "worksheet_quiz", content: farmWriting },
  { id: "farm_choice", contentType: "CHOICE_JUDGEMENT", title: "선택지 판별 농장", moduleKey: "choice_judgement", content: farmChoice },
  // 프로 모드
  { id: "pro_reading", contentType: "PRO_READING", title: "프로 독해", moduleKey: "reading_training", content: readingTraining },
  { id: "pro_vocab", contentType: "PRO_VOCAB", title: "프로 어휘", moduleKey: "worksheet_quiz", content: vocabTraining },
  { id: "pro_background", contentType: "PRO_BACKGROUND", title: "프로 배경지식", moduleKey: "worksheet_quiz", content: backgroundQuiz },
  { id: "pro_logic", contentType: "PRO_LOGIC", title: "프로 논리사고력", moduleKey: "logic_reasoning", content: farmLogic },
  { id: "pro_answer", contentType: "PRO_ANSWER", title: "프로 모범답안/정답해설", moduleKey: "worksheet_quiz", content: proAnswer },
];
