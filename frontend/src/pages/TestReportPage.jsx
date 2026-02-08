import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiGet } from "../utils/api";
import { apiGet as adminApiGet } from "../utils/adminApi";
import "../styles/test-storage.css";

function TestReportPage() {
  const { testId } = useParams();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("studentId");
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) return;
    const fetchFn = studentId
      ? () => adminApiGet(`/v1/admin/test-papers/${testId}/submissions/${studentId}/report`)
      : () => apiGet(`/v1/test-storage/${testId}/report`);
    fetchFn()
      .then(setReport)
      .catch(() => navigate(studentId ? `/admin/tests/${testId}` : `/tests/${testId}`))
      .finally(() => setLoading(false));
  }, [isLoggedIn, testId, studentId, navigate]);

  if (loading) return <div className="ts-page ts-center"><p>불러오는 중...</p></div>;
  if (!report) return null;

  const domains = Object.entries(report.domainScores || {});

  return (
    <div className="ts-page ts-report-page">
      <div className="ts-back-row ts-no-print">
        <Link to={studentId ? `/admin/tests/${testId}` : `/tests/${testId}`} className="ts-back-link">
          <span className="material-symbols-outlined">arrow_back</span> {studentId ? "시험 관리" : "시험 상세"}
        </Link>
      </div>

      <div className="ts-report-header">
        <h1>성적표</h1>
        <h2>{report.testTitle}</h2>
        {user && <p className="ts-report-student">{user.name}</p>}
      </div>

      <div className="ts-report-summary">
        <div className="ts-summary-card ts-summary-primary">
          <span className="ts-summary-label">총점</span>
          <strong className="ts-summary-value">{report.score} <small>/ {report.totalPoints}</small></strong>
        </div>
        <div className="ts-summary-card">
          <span className="ts-summary-label">정답 수</span>
          <strong className="ts-summary-value">{report.correctCount} <small>/ {report.totalQuestions}</small></strong>
        </div>
        <div className="ts-summary-card">
          <span className="ts-summary-label">정답률</span>
          <strong className="ts-summary-value">{report.accuracy}%</strong>
        </div>
      </div>

      {domains.length > 0 && (
        <section className="ts-report-section">
          <h3>영역별 점수</h3>
          <table className="ts-table">
            <thead>
              <tr>
                <th>영역</th>
                <th>득점</th>
                <th>만점</th>
                <th>정답</th>
                <th>정답률</th>
              </tr>
            </thead>
            <tbody>
              {domains.map(([domain, ds]) => (
                <tr key={domain}>
                  <td>{domain}</td>
                  <td>{ds.score}</td>
                  <td>{ds.maxScore}</td>
                  <td>{ds.correct}/{ds.total}</td>
                  <td>{ds.total > 0 ? Math.round((ds.correct / ds.total) * 100) : 0}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section className="ts-report-section">
        <h3>문항별 결과</h3>
        <table className="ts-table ts-table-detail">
          <thead>
            <tr>
              <th>번호</th>
              <th>영역</th>
              <th>유형</th>
              <th>내 답</th>
              <th>정답</th>
              <th>배점</th>
              <th>결과</th>
            </tr>
          </thead>
          <tbody>
            {(report.details || []).map(d => (
              <tr key={d.questionNumber} className={d.isCorrect ? "" : "ts-row-wrong"}>
                <td>{d.questionNumber}</td>
                <td>{d.domain || "-"}</td>
                <td>{d.type}</td>
                <td>{d.myAnswer || "-"}</td>
                <td>{d.correctAnswer}</td>
                <td>{d.points}</td>
                <td>
                  <span className={`ts-result-mark ${d.isCorrect ? "ts-correct" : "ts-wrong"}`}>
                    {d.isCorrect ? "O" : "X"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <div className="ts-report-actions ts-no-print">
        <button className="ts-btn ts-btn-outline" onClick={() => window.print()}>
          <span className="material-symbols-outlined">print</span>
          인쇄
        </button>
        <button className="ts-btn ts-btn-outline" onClick={() => navigate(`/tests/${testId}/wrong-note${studentId ? `?studentId=${studentId}` : ""}`)}>
          <span className="material-symbols-outlined">error_outline</span>
          오답 노트
        </button>
        <Link to={studentId ? `/admin/tests/${testId}` : "/tests"} className="ts-btn ts-btn-outline">
          {studentId ? "시험 관리로" : "목록으로"}
        </Link>
      </div>
    </div>
  );
}

export default TestReportPage;
