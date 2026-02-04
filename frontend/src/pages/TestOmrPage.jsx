import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiGet, apiPost } from "../utils/api";
import "../styles/test-storage.css";

function TestOmrPage() {
  const { testId } = useParams();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoggedIn) return;
    Promise.all([
      apiGet(`/v1/test-storage/${testId}`),
      apiGet(`/v1/tests/${testId}/questions`).catch(() => [])
    ])
      .then(([testData, qs]) => {
        if (testData.hasSubmitted) {
          navigate(`/tests/${testId}/report`, { replace: true });
          return;
        }
        setTest(testData);
        setQuestions(Array.isArray(qs) ? qs : []);
      })
      .catch(() => navigate("/tests"))
      .finally(() => setLoading(false));
  }, [isLoggedIn, testId, navigate]);

  const handleBubble = (qNum, choice) => {
    setAnswers(prev => {
      const key = String(qNum);
      if (prev[key] === String(choice)) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: String(choice) };
    });
  };

  const handleSubmit = async () => {
    setError("");
    const unanswered = questions.filter(q => q.type === "객관식" && !answers[String(q.number)]);
    if (unanswered.length > 0) {
      const confirm = window.confirm(
        `${unanswered.length}문항이 미응답입니다. 제출하시겠습니까?`
      );
      if (!confirm) return;
    }
    setSubmitting(true);
    try {
      await apiPost(`/v1/tests/${testId}/submit`, { answers });
      navigate(`/tests/${testId}/report`);
    } catch (err) {
      setError(err.message || "제출에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="ts-page ts-center"><p>불러오는 중...</p></div>;
  if (!test) return null;

  // group questions into rows of 5
  const rows = [];
  for (let i = 0; i < questions.length; i += 5) {
    rows.push(questions.slice(i, i + 5));
  }

  const answeredCount = Object.keys(answers).length;

  return (
    <div className="ts-page">
      <div className="ts-back-row">
        <Link to={`/tests/${testId}`} className="ts-back-link">
          <span className="material-symbols-outlined">arrow_back</span> 시험 상세
        </Link>
      </div>

      <header className="ts-header">
        <h1>OMR 답안 입력</h1>
        <p className="ts-subtitle">{test.title}</p>
      </header>

      <div className="ts-omr-status">
        <span>{answeredCount} / {questions.length} 응답</span>
      </div>

      <div className="ts-omr-grid">
        {rows.map((row, ri) => (
          <div key={ri} className="ts-omr-row">
            {row.map(q => (
              <div key={q.number} className="ts-omr-cell">
                <div className="ts-omr-qnum">
                  <span className="ts-omr-num">{q.number}</span>
                  <span className="ts-omr-type">{q.type === "서술형" ? "서" : ""}</span>
                  <span className="ts-omr-pts">{q.points}점</span>
                </div>
                {q.type === "객관식" ? (
                  <div className="ts-omr-bubbles">
                    {[1, 2, 3, 4, 5].map(c => (
                      <button
                        key={c}
                        className={`ts-omr-bubble ${answers[String(q.number)] === String(c) ? "selected" : ""}`}
                        onClick={() => handleBubble(q.number, c)}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="ts-omr-essay">
                    <input
                      type="text"
                      placeholder="서술형"
                      value={answers[String(q.number)] || ""}
                      onChange={e => setAnswers(prev => ({ ...prev, [String(q.number)]: e.target.value }))}
                      className="ts-omr-essay-input"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {error && <p className="ts-error">{error}</p>}

      <div className="ts-omr-footer">
        <button
          className="ts-btn ts-btn-primary ts-btn-lg"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? "제출 중..." : "제출하기"}
        </button>
      </div>
    </div>
  );
}

export default TestOmrPage;
