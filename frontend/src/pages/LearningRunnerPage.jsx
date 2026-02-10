import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import EngineShell from "../engine/core/EngineShell";
import { getLearningById, FARM_LIST } from "../data/learning/learningCatalog";
import { apiPost } from "../utils/api";

function findFarmForContentType(contentType) {
  if (!contentType) return null;
  return FARM_LIST.find((farm) => farm.contentTypes.includes(contentType)) || null;
}

function LearningRunnerPage() {
  const { learningId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const learning = getLearningById(learningId);
  const [farmLogId, setFarmLogId] = useState(null);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resolvedStartPage, setResolvedStartPage] = useState(null);

  const startPageParam = searchParams.get("startPage");
  const isContentPdf = learning?.moduleKey === "content_pdf";

  const exitPath = useMemo(() => {
    const farm = findFarmForContentType(learning?.contentType);
    return farm ? `/farm-mode/${farm.id}` : "/farm-mode";
  }, [learning]);

  // JSON fetch
  useEffect(() => {
    if (!learning?.jsonPath) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    fetch(import.meta.env.BASE_URL + learning.jsonPath.replace(/^\//, ""))
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
  }, [learning]);

  // 학습 시작 로그
  useEffect(() => {
    if (!learning) return;
    apiPost("/v1/learning/farm/start", {
      content_id: learning.contentId,
      content_type: learning.contentType,
    })
      .then((res) => setFarmLogId(res.log_id ?? res.logId))
      .catch(() => {});
  }, [learningId]);

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
    // startPage 미지정 시 서버에서 마지막 진행 페이지 조회
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

  if (!learning) {
    return (
      <div style={{ padding: "40px" }}>
        <h1>학습을 찾을 수 없습니다.</h1>
        <button type="button" onClick={() => navigate("/farm-mode")}>홈으로</button>
      </div>
    );
  }

  if (loading || (isContentPdf && resolvedStartPage === null)) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <p>학습 데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2>학습 데이터를 불러올 수 없습니다.</h2>
        <p style={{ color: "#888" }}>{error}</p>
        <button type="button" onClick={() => navigate(exitPath)}>돌아가기</button>
      </div>
    );
  }

  return (
    <EngineShell
      content={enrichedContent}
      moduleKey={learning.moduleKey}
      onExit={() => navigate(exitPath)}
      farmLogId={farmLogId}
      preventAutoFinish={isContentPdf}
    />
  );
}

export default LearningRunnerPage;
