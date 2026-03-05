import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiGet, apiPost, API_BASE } from "../utils/api";
import AnswerInputPanel from "../components/AnswerInputPanel";
import "../styles/test-storage.css";
import "../styles/test-online.css";

function TestDetailPage() {
  const { testId } = useParams();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPdf, setShowPdf] = useState(false);

  // 온라인 답안 입력
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isLoggedIn) return;
    apiGet(`/v1/test-storage/${testId}`)
      .then(data => {
        setTest(data);
        // 미제출 + 문항이 있으면 문항 로드 & PDF 자동 표시
        if (!data.hasSubmitted && data.hasQuestions) {
          apiGet(`/v1/test-storage/${testId}/questions`)
            .then(qs => setQuestions(Array.isArray(qs) ? qs : []))
            .catch(() => {});
          if (data.pdfFileId) setShowPdf(true);
        }
      })
      .catch(() => navigate("/tests"))
      .finally(() => setLoading(false));
  }, [isLoggedIn, testId, navigate]);

  const handleAnswer = (qNum, value) => {
    setAnswers(prev => {
      if (value === null) {
        const next = { ...prev };
        delete next[String(qNum)];
        return next;
      }
      return { ...prev, [String(qNum)]: String(value) };
    });
  };

  const handleSubmit = async () => {
    setError("");
    const unanswered = questions.filter(q => q.type === "객관식" && !answers[String(q.number)]);
    if (unanswered.length > 0) {
      const ok = window.confirm(`${unanswered.length}문항이 미응답입니다. 제출하시겠습니까?`);
      if (!ok) return;
    }
    setSubmitting(true);
    try {
      await apiPost(`/v1/test-storage/${testId}/submit`, { answers });
      navigate(`/tests/${testId}/report`);
    } catch (err) {
      setError(err.message || "제출에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="ts-page ts-center"><p>불러오는 중...</p></div>;
  if (!test) return null;

  const pdfUrl = test.pdfFileId
    ? `${API_BASE}/v1/files/${test.pdfFileId}/download`
    : null;

  const canAnswer = !test.hasSubmitted && test.hasQuestions && questions.length > 0;

  return (
    <div className="ts-page">
      <div className="ts-back-row">
        <Link to="/tests" className="ts-back-link">
          <span className="material-symbols-outlined">arrow_back</span> 목록으로
        </Link>
      </div>

      <div className="ts-detail-card">
        <h1>{test.title}</h1>
        {test.description && <p className="ts-detail-desc">{test.description}</p>}

        <div className="ts-detail-meta">
          {test.levelId && <span className="ts-meta-chip">{test.levelId}</span>}
          <span className="ts-meta-chip">{test.totalQuestions}문항</span>
          <span className="ts-meta-chip">{test.totalPoints}점 만점</span>
          {test.timeLimitMinutes && <span className="ts-meta-chip">{test.timeLimitMinutes}분</span>}
          {test.examDate && <span className="ts-meta-chip">{test.examDate}</span>}
          {test.series && <span className="ts-meta-chip">{test.series}</span>}
        </div>

        <div className="ts-detail-actions">
          {test.pdfFileId && !canAnswer && (
            <button className="ts-btn ts-btn-outline" onClick={() => setShowPdf(!showPdf)}>
              <span className="material-symbols-outlined">description</span>
              {showPdf ? "시험지 닫기" : "시험지 보기"}
            </button>
          )}

          {test.hasSubmitted && (
            <>
              <button className="ts-btn ts-btn-primary" onClick={() => navigate(`/tests/${testId}/report`)}>
                <span className="material-symbols-outlined">assessment</span>
                성적표
              </button>
              <button className="ts-btn ts-btn-outline" onClick={() => navigate(`/tests/${testId}/wrong-note`)}>
                <span className="material-symbols-outlined">error_outline</span>
                오답 노트
              </button>
            </>
          )}
        </div>
      </div>

      {error && <p className="ts-error">{error}</p>}

      {/* 미제출: PDF + 답안 패널 통합 레이아웃 */}
      {canAnswer && pdfUrl && (
        <div className="test-online-split">
          <div className="test-online-pdf" onContextMenu={e => e.preventDefault()}>
            <div className="ts-pdf-overlay" />
            <iframe
              src={`${pdfUrl}#toolbar=0&navpanes=0`}
              title="시험지"
            />
          </div>
          <AnswerInputPanel
            questions={questions}
            answers={answers}
            onAnswer={handleAnswer}
            onSubmit={handleSubmit}
            submitting={submitting}
          />
        </div>
      )}

      {/* 제출 완료 후 PDF 보기 */}
      {showPdf && pdfUrl && !canAnswer && (
        <div className="ts-pdf-container" onContextMenu={e => e.preventDefault()}>
          <div className="ts-pdf-overlay" />
          <iframe
            className="ts-pdf-iframe test-pdf-viewer"
            src={`${pdfUrl}#toolbar=0&navpanes=0`}
            title="시험지"
          />
        </div>
      )}
    </div>
  );
}

export default TestDetailPage;
