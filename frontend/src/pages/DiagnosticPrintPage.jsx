import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiGet, apiPost, API_BASE, TOKEN_KEY } from "../utils/api";
import AnswerInputPanel from "../components/AnswerInputPanel";
import "../styles/diagnostic.css";
import "../styles/test-storage.css";
import "../styles/test-online.css";

// 진단 시험 제한 시간: 60분 = 3600초
const TIME_LIMIT_SEC = 60 * 60;
const formatMmSs = (sec) => {
  const m = Math.floor(Math.max(0, sec) / 60);
  const s = Math.max(0, sec) % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

const TIER_INFO = {
  sohssure: { label: "소쉬르", desc: "초등 1~3학년" },
  frege: { label: "프레게", desc: "초등 4~6학년" },
  russell: { label: "러셀", desc: "중학생" },
  wittgenstein: { label: "비트겐슈타인", desc: "고등학생" },
};

// 진단 객관식 문항은 48개 고정
const TOTAL_Q = 48;
// AnswerInputPanel은 1~5 숫자 선택지를 사용 → 진단은 A~E 알파벳 사용
const NUM_TO_LETTER = { "1": "A", "2": "B", "3": "C", "4": "D", "5": "E" };

function DiagnosticPrintPage() {
  const { tier } = useParams();
  const navigate = useNavigate();
  const tierInfo = TIER_INFO[tier];

  const [paperId, setPaperId] = useState(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [pdfError, setPdfError] = useState("");
  const [answers, setAnswers] = useState({}); // {1: "1"|"2"|...|"5"}
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // 60분 카운트다운 타이머
  const [remainSec, setRemainSec] = useState(TIME_LIMIT_SEC);
  const [timerStarted, setTimerStarted] = useState(false);
  const submittedRef = useRef(false);

  // 빈 객관식 문항 메타 (AnswerInputPanel용)
  const questions = Array.from({ length: TOTAL_Q }, (_, i) => ({
    number: i + 1,
    type: "객관식",
    points: 10,
  }));

  // 진단 시험지 정보 + PDF 로드
  useEffect(() => {
    if (!tierInfo) {
      navigate("/diagnostic/v2");
      return;
    }
    let revoked = false;
    (async () => {
      try {
        const list = await apiGet("/v1/test-storage/diagnostic");
        const paper = (Array.isArray(list) ? list : []).find(t => t.levelId === tier);
        if (!paper) {
          setPdfError("진단 시험지가 등록되지 않았습니다. 본사에 문의해 주세요.");
          setLoading(false);
          return;
        }
        setPaperId(paper.testId);
        try {
          const ref = await apiGet(`/v1/test-storage/${paper.testId}/pdf`);
          if (revoked) return;
          // ref가 http(s) URL이면 직접 사용, 그 외는 file id로 간주
          if (typeof ref === "string" && /^https?:\/\//.test(ref)) {
            setPdfUrl(ref);
          } else {
            const token = sessionStorage.getItem(TOKEN_KEY);
            const resp = await fetch(`${API_BASE}/v1/files/${ref}/download`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (!resp.ok) throw new Error("PDF 다운로드 실패");
            const blob = await resp.blob();
            if (revoked) return;
            setPdfUrl(URL.createObjectURL(blob));
          }
        } catch {
          setPdfError("진단 시험지 PDF가 아직 등록되지 않았습니다. 답안지만 출력 후 응시해 주세요.");
        }
      } catch {
        setPdfError("진단 시험지 정보를 불러올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    })();
    return () => { revoked = true; };
  }, [tier, tierInfo, navigate]);

  useEffect(() => {
    return () => {
      if (pdfUrl?.startsWith("blob:")) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  const handleAnswer = (qNum, value) => {
    setAnswers(prev => {
      const key = String(qNum);
      if (value == null) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: String(value) };
    });
  };

  const handleSubmit = async (auto = false) => {
    if (submittedRef.current) return;
    setSubmitError("");
    if (!auto) {
      const unanswered = questions.filter(q => !answers[String(q.number)]);
      if (unanswered.length > 0) {
        const ok = window.confirm(
          `${unanswered.length}문항이 미응답입니다. 그래도 제출하시겠습니까?`
        );
        if (!ok) return;
      }
    }
    submittedRef.current = true;
    setSubmitting(true);
    try {
      // 1~5 숫자 → A~E 알파벳 변환
      const converted = {};
      for (const [k, v] of Object.entries(answers)) {
        converted[k] = NUM_TO_LETTER[v] || v;
      }
      const res = await apiPost("/v1/diagnostic/sessions/from-omr", {
        tier,
        answers: converted,
      });
      navigate(`/diagnostic/v2/report/${res.sessionId}`);
    } catch (err) {
      submittedRef.current = false;
      setSubmitError(err.message || "제출에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  // 카운트다운 타이머: 시작 버튼 누르면 즉시 카운트, 0이 되면 자동 제출
  useEffect(() => {
    if (!timerStarted) return;
    if (remainSec <= 0) {
      handleSubmit(true);
      return;
    }
    const id = setTimeout(() => setRemainSec(s => s - 1), 1000);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerStarted, remainSec]);

  if (!tierInfo) return null;
  if (loading) return <div className="diag-v2-loading">불러오는 중...</div>;

  return (
    <div className="diagnostic-page">
      <main className="diagnostic-panel" style={{ maxWidth: "100%", padding: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 12, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0 }}>
            [{tierInfo.label}] 진단 시험지 OMR 입력
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* 60분 카운트다운 타이머 */}
            <div
              className={`diag-timer ${remainSec <= 300 ? "warn" : ""}`}
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                fontWeight: 800,
                fontSize: 18,
                fontVariantNumeric: "tabular-nums",
                background: remainSec <= 300 ? "#fdecea" : "#eef5ff",
                color: remainSec <= 300 ? "#c0392b" : "#1f4e8a",
                border: `2px solid ${remainSec <= 300 ? "#e74c3c" : "#5a8dd6"}`,
              }}
            >
              ⏱ {formatMmSs(remainSec)}
            </div>
            {!timerStarted && (
              <button
                className="btn primary"
                onClick={() => setTimerStarted(true)}
                style={{ padding: "8px 16px", fontWeight: 700 }}
              >
                타이머 시작
              </button>
            )}
            <button className="btn ghost" onClick={() => navigate("/diagnostic/v2")}>
              돌아가기
            </button>
          </div>
        </div>

        <div className="diag-print-notice" style={{
          background: "#fff7e8",
          border: "1px solid #d4b980",
          borderRadius: 8,
          padding: "12px 16px",
          marginBottom: 12,
          fontSize: 14,
          lineHeight: 1.6,
        }}>
          <strong>응시 안내</strong><br />
          1) 시험지 PDF를 출력 또는 화면으로 보고 <strong>60분 안에</strong> 풀어주세요.<br />
          2) <strong>"타이머 시작"</strong>을 누르면 60분 카운트가 시작됩니다. 0이 되면 자동 제출됩니다.<br />
          3) 다 푼 후 종이 답안을 아래 OMR 칸에 옮겨 적고 <strong>제출하기</strong>를 누르세요.<br />
          4) 객관식 48문항입니다. 찍고 넘어간 문제는 풀이속도 측정이 정확하지 않을 수 있습니다.
        </div>

        {pdfError && (
          <p className="ts-error" style={{ marginBottom: 12 }}>{pdfError}</p>
        )}
        {submitError && (
          <p className="ts-error" style={{ marginBottom: 12 }}>{submitError}</p>
        )}

        <div className="test-online-split">
          {pdfUrl && (
            <div className="test-online-pdf" onContextMenu={e => e.preventDefault()}>
              <iframe src={pdfUrl} title={`[${tierInfo.label}] 진단 시험지`} />
            </div>
          )}
          <AnswerInputPanel
            questions={questions}
            answers={answers}
            onAnswer={handleAnswer}
            onSubmit={() => handleSubmit(false)}
            submitting={submitting}
            label="OMR 답안 입력"
            showPoints={false}
          />
        </div>
      </main>
    </div>
  );
}

export default DiagnosticPrintPage;
