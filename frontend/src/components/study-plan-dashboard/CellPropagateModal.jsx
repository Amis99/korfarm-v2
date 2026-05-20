import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../../utils/api";

/**
 * 학습 계획표 셀 단위 복제 모달 (Rev.2 / 2026-05-20).
 *
 * 매트릭스 한 셀의 학습 내용을 다른 학생들에게 일괄 복제.
 * 정책: 라벨이 같은 행/열이 있으면 그 위치 셀에 학습 내용 병합,
 *       없으면 행/열을 자동 추가 후 셀 채움.
 *       결과·산출물(점수/제출물/wisdom_posts/test_submissions)은 복제 제외.
 *
 * Props:
 *   cell, scope, asset    매트릭스의 source cell + 자산 정보
 *   currentUserId         현재 학생(자기 자신 제외)
 *   onClose
 *   onApplied             복제 성공 시 호출
 */
export default function CellPropagateModal({ cell, scope, asset, currentUserId, onClose, onApplied }) {
  const [targetScope, setTargetScope] = useState("class");
  const [classId, setClassId] = useState("");
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [pickedStudents, setPickedStudents] = useState(new Set());

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    apiGet("/v1/admin/classes")
      .then((d) => setClasses(Array.isArray(d) ? d : []))
      .catch(() => setClasses([]));
    apiGet("/v1/admin/students")
      .then((d) => setStudents(Array.isArray(d) ? d : []))
      .catch(() => setStudents([]));
  }, []);

  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const id = s.id || s.userId;
      return id && id !== currentUserId;
    });
  }, [students, currentUserId]);

  const toggle = (set, id) => {
    const n = new Set(set);
    if (n.has(id)) n.delete(id);
    else n.add(id);
    return n;
  };

  const validate = () => {
    if (targetScope === "class" && !classId) return "수강반을 선택해 주세요.";
    if (targetScope === "users" && pickedStudents.size === 0) return "학생을 1명 이상 선택해 주세요.";
    return null;
  };

  const submit = async () => {
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const body = { targetScope };
      if (targetScope === "class") body.classId = classId;
      if (targetScope === "users") body.userIds = Array.from(pickedStudents);
      const res = await apiPost(`/v1/admin/study-plans/cells/${cell.cellId}/propagate`, body);
      const applied = res?.appliedCount ?? 0;
      const merged = res?.overwrittenCount ?? 0;
      const eligible = res?.eligibleUsers ?? 0;
      const withPlan = res?.usersWithPlan ?? 0;
      const noPlan = res?.skippedNoPlan ?? 0;
      const lines = [
        `대상 학생 ${eligible}명 (plan 보유 ${withPlan}명)`,
        `새 행/열 추가 ${applied}건 / 기존 셀 병합 ${merged}건`,
      ];
      if (noPlan > 0) lines.push(`⚠ plan 자동 생성 실패 ${noPlan}명 — 가입 처리 확인 필요`);
      if (eligible === 0) lines.push("ℹ 대상 학생이 없습니다 (자기 자신 제외).");
      alert(lines.join("\n"));
      onApplied?.();
      onClose?.();
    } catch (e) {
      setError(e?.message || "셀 복제 실패");
    } finally {
      setSubmitting(false);
    }
  };

  // 소스 셀 요약
  const assetTypeLabel = {
    korfarm: "국어농장",
    activity: "학습활동",
    test: "테스트",
    writing: "글쓰기",
  }[asset?.assetType] || asset?.assetType || "—";

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal admin-modal-wide" onClick={(e) => e.stopPropagation()}>
        <h2>이 셀 다른 학생에게 복제</h2>

        {/* 소스 셀 요약 */}
        <div className="admin-modal-section" style={{ background: "var(--admin-panel-light, #f5f9f3)", padding: 12, borderRadius: 8 }}>
          <div style={{ fontSize: 12, color: "var(--admin-muted)", marginBottom: 6 }}>복제할 셀</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{
              padding: "2px 8px",
              borderRadius: 12,
              background: "var(--admin-accent-soft)",
              color: "var(--admin-accent-strong)",
              fontSize: 11,
              fontWeight: 700,
            }}>{assetTypeLabel}</span>
            <span style={{ fontWeight: 600 }}>{scope?.label} / {asset?.label}</span>
            {cell?.assignedLabel && (
              <span style={{ color: "var(--admin-muted)", fontSize: 13 }}>· {cell.assignedLabel}</span>
            )}
            {cell?.dueAt && (
              <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--admin-muted)" }}>
                마감 {String(cell.dueAt).slice(0, 10)}
              </span>
            )}
          </div>
          {(cell?.assignments?.length || 0) > 0 && (
            <div style={{ marginTop: 8, fontSize: 12, color: "var(--admin-muted)" }}>
              배정 콘텐츠 {cell.assignments.length}건
            </div>
          )}
        </div>

        <div className="admin-modal-section">
          <h3>복제 대상</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input
                type="radio"
                name="cellPropTargetScope"
                checked={targetScope === "org"}
                onChange={() => setTargetScope("org")}
              /> 같은 기관 전원
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input
                type="radio"
                name="cellPropTargetScope"
                checked={targetScope === "class"}
                onChange={() => setTargetScope("class")}
              /> 같은 수강반
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input
                type="radio"
                name="cellPropTargetScope"
                checked={targetScope === "users"}
                onChange={() => setTargetScope("users")}
              /> 선택 학생
            </label>
          </div>

          {targetScope === "class" && (
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              style={{
                marginTop: 8,
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid rgba(31,58,44,0.18)",
                background: "var(--admin-panel, #fff)",
                color: "var(--admin-ink)",
                width: "100%",
              }}
            >
              <option value="">수강반 선택</option>
              {classes.map((c) => {
                const id = c.id || c.classId || c.class_id;
                return <option key={id} value={id}>{c.name}</option>;
              })}
            </select>
          )}

          {targetScope === "users" && (
            <div style={{ maxHeight: 200, overflowY: "auto", border: "1px solid var(--admin-stroke)", borderRadius: 6, padding: 8, marginTop: 8 }}>
              {filteredStudents.map((s) => {
                const id = s.id || s.userId;
                return (
                  <label key={id} style={{ display: "flex", gap: 6, padding: "4px 0", alignItems: "center" }}>
                    <input
                      type="checkbox"
                      checked={pickedStudents.has(id)}
                      onChange={() => setPickedStudents((p) => toggle(p, id))}
                    />
                    <span>{s.name || s.userName || id}</span>
                    {s.school && <span style={{ color: "var(--admin-muted)", fontSize: 12 }}>· {s.school}</span>}
                  </label>
                );
              })}
              {filteredStudents.length === 0 && (
                <div style={{ color: "var(--admin-muted)", fontSize: 12 }}>학생 목록이 비어있습니다.</div>
              )}
            </div>
          )}
        </div>

        <div className="admin-modal-section" style={{ fontSize: 12, color: "var(--admin-muted)", background: "rgba(33,150,243,0.06)", padding: 10, borderRadius: 6 }}>
          ※ 학습 내용(콘텐츠·마감일·라벨)만 복제됩니다. 점수·제출물·작성한 글 같은 결과는 복제되지 않습니다.<br />
          같은 라벨의 행/열이 대상 학생에게 이미 있으면 그 위치 셀에 학습 내용을 병합하고, 없으면 행/열을 자동으로 추가합니다.
        </div>

        {error && (
          <p className="admin-detail-note error" style={{ marginTop: 8 }}>{error}</p>
        )}

        <div className="admin-modal-actions">
          <button className="admin-detail-btn secondary" onClick={onClose}>취소</button>
          <button className="admin-detail-btn" onClick={submit} disabled={submitting}>
            {submitting ? "복제 중..." : "이 셀 복제"}
          </button>
        </div>
      </div>
    </div>
  );
}
