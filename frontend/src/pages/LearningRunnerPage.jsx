import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import EngineShell from "../engine/core/EngineShell";
import { getLearningById, FARM_LIST } from "../data/learning/learningCatalog";
import { apiGet, apiPost } from "../utils/api";

function findFarmForContentType(contentType) {
  if (!contentType) return null;
  return FARM_LIST.find((farm) => farm.contentTypes.includes(contentType)) || null;
}

/* DB 콘텐츠 ID 여부 판단: content_ 접두사 */
function isDbContentId(id) {
  return id && id.startsWith("content_");
}

function LearningRunnerPage() {
  const { learningId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const staticLearning = getLearningById(learningId);
  // DB 콘텐츠인 경우 API에서 메타 로드
  const [dbMeta, setDbMeta] = useState(null);
  const learning = staticLearning || dbMeta;
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
    const farm = findFarmForContentType(learning?.contentType);
    return farm ? `/farm-mode/${farm.id}` : "/farm-mode";
  }, [learning, assignmentId, proChapter]);

  // DB 콘텐츠일 경우 API에서 콘텐츠 로드
  useEffect(() => {
    if (staticLearning) return; // 정적 카탈로그에 있으면 스킵
    if (!isDbContentId(learningId)) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    apiGet(`/v1/learning/content/${learningId}`)
      .then((data) => {
        // DB 콘텐츠에서 메타 + content 모두 추출
        setDbMeta({
          id: learningId,
          contentId: data.contentId || learningId,
          contentType: data.contentType || data.content_type,
          moduleKey: data.moduleKey || data.content?.moduleKey || data.contentType?.toLowerCase() || "worksheet_quiz",
          title: data.title,
          jsonPath: null,
        });
        setContent(data.content);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [learningId, staticLearning]);

  // 정적 콘텐츠: JSON fetch
  useEffect(() => {
    if (!staticLearning?.jsonPath) return;
    setLoading(true);
    setError(null);
    fetch(import.meta.env.BASE_URL + staticLearning.jsonPath.replace(/^\//, ""))
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        setContent(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [staticLearning]);

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

  if (!learning) {
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
