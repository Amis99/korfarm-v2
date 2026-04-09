import WorksheetQuizModule from "./WorksheetQuizModule";
import ReadingTrainingModule from "./ReadingTrainingModule";
import ChoiceAnalysisModule from "./ChoiceAnalysisModule";
import PhonemeChangeModule from "./PhonemeChangeModule";
import WordFormationModule from "./WordFormationModule";
import SentenceStructureModule from "./SentenceStructureModule";
import StudyContentModule from "./StudyContentModule";
import AnswerKeyModule from "./AnswerKeyModule";
import BackgroundModule from "./BackgroundModule";
import LogicModule from "./LogicModule";
import DailyQuizModule from "./DailyQuizModule";
import MorphemeAnalysisModule from "./MorphemeAnalysisModule";

export const MODULES = {
  worksheet_quiz: WorksheetQuizModule,
  reading_training: ReadingTrainingModule,
  // 신 명칭
  choice_analysis: ChoiceAnalysisModule,
  // 옛 alias (호환성) — 새 출제는 choice_analysis 사용
  choice_judgement: ChoiceAnalysisModule,
  phoneme_change: PhonemeChangeModule,
  word_formation: WordFormationModule,
  sentence_structure: SentenceStructureModule,
  study_content: StudyContentModule,
  answer_key: AnswerKeyModule,
  background_knowledge: BackgroundModule,
  logic_reasoning: LogicModule,
  daily_quiz: DailyQuizModule,
  morpheme_analysis: MorphemeAnalysisModule,
};
