import { useNavigate } from "react-router-dom";
import "../styles/start.css";

function DailyLearningPage() {
  const navigate = useNavigate();

  return (
    <div className="start-page" style={{ minHeight: "100vh" }}>
      <div style={{ maxWidth: 500, margin: "0 auto", padding: "60px 16px" }}>
        <h1 style={{ textAlign: "center", marginBottom: 8 }}>일일 학습</h1>
        <p style={{ textAlign: "center", color: "#8a7468", marginBottom: 32 }}>
          오늘의 학습을 선택하세요.
        </p>

        <div style={{ display: "grid", gap: 16 }}>
          <div
            className="start-card"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/daily-quiz")}
          >
            <span className="badge">일일 퀴즈</span>
            <h3>일일 퀴즈</h3>
            <p>총 10문제 도전! 하루 첫 제출 시 씨앗 지급</p>
          </div>

          <div
            className="start-card"
            style={{ cursor: "pointer" }}
            onClick={() => navigate("/daily-reading")}
          >
            <span className="badge" style={{ background: "#81d4fa" }}>일일 독해</span>
            <h3>일일 독해</h3>
            <p>지문 읽는 힘을 키워요. 제출할 때마다 씨앗 지급</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DailyLearningPage;
