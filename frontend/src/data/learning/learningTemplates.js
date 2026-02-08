import dailyQuizQuiz from "./templates/dailyQuiz_quiz.json";
import dailyReadingIntensive from "./templates/dailyReading_intensive.json";
import dailyReadingTraining from "./templates/dailyReading_training.json";
import dailyReadingRecall from "./templates/dailyReading_recall.json";
import dailyReadingConfirm from "./templates/dailyReading_confirm.json";
import farmVocab from "./templates/farm_vocab.json";
import farmReading from "./templates/farm_reading.json";
import farmContent from "./templates/farm_content.json";
import farmGrammarWf from "./templates/farm_grammar_wf.json";
import farmGrammarSs from "./templates/farm_grammar_ss.json";
import farmGrammarPc from "./templates/farm_grammar_pc.json";
import farmGrammarPos from "./templates/farm_grammar_pos.json";
import farmBackground from "./templates/farm_background.json";
import farmConcept from "./templates/farm_concept.json";
import farmLogic from "./templates/farm_logic.json";
import farmWriting from "./templates/farm_writing.json";
import farmChoice from "./templates/farm_choice.json";

export const LEARNING_TEMPLATES = [
  { id: "dailyQuiz_quiz", title: "일일 퀴즈 - 공통 퀴즈형", moduleKey: "worksheet_quiz", content: dailyQuizQuiz },
  { id: "dailyReading_intensive", title: "일일 독해 - 정독 훈련", moduleKey: "reading_intensive", content: dailyReadingIntensive },
  { id: "dailyReading_training", title: "일일 독해 - 독해 훈련", moduleKey: "reading_training", content: dailyReadingTraining },
  { id: "dailyReading_recall", title: "일일 독해 - 복기 훈련", moduleKey: "recall_cards", content: dailyReadingRecall },
  { id: "dailyReading_confirm", title: "일일 독해 - 확인 학습", moduleKey: "confirm_click", content: dailyReadingConfirm },
  { id: "farm_vocab", title: "어휘 기본 학습", moduleKey: "worksheet_quiz", content: farmVocab },
  { id: "farm_reading", title: "비문학 독해 훈련", moduleKey: "reading_training", content: farmReading },
  { id: "farm_content", title: "내용 숙지 학습", moduleKey: "reading_training", content: farmContent },
  { id: "farm_grammar_wf", title: "단어 형성 분석", moduleKey: "word_formation", content: farmGrammarWf },
  { id: "farm_grammar_ss", title: "문장의 짜임 분석", moduleKey: "sentence_structure", content: farmGrammarSs },
  { id: "farm_grammar_pc", title: "음운 변동 분석", moduleKey: "phoneme_change", content: farmGrammarPc },
  { id: "farm_grammar_pos", title: "품사 학습", moduleKey: "worksheet_quiz", content: farmGrammarPos },
  { id: "farm_background", title: "배경지식 퀴즈", moduleKey: "worksheet_quiz", content: farmBackground },
  { id: "farm_concept", title: "국어 개념 퀴즈", moduleKey: "worksheet_quiz", content: farmConcept },
  { id: "farm_logic", title: "논리사고력 문제", moduleKey: "worksheet_quiz", content: farmLogic },
  { id: "farm_writing", title: "서술형 연습", moduleKey: "worksheet_quiz", content: farmWriting },
  { id: "farm_choice", title: "선택지 판별 연습", moduleKey: "choice_judgement", content: farmChoice },
];
