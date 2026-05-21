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
        // 미제출 + 문항이 있으면 문항 로드 & PDF 자동 표시.
        // V0149 / O-5 (2026-05-21) — OCR 생성 시험(source='ocr_generated')은 PDF 미노출 (학생은 종이 시험지 사용).
        const isOcrGenerated = data.source === "ocr_generated";
        if (!data.hasSubmitted && data.hasQuestions) {
          apiGet(`/v1/test-storage/${testId}/questions`)
            .then(qs => setQuestions(Array.isArray(qs) ? qs : []))
            .catch(() => {});
          if (data.pdfFileId && !isOcrGenerated) setShowPdf(true);
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

  // O-5 — OCR 생성 시험은 PDF 학생 노출 차단 (지문 노출 방지)
  const isOcrGenerated = test.source === "ocr_generated";
  const pdfUrl = test.pdfFileId && !isOcrGenerated
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

      {/* O-5 — OCR 생성 시험: 종이 시험지로 풀고 답안만 입력 안내 + OMR 페이지로 이동 버튼 */}
      {canAnswer && isOcrGenerated && (
        <div className="ts-detail-card" style={{ marginTop: 16 }}>
          <div style={{
            background: "rgba(34,139,230,0.08)",
            border: "1px solid rgba(34,139,230,0.25)",
            borderRadius: 8,
            padding: "16px 18px",
            marginBottom: 16,
            color: "#1971c2",
            fontSize: 14,
            lineHeight: 1.6,
          }}>
            <strong>📝 종이 시험지로 응시하는 시험입니다.</strong><br/>
            선생님께서 나눠준 종이 시험지를 풀고, 아래 버튼을 눌러 답안만 입력하세요.
            화면에서는 문항·지문이 노출되지 않습니다.
          </div>
          <button
            className="ts-btn ts-btn-primary ts-btn-lg"
            onClick={() => navigate(`/tests/${testId}/omr`)}
          >
            <span className="material-symbols-outlined">edit_note</span>
            OMR 답안 입력 시작
          </button>
        </div>
      )}

      {/* 미제출: PDF + 답안 패널 통합 레이아웃 (일반 misc 시험) */}
      {canAnswer && !isOcrGenerated && pdfUrl && (
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
