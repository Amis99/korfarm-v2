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
const COUNT_OPTIONS = [0, 1, 2, 3, 4, 5, 10, 15, 20, 25];

export default function AiStudyQuestionGenModal({
  pageMarkdown, area, subArea, levelId, existingCheckpoints,
  onClose, onGenerated,
}) {
  const [counts, setCounts] = useState({ mcq: 5, ox: 5, short: 5, essay: 5 });
  const [tier, setTier] = useState("BASIC"); // BASIC | ADVANCED
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
    setProgress("출제 포인트 분석 중... (20~60초)");
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
        tier,
      });
      setProgress("문제 생성 중... (1~2분)");
      // pollJob 은 잡이 completed 일 때만 result 데이터(checkpoints/questions)를 반환.
      // failed 면 throw, 시간 초과도 throw — 정상 반환이면 곧 성공.
      const result = await pollJob(submission.jobId, 150, 2000);
      onGenerated({
        checkpoints: result.checkpoints || [],
        questions: result.questions || [],
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
          <strong>⚠️ 추가 과금 안내</strong>
          <p style={{ margin: "4px 0 0", fontSize: 12 }}>
            AI 호출이므로 추가 과금이 발생할 수 있습니다.
          </p>
          {existingCheckpoints?.length > 0 && (
            <p style={{ margin: "4px 0 0", fontSize: 12 }}>
              ✓ 기존 출제 포인트 {existingCheckpoints.length}개 재사용
            </p>
          )}
        </div>

        <div className="admin-modal-section">
          <h3 style={{ fontSize: 13, color: "var(--admin-accent-strong)" }}>AI 모델</h3>
          <div style={{ display: "flex", gap: 8 }}>
            <TierOption value="BASIC" current={tier} onChange={setTier}
              icon="⚡" label="기본"
              hint="빠르고 저렴" />
            <TierOption value="ADVANCED" current={tier} onChange={setTier}
              icon="✨" label="고급"
              hint="정밀·고품질 (시간 더 소요)" />
          </div>
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

function TierOption({ value, current, onChange, icon, label, hint }) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      style={{
        flex: 1,
        padding: "10px 14px",
        border: `2px solid ${active ? "var(--admin-accent)" : "var(--admin-stroke)"}`,
        background: active ? "var(--admin-accent-soft)" : "var(--admin-panel)",
        borderRadius: 10,
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: active ? "var(--admin-accent-strong)" : "var(--admin-ink)" }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 11, color: "var(--admin-muted)", marginTop: 2 }}>{hint}</div>
    </button>
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
