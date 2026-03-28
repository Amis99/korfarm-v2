import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import EngineShell from "../engine/core/EngineShell";
import { FARM_MAP } from "../data/learning/learningCatalog";
import { apiGet, apiPost } from "../utils/api";

/* contentType → moduleKey 매핑 (DB에 moduleKey가 없는 경우 fallback) */
const CONTENT_TYPE_TO_MODULE = {
  PRO_READING: "reading_training",
  PRO_VOCAB: "worksheet_quiz",
  PRO_BACKGROUND: "background_knowledge",
  PRO_LOGIC: "logic_reasoning",
  PRO_ANSWER: "answer_key",
  BACKGROUND_KNOWLEDGE: "background_knowledge",
  BACKGROUND_KNOWLEDGE_QUIZ: "background_knowledge",
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
  const [resolvedStartPage, setResolvedStartPage] = useState(null);
  const [assignmentSubmitted, setAssignmentSubmitted] = useState(false);

  const startPageParam = searchParams.get("startPage");
  const assignmentId = searchParams.get("assignmentId");
  const proChapter = searchParams.get("proChapter");
  const proItemId = searchParams.get("proItemId");
  const isContentPdf = learning?.moduleKey === "content_pdf";

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
        setContent(data.content);
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

  // content_pdf인 경우 page-progress 조회하여 startPage 결정
  useEffect(() => {
    if (!isContentPdf || !learning) {
      setResolvedStartPage(null);
      return;
    }
    if (startPageParam) {
      setResolvedStartPage(parseInt(startPageParam, 10) || 1);
      return;
    }
    apiPost("/v1/learning/farm/page-progress", {
      contentId: learning.contentId,
    })
      .then((res) => {
        const lastPage = res?.data?.lastCompletedPage || res?.lastCompletedPage || 0;
        setResolvedStartPage(lastPage + 1);
      })
      .catch(() => {
        setResolvedStartPage(1);
      });
  }, [isContentPdf, learning, startPageParam]);

  // content에 _startPage, _farmLogId 주입
  const enrichedContent = useMemo(() => {
    if (!content) return content;
    if (!isContentPdf) return content;
    return {
      ...content,
      _startPage: resolvedStartPage || 1,
      _farmLogId: farmLogId,
    };
  }, [content, isContentPdf, resolvedStartPage, farmLogId]);

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

  if (loading || (isContentPdf && resolvedStartPage === null)) {
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
      content={enrichedContent}
      moduleKey={learning.moduleKey}
      onExit={handleExit}
      farmLogId={farmLogId}
    />
  );
}

export default LearningRunnerPage;
