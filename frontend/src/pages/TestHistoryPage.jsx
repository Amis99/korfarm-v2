import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiGet } from "../utils/api";
import "../styles/test-storage.css";

function TestHistoryPage() {
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) return;
    apiGet("/v1/test-storage/history")
      .then(setHistory)
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, [isLoggedIn]);

  return (
    <div className="ts-page">
      <div className="ts-back-row">
        <Link to="/tests" className="ts-back-link">
          <span className="material-symbols-outlined">arrow_back</span> 시험 목록
        </Link>
      </div>

      <header className="ts-header">
        <h1>응시 이력</h1>
      </header>

      {loading ? (
        <div className="ts-center"><p>불러오는 중...</p></div>
      ) : history.length === 0 ? (
        <div className="ts-center"><p>응시한 시험이 없습니다.</p></div>
      ) : (
        <table className="ts-table">
          <thead>
            <tr>
              <th>시험명</th>
              <th>시행일</th>
              <th>점수</th>
              <th>정답률</th>
              <th>제출일</th>
            </tr>
          </thead>
          <tbody>
            {history.map(h => (
              <tr
                key={h.testId}
                className="ts-clickable-row"
                onClick={() => navigate(`/tests/${h.testId}/report`)}
              >
                <td>{h.testTitle}</td>
                <td>{h.examDate || "-"}</td>
                <td>{h.score} / {h.totalPoints}</td>
                <td>{h.accuracy}%</td>
                <td>{h.submittedAt ? new Date(h.submittedAt).toLocaleDateString("ko-KR") : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default TestHistoryPage;
