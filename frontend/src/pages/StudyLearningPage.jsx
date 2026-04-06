import { useEffect, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EngineShell from "../engine/core/EngineShell";
import { apiGet } from "../utils/api";

/**
 * 내용 숙지 학습 페이지
 * - URL: /study-learning/:contentId
 * - /v1/learning/study/contents/{id} 호출하여 마크다운 본문 수신
 * - EngineShell + StudyContentModule 렌더링
 * - farmLogId는 모듈 자체에서 관리하므로 EngineShell에 전달하지 않음
 *   (EngineShell.finish가 farm/complete를 호출하지 않도록)
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
    apiGet(`/v1/learning/study/contents/${contentId}`)
      .then((data) => {
        setContent({
          contentId: data.id,
          title: data.title,
          targetLevel: data.levelId,
          area: "BACKGROUND",
          subArea: "STUDY_CONTENT",
          contentType: "STUDY_CONTENT",
          timeLimitSec: 600,
          seedReward: { count: 3 },
          payload: {
            markdown: data.markdown,
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
    return (
      <div className="lr-loading">
        <p>학습 데이터를 불러오는 중...</p>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="lr-loading">
        <h2>학습 데이터를 불러올 수 없습니다.</h2>
        {error && <p className="lr-error">{error}</p>}
        <button type="button" onClick={() => navigate("/farm-mode/content")}>
          돌아가기
        </button>
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
