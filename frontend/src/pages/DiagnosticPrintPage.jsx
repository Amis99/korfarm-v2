import { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { apiGet, apiPost, API_BASE, TOKEN_KEY } from "../utils/api";
import AnswerInputPanel from "../components/AnswerInputPanel";
import "../styles/diagnostic.css";
import "../styles/test-storage.css";
import "../styles/test-online.css";

// 진단 시험 제한 시간: 60분. 서버에서 deadline 받음. 클라이언트는 deadline - Date.now() 만 계산.
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

const TOTAL_Q = 48;
const NUM_TO_LETTER = { "1": "A", "2": "B", "3": "C", "4": "D", "5": "E" };
const LETTER_TO_NUM = { A: "1", B: "2", C: "3", D: "4", E: "5" };

// 알림음 — Web Audio API 로 단순 비프음 합성 (외부 파일 의존 X)
function playAlarmSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const beep = (start, dur, freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + start + 0.02);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + start + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + dur);
    };
    beep(0, 0.3, 880); beep(0.4, 0.3, 880); beep(0.8, 0.6, 660);
  } catch {}
}

function notifyTimerEnd(tierLabel) {
  if (typeof Notification === "undefined") return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification("진단 시험 시간 종료", {
      body: `${tierLabel} 진단 60분이 끝나 자동 제출되었습니다.`,
      icon: "/korfarm-logo.png",
      tag: "diagnostic-omr-timeup",
      requireInteraction: true,
    });
  } catch {}
}

function DiagnosticPrintPage() {
  const { tier } = useParams();
  const navigate = useNavigate();
  const tierInfo = TIER_INFO[tier];

  const [paperId, setPaperId] = useState(null);
  const [pdfUrl, setPdfUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [pdfError, setPdfError] = useState("");
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  // 서버 deadline 기반 타이머. setInterval 1초마다 잔여시간 재계산.
  const [deadline, setDeadline] = useState(null);     // Date 객체
  const [remainSec, setRemainSec] = useState(0);
  const [timerStarted, setTimerStarted] = useState(false);
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported",
  );
  const submittedRef = useRef(false);
  const saveTimerRef = useRef(null);
  // 자동 저장 상태 인디케이터 (2026-05-17 최민성 사고 fix) — "저장 중" / "저장됨" / "저장 실패"
  const [saveStatus, setSaveStatus] = useState("idle");  // idle | saving | saved | error
  const [lastSavedAt, setLastSavedAt] = useState(null);
  // 최신 답안 ref — beforeunload 시 sendBeacon 으로 보낼 때 사용
  const answersRef = useRef({});

  // 빈 객관식 문항 메타 (AnswerInputPanel용)
  const questions = Array.from({ length: TOTAL_Q }, (_, i) => ({
    number: i + 1,
    type: "객관식",
    points: 10,
  }));

  // 진단 시험지 정보 + PDF 로드 + 기존 draft 복원
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

        // 기존 OMR draft 복원
        try {
          const status = await apiGet(`/v1/diagnostic/omr-timer/status?tier=${tier}`);
          if (status?.started) {
            if (status.submitted && status.submittedSessionId) {
              navigate(`/diagnostic/v2/report/${status.submittedSessionId}`);
              return;
            }
            // 답안 복원 (A~E → 1~5)
            const restoredAnswers = {};
            for (const [k, v] of Object.entries(status.answers || {})) {
              restoredAnswers[k] = LETTER_TO_NUM[v] || v;
            }
            setAnswers(restoredAnswers);
            setDeadline(new Date(status.deadline));
            setTimerStarted(true);
            if (status.expired) {
              // 만료된 draft — 즉시 자동 제출 시도 (서버 scheduler 가 처리하기 전 클라이언트가 먼저 도착했을 수도)
              handleSubmit(true);
            }
          }
        } catch {}
      } catch {
        setPdfError("진단 시험지 정보를 불러올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    })();
    return () => { revoked = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tier, tierInfo, navigate]);

  useEffect(() => {
    return () => {
      if (pdfUrl?.startsWith("blob:")) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  // 서버 deadline 기준 잔여 시간 재계산 (setInterval). 슬립 모드 깨어남 시 visibilitychange 로 즉시 보정.
  useEffect(() => {
    if (!timerStarted || !deadline) return;
    const tick = () => {
      const sec = Math.max(0, Math.floor((deadline.getTime() - Date.now()) / 1000));
      setRemainSec(sec);
      if (sec <= 0) {
        handleSubmit(true);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    const onVisibility = () => { if (!document.hidden) tick(); };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timerStarted, deadline]);

  const handleAnswer = (qNum, value) => {
    if (!timerStarted) return; // 타이머 켜지 않으면 OMR 입력 차단 (사용자 명시 2026-05-16)
    setAnswers(prev => {
      const key = String(qNum);
      const next = { ...prev };
      if (value == null) {
        delete next[key];
      } else {
        next[key] = String(value);
      }
      answersRef.current = next;
      // 300ms debounce 자동 저장 (2026-05-17 최민성 사고 fix).
      //   - 1초 debounce 였는데 학생이 마지막 입력 직후 페이지 닫으면 저장 안 됨 → 짧게.
      //   - 실패 시 silent X — saveStatus 인디케이터로 학생에게 표시.
      //   - 매 입력 즉시 답안 수정/덮어쓰기 보장 (백엔드 saveOmrDraft 가 전체 answers 덮어씀).
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      setSaveStatus("saving");
      saveTimerRef.current = setTimeout(() => {
        const converted = {};
        for (const [k, v] of Object.entries(next)) {
          converted[k] = NUM_TO_LETTER[v] || v;
        }
        apiPost("/v1/diagnostic/omr-timer/save", { tier, answers: converted })
          .then(() => {
            setSaveStatus("saved");
            setLastSavedAt(new Date());
          })
          .catch(() => {
            setSaveStatus("error");
          });
      }, 300);
      return next;
    });
  };

  // 페이지 닫기·이탈 직전 마지막 저장 보장 (sendBeacon — 동기, 백그라운드 OK)
  useEffect(() => {
    if (!timerStarted) return;
    const beacon = () => {
      const cur = answersRef.current;
      if (!cur || Object.keys(cur).length === 0) return;
      const converted = {};
      for (const [k, v] of Object.entries(cur)) {
        converted[k] = NUM_TO_LETTER[v] || v;
      }
      try {
        const token = sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY) || "";
        const body = JSON.stringify({ tier, answers: converted });
        const blob = new Blob([body], { type: "application/json" });
        // navigator.sendBeacon 은 헤더 추가 불가 — fetch keepalive 로 대체 (Authorization 필요).
        fetch(`${API_BASE}/v1/diagnostic/omr-timer/save`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body, keepalive: true,
        }).catch(() => {});
      } catch {}
    };
    window.addEventListener("beforeunload", beacon);
    window.addEventListener("pagehide", beacon);
    return () => {
      window.removeEventListener("beforeunload", beacon);
      window.removeEventListener("pagehide", beacon);
    };
  }, [timerStarted, tier]);

  const handleStartTimer = async () => {
    try {
      // 모바일 알림 권한 요청 (타이머 종료 시 알림용)
      if (typeof Notification !== "undefined" && Notification.permission === "default") {
        try {
          const p = await Notification.requestPermission();
          setNotifPermission(p);
        } catch {}
      }
      const res = await apiPost("/v1/diagnostic/omr-timer/start", { tier });
      setDeadline(new Date(res.deadline));
      setTimerStarted(true);
    } catch (err) {
      alert(err.message || "타이머 시작 실패");
    }
  };

  const handleSubmit = useCallback(async (auto = false) => {
    if (submittedRef.current) return;
    setSubmitError("");
    if (!auto) {
      const unanswered = questions.filter(q => !answers[String(q.number)]);
      if (unanswered.length > 0) {
        const ok = window.confirm(
          `${unanswered.length}문항이 미응답입니다. 그래도 제출하시겠습니까?`,
        );
        if (!ok) return;
      }
    }
    submittedRef.current = true;
    setSubmitting(true);
    try {
      // 마지막 자동 저장 보장 — debounce 끊고 즉시 동기 저장
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
        saveTimerRef.current = null;
      }
      const converted = {};
      for (const [k, v] of Object.entries(answers)) {
        converted[k] = NUM_TO_LETTER[v] || v;
      }
      // save 실패 silent 였음 → submit 가 client answers 함께 보내 백엔드에서 덮어쓰기 보장.
      try {
        await apiPost("/v1/diagnostic/omr-timer/save", { tier, answers: converted });
      } catch {}
      // 2026-05-17 최민성 사고 fix: submit 에 answers 동봉 → draft 빈 채로 굳어도 채점 보장
      const res = await apiPost("/v1/diagnostic/omr-timer/submit", { tier, answers: converted });
      if (auto) {
        playAlarmSound();
        notifyTimerEnd(tierInfo?.label || "");
      }
      navigate(`/diagnostic/v2/report/${res.sessionId}`);
    } catch (err) {
      submittedRef.current = false;
      setSubmitError(err.message || "제출에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answers, tier, tierInfo, navigate, questions]);

  if (!tierInfo) return null;
  if (loading) return <div className="diag-v2-loading">불러오는 중...</div>;

  return (
    <div className="diagnostic-page diag-omr-page">
      <main className="diagnostic-panel" style={{ maxWidth: "100%", padding: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 12, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0 }}>
            [{tierInfo.label}] 진단 시험지 OMR 입력
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              className={`diag-timer ${remainSec <= 300 ? "warn" : ""}`}
              style={{
                padding: "8px 16px",
                borderRadius: 999,
                fontWeight: 800,
                fontSize: 18,
                fontVariantNumeric: "tabular-nums",
                background: remainSec <= 300 && timerStarted ? "#fdecea" : "#eef5ff",
                color: remainSec <= 300 && timerStarted ? "#c0392b" : "#1f4e8a",
                border: `2px solid ${remainSec <= 300 && timerStarted ? "#e74c3c" : "#5a8dd6"}`,
              }}
            >
              ⏱ {timerStarted ? formatMmSs(remainSec) : "60:00"}
            </div>
            {/* 자동 저장 상태 인디케이터 (2026-05-17) */}
            {timerStarted && (
              <div style={{
                padding: "6px 12px", borderRadius: 999, fontSize: 12, fontWeight: 700,
                background: saveStatus === "error" ? "#fdecea"
                  : saveStatus === "saving" ? "#fff8e1"
                  : "#e8f5e9",
                color: saveStatus === "error" ? "#c0392b"
                  : saveStatus === "saving" ? "#b7791f"
                  : "#2d6a4f",
                border: `1px solid ${
                  saveStatus === "error" ? "#e74c3c"
                  : saveStatus === "saving" ? "#d4a017"
                  : "#5cb85c"}`,
              }}>
                {saveStatus === "error" ? "⚠ 저장 실패 — 다시 입력해주세요"
                  : saveStatus === "saving" ? "⏳ 저장 중"
                  : saveStatus === "saved" && lastSavedAt
                    ? `✓ 저장됨 ${lastSavedAt.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
                    : "✓ 자동 저장 대기"}
              </div>
            )}
            {!timerStarted && (
              <button
                className="btn primary"
                onClick={handleStartTimer}
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
          1) 시험지 PDF를 출력하거나 화면으로 보고 <strong>60분 안에</strong> 풀어 주세요.<br />
          2) <strong>"타이머 시작"</strong>을 누른 뒤에야 OMR 입력이 가능합니다. 타이머는 기기 슬립 모드와 무관하게 서버 시각 기준으로 흐릅니다.<br />
          3) 60분이 지나면 입력된 답안까지로 <strong>자동 제출</strong>됩니다.<br />
          4) 답안은 입력 즉시 서버에 자동 저장되므로 새로고침해도 그대로 유지됩니다.<br />
          {notifPermission === "default" && timerStarted && (
            <span style={{ color: "#c0392b" }}>※ 알림 권한이 꺼져 있어 모바일 잠금 화면에서는 시간 종료 알림이 울리지 않을 수 있습니다.</span>
          )}
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
          <div style={{ position: "relative" }}>
            {!timerStarted && (
              <div style={{
                position: "absolute", inset: 0, zIndex: 10,
                background: "rgba(255,255,255,0.85)",
                display: "flex", alignItems: "center", justifyContent: "center",
                borderRadius: 8, pointerEvents: "auto",
              }}>
                <div style={{ textAlign: "center", color: "#5a4636" }}>
                  <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>
                    🔒 타이머를 시작해야<br />OMR 답안 입력이 가능합니다.
                  </p>
                  <button
                    className="btn primary"
                    onClick={handleStartTimer}
                    style={{ padding: "10px 24px", fontWeight: 700, fontSize: 15 }}
                  >
                    타이머 시작
                  </button>
                </div>
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
        </div>
      </main>
    </div>
  );
}

export default DiagnosticPrintPage;
