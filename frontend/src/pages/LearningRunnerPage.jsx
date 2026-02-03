import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import EngineShell from "../engine/core/EngineShell";
import { getLearningById, FARM_LIST } from "../data/learning/learningCatalog";
import { apiPost } from "../utils/api";

function findFarmForContentType(contentType) {
  if (!contentType) return null;
  return FARM_LIST.find((farm) => farm.contentTypes.includes(contentType)) || null;
}

function LearningRunnerPage() {
  const { learningId } = useParams();
  const navigate = useNavigate();
  const learning = getLearningById(learningId);
  const [farmLogId, setFarmLogId] = useState(null);
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (!learning) {
    return (
      <div style={{ padding: "40px" }}>
        <h1>학습을 찾을 수 없습니다.</h1>
        <button type="button" onClick={() => navigate("/farm-mode")}>홈으로</button>
      </div>
    );
  }

  if (loading) {
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
      content={content}
      moduleKey={learning.moduleKey}
      onExit={() => navigate(exitPath)}
      farmLogId={farmLogId}
    />
  );
}

export default LearningRunnerPage;
