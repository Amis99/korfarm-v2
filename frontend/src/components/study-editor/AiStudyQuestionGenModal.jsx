import { useState } from "react";
import { apiPost } from "../../utils/adminApi";
import { pollJob } from "../../utils/aiGenJob";

/**
 * AI 문제 생성 모달 — 페이지 1장의 마크다운에서 4유형 문제 생성.
 * 합계 최대 30. 각 유형 0~25, 5의 배수 권장.
 *
 * props:
 *  - pageMarkdown
 *  - area / subArea / levelId
 *  - existingCheckpoints: 이미 추출된 출제 포인트 (재사용)
 *  - onClose()
 *  - onGenerated({checkpoints, questions})
 */
const COUNT_OPTIONS = [0, 5, 10, 15, 20, 25];

export default function AiStudyQuestionGenModal({
  pageMarkdown, area, subArea, levelId, existingCheckpoints,
  onClose, onGenerated,
}) {
  const [counts, setCounts] = useState({ mcq: 5, ox: 5, short: 5, essay: 5 });
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState("");
  const [error, setError] = useState("");

  const total = counts.mcq + counts.ox + counts.short + counts.essay;
  const overLimit = total > 30;

  const submit = async () => {
    if (total === 0) {
      setError("최소 1문제는 선택해주세요");
      return;
    }
    if (overLimit) {
      setError("페이지당 최대 30문제까지 생성 가능합니다");
      return;
    }
    setSubmitting(true);
    setError("");
    setProgress("출제 포인트 추출 중... (10~30초)");
    try {
      const submission = await apiPost("/v1/admin/ai-gen/study-question", {
        pageMarkdown,
        area: area || null,
        subArea: subArea || null,
        levelId: levelId || null,
        mcqCount: counts.mcq,
        oxCount: counts.ox,
        shortCount: counts.short,
        essayCount: counts.essay,
        existingCheckpoints: existingCheckpoints?.length ? existingCheckpoints : null,
      });
      setProgress("문제 생성 중... (30초~2분)");
      const result = await pollJob(submission.jobId, 60, 2000);
      if (result.status !== "completed") {
        throw new Error(result.errorMessage || `생성 실패 (${result.status})`);
      }
      const data = result.result || {};
      onGenerated({
        checkpoints: data.checkpoints || [],
        questions: data.questions || [],
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal admin-modal-wide" onClick={(e) => e.stopPropagation()}>
        <h2>🤖 AI 문제 생성</h2>
        <div style={{
          background: "rgba(212, 160, 76, 0.12)",
          border: "1px solid rgba(212, 160, 76, 0.4)",
          padding: "10px 14px",
          borderRadius: 8,
          marginBottom: 14,
          fontSize: 13,
          color: "#8a5e1c",
        }}>
          <strong>⚠️ 추가 과금 서비스</strong>
          <p style={{ margin: "4px 0 0", fontSize: 12 }}>
            출제 포인트 추출(Sonnet 4.6) + 문제 생성(Opus 4.7) 2단계 호출.
            30문제 기준 약 ₩300~1,500 예상. 정확한 금액은 AI 사용 내역 메뉴.
          </p>
          {existingCheckpoints?.length > 0 && (
            <p style={{ margin: "4px 0 0", fontSize: 12 }}>
              ✓ 출제 포인트 {existingCheckpoints.length}개 재사용 — 1단계 비용 절감
            </p>
          )}
        </div>

        <div className="admin-modal-section">
          <h3 style={{ fontSize: 13, color: "var(--admin-accent-strong)" }}>유형별 출제 개수 (합계 {total}/30)</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            <CountField label="객관식" value={counts.mcq} onChange={(v) => setCounts({ ...counts, mcq: v })} />
            <CountField label="OX" value={counts.ox} onChange={(v) => setCounts({ ...counts, ox: v })} />
            <CountField label="단답형" value={counts.short} onChange={(v) => setCounts({ ...counts, short: v })} />
            <CountField label="서술형" value={counts.essay} onChange={(v) => setCounts({ ...counts, essay: v })} />
          </div>
          {overLimit && (
            <p style={{ color: "#c0392b", fontSize: 12, margin: "8px 0 0" }}>
              합계가 30을 초과합니다 ({total}). 30 이하로 줄여주세요.
            </p>
          )}
        </div>

        {progress && (
          <div style={{
            background: "var(--admin-accent-soft)",
            padding: "10px 14px",
            borderRadius: 8,
            marginBottom: 10,
            fontSize: 13,
            color: "var(--admin-accent-strong)",
          }}>
            {progress}
          </div>
        )}
        {error && <div className="admin-error" style={{ marginBottom: 10 }}>{error}</div>}

        <div className="admin-modal-actions">
          <button
            type="button"
            className="admin-detail-btn"
            onClick={submit}
            disabled={submitting || total === 0 || overLimit}
          >
            {submitting ? "생성 중..." : `${total}문제 생성`}
          </button>
          <button
            type="button"
            className="admin-detail-btn secondary"
            onClick={onClose}
            disabled={submitting}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}

function CountField({ label, value, onChange }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ width: 60, fontSize: 13, color: "var(--admin-ink)" }}>{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value, 10))}
        style={{
          flex: 1, padding: "6px 10px",
          border: "1px solid var(--admin-stroke)", borderRadius: 6,
          background: "var(--admin-panel)", color: "var(--admin-ink)",
          fontSize: 13, fontFamily: "inherit",
        }}
      >
        {COUNT_OPTIONS.map(n => <option key={n} value={n}>{n}개</option>)}
      </select>
    </label>
  );
}
