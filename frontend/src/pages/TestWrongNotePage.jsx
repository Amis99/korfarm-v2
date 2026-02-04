import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiGet } from "../utils/api";
import "../styles/test-storage.css";

function TestWrongNotePage() {
  const { testId } = useParams();
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) return;
    apiGet(`/v1/test-storage/${testId}/wrong-note`)
      .then(setData)
      .catch(() => navigate(`/tests/${testId}`))
      .finally(() => setLoading(false));
  }, [isLoggedIn, testId, navigate]);

  if (loading) return <div className="ts-page ts-center"><p>불러오는 중...</p></div>;
  if (!data) return null;

  return (
    <div className="ts-page ts-report-page">
      <div className="ts-back-row ts-no-print">
        <Link to={`/tests/${testId}`} className="ts-back-link">
          <span className="material-symbols-outlined">arrow_back</span> 시험 상세
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
        <div className="ts-wrong-list">
          {data.wrongItems.map(item => (
            <div key={item.questionNumber} className="ts-wrong-card">
              <div className="ts-wrong-header">
                <span className="ts-wrong-num">{item.questionNumber}번</span>
                <span className="ts-wrong-type">{item.type}</span>
                {item.domain && <span className="ts-wrong-domain">{item.domain}</span>}
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
          ))}
        </div>
      )}

      <div className="ts-report-actions ts-no-print">
        <button className="ts-btn ts-btn-outline" onClick={() => window.print()}>
          <span className="material-symbols-outlined">print</span>
          인쇄
        </button>
        <button className="ts-btn ts-btn-outline" onClick={() => navigate(`/tests/${testId}/report`)}>
          <span className="material-symbols-outlined">assessment</span>
          성적표
        </button>
        <Link to="/tests" className="ts-btn ts-btn-outline">목록으로</Link>
      </div>
    </div>
  );
}

export default TestWrongNotePage;
