import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import EngineShell from "../engine/core/EngineShell";
import { FARM_MAP } from "../data/learning/learningCatalog";
import { apiGet, apiPost } from "../utils/api";

// (resolvedStartPage / isContentPdf 분기는 V0046에서 제거됨)

/* contentType → moduleKey 매핑 (DB에 moduleKey가 없는 경우 fallback)
 * AdminContentPage의 매핑과 동일하게 유지해야 함.
 */
const CONTENT_TYPE_TO_MODULE = {
  // 어휘
  VOCAB_BASIC: "worksheet_quiz",
  PRO_VOCAB: "worksheet_quiz",
  // 독해
  READING_NONFICTION: "reading_training",
  READING_LITERATURE: "reading_training",
  DAILY_READING: "reading_training",
  PRO_READING: "reading_training",
  // 내용 숙지
  CONTENT_PDF: "study_content",
  CONTENT_PDF_QUIZ: "study_content",
  STUDY_CONTENT: "study_content",
  // 선택지 판별
  CHOICE_JUDGEMENT: "choice_judgement",
  // 문법
  GRAMMAR_PHONEME_CHANGE: "phoneme_change",
  GRAMMAR_WORD_FORMATION: "word_formation",
  GRAMMAR_SENTENCE_STRUCTURE: "sentence_structure",
  GRAMMAR_POS: "morpheme_analysis",
  MORPHEME_ANALYSIS: "morpheme_analysis",
  // 배경지식
  BACKGROUND_KNOWLEDGE: "background_knowledge",
  BACKGROUND_KNOWLEDGE_QUIZ: "background_knowledge",
  PRO_BACKGROUND: "background_knowledge",
  // 국어 개념
  LANGUAGE_CONCEPT: "worksheet_quiz",
  LANGUAGE_CONCEPT_QUIZ: "worksheet_quiz",
  // 논리 사고력
  LOGIC_REASONING: "logic_reasoning",
  LOGIC_REASONING_QUIZ: "worksheet_quiz",
  PRO_LOGIC: "logic_reasoning",
  // 일일 퀴즈
  DAILY_QUIZ: "daily_quiz",
  // 글쓰기/테스트/정답
  WRITING_DESCRIPTIVE: "worksheet_quiz",
  PRO_TEST: "worksheet_quiz",
  PRO_ANSWER: "answer_key",
};
function resolveModuleKey(contentType) {
  if (!contentType) return null;
  return CONTENT_TYPE_TO_MODULE[contentType] || CONTENT_TYPE_TO_MODULE[contentType.toUpperCase()] || null;
}

function LearningRunnerPage() {
  const { learningId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [dbMeta, setDbMeta] = useState(null);
  const learning = dbMeta;
  const [farmLogId, setFarmLogId] = useState(null);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignmentSubmitted, setAssignmentSubmitted] = useState(false);

  const assignmentId = searchParams.get("assignmentId");
  const proChapter = searchParams.get("proChapter");
  const proItemId = searchParams.get("proItemId");

  const exitPath = useMemo(() => {
    if (proChapter) return `/pro-mode/chapter/${proChapter}`;
    if (assignmentId) return "/assignments";
    // DB 응답의 area 필드로 농장 직접 결정
    const area = learning?.area;
    if (area && FARM_MAP[area]) return `/farm-mode/${area}`;
    return "/farm-mode";
  }, [learning, assignmentId, proChapter]);

  // 항상 DB API로 콘텐츠 로드
  useEffect(() => {
    if (!learningId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    apiGet(`/v1/learning/content/${learningId}`)
      .then((data) => {
        setDbMeta({
          id: learningId,
          contentId: data.contentId || learningId,
          contentType: data.contentType || data.content_type,
          moduleKey: data.module_key || data.moduleKey || data.content?.moduleKey || resolveModuleKey(data.content_type || data.contentType) || "worksheet_quiz",
          title: data.title,
          area: data.area,
          jsonPath: null,
        });
        // payload 키가 없는 콘텐츠(문법 등)는 content 자체를 payload로 래핑
        const raw = data.content || {};
        const wrapped = raw.payload ? raw : { ...raw, payload: raw };
        setContent(wrapped);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [learningId]);

  // 학습 시작 로그
  useEffect(() => {
    if (!learning) return;
    apiPost("/v1/learning/farm/start", {
      content_id: learning.contentId || learningId,
      content_type: learning.contentType,
    })
      .then((res) => setFarmLogId(res.log_id ?? res.logId))
      .catch((e) => console.error(e));
  }, [learningId, learning]);


  // 학습 종료 시 과제 자동 제출 + 프로 모드 완료
  const handleExit = useCallback(() => {
    if (proItemId) {
      apiPost("/v1/pro/progress/complete", { itemId: proItemId }).catch((e) => console.error(e));
    }
    if (assignmentId && !assignmentSubmitted) {
      setAssignmentSubmitted(true);
      apiPost(`/v1/assignments/${assignmentId}/submit`, {
        content: {
          completedAt: new Date().toISOString(),
          contentId: learning?.contentId || learningId,
        },
      }).catch((e) => console.error(e));
    }
    navigate(exitPath);
  }, [assignmentId, assignmentSubmitted, exitPath, navigate, learning, learningId, proItemId]);

  if (!learning && !loading) {
    return (
      <div className="lr-loading">
        <h1>학습을 찾을 수 없습니다.</h1>
        <button type="button" onClick={() => navigate("/farm-mode")}>홈으로</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="lr-loading">
        <p>학습 데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="lr-loading">
        <h2>학습 데이터를 불러올 수 없습니다.</h2>
        <p className="lr-error">{error}</p>
        <button type="button" onClick={() => navigate(exitPath)}>돌아가기</button>
      </div>
    );
  }

  return (
    <EngineShell
      content={content}
      moduleKey={learning.moduleKey}
      onExit={handleExit}
      farmLogId={farmLogId}
    />
  );
}

export default LearningRunnerPage;
