import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiGet } from "../utils/api";
import ScoreTrendChart from "../components/test-report/ScoreTrendChart";
import Pagination from "../components/Pagination";
import usePagination from "../hooks/usePagination";
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

  // 통계 계산
  const stats = useMemo(() => {
    if (!history || history.length === 0) return null;
    const count = history.length;
    const avgScore = Math.round(history.reduce((s, h) => s + (h.score || 0), 0) / count);
    const avgAccuracy = Math.round(history.reduce((s, h) => s + (h.accuracy || 0), 0) / count);
    const maxScore = Math.max(...history.map(h => h.score || 0));
    return { count, avgScore, avgAccuracy, maxScore };
  }, [history]);

  const { page, setPage, totalPages, paged } = usePagination(history, 20);

  if (loading) {
    return <div className="ts-center"><p>불러오는 중...</p></div>;
  }

  if (history.length === 0) {
    return <div className="ts-center"><p>응시한 시험이 없습니다.</p></div>;
  }

  return (
    <>
      {/* 요약 카드 4개 */}
      {stats && (
        <div className="ts-report-summary">
          <div className="ts-summary-card ts-summary-primary">
            <span className="ts-summary-label">응시 횟수</span>
            <strong className="ts-summary-value">{stats.count}회</strong>
          </div>
          <div className="ts-summary-card">
            <span className="ts-summary-label">평균 점수</span>
            <strong className="ts-summary-value">{stats.avgScore}점</strong>
          </div>
          <div className="ts-summary-card">
            <span className="ts-summary-label">평균 정답률</span>
            <strong className="ts-summary-value">{stats.avgAccuracy}%</strong>
          </div>
          <div className="ts-summary-card">
            <span className="ts-summary-label">최고 점수</span>
            <strong className="ts-summary-value">{stats.maxScore}점</strong>
          </div>
        </div>
      )}

      {/* 점수 추이 차트 (2개 이상일 때만) */}
      {history.length >= 2 && (
        <div style={{ marginBottom: 28 }}>
          <ScoreTrendChart history={history} />
        </div>
      )}

      {/* 응시 이력 테이블 */}
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
          {paged.map(h => (
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
      <Pagination page={page} totalPages={totalPages} onChange={setPage} />
    </>
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
