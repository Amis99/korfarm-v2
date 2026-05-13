import { useEffect, useState } from "react";
import { apiPost } from "../../utils/adminApi";

/**
 * 시험 정보 AI 분석 모달.
 *
 * Flow (배치 호출):
 *  1) /charge — 자몹 1자몹 차감 + jobId·모델 받음 (HQ_ADMIN 은 무료)
 *  2) 지문별 묶음 호출 — /ai-analysis/batch (scope=passage_block, passageId, questionIds)
 *  3) 지문 없는 독립 문항이 있으면 4~5개씩 묶어 /batch (scope=questions_solo)
 *  4) 완료 시 onDone() 호출 (페이지 reload 또는 payload 갱신)
 *
 * 토큰 절감: 48문항 시험지 → 약 6~10회 호출 (단일 호출 대비 1/5~1/8).
 *
 * Props:
 *   open, onClose, onDone, testId,
 *   passages: [{id, ...}], questions: [{id, number, passageId, ...}]
 */
const SOLO_BATCH_SIZE = 5; // 지문 없는 독립 문항 묶음 크기

export default function AiTestAnalysisModal({ open, onClose, onDone, testId, passages = [], questions = [] }) {
  const [mode, setMode] = useState("full");
  const [phase, setPhase] = useState("setup"); // setup | running | done | error
  const [errorMsg, setErrorMsg] = useState("");
  const [progress, setProgress] = useState({ idx: 0, total: 0, label: "" });
  const [failed, setFailed] = useState([]);
  const [model, setModel] = useState("");

  useEffect(() => {
    if (!open) {
      setPhase("setup");
      setErrorMsg("");
      setProgress({ idx: 0, total: 0, label: "" });
      setFailed([]);
    }
  }, [open]);

  if (!open) return null;

  // 배치 묶음 구성: 지문별 묶음 + 독립 문항 묶음(SOLO_BATCH_SIZE 단위)
  const batches = [];
  const questionsByPassage = new Map();
  const soloQuestions = [];
  for (const q of questions) {
    const pid = q.passageId;
    if (pid && passages.some((p) => p.id === pid)) {
      if (!questionsByPassage.has(pid)) questionsByPassage.set(pid, []);
      questionsByPassage.get(pid).push(q);
    } else {
      soloQuestions.push(q);
    }
  }
  for (const p of passages) {
    const qs = questionsByPassage.get(p.id) || [];
    batches.push({ scope: "passage_block", passage: p, questions: qs });
  }
  for (let i = 0; i < soloQuestions.length; i += SOLO_BATCH_SIZE) {
    batches.push({
      scope: "questions_solo",
      passage: null,
      questions: soloQuestions.slice(i, i + SOLO_BATCH_SIZE),
    });
  }
  const totalUnits = batches.length;

  const run = async () => {
    setErrorMsg("");
    setFailed([]);
    setPhase("running");
    try {
      // 1) charge (자몹 차감 1회)
      const charge = await apiPost(`/v1/admin/test-papers/${testId}/ai-analysis/charge`, { mode });
      setModel(charge?.model || "");

      // 2) 배치 호출 (지문 묶음 + 독립 문항 묶음)
      let idx = 0;
      for (const b of batches) {
        idx++;
        const label = b.scope === "passage_block"
          ? `지문 묶음 분석 (${idx}/${totalUnits}) — ${b.passage?.id || ""} + 문항 ${b.questions.length}개`
          : `독립 문항 묶음 분석 (${idx}/${totalUnits}) — 문항 ${b.questions.length}개`;
        setProgress({ idx, total: totalUnits, label });
        try {
          await apiPost(`/v1/admin/test-papers/${testId}/ai-analysis/batch`, {
            mode,
            scope: b.scope,
            passageId: b.passage?.id || null,
            questionIds: b.questions.map((q) => q.id),
          });
        } catch (e) {
          const targetLabel = b.scope === "passage_block"
            ? `지문 ${b.passage?.id || ""}`
            : `문항 묶음 #${idx}`;
          setFailed((prev) => [...prev, `${targetLabel}: ${e?.message || "실패"}`]);
        }
      }
      setPhase("done");
    } catch (e) {
      setErrorMsg(e?.message || "분석 시작 실패 (자몹 잔액 부족 등)");
      setPhase("error");
    }
  };

  return (
    <div onClick={phase === "setup" || phase === "error" || phase === "done" ? onClose : undefined}
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center" }}
    >
      <div onClick={(e) => e.stopPropagation()}
        style={{ width: "min(560px, 92vw)", background: "#fff", borderRadius: 10, padding: 24, boxShadow: "0 20px 60px rgba(0,0,0,0.35)" }}
      >
        <h2 style={{ margin: "0 0 8px", fontSize: 18 }}>🤖 시험 정보 AI 분석</h2>
        <p style={{ color: "#666", fontSize: 13, marginTop: 0 }}>
          지문 영역·세부영역·주제, 문항별 분류·정답 벡터·선지 해설·함정 패턴·약점 벡터·출제 의도·해설을 AI 가 자동으로 채웁니다.
        </p>

        {phase === "setup" && (
          <>
            <div style={{ margin: "16px 0" }}>
              <label style={radioLabel}>
                <input type="radio" checked={mode === "full"} onChange={() => setMode("full")} />
                <span><strong>전체 덮어쓰기</strong> — 이미 채워진 값도 모두 새로 분석.</span>
              </label>
              <label style={radioLabel}>
                <input type="radio" checked={mode === "empty"} onChange={() => setMode("empty")} />
                <span><strong>빈 필드만 채우기</strong> — 이미 채워진 값은 유지, 비어 있는 필드만.</span>
              </label>
            </div>
            <div style={{ background: "#fff7e8", border: "1px solid #d4b980", borderRadius: 6, padding: 12, fontSize: 12, color: "#7a5a00", marginBottom: 12 }}>
              총 분석 대상: 지문 {passages.length}편 · 문항 {questions.length}개<br />
              배치 호출 단위: <strong>{totalUnits}회</strong> (지문 묶음 {passages.length}개 + 독립 문항 묶음 {Math.ceil(soloQuestions.length / SOLO_BATCH_SIZE)}개)
            </div>
            {errorMsg && <p style={{ color: "#c0392b", fontSize: 13 }}>{errorMsg}</p>}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={onClose} style={btnSecondary}>취소</button>
              <button onClick={run} style={btnPrimary} disabled={totalUnits === 0}>분석 시작</button>
            </div>
          </>
        )}

        {phase === "running" && (
          <>
            <p style={{ margin: "16px 0 8px", fontSize: 14, fontWeight: 600 }}>{progress.label}</p>
            <div style={{ background: "#eee", height: 10, borderRadius: 5, overflow: "hidden" }}>
              <div style={{
                width: `${progress.total > 0 ? (progress.idx / progress.total) * 100 : 0}%`,
                background: "#2d6a4f", height: "100%", transition: "width 200ms",
              }} />
            </div>
            <p style={{ marginTop: 8, fontSize: 12, color: "#666" }}>
              {progress.idx} / {progress.total} {model && `· 모델: ${model}`}
            </p>
            {failed.length > 0 && (
              <div style={{ marginTop: 10, padding: 8, background: "#fff5f5", border: "1px solid #f6c2c2", borderRadius: 6, fontSize: 12, color: "#8a3a3a" }}>
                <strong>실패한 항목 {failed.length}건</strong>: 끝나면 다시 시도하세요.
              </div>
            )}
          </>
        )}

        {phase === "done" && (
          <>
            <p style={{ margin: "16px 0 8px", fontSize: 14, color: "#2d6a4f", fontWeight: 600 }}>
              ✅ 분석 완료 ({progress.total - failed.length}/{progress.total} 성공)
            </p>
            {failed.length > 0 && (
              <div style={{ padding: 8, background: "#fff5f5", border: "1px solid #f6c2c2", borderRadius: 6, fontSize: 12, color: "#8a3a3a", marginBottom: 12 }}>
                <strong>실패 {failed.length}건</strong>: 분석 다시 시작 시 빈 필드만 채우기 모드로 재시도 권장.
                <ul style={{ margin: "6px 0 0 16px" }}>
                  {failed.slice(0, 5).map((f, i) => <li key={i}>{f}</li>)}
                  {failed.length > 5 && <li>... 외 {failed.length - 5}건</li>}
                </ul>
              </div>
            )}
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => { onDone?.(); onClose(); }} style={btnPrimary}>확인 (페이지 새로고침)</button>
            </div>
          </>
        )}

        {phase === "error" && (
          <>
            <p style={{ margin: "16px 0", color: "#c0392b", fontSize: 13 }}>{errorMsg}</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={onClose} style={btnSecondary}>닫기</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const radioLabel = { display: "flex", gap: 8, alignItems: "flex-start", padding: "8px 0", fontSize: 13, cursor: "pointer" };
const btnPrimary = { padding: "8px 18px", background: "#2d6a4f", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontWeight: 600 };
const btnSecondary = { padding: "8px 18px", background: "#fff", color: "#333", border: "1px solid #ccc", borderRadius: 6, cursor: "pointer" };
