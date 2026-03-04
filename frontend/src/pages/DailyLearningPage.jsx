import { useNavigate } from "react-router-dom";
import "../styles/start.css";

function DailyLearningPage() {
  const navigate = useNavigate();

  return (
    <div className="start-page">
      <div className="start-daily-shell">
        <h1>일일 학습</h1>
        <p>오늘의 학습을 선택하세요.</p>

        <div className="start-daily-grid">
          <div
            className="start-card"
            onClick={() => navigate("/daily-quiz")}
          >
            <span className="badge">일일 퀴즈</span>
            <h3>일일 퀴즈</h3>
            <p>총 10문제 도전! 하루 첫 제출 시 씨앗 지급</p>
          </div>

          <div
            className="start-card"
            onClick={() => navigate("/daily-reading")}
          >
            <span className="badge badge-reading">일일 독해</span>
            <h3>일일 독해</h3>
            <p>지문 읽는 힘을 키워요. 제출할 때마다 씨앗 지급</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DailyLearningPage;
