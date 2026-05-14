import { useNavigate } from "react-router-dom";
import RichText from "../../utils/RichText";

const CONTENT_TYPE_LABELS = {
  DAILY_QUIZ: "일일 퀴즈",
  DAILY_READING: "일일 독해",
  STUDY_CONTENT: "학습 콘텐츠",
  BACKGROUND_KNOWLEDGE: "배경지식",
  BACKGROUND_KNOWLEDGE_QUIZ: "배경지식 퀴즈",
  LANGUAGE_CONCEPT: "국어 개념",
  LANGUAGE_CONCEPT_QUIZ: "국어 개념 퀴즈",
  LOGIC_REASONING: "논리 사고력",
  LOGIC_REASONING_QUIZ: "논리 사고력 퀴즈",
  CHOICE_JUDGEMENT: "선택지 판별",
  WRITING_DESCRIPTIVE: "서술형 글쓰기",
  VOCAB_BASIC: "어휘",
  VOCAB_DICTIONARY: "어휘 사전",
  GRAMMAR_WORD_FORMATION: "문법 — 단어",
  GRAMMAR_SENTENCE_STRUCTURE: "문법 — 문장",
  GRAMMAR_PHONEME_CHANGE: "문법 — 음운",
  GRAMMAR_POS: "문법 — 품사",
  READING_NONFICTION: "독해 — 비문학",
  READING_LITERATURE: "독해 — 문학",
  PRO_VOCAB: "프로 어휘",
  PRO_READING: "프로 독해",
  PRO_BACKGROUND: "프로 배경지식",
  PRO_LOGIC: "프로 논리",
  PRO_ANSWER: "프로 정답·해설",
};

function LearningRecommendation({ report }) {
  const navigate = useNavigate();
  const level = report.recommendedLevel;
  const weakAreas = report.weakCompetencies || [];
  const aiSummary = report.aiSummary;
  const contents = report.recommendedContents || [];

  return (
    <div className="diag-report-section">
      <h2>추천 학습 방향</h2>
      <div className="learning-rec-card">
        {level && (
          <div className="rec-level">
            <span className="rec-level-label">추천 학습 레벨</span>
            <span className="rec-level-value">{level.label}</span>
          </div>
        )}

        {aiSummary && (
          <div className="rec-ai-summary">
            <div className="rec-ai-summary-head">
              <span className="material-symbols-outlined">auto_awesome</span>
              <span>AI 종합 분석</span>
            </div>
            <div className="rec-ai-summary-body">
              <RichText>{aiSummary}</RichText>
            </div>
          </div>
        )}

        {weakAreas.length > 0 && (
          <div className="rec-weak-areas">
            <div className="rec-weak-title">우선 보강 영역</div>
            <ul>
              {weakAreas.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {contents.length > 0 ? (
          <div className="rec-contents">
            <div className="rec-contents-title">상세 추천 학습 콘텐츠</div>
            <div className="rec-contents-grid">
              {contents.map((c) => (
                <button
                  key={c.contentId}
                  type="button"
                  className="rec-content-card"
                  onClick={() => navigate(`/learning/${c.contentId}`)}
                >
                  <div className="rec-content-type">
                    {CONTENT_TYPE_LABELS[c.contentType] || c.contentType}
                  </div>
                  <div className="rec-content-title">{c.title}</div>
                  <div className="rec-content-meta">
                    {[c.area, c.subArea].filter(Boolean).join(" · ")}
                    {c.levelId && <span className="rec-content-level"> · {c.levelId}</span>}
                  </div>
                  {c.reason && <div className="rec-content-reason">{c.reason}</div>}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="rec-notice">
            현재 약점 영역에 맞는 추천 콘텐츠가 없습니다. 다른 학습으로 데이터가 더 쌓이면 자동 추천됩니다.
          </div>
        )}
      </div>
    </div>
  );
}

export default LearningRecommendation;
