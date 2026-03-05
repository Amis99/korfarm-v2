import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost, API_BASE, TOKEN_KEY } from "../utils/api";
import AnswerInputPanel from "../components/AnswerInputPanel";
import "../styles/diagnostic.css";
import "../styles/test-online.css";

const LEVEL_INFO = {
  saussure: { label: "소쉬르", desc: "초등 저학년", icon: "eco" },
  frege: { label: "프레게", desc: "초등 고학년", icon: "psychology" },
  russell: { label: "러셀", desc: "중학생", icon: "menu_book" },
  wittgenstein: { label: "비트겐슈타인", desc: "고등학생", icon: "school" },
};

const blockEvent = (event) => {
  event.preventDefault();
  event.stopPropagation();
};

function DiagnosticPrintPage() {
  const [phase, setPhase] = useState("select"); // select | print | online
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [printed, setPrinted] = useState(false);
  const [isObscured, setIsObscured] = useState(false);
  const navigate = useNavigate();

  // 온라인 응시
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [onlineError, setOnlineError] = useState("");

  // 진단 테스트 목록 로드
  useEffect(() => {
    apiGet("/v1/test-storage/diagnostic")
      .then((data) => setTests(Array.isArray(data) ? data : []))
      .catch(() => setTests([]))
      .finally(() => setLoading(false));
  }, []);

  // print 단계: 보안 이벤트 차단
  useEffect(() => {
    if (phase !== "print") return;
    const keyEvents = ["keydown", "keypress", "keyup"];
    const blockEvents = [
      "contextmenu", "copy", "cut", "paste", "dragstart", "selectstart",
    ];
    keyEvents.forEach((e) => window.addEventListener(e, blockEvent, true));
    blockEvents.forEach((e) => window.addEventListener(e, blockEvent, true));
    return () => {
      keyEvents.forEach((e) => window.removeEventListener(e, blockEvent, true));
      blockEvents.forEach((e) => window.removeEventListener(e, blockEvent, true));
    };
  }, [phase]);

  // print 단계: 화면이탈 감지
  useEffect(() => {
    if (phase !== "print") return;
    const updateVisibility = () => {
      setIsObscured(document.hidden || !document.hasFocus());
    };
    updateVisibility();
    window.addEventListener("blur", updateVisibility);
    window.addEventListener("focus", updateVisibility);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => {
      window.removeEventListener("blur", updateVisibility);
      window.removeEventListener("focus", updateVisibility);
      document.removeEventListener("visibilitychange", updateVisibility);
    };
  }, [phase]);

  const handleSelectTest = async (test) => {
    if (test.hasSubmitted) return;
    setSelectedTest(test);
    try {
      const pdfFileId = await apiGet(`/v1/test-storage/${test.testId}/pdf`);
      const token = localStorage.getItem(TOKEN_KEY);
      const resp = await fetch(`${API_BASE}/v1/files/${pdfFileId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error("PDF 다운로드 실패");
      const blob = await resp.blob();
      setPdfUrl(URL.createObjectURL(blob));
      setPhase("print");
    } catch {
      alert("시험지 PDF를 불러올 수 없습니다.");
    }
  };

  const requestFullscreen = async () => {
    const el = document.documentElement;
    if (!document.fullscreenElement && el?.requestFullscreen) {
      try { await el.requestFullscreen(); } catch { /* 무시 */ }
    }
  };

  const handlePrint = async () => {
    await requestFullscreen();
    setPrinted(true);
    window.print();
  };

  const handleGoOmr = () => {
    navigate(`/tests/${selectedTest.testId}/omr?from=diagnostic`);
  };

  // 온라인 응시 시작
  const handleOnlineTest = async () => {
    if (!selectedTest) return;
    try {
      const qs = await apiGet(`/v1/test-storage/${selectedTest.testId}/questions`);
      setQuestions(Array.isArray(qs) ? qs : []);
      setAnswers({});
      setOnlineError("");
      setPhase("online");
    } catch {
      alert("문항 정보를 불러올 수 없습니다.");
    }
  };

  const handleOnlineAnswer = (qNum, value) => {
    setAnswers(prev => {
      if (value === null) {
        const next = { ...prev };
        delete next[String(qNum)];
        return next;
      }
      return { ...prev, [String(qNum)]: String(value) };
    });
  };

  const handleOnlineSubmit = async () => {
    setOnlineError("");
    const unanswered = questions.filter(q => q.type === "객관식" && !answers[String(q.number)]);
    if (unanswered.length > 0) {
      const ok = window.confirm(`${unanswered.length}문항이 미응답입니다. 제출하시겠습니까?`);
      if (!ok) return;
    }
    setSubmitting(true);
    try {
      await apiPost(`/v1/test-storage/${selectedTest.testId}/submit`, { answers });
      navigate(`/tests/${selectedTest.testId}/report?from=diagnostic`);
    } catch (err) {
      setOnlineError(err.message || "제출에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── select 단계: 레벨 선택 ──
  if (phase === "select") {
    return (
      <div className="diagnostic-page">
        <main className="diagnostic-panel">
          <div className="diag-select-header">
            <h1>진단 테스트</h1>
            <p>수준에 맞는 진단 테스트를 선택하세요.</p>
          </div>

          {loading ? (
            <p style={{ textAlign: "center", color: "#6b5b53" }}>불러오는 중...</p>
          ) : tests.length === 0 ? (
            <p style={{ textAlign: "center", color: "#6b5b53" }}>
              등록된 진단 테스트가 없습니다.
            </p>
          ) : (
            <div className="diag-level-grid">
              {Object.entries(LEVEL_INFO).map(([key, info]) => {
                const test = tests.find((t) => t.levelId === key);
                if (!test) return null;
                const done = test.hasSubmitted;
                return (
                  <button
                    key={key}
                    className={`diag-level-card ${done ? "done" : ""}`}
                    onClick={() =>
                      done
                        ? navigate(`/tests/${test.testId}/report?from=diagnostic`)
                        : handleSelectTest(test)
                    }
                  >
                    <span className="material-symbols-outlined diag-level-icon">
                      {info.icon}
                    </span>
                    <div className="diag-level-label">{info.label}</div>
                    <div className="diag-level-desc">{info.desc}</div>
                    <div className="diag-level-meta">
                      {test.totalQuestions}문항 · {test.totalPoints}점
                    </div>
                    {done && (
                      <span className="diag-level-badge">
                        응시 완료 ({test.score}점) · 성적표 보기
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          <div className="diagnostic-actions" style={{ marginTop: 32, gap: 12, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <button className="btn primary" type="button" onClick={() => navigate("/diagnostic/v2")}
              style={{ width: "100%", maxWidth: 360 }}>
              <span className="material-symbols-outlined" style={{ marginRight: 6, verticalAlign: "middle" }}>neurology</span>
              온라인 역량 진단 (v2)
            </button>
            <button className="btn ghost" type="button" onClick={() => navigate("/start")}>
              돌아가기
            </button>
          </div>
        </main>
      </div>
    );
  }

  // ── online 단계: PDF + 답안 패널 통합 ──
  if (phase === "online") {
    return (
      <div className="diagnostic-page">
        <main className="diagnostic-panel" style={{ maxWidth: "100%", padding: "16px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ margin: 0 }}>{selectedTest?.title || "진단 테스트"}</h2>
            <button className="btn ghost" onClick={() => setPhase("print")}>
              돌아가기
            </button>
          </div>
          {onlineError && <p className="ts-error">{onlineError}</p>}
          <div className="test-online-split">
            {pdfUrl && (
              <div className="test-online-pdf" onContextMenu={e => e.preventDefault()}>
                <iframe src={pdfUrl} title="시험지 PDF" />
              </div>
            )}
            <AnswerInputPanel
              questions={questions}
              answers={answers}
              onAnswer={handleOnlineAnswer}
              onSubmit={handleOnlineSubmit}
              submitting={submitting}
            />
          </div>
        </main>
      </div>
    );
  }

  // ── print 단계: PDF 출력 + OMR 이동 ──
  return (
    <div
      className={`diagnostic-page minimal ${isObscured ? "obscured" : ""}`}
      onClick={requestFullscreen}
    >
      <div className="watermark" aria-hidden="true" />
      {isObscured && <div className="screen-shield" aria-hidden="true" />}
      <main className="diagnostic-panel">
        <div className="pdf-shell">
          <iframe className="pdf-viewer" src={pdfUrl} title="시험지 PDF" />
        </div>

        <div className="diagnostic-actions">
          <button className="btn primary" type="button" onClick={handlePrint}>
            출력하기
          </button>
          <button
            className="btn ghost"
            type="button"
            onClick={handleGoOmr}
            disabled={!printed}
          >
            답안 입력하기
          </button>
          <button className="btn ghost" type="button" onClick={handleOnlineTest}>
            온라인으로 풀기
          </button>
          <button
            className="btn ghost"
            type="button"
            onClick={() => {
              if (pdfUrl.startsWith("blob:")) URL.revokeObjectURL(pdfUrl);
              setPhase("select"); setPrinted(false); setPdfUrl(""); setSelectedTest(null);
            }}
          >
            다른 레벨 선택
          </button>
        </div>
      </main>
    </div>
  );
}

export default DiagnosticPrintPage;
