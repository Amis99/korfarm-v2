import { useNavigate } from "react-router-dom";
import EngineShell from "../engine/core/EngineShell";
import useDailyContent from "../hooks/useDailyContent";

function DailyQuizPage() {
  const navigate = useNavigate();
  const { content, loading, error, farmLogId } = useDailyContent({
    folder: "daily-quiz",
    contentType: "DAILY_QUIZ",
    errorLabel: "퀴즈",
  });

  if (loading) {
    return (
      <div className="lr-loading">
        <p>일일 퀴즈를 불러오는 중...</p>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="lr-loading">
        <h2>퀴즈를 불러올 수 없습니다</h2>
        <p>{error || "데이터가 없습니다."}</p>
        <button type="button" onClick={() => navigate("/start")}>홈으로 돌아가기</button>
      </div>
    );
  }

  const resolvedModuleKey = content?.payload?.moduleKey || "daily_quiz";

  return (
    <EngineShell
      content={content}
      moduleKey={resolvedModuleKey}
      onExit={() => navigate("/start")}
      farmLogId={farmLogId}
    />
  );
}

export default DailyQuizPage;
