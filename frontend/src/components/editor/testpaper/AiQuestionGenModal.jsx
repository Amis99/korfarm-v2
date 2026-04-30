import { useState } from "react";
import Modal from "../../Modal";
import { apiPost } from "../../../utils/adminApi";
import { pollJob } from "../../../utils/aiGenJob";
import {
  READ_QUESTION_TYPE_LABELS, LIT_QUESTION_TYPE_LABELS,
} from "../../../constants/questionBankCodes";

const BOX_FORMS = {
  "": "보기 없음",
  A: "A형 — 이론·개념 정리형",
  B: "B형 — 개념 정의형",
  C: "C형 — 작품 구조 안내형",
  D: "D형 — 기호 부여형 (Ⓐ·Ⓑ)",
  E: "E형 — 양립적 태도 제시형",
};

/**
 * AI 문항 생성 모달.
 * props:
 *   open / onClose
 *   testId
 *   passageText        # 이 지문 텍스트 (지문 없는 문항이면 빈 문자열)
 *   passageId          # passageId (없으면 null)
 *   area / subArea / levelId
 *   onGenerated(questionObj, review)  # 응답 받으면 호출
 */
export default function AiQuestionGenModal({
  open, onClose, testId, passageText, passageId, area, subArea, levelId, onGenerated,
}) {
  const [type, setType] = useState("MULTI_CHOICE");
  const [questionType, setQuestionType] = useState("");
  const [boxType, setBoxType] = useState("");
  const [needsCondition, setNeedsCondition] = useState(false);
  const [conditionText, setConditionText] = useState("");
  const [attachment, setAttachment] = useState("");
  const [stemHint, setStemHint] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reviewResult, setReviewResult] = useState(null);
  const [tier, setTier] = useState("BASIC");

  const isEssay = type === "ESSAY";
  const QTYPE_OPTS = area === "LIT" ? LIT_QUESTION_TYPE_LABELS : READ_QUESTION_TYPE_LABELS;

  const handleGenerate = async () => {
    setBusy(true);
    setError("");
    setReviewResult(null);
    try {
      const body = {
        testId,
        passageText: passageText || "",
        passageId: passageId || null,
        area,
        subArea: subArea || null,
        levelId: levelId || null,
        type,
        questionType: questionType || null,
        boxType: !isEssay ? (boxType || null) : null,
        needsCondition: isEssay ? needsCondition : false,
        conditionText: isEssay && needsCondition ? conditionText : null,
        attachment: attachment || null,
        stemHint: stemHint || null,
        tier,
      };
      const submit = await apiPost("/v1/admin/ai-gen/question", body);
      const jobId = submit?.jobId ?? submit?.job_id;
      if (!jobId) throw new Error("jobId 누락");
      // 검증 포함이라 길게 — 최대 8분
      const res = await pollJob(jobId, 240);
      onGenerated?.(res.question, {
        passed: res.passed,
        score: res.reviewScore,
        issues: res.reviewIssues || [],
        suggestedFixes: res.suggestedFixes || [],
        retryCount: res.retryCount,
      });
      // passed=false면 모달 유지 + issues 표시. true면 닫기.
      if (res.passed) {
        onClose?.();
      } else {
        setReviewResult({
          passed: false,
          score: res.reviewScore,
          issues: res.reviewIssues || [],
          suggestedFixes: res.suggestedFixes || [],
          retryCount: res.retryCount,
        });
      }
    } catch (e) {
      setError(e.message || "생성 실패");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="🤖 AI 문항 생성" size="lg">
      <div style={{ display: "flex", flexDirection: "column", gap: 12, fontSize: 13 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: "#1f4a37" }}>AI 모델</div>
          <div style={{ display: "flex", gap: 8 }}>
            <TierBtn value="BASIC" current={tier} onClick={setTier} icon="⚡" label="기본" hint="빠르고 저렴" />
            <TierBtn value="ADVANCED" current={tier} onClick={setTier} icon="✨" label="고급" hint="정밀·고품질 (시간 더 소요)" />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
          <Field label="유형">
            <select value={type} onChange={(e) => setType(e.target.value)} style={inpStyle}>
              <option value="MULTI_CHOICE">객관식</option>
              <option value="ESSAY">서술형</option>
            </select>
          </Field>
          <Field label="문제 유형">
            <select value={questionType} onChange={(e) => setQuestionType(e.target.value)} style={inpStyle}>
              <option value="">자동/미지정</option>
              {Object.entries(QTYPE_OPTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </Field>
          {!isEssay && (
            <Field label="<보기> 양식">
              <select value={boxType} onChange={(e) => setBoxType(e.target.value)} style={inpStyle}>
                {Object.entries(BOX_FORMS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
          )}
          {isEssay && (
            <Field label="조건 사용">
              <select value={needsCondition ? "yes" : "no"} onChange={(e) => setNeedsCondition(e.target.value === "yes")} style={inpStyle}>
                <option value="no">없음</option>
                <option value="yes">있음 (아래 작성)</option>
              </select>
            </Field>
          )}
        </div>

        {isEssay && needsCondition && (
          <Field label="조건 본문">
            <textarea
              value={conditionText}
              onChange={(e) => setConditionText(e.target.value)}
              placeholder="예: '~의 효과·기능·의미를 모두 포함하여 60자 이내로 서술할 것'"
              style={{ ...inpStyle, minHeight: 60, resize: "vertical", fontFamily: "inherit" }}
            />
          </Field>
        )}

        <Field label="첨부 자료 — 해설/모범답안/작품 배경 (선택)">
          <textarea
            value={attachment}
            onChange={(e) => setAttachment(e.target.value)}
            placeholder="작품 해설·역사적 배경·모범답안 등을 직접 입력하면 출제 정확도 ↑"
            style={{ ...inpStyle, minHeight: 80, resize: "vertical", fontFamily: "inherit" }}
          />
        </Field>

        <Field label="발문 가이드 (선택)">
          <input
            value={stemHint}
            onChange={(e) => setStemHint(e.target.value)}
            placeholder="예: '~에 대한 이해로 가장 적절한 것은?'"
            style={inpStyle}
          />
        </Field>

        {reviewResult && !reviewResult.passed && (
          <div style={{
            padding: 10, borderRadius: 6,
            background: "rgba(245,158,11,0.12)",
            border: "1px solid rgba(245,158,11,0.4)",
            fontSize: 12, color: "#fbbf24",
          }}>
            <div style={{ marginBottom: 6 }}>
              ⚠ 학생 페르소나 검증 미통과 (점수 {reviewResult.score}, 재시도 {reviewResult.retryCount}회).
              생성된 문항은 시험지에 추가됐지만 다음 이슈가 있습니다:
            </div>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              {reviewResult.issues.map((it, i) => <li key={i}>{it}</li>)}
            </ul>
            {reviewResult.suggestedFixes.length > 0 && (
              <>
                <div style={{ marginTop: 6 }}>제안:</div>
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {reviewResult.suggestedFixes.map((it, i) => <li key={i}>{it}</li>)}
                </ul>
              </>
            )}
          </div>
        )}

        {error && <div style={{ color: "#ef4444", fontSize: 12 }}>{error}</div>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onClose} disabled={busy} className="ce-btn ce-btn-secondary">
            {reviewResult ? "닫기" : "취소"}
          </button>
          <button onClick={handleGenerate} disabled={busy} className="ce-btn ce-btn-primary">
            {busy ? "생성 중... (검증 포함 30~60초)" : "🤖 생성"}
          </button>
        </div>
        <div style={{ fontSize: 11, color: "var(--muted)" }}>
          학생 페르소나 검증 자동 (재시도 최대 2회) · 통과 시 모든 필드 자동 채움
        </div>
      </div>
    </Modal>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span style={{ fontSize: 11, color: "var(--muted)" }}>{label}</span>
      {children}
    </label>
  );
}

function TierBtn({ value, current, onClick, icon, label, hint }) {
  const active = current === value;
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      style={{
        flex: 1,
        padding: "10px 14px",
        border: `2px solid ${active ? "#2d6a4f" : "rgba(31,58,44,0.18)"}`,
        background: active ? "rgba(45,106,79,0.10)" : "#ffffff",
        borderRadius: 10,
        cursor: "pointer",
        fontFamily: "inherit",
        textAlign: "left",
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: active ? "#1f4a37" : "#1a2920" }}>
        {icon} {label}
      </div>
      <div style={{ fontSize: 11, color: "#5e7060", marginTop: 2 }}>{hint}</div>
    </button>
  );
}

const inpStyle = {
  padding: "6px 10px", fontSize: 13,
  background: "var(--bg)", color: "var(--text)",
  border: "1px solid var(--stroke)", borderRadius: 4,
};
