import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiGet, apiPost } from "../utils/api";
import "../styles/pro-mode.css";
import "../styles/test-storage.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";

function ProTestPage() {
  const { chapterId } = useParams();
  const { isLoggedIn } = useAuth();
  const navigate = useNavigate();

  // 상태 머신: ready → printed → omr_input → result
  const [phase, setPhase] = useState("ready");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 테스트 상태 정보
  const [testStatus, setTestStatus] = useState(null);

  // 인쇄 세션 정보
  const [session, setSession] = useState(null);

  // OMR 관련
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // 결과
  const [result, setResult] = useState(null);

  // 타이머
  const [remainingSec, setRemainingSec] = useState(0);
  const timerRef = useRef(null);

  // 초기 테스트 상태 로드
  useEffect(() => {
    if (!isLoggedIn || !chapterId) return;
    loadTestStatus();
  }, [isLoggedIn, chapterId]);

  const loadTestStatus = async () => {
    setLoading(true);
    try {
      const status = await apiGet(`/v1/pro/chapters/${chapterId}/test-status`);
      setTestStatus(status);

      // 이미 통과한 경우
      if (status.isTestPassed) {
        setPhase("result");
        setResult({ passed: true, score: 0, totalPoints: 0, nextAction: "next_chapter" });
        // 통과 세션의 점수 찾기
        const passedSession = status.history?.find(s => s.status === "passed");
        if (passedSession) {
          setResult(prev => ({ ...prev, score: passedSession.score }));
        }
      }
      // 활성 세션이 있는 경우
      else if (status.activeSession) {
        setSession({
          sessionId: status.activeSession.sessionId,
          omrDeadline: status.activeSession.omrDeadline,
        });
        startTimer(new Date(status.activeSession.omrDeadline));
        setPhase("printed");
      }
    } catch {
      setError("테스트 정보를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 타이머 시작
  const startTimer = (deadline) => {
    if (timerRef.current) clearInterval(timerRef.current);
    const deadlineMs = deadline.getTime();
    const update = () => {
      const diff = Math.max(0, Math.floor((deadlineMs - Date.now()) / 1000));
      setRemainingSec(diff);
      if (diff <= 0) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
    update();
    timerRef.current = setInterval(update, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // 인쇄 요청
  const handlePrint = async () => {
    setError("");
    try {
      const res = await apiPost("/v1/pro/test/print", { chapterId });
      setSession(res);

      // PDF 새 탭으로 열기
      if (res.pdfFileId) {
        const token = localStorage.getItem("korfarm_token");
        window.open(`${API_BASE}/v1/files/${res.pdfFileId}?token=${token}`, "_blank");
      }

      startTimer(new Date(res.omrDeadline));
      setPhase("printed");
    } catch (err) {
      setError(err.message || "인쇄 세션 생성에 실패했습니다.");
    }
  };

  // OMR 입력 단계 진입
  const handleStartOmr = async () => {
    setError("");
    try {
      // 문항 정보 로드
      const qs = await apiGet(`/v1/tests/${session.testId}/questions`);
      setQuestions(Array.isArray(qs) ? qs : []);
      setAnswers({});
      setPhase("omr_input");
    } catch {
      setError("문항 정보를 불러올 수 없습니다.");
    }
  };

  // 버블 클릭
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

  // OMR 제출
  const handleSubmit = async () => {
    setError("");
    const unanswered = questions.filter(q => q.type === "객관식" && !answers[String(q.number)]);
    if (unanswered.length > 0) {
      const ok = window.confirm(`${unanswered.length}문항이 미응답입니다. 제출하시겠습니까?`);
      if (!ok) return;
    }
    setSubmitting(true);
    try {
      const res = await apiPost("/v1/pro/test/submit", {
        sessionId: session.sessionId,
        answers,
      });
      setResult(res);
      setPhase("result");
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    } catch (err) {
      setError(err.message || "제출에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // 재응시
  const handleRetry = () => {
    setSession(null);
    setResult(null);
    setAnswers({});
    setQuestions([]);
    setError("");
    setPhase("ready");
    loadTestStatus();
  };

  // 타이머 포맷
  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="pro">
        <div className="pro-loading">불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="pro">
      <div className="pro-topbar">
        <div className="pro-topbar-inner">
          <Link to={`/pro-mode/chapter/${chapterId}`} className="pro-back">
            <span className="material-symbols-outlined">arrow_back</span>
            학습 목록
          </Link>
          <h1 className="pro-topbar-title">챕터 테스트</h1>
        </div>
      </div>

      <div className="pro-body">
        <div className="pro-test-container">
          {error && (
            <p style={{ color: "#ef4444", textAlign: "center", marginBottom: 16 }}>{error}</p>
          )}

          {/* ── ready 단계 ── */}
          {phase === "ready" && (
            <div className="pro-test-info">
              <h3>챕터 테스트</h3>
              <div className="pro-test-info-grid">
                <div className="pro-test-info-item">
                  <div className="label">제한 시간</div>
                  <div className="value">60분</div>
                </div>
                <div className="pro-test-info-item">
                  <div className="label">통과 기준</div>
                  <div className="value">70점</div>
                </div>
                <div className="pro-test-info-item">
                  <div className="label">남은 버전</div>
                  <div className="value">{testStatus?.remainingVersions ?? "?"}</div>
                </div>
              </div>
              <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
                인쇄 버튼을 누르면 시험지가 출력되고 1시간 카운트다운이 시작됩니다.
              </p>
              <button className="pro-test-btn primary" onClick={handlePrint}>
                <span className="material-symbols-outlined">print</span>
                인쇄하기
              </button>

              {testStatus?.history?.length > 0 && (
                <div style={{ marginTop: 32 }}>
                  <h4 style={{ fontSize: 14, color: "#64748b", marginBottom: 8 }}>응시 기록</h4>
                  {testStatus.history.map(h => (
                    <div key={h.sessionId} style={{
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      padding: "8px 12px", background: "#f8fafc", borderRadius: 8, marginBottom: 6, fontSize: 13
                    }}>
                      <span>버전 {h.version}</span>
                      <span style={{ color: h.status === "passed" ? "#22c55e" : h.status === "failed" ? "#ef4444" : "#94a3b8" }}>
                        {h.status === "passed" ? "통과" : h.status === "failed" ? "불합격" : h.status === "expired" ? "만료" : h.status}
                        {h.score != null && ` (${h.score}점)`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── printed 단계 ── */}
          {phase === "printed" && (
            <div className="pro-test-info">
              <h3>시험지가 출력되었습니다</h3>
              <div className={`pro-test-timer ${remainingSec < 300 ? "warning" : ""}`}>
                {formatTime(remainingSec)}
              </div>
              <p className="pro-test-timer-label">남은 시간</p>
              <p style={{ fontSize: 13, color: "#64748b", marginBottom: 20 }}>
                시험지를 풀고 OMR 작성 버튼을 눌러 답안을 입력하세요.
              </p>
              <button className="pro-test-btn primary" onClick={handleStartOmr}>
                <span className="material-symbols-outlined">edit_note</span>
                OMR 작성
              </button>
            </div>
          )}

          {/* ── omr_input 단계 ── */}
          {phase === "omr_input" && (
            <>
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <div className={`pro-test-timer ${remainingSec < 300 ? "warning" : ""}`}>
                  {formatTime(remainingSec)}
                </div>
                <p className="pro-test-timer-label">남은 시간</p>
              </div>

              <div className="ts-omr-status" style={{ marginBottom: 12 }}>
                <span>{Object.keys(answers).length} / {questions.length} 응답</span>
              </div>

              <div className="ts-omr-grid">
                {(() => {
                  const rows = [];
                  for (let i = 0; i < questions.length; i += 5) {
                    rows.push(questions.slice(i, i + 5));
                  }
                  return rows.map((row, ri) => (
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
                  ));
                })()}
              </div>

              <div style={{ textAlign: "center", marginTop: 24 }}>
                <button
                  className="pro-test-btn primary"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? "제출 중..." : "제출하기"}
                </button>
              </div>
            </>
          )}

          {/* ── result 단계 ── */}
          {phase === "result" && result && (
            <div className={`pro-result-card ${result.passed ? "passed" : "failed"}`}>
              <span className="material-symbols-outlined" style={{ fontSize: 48 }}>
                {result.passed ? "emoji_events" : "sentiment_dissatisfied"}
              </span>
              {result.score > 0 && (
                <div className="pro-result-score">{result.score}점</div>
              )}
              <div className="pro-result-label">
                {result.passed ? "축하합니다! 통과했습니다" : "아쉽습니다"}
              </div>
              <p className="pro-result-desc">
                {result.passed
                  ? "다음 챕터로 진행할 수 있습니다."
                  : result.nextAction === "retry_available"
                    ? "다른 버전으로 재응시할 수 있습니다."
                    : result.nextAction === "no_more_versions"
                      ? "모든 테스트 버전을 소진했습니다. 학습을 복습해주세요."
                      : ""}
              </p>
              <div className="pro-result-actions">
                {result.passed ? (
                  <button
                    className="pro-test-btn primary"
                    onClick={() => navigate("/pro-mode")}
                  >
                    챕터 목록으로
                  </button>
                ) : (
                  <>
                    <button
                      className="pro-test-btn secondary"
                      onClick={() => navigate(`/pro-mode/chapter/${chapterId}`)}
                    >
                      학습 복습하기
                    </button>
                    {result.nextAction === "retry_available" && (
                      <button className="pro-test-btn primary" onClick={handleRetry}>
                        재응시하기
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ProTestPage;
