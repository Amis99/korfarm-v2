import { useNavigate } from "react-router-dom";
import EngineShell from "../engine/core/EngineShell";
import useDailyContent from "../hooks/useDailyContent";

function DailyReadingPage() {
  const navigate = useNavigate();
  const { content, loading, error, farmLogId } = useDailyContent({
    folder: "daily-reading",
    contentType: "DAILY_READING",
    errorLabel: "독해",
  });

  if (loading) {
    return (
      <div className="lr-loading">
        <p>일일 독해를 불러오는 중...</p>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="lr-loading">
        <h2>독해 자료를 불러올 수 없습니다</h2>
        <p>{error || "데이터가 없습니다."}</p>
        <button type="button" onClick={() => navigate("/start")}>홈으로 돌아가기</button>
      </div>
    );
  }

  return (
    <EngineShell
      content={content}
      moduleKey="reading_training"
      onExit={() => navigate("/start")}
      farmLogId={farmLogId}
    />
  );
}

export default DailyReadingPage;
