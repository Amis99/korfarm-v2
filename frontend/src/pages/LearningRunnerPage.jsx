import { useNavigate, useParams } from "react-router-dom";
import EngineShell from "../engine/core/EngineShell";
import { getLearningById } from "../data/learning/learningCatalog";

function LearningRunnerPage() {
  const { learningId } = useParams();
  const navigate = useNavigate();
  const learning = getLearningById(learningId);

  if (!learning) {
    return (
      <div style={{ padding: "40px" }}>
        <h1>학습을 찾을 수 없습니다.</h1>
        <button type="button" onClick={() => navigate("/learning")}>홈으로</button>
      </div>
    );
  }

  return (
    <EngineShell
      content={learning.content}
      moduleKey={learning.moduleKey}
      onExit={() => navigate("/learning")}
    />
  );
}

export default LearningRunnerPage;
