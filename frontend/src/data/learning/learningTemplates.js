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

export const LEARNING_TEMPLATES = [
  { id: "dailyQuiz_quiz", title: "일일 퀴즈 - 공통 퀴즈형", moduleKey: "worksheet_quiz", content: dailyQuizQuiz },
  { id: "reading_training", title: "독해 훈련", moduleKey: "reading_training", content: readingTraining },
  { id: "vocab_training", title: "어휘 학습", moduleKey: "worksheet_quiz", content: vocabTraining },
  { id: "background_quiz", title: "배경지식 퀴즈", moduleKey: "worksheet_quiz", content: backgroundQuiz },
  { id: "farm_content", title: "내용 숙지 학습", moduleKey: "content_pdf", content: farmContent },
  { id: "farm_grammar_wf", title: "단어 형성 분석", moduleKey: "word_formation", content: farmGrammarWf },
  { id: "farm_grammar_ss", title: "문장의 짜임 분석", moduleKey: "sentence_structure", content: farmGrammarSs },
  { id: "farm_grammar_pc", title: "음운 변동 분석", moduleKey: "phoneme_change", content: farmGrammarPc },
  { id: "farm_grammar_pos", title: "품사 학습", moduleKey: "worksheet_quiz", content: farmGrammarPos },
  { id: "farm_concept", title: "국어 개념 퀴즈", moduleKey: "worksheet_quiz", content: farmConcept },
  { id: "farm_logic", title: "논리사고력 문제", moduleKey: "worksheet_quiz", content: farmLogic },
  { id: "farm_writing", title: "서술형 연습", moduleKey: "worksheet_quiz", content: farmWriting },
  { id: "farm_choice", title: "선택지 판별 연습", moduleKey: "choice_judgement", content: farmChoice },
  { id: "pro_reading", title: "프로 독해 모드", moduleKey: "reading_training", content: readingTraining },
  { id: "pro_vocab", title: "프로 어휘 학습", moduleKey: "worksheet_quiz", content: vocabTraining },
  { id: "pro_background", title: "프로 배경지식", moduleKey: "worksheet_quiz", content: backgroundQuiz },
  { id: "pro_logic", title: "프로 논리사고력", moduleKey: "logic_reasoning", content: farmLogic },
  { id: "pro_answer", title: "프로 모범답안/정답해설", moduleKey: "worksheet_quiz", content: proAnswer },
];
