import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EngineShell from "../engine/core/EngineShell";
import { apiPost } from "../utils/api";

/**
 * 내용 숙지 학습 페이지 (V0076 페이지 단위, EngineShell 안에서 작동)
 * - URL: /study-learning/:contentId
 * - POST /v1/learning/study/contents/{id}/full → 페이지 + 정답 마스킹된 문제 + 세션 시작
 * - EngineShell + StudyContentModule (페이지 단위 흐름)
 */
function StudyLearningPage() {
  const { contentId } = useParams();
  const navigate = useNavigate();
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!contentId) return;
    setLoading(true);
    setError(null);
    apiPost(`/v1/learning/study/contents/${contentId}/full`, {})
      .then((data) => {
        setContent({
          contentId: data.id,
          title: data.title,
          targetLevel: data.levelId,
          area: data.area || "STUDY",
          subArea: data.subArea || "STUDY_CONTENT",
          contentType: "STUDY_CONTENT",
          timeLimitSec: 1200,
          seedReward: { count: 3 },
          payload: {
            sessionId: data.sessionId,
            logId: data.logId,
            pages: data.pages || [],
          },
        });
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [contentId]);

  const handleExit = useCallback(() => {
    navigate("/farm-mode/content");
  }, [navigate]);

  if (loading) {
    return <div className="lr-loading"><p>학습 데이터를 불러오는 중...</p></div>;
  }
  if (error || !content) {
    return (
      <div className="lr-loading">
        <h2>학습 데이터를 불러올 수 없습니다.</h2>
        {error && <p className="lr-error">{error}</p>}
        <button type="button" onClick={() => navigate("/farm-mode/content")}>돌아가기</button>
      </div>
    );
  }

  return (
    <EngineShell
      content={content}
      moduleKey="study_content"
      onExit={handleExit}
      farmLogId={null}
    />
  );
}

export default StudyLearningPage;
