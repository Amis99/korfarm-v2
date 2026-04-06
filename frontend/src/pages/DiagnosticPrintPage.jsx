import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiGet, apiPost, API_BASE, TOKEN_KEY } from "../utils/api";
import AnswerInputPanel from "../components/AnswerInputPanel";
import "../styles/diagnostic.css";
import "../styles/test-online.css";

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

  const handleSubmit = async () => {
    setSubmitError("");
    const unanswered = questions.filter(q => !answers[String(q.number)]);
    if (unanswered.length > 0) {
      const ok = window.confirm(
        `${unanswered.length}문항이 미응답입니다. 그래도 제출하시겠습니까?`
      );
      if (!ok) return;
    }
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
      setSubmitError(err.message || "제출에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!tierInfo) return null;
  if (loading) return <div className="diag-v2-loading">불러오는 중...</div>;

  return (
    <div className="diagnostic-page">
      <main className="diagnostic-panel" style={{ maxWidth: "100%", padding: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>
            [{tierInfo.label}] 진단 시험지 OMR 입력
          </h2>
          <button className="btn ghost" onClick={() => navigate("/diagnostic/v2")}>
            돌아가기
          </button>
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
          1) 시험지 PDF를 출력해서 60분 안에 풀어주세요.<br />
          2) 다 푼 후 종이 답안을 아래 OMR 칸에 옮겨 적고 제출하세요.<br />
          3) 객관식 48문항입니다. 찍고 넘어간 문제는 풀이속도 측정이 정확하지 않을 수 있습니다.
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
            onSubmit={handleSubmit}
            submitting={submitting}
            label="OMR 답안 입력"
          />
        </div>
      </main>
    </div>
  );
}

export default DiagnosticPrintPage;
