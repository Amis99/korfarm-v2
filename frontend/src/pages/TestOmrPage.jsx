import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiGet, apiPost } from "../utils/api";
import "../styles/test-storage.css";

function TestOmrPage() {
  const { testId } = useParams();
  const [searchParams] = useSearchParams();
  const fromDiagnostic = searchParams.get("from") === "diagnostic";
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  // N-20B (2026-05-21) — 서버 측 응시 세션 + 잔여 시간 타이머
  // N-35 (2026-05-22) — 타이머 종료 시 자동 제출 X, isTimeUp 만 true. 마킹 잠금, 제출 버튼은 학생이 직접.
  const [examDeadlineMs, setExamDeadlineMs] = useState(null);
  const [remainingSec, setRemainingSec] = useState(null);
  const [isTimeUp, setIsTimeUp] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;
    (async () => {
      try {
        const [testData, qs] = await Promise.all([
          apiGet(`/v1/test-storage/${testId}`),
          apiGet(`/v1/test-storage/${testId}/questions`).catch(() => []),
        ]);
        if (cancelled) return;
        if (testData.hasSubmitted) {
          navigate(`/tests/${testId}/report`, { replace: true });
          return;
        }
        setTest(testData);
        setQuestions(Array.isArray(qs) ? qs : []);

        // 서버 응시 세션 — 활성 있으면 그것, 없으면 신규 start
        let session = null;
        try {
          session = await apiGet(`/v1/test-storage/${testId}/active-session`);
        } catch { session = null; }
        if (!session) {
          try {
            session = await apiPost(`/v1/test-storage/${testId}/start`, {});
          } catch { session = null; }
        }
        if (!cancelled && session?.examDeadlineIso) {
          const ms = Date.parse(session.examDeadlineIso);
          if (Number.isFinite(ms)) setExamDeadlineMs(ms);
        }
      } catch {
        if (!cancelled) navigate("/tests");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isLoggedIn, testId, navigate]);

  // 타이머 — 서버 절대 deadline 기준 (deadline - now) 매초 계산
  // N-35 (2026-05-22) — 타이머 0 도달 시 자동 제출 X. isTimeUp=true 로만 마킹.
  // OMR 마킹·서술형 입력은 핸들러에서 isTimeUp 체크로 차단. 제출 버튼은 학생이 직접.
  useEffect(() => {
    if (examDeadlineMs == null) return undefined;
    const update = () => {
      const sec = Math.max(0, Math.floor((examDeadlineMs - Date.now()) / 1000));
      setRemainingSec(sec);
      if (sec <= 0) {
        setIsTimeUp(true);
      }
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [examDeadlineMs]);

  const handleBubble = (qNum, choice) => {
    if (isTimeUp) return; // N-35: 시간 종료 후 마킹 잠금
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
      await apiPost(`/v1/test-storage/${testId}/submit`, { answers });
      navigate(`/tests/${testId}/report${fromDiagnostic ? "?from=diagnostic" : ""}`);
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
        <Link to={fromDiagnostic ? "/diagnostic/print" : `/tests/${testId}`} className="ts-back-link">
          <span className="material-symbols-outlined">arrow_back</span> {fromDiagnostic ? "진단 테스트" : "시험 상세"}
        </Link>
      </div>

      <header className="ts-header">
        <h1>OMR 답안 입력</h1>
        <p className="ts-subtitle">{test.title}</p>
      </header>

      <div className="ts-omr-status">
        <span>{answeredCount} / {questions.length} 응답</span>
        {remainingSec != null && (
          <span className={`ts-omr-timer${remainingSec <= 300 ? " warn" : ""}`}>
            {isTimeUp ? "⏰ 시간 종료" : `남은 시간 ${String(Math.floor(remainingSec / 60)).padStart(2, "0")}:${String(remainingSec % 60).padStart(2, "0")}`}
          </span>
        )}
      </div>

      {/* N-35 (2026-05-22) — 시간 종료 안내 띠. 마킹 잠금, 제출 가능. */}
      {isTimeUp && (
        <div style={{
          padding: "10px 14px",
          margin: "0 0 14px",
          background: "rgba(192,57,43,0.10)",
          border: "1px solid rgba(192,57,43,0.35)",
          borderRadius: 6,
          color: "#c0392b",
          fontWeight: 600,
          textAlign: "center",
          fontSize: "0.92rem",
        }}>
          시험 시간이 종료되었습니다. 추가 입력·수정은 불가하며, 아래 <strong>제출하기</strong> 버튼을 눌러 마무리해 주세요.
        </div>
      )}

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
                      placeholder={isTimeUp ? "시간 종료" : "서술형"}
                      value={answers[String(q.number)] || ""}
                      onChange={e => {
                        if (isTimeUp) return; // N-35
                        setAnswers(prev => ({ ...prev, [String(q.number)]: e.target.value }));
                      }}
                      readOnly={isTimeUp}
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
