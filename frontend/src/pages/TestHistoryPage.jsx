import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiGet } from "../utils/api";
import "../styles/test-storage.css";

/* wrap=false → 내부 콘텐츠만 반환 (TestStoragePage 탭에서 사용) */
export function TestHistoryContent({ studentId: externalStudentId }) {
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const studentId = externalStudentId || searchParams.get("studentId");
  const isParent = user?.roles?.includes("PARENT");
  const isViewingChild = isParent && studentId;

  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) return;

    if (isViewingChild) {
      apiGet(`/v1/parents/children/${studentId}/test-storage/history`)
        .then((data) => setHistory(data || []))
        .catch(() => setHistory([]))
        .finally(() => setLoading(false));
    } else {
      apiGet("/v1/test-storage/history")
        .then(setHistory)
        .catch(() => setHistory([]))
        .finally(() => setLoading(false));
    }
  }, [isLoggedIn, isViewingChild, studentId]);

  if (loading) {
    return <div className="ts-center"><p>불러오는 중...</p></div>;
  }

  if (history.length === 0) {
    return <div className="ts-center"><p>응시한 시험이 없습니다.</p></div>;
  }

  return (
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
            onClick={() => navigate(`/tests/${h.testId}/report${isViewingChild ? `?studentId=${studentId}` : ""}`)}
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
  );
}

function TestHistoryPage() {
  const { isLoggedIn, user } = useAuth();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("studentId");
  const isParent = user?.roles?.includes("PARENT");
  const isViewingChild = isParent && studentId;
  const [childName, setChildName] = useState("");

  useEffect(() => {
    if (isViewingChild) {
      apiGet(`/v1/parents/children/${studentId}/profile`)
        .then((profile) => setChildName(profile?.name || "자녀"))
        .catch(() => {});
    }
  }, [isViewingChild, studentId]);

  const backLink = isViewingChild ? `/tests?studentId=${studentId}` : "/tests";

  return (
    <div className="ts-page">
      <div className="ts-back-row">
        <Link to={backLink} className="ts-back-link">
          <span className="material-symbols-outlined">arrow_back</span> 시험 목록
        </Link>
      </div>

      <header className="ts-header">
        <h1>{isViewingChild ? `${childName}의 응시 이력` : "응시 이력"}</h1>
      </header>

      <TestHistoryContent studentId={studentId} />
    </div>
  );
}

export default TestHistoryPage;
