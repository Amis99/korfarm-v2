import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiGet } from "../utils/api";
import { apiGet as adminApiGet } from "../utils/adminApi";
import WrongNoteDomainChart from "../components/test-report/WrongNoteDomainChart";
import { getDomainColor } from "../components/test-report/domainColors";
import "../styles/test-storage.css";

function TestWrongNotePage() {
  const { testId } = useParams();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("studentId");
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const isParent = user?.roles?.includes("PARENT");

  useEffect(() => {
    if (!isLoggedIn) return;
    let fetchFn;
    if (isParent && studentId) {
      // 학부모: 자녀 오답 노트 조회 전용 API
      fetchFn = () => apiGet(`/v1/parents/children/${studentId}/test-storage/${testId}/wrong-note`);
    } else if (studentId) {
      // 관리자: 학생 오답 노트 조회
      fetchFn = () => adminApiGet(`/v1/admin/test-papers/${testId}/submissions/${studentId}/wrong-note`);
    } else {
      // 학생 본인: 자기 오답 노트 조회
      fetchFn = () => apiGet(`/v1/test-storage/${testId}/wrong-note`);
    }
    fetchFn()
      .then(setData)
      .catch(() => navigate(studentId ? `/admin/tests/${testId}` : `/tests/${testId}`))
      .finally(() => setLoading(false));
  }, [isLoggedIn, testId, studentId, navigate, isParent]);

  // 오답 통계 계산
  const wrongStats = useMemo(() => {
    if (!data?.wrongItems) return null;
    const items = data.wrongItems;
    const totalWrong = items.length;
    const lostPoints = items.reduce((sum, i) => sum + (i.points || 0), 0);
    const domainGroups = {};
    for (const item of items) {
      const d = item.domain || "기타";
      domainGroups[d] = (domainGroups[d] || 0) + 1;
    }
    const domainCount = Object.keys(domainGroups).length;
    const topDomain = Object.entries(domainGroups).sort((a, b) => b[1] - a[1])[0];
    return { totalWrong, lostPoints, domainGroups, domainCount, topDomain: topDomain?.[0] || "-" };
  }, [data]);

  if (loading) return <div className="ts-page ts-center"><p>불러오는 중...</p></div>;
  if (!data) return null;

  return (
    <div className="ts-page ts-report-page">
      <div className="ts-back-row ts-no-print">
        <Link to={studentId ? `/admin/tests/${testId}` : `/tests/${testId}`} className="ts-back-link">
          <span className="material-symbols-outlined">arrow_back</span> {studentId ? "시험 관리" : "시험 상세"}
        </Link>
      </div>

      <div className="ts-report-header">
        <h1>오답 노트</h1>
        <h2>{data.testTitle}</h2>
        {user && <p className="ts-report-student">{user.name}</p>}
      </div>

      {data.wrongItems.length === 0 ? (
        <div className="ts-center" style={{ marginTop: 40 }}>
          <p>틀린 문항이 없습니다. 만점입니다!</p>
        </div>
      ) : (
        <>
          {/* 요약 카드 4개 */}
          {wrongStats && (
            <div className="ts-report-summary">
              <div className="ts-summary-card ts-summary-primary">
                <span className="ts-summary-label">오답 수</span>
                <strong className="ts-summary-value">{wrongStats.totalWrong}문항</strong>
              </div>
              <div className="ts-summary-card">
                <span className="ts-summary-label">손실 배점</span>
                <strong className="ts-summary-value">{wrongStats.lostPoints}점</strong>
              </div>
              <div className="ts-summary-card">
                <span className="ts-summary-label">오답 영역 수</span>
                <strong className="ts-summary-value">{wrongStats.domainCount}개</strong>
              </div>
              <div className="ts-summary-card">
                <span className="ts-summary-label">최다 오답 영역</span>
                <strong className="ts-summary-value" style={{ fontSize: 20 }}>{wrongStats.topDomain}</strong>
              </div>
            </div>
          )}

          {/* 영역별 오답 분포 차트 */}
          {wrongStats && Object.keys(wrongStats.domainGroups).length >= 2 && (
            <div style={{ marginBottom: 28 }}>
              <WrongNoteDomainChart domainGroups={wrongStats.domainGroups} />
            </div>
          )}

          {/* 오답 카드 리스트 */}
          <div className="ts-wrong-list">
            {data.wrongItems.map(item => {
              const domainColor = getDomainColor(item.domain);
              return (
                <div key={item.questionNumber} className="ts-wrong-card">
                  <div className="ts-wrong-header">
                    <span className="ts-wrong-num">{item.questionNumber}번</span>
                    <span className="ts-wrong-type">{item.type}</span>
                    {item.domain && (
                      <span
                        className="ts-wrong-domain"
                        style={{ backgroundColor: domainColor.bg, color: domainColor.main, borderColor: domainColor.main }}
                      >
                        {item.domain}
                      </span>
                    )}
                    <span className="ts-wrong-pts">{item.points}점</span>
                  </div>

                  {item.passage && (
                    <div className="ts-wrong-passage">
                      <span className="ts-label">지문/작품:</span> {item.passage}
                    </div>
                  )}

                  <div className="ts-wrong-answers">
                    <div className="ts-wrong-my">
                      <span className="ts-label">내 답:</span>
                      <span className="ts-wrong-val ts-wrong-mine">{item.myAnswer || "-"}</span>
                    </div>
                    <div className="ts-wrong-correct">
                      <span className="ts-label">정답:</span>
                      <span className="ts-wrong-val ts-wrong-right">{item.correctAnswer}</span>
                    </div>
                  </div>

                  {item.intent && (
                    <div className="ts-wrong-intent">
                      <span className="ts-label">출제 의도:</span> {item.intent}
                    </div>
                  )}

                  <div className="ts-wrong-feedback">
                    <span className="ts-label">해설:</span>
                    <pre className="ts-wrong-feedback-text">{item.feedback}</pre>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="ts-report-actions ts-no-print">
        <button className="ts-btn ts-btn-outline" onClick={() => window.print()}>
          <span className="material-symbols-outlined">print</span>
          인쇄
        </button>
        <button className="ts-btn ts-btn-outline" onClick={() => navigate(`/tests/${testId}/report${studentId ? `?studentId=${studentId}` : ""}`)}>
          <span className="material-symbols-outlined">assessment</span>
          성적표
        </button>
        <Link to={studentId ? `/admin/tests/${testId}` : "/tests"} className="ts-btn ts-btn-outline">
          {studentId ? "시험 관리로" : "목록으로"}
        </Link>
      </div>
    </div>
  );
}

export default TestWrongNotePage;
