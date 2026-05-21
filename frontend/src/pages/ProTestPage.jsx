import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiGet, apiPost, API_BASE, TOKEN_KEY } from "../utils/api";
import AnswerInputPanel from "../components/AnswerInputPanel";
import OnlineTestRenderer from "../components/OnlineTestRenderer";
import EngineShell from "../engine/core/EngineShell";
import { adaptTestQuestions, buildEngineContent } from "../utils/testToEngineAdapter";
import "../styles/pro-mode.css";
import "../styles/test-storage.css";
import "../styles/test-online.css";

/** 역량별 점수 분석 컴포넌트 */
function CompetencyAnalysis({ scores }) {
  const entries = Object.entries(scores).sort((a, b) => a[1].accuracy - b[1].accuracy);
  const weakTop3 = entries.slice(0, 3);

  return (
    <div className="pro-competency-analysis">
      <h4 className="pro-competency-title">역량 분석</h4>
      <div className="pro-competency-bars">
        {entries.map(([domain, data]) => {
          const isWeak = weakTop3.some(([d]) => d === domain);
          return (
            <div key={domain} className={`pro-competency-row ${isWeak ? "weak" : ""}`}>
              <div className="pro-competency-label">
                {domain}
                {isWeak && <span className="pro-competency-weak-badge">보강 필요</span>}
              </div>
              <div className="pro-competency-bar-wrap">
                <div
                  className="pro-competency-bar-fill"
                  style={{ width: `${Math.min(100, data.accuracy)}%` }}
                />
              </div>
              <div className="pro-competency-pct">
                {data.correct}/{data.total} ({Math.round(data.accuracy)}%)
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ProTestPage() {
  const { chapterId } = useParams();
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  // 본사/기관 관리자는 통과한 챕터도 무한 재응시 가능 — isTestPassed 잠금 무시
  const isAdmin = user?.roles?.some((r) => r === "HQ_ADMIN" || r === "ORG_ADMIN");

  // 상태 머신: ready → printed → omr_input → result
  //            ready → online_solving → result
  const [phase, setPhase] = useState("ready");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 테스트 상태 정보
  const [testStatus, setTestStatus] = useState(null);

  // 세션 정보
  const [session, setSession] = useState(null);

  // OMR / 온라인 공통
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // 온라인 엔진 모드용
  const [engineContent, setEngineContent] = useState(null);

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

      // 이미 통과한 경우 — 관리자는 무한 재응시 가능하므로 ready 단계 유지
      if (status.isTestPassed && !isAdmin) {
        setPhase("result");
        const passedSession = status.history?.find(s => s.status === "passed");
        setResult({
          passed: true,
          score: passedSession?.score ?? 0,
          totalPoints: passedSession?.totalPoints ?? 100,
          nextAction: "next_chapter"
        });
      }
      // 활성 세션이 있는 경우
      else if (status.activeSession) {
        const active = status.activeSession;
        setSession({
          sessionId: active.sessionId,
          testId: active.testId,
          mode: active.mode || "print",
          omrDeadline: active.omrDeadline,
        });
        startTimer(active.remainingMinutes ?? 0);

        if (active.mode === "online" || active.status === "online_solving") {
          // 온라인 모드 활성 세션 → 문항 로드 → 엔진 형식 변환
          try {
            const qs = await apiGet(`/v1/test-storage/${active.testId}/questions`);
            const rawQuestions = Array.isArray(qs) ? qs : [];
            setQuestions(rawQuestions);
            const engineQuestions = adaptTestQuestions(rawQuestions);
            setEngineContent(
              buildEngineContent({
                title: "챕터 테스트",
                questions: engineQuestions,
                timeLimitSec: (active.remainingMinutes ?? 60) * 60,
                contentType: "CHAPTER_TEST",
              }),
            );
          } catch {
            // 문항 로드 실패 시 ready로 복귀
          }
          setPhase("online_solving");
        } else {
          setPhase("printed");
        }
      }
    } catch {
      setError("테스트 정보를 불러올 수 없습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 타이머 시작 — 남은 분(remainingMinutes) 기반 (서버 시간대 무관)
  const startTimer = (minutes) => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (!minutes || minutes <= 0) return;
    const deadlineMs = Date.now() + minutes * 60 * 1000;
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

  // 인쇄 모드 시작
  const handlePrint = async () => {
    setError("");
    try {
      const res = await apiPost("/v1/pro/test/start", { chapterId, mode: "print" });
      setSession(res);

      // PDF 새 탭으로 열기
      if (res.pdfFileId) {
        if (res.pdfFileId.startsWith("http")) {
          window.open(res.pdfFileId, "_blank");
        } else {
          const token = sessionStorage.getItem(TOKEN_KEY);
          window.open(`${API_BASE}/v1/files/${res.pdfFileId}/download?token=${token}`, "_blank");
        }
      }

      startTimer(res.remainingMinutes ?? 60);
      setPhase("printed");
    } catch (err) {
      setError(err.message || "인쇄 세션 생성에 실패했습니다.");
    }
  };

  // 온라인 모드 시작
  const handleOnlineStart = async () => {
    setError("");
    try {
      const res = await apiPost("/v1/pro/test/start", { chapterId, mode: "online" });
      setSession(res);
      startTimer(res.remainingMinutes ?? 60);

      // 문항 로드 → 엔진 형식 변환
      const qs = await apiGet(`/v1/test-storage/${res.testId}/questions`);
      const rawQuestions = Array.isArray(qs) ? qs : [];
      setQuestions(rawQuestions);
      setAnswers({});

      const engineQuestions = adaptTestQuestions(rawQuestions);
      setEngineContent(
        buildEngineContent({
          title: "챕터 테스트",
          questions: engineQuestions,
          timeLimitSec: (res.remainingMinutes ?? 60) * 60,
          contentType: "CHAPTER_TEST",
        }),
      );
      setPhase("online_solving");
    } catch (err) {
      setError(err.message || "온라인 테스트 시작에 실패했습니다.");
    }
  };

  // OMR 입력 단계 진입 (인쇄 모드)
  const handleStartOmr = async () => {
    setError("");
    try {
      const testId = session?.testId;
      const qs = await apiGet(`/v1/test-storage/${testId}/questions`);
      setQuestions(Array.isArray(qs) ? qs : []);
      setAnswers({});
      setPhase("omr_input");
    } catch {
      setError("문항 정보를 불러올 수 없습니다.");
    }
  };

  // 답안 변경
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

  // 제출 (OMR + 온라인 공통)
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

  // 엔진 모드 완료 (온라인 풀기)
  // N-21 (2026-05-21) — 서술형 답안(essayText) 도 함께 보냄
  const handleEngineFinish = async ({ records }) => {
    setError("");
    const engineAnswers = {};
    records.forEach((r) => {
      if (!r.id) return;
      if (r.selectedId) engineAnswers[r.id] = r.selectedId;
      else if (r.essayText) engineAnswers[r.id] = r.essayText;
    });
    setSubmitting(true);
    try {
      const res = await apiPost("/v1/pro/test/submit", {
        sessionId: session.sessionId,
        answers: engineAnswers,
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
            <p className="pro-test-error">{error}</p>
          )}

          {/* ── ready 단계: 인쇄하기 + 온라인 풀기 선택 ── */}
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
                  <div className="value">
                    {testStatus?.remainingVersions > 0
                      ? testStatus.remainingVersions
                      : "재응시 가능"}
                  </div>
                </div>
              </div>
              <p className="pro-test-hint">
                테스트 방식을 선택하세요. 두 방식 모두 60분 제한 시간이 적용됩니다.
              </p>
              <div className="pro-test-mode-btns">
                <button className="pro-test-btn primary" onClick={handlePrint}>
                  <span className="material-symbols-outlined">print</span>
                  인쇄하기
                </button>
                <button className="pro-test-btn secondary" onClick={handleOnlineStart}>
                  <span className="material-symbols-outlined">computer</span>
                  온라인 풀기
                </button>
              </div>

              {testStatus?.history?.length > 0 && (
                <div className="pro-test-history">
                  <h4 className="pro-test-history-title">응시 기록</h4>
                  {testStatus.history.map(h => (
                    <div key={h.sessionId} className="pro-test-history-row">
                      <span>
                        버전 {h.version}
                        <span className="pro-test-history-mode">
                          {h.mode === "online" ? " (온라인)" : " (인쇄)"}
                        </span>
                      </span>
                      <span className={h.status === "passed" ? "pro-test-history-passed" : h.status === "failed" ? "pro-test-history-failed" : "pro-test-history-expired"}>
                        {h.status === "passed" ? "통과" : h.status === "failed" ? "불합격" : h.status === "expired" ? "만료" : h.status}
                        {h.score != null && ` (${h.score}점)`}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── printed 단계 (인쇄 모드) ── */}
          {phase === "printed" && (
            <div className="pro-test-info">
              <h3>시험지가 출력되었습니다</h3>
              <div className={`pro-test-timer ${remainingSec < 300 ? "warning" : ""}`}>
                {formatTime(remainingSec)}
              </div>
              <p className="pro-test-timer-label">남은 시간</p>
              <p className="pro-test-hint">
                시험지를 풀고 OMR 작성 버튼을 눌러 답안을 입력하세요.
              </p>
              <button className="pro-test-btn primary" onClick={handleStartOmr}>
                <span className="material-symbols-outlined">edit_note</span>
                OMR 작성
              </button>
            </div>
          )}

          {/* ── omr_input 단계: PDF + 답안 패널 (인쇄 모드) ── */}
          {phase === "omr_input" && (
            <>
              <div className="pro-test-online-header">
                <div className={`pro-test-timer ${remainingSec < 300 ? "warning" : ""}`}>
                  {formatTime(remainingSec)}
                </div>
                <p className="pro-test-timer-label">남은 시간</p>
              </div>

              <div className="pro-test-online-split">
                {session?.pdfFileId && (
                  <div className="test-online-pdf" onContextMenu={e => e.preventDefault()}>
                    <iframe
                      src={`${session.pdfFileId.startsWith("http") ? session.pdfFileId : `${API_BASE}/v1/files/${session.pdfFileId}/download`}#toolbar=0&navpanes=0`}
                      title="시험지"
                    />
                  </div>
                )}
                <AnswerInputPanel
                  questions={questions}
                  answers={answers}
                  onAnswer={handleAnswer}
                  onSubmit={handleSubmit}
                  submitting={submitting}
                />
              </div>
            </>
          )}

          {/* ── online_solving 단계: 엔진 기반 누적 카드 (온라인 모드) ── */}
          {phase === "online_solving" && engineContent && (
            <EngineShell
              content={engineContent}
              moduleKey="exam"
              onExit={() => { setPhase("ready"); setEngineContent(null); loadTestStatus(); }}
              onFinish={handleEngineFinish}
            />
          )}

          {/* ── result 단계 ── */}
          {phase === "result" && result && (
            <div className={`pro-result-card ${result.passed ? "passed" : "failed"}`}>
              <span className="material-symbols-outlined pro-result-icon">
                {result.passed ? "emoji_events" : "sentiment_dissatisfied"}
              </span>
              {result.score > 0 && (
                <div className="pro-result-score">
                  {result.score}점{result.totalPoints ? ` / ${result.totalPoints}점` : ""}
                </div>
              )}
              <div className="pro-result-label">
                {result.passed ? "축하합니다! 통과했습니다" : "아쉽습니다"}
              </div>
              <p className="pro-result-desc">
                {result.passed
                  ? "다음 챕터로 진행할 수 있습니다."
                  : result.nextAction === "retry_recycled"
                    ? "기존 테스트 중 하나로 재응시할 수 있습니다."
                    : result.nextAction === "retry_available"
                      ? "다른 버전으로 재응시할 수 있습니다."
                      : ""}
              </p>

              {/* 역량 분석 섹션 */}
              {result.competencyScores && Object.keys(result.competencyScores).length > 0 && (
                <CompetencyAnalysis scores={result.competencyScores} />
              )}

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
                    {(result.nextAction === "retry_available" || result.nextAction === "retry_recycled") && (
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
