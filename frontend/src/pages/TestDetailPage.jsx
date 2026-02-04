import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiGet } from "../utils/api";
import "../styles/test-storage.css";

function TestDetailPage() {
  const { testId } = useParams();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPdf, setShowPdf] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    apiGet(`/v1/test-storage/${testId}`)
      .then(setTest)
      .catch(() => navigate("/tests"))
      .finally(() => setLoading(false));
  }, [isLoggedIn, testId, navigate]);

  if (loading) return <div className="ts-page ts-center"><p>불러오는 중...</p></div>;
  if (!test) return null;

  const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";
  const token = localStorage.getItem("korfarm_token");
  const pdfUrl = test.pdfFileId
    ? `${API_BASE}/v1/files/${test.pdfFileId}/download`
    : null;

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
          {test.pdfFileId && (
            <button className="ts-btn ts-btn-outline" onClick={() => setShowPdf(!showPdf)}>
              <span className="material-symbols-outlined">description</span>
              {showPdf ? "시험지 닫기" : "시험지 보기"}
            </button>
          )}

          {!test.hasSubmitted && test.hasQuestions && (
            <button className="ts-btn ts-btn-primary" onClick={() => navigate(`/tests/${testId}/omr`)}>
              <span className="material-symbols-outlined">edit_note</span>
              OMR 입력
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

      {showPdf && pdfUrl && (
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
