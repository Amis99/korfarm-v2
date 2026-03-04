import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiGet } from "../utils/api";
import { apiGet as adminApiGet } from "../utils/adminApi";
import DomainRadarChart from "../components/test-report/DomainRadarChart";
import DomainDoughnutChart from "../components/test-report/DomainDoughnutChart";
import { getDomainColor } from "../components/test-report/domainColors";
import "../styles/test-storage.css";

function TestReportPage() {
  const { testId } = useParams();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("studentId");
  const fromDiagnostic = searchParams.get("from") === "diagnostic";
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  const isParent = user?.roles?.includes("PARENT");

  useEffect(() => {
    if (!isLoggedIn) return;
    let fetchFn;
    if (isParent && studentId) {
      // 학부모: 자녀 성적표 조회 전용 API
      fetchFn = () => apiGet(`/v1/parents/children/${studentId}/test-storage/${testId}/report`);
    } else if (studentId) {
      // 관리자: 학생 성적표 조회
      fetchFn = () => adminApiGet(`/v1/admin/test-papers/${testId}/submissions/${studentId}/report`);
    } else {
      // 학생 본인: 자기 성적표 조회
      fetchFn = () => apiGet(`/v1/test-storage/${testId}/report`);
    }
    fetchFn()
      .then(setReport)
      .catch(() => navigate(studentId ? `/admin/tests/${testId}` : `/tests/${testId}`))
      .finally(() => setLoading(false));
  }, [isLoggedIn, testId, studentId, navigate, isParent]);

  // 객관식/서술형 분리 집계
  const typeStats = useMemo(() => {
    if (!report?.details) return { obj: { score: 0, total: 0 }, sub: { score: 0, total: 0 } };
    const obj = { score: 0, total: 0 };
    const sub = { score: 0, total: 0 };
    for (const d of report.details) {
      const earned = d.earnedPoints != null ? d.earnedPoints : (d.isCorrect ? d.points : 0);
      const isSubjective = d.type === "서술형" || d.type === "서술";
      if (isSubjective) {
        sub.score += earned;
        sub.total += d.points;
      } else {
        obj.score += earned;
        obj.total += d.points;
      }
    }
    return { obj, sub };
  }, [report]);

  if (loading) return <div className="ts-page ts-center"><p>불러오는 중...</p></div>;
  if (!report) return null;

  const domains = Object.entries(report.domainScores || {});

  return (
    <div className="ts-page ts-report-page">
      <div className="ts-back-row ts-no-print">
        <Link to={studentId ? `/admin/tests/${testId}` : fromDiagnostic ? "/diagnostic/print" : `/tests/${testId}`} className="ts-back-link">
          <span className="material-symbols-outlined">arrow_back</span> {studentId ? "시험 관리" : fromDiagnostic ? "진단 테스트" : "시험 상세"}
        </Link>
      </div>

      <div className="ts-report-header">
        <h1>성적표</h1>
        <h2>{report.testTitle}</h2>
        {user && <p className="ts-report-student">{user.name}</p>}
      </div>

      {/* 요약 카드 5개 */}
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
        <div className="ts-summary-card">
          <span className="ts-summary-label">객관식</span>
          <strong className="ts-summary-value">{typeStats.obj.score} <small>/ {typeStats.obj.total}</small></strong>
        </div>
        <div className="ts-summary-card">
          <span className="ts-summary-label">서술형</span>
          <strong className="ts-summary-value">{typeStats.sub.score} <small>/ {typeStats.sub.total}</small></strong>
        </div>
      </div>

      {/* 레이더 + 도넛 차트 */}
      {domains.length >= 2 && (
        <div className="ts-charts-row">
          <DomainRadarChart domainScores={report.domainScores} />
          <DomainDoughnutChart domainScores={report.domainScores} />
        </div>
      )}

      {/* 영역별 점수 테이블 + 인라인 막대 */}
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
              {domains.map(([domain, ds]) => {
                const rate = ds.total > 0 ? Math.round((ds.correct / ds.total) * 100) : 0;
                const color = getDomainColor(domain);
                return (
                  <tr key={domain}>
                    <td>{domain}</td>
                    <td>{ds.score}</td>
                    <td>{ds.maxScore}</td>
                    <td>{ds.correct}/{ds.total}</td>
                    <td>
                      <div className="ts-domain-bar-cell">
                        <div className="ts-domain-bar-bg">
                          <div
                            className="ts-domain-bar-fill"
                            style={{ width: `${rate}%`, backgroundColor: color.main }}
                          />
                        </div>
                        <span className="ts-domain-bar-label">{rate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
        <button className="ts-btn ts-btn-outline" onClick={() => navigate(`/tests/${testId}/wrong-note${studentId ? `?studentId=${studentId}` : fromDiagnostic ? "?from=diagnostic" : ""}`)}>
          <span className="material-symbols-outlined">error_outline</span>
          오답 노트
        </button>
        <Link to={studentId ? `/admin/tests/${testId}` : fromDiagnostic ? "/diagnostic/print" : "/tests"} className="ts-btn ts-btn-outline">
          {studentId ? "시험 관리로" : fromDiagnostic ? "진단 테스트로" : "목록으로"}
        </Link>
        {fromDiagnostic && (
          <Link to="/start" className="ts-btn ts-btn-primary">
            학습 시작하기
          </Link>
        )}
      </div>
    </div>
  );
}

export default TestReportPage;
