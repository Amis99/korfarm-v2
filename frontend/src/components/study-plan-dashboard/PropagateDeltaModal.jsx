import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../../utils/api";
import { useAuth } from "../../hooks/useAuth";

/**
 * 학생 plan 의 행/열을 다른 학생들에게 일괄 적용.
 * Props:
 *   planId       원본 plan
 *   plan         원본 plan 객체 (scopes, assets 추출용)
 *   defaultScopeId / defaultAssetId   가장 최근 추가된 항목 자동 선택
 *   currentUserId   현재 학생 (자기 자신 제외)
 *   onClose
 *   onApplied    적용 성공 시 호출
 */
export default function PropagateDeltaModal({
  planId, plan, defaultScopeId, defaultAssetId, currentUserId, onClose, onApplied,
}) {
  const { user } = useAuth();
  const isHq = (user?.roles || []).includes("HQ_ADMIN");

  const [targetScope, setTargetScope] = useState("class"); // org/class/users
  const [classId, setClassId] = useState("");
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [pickedStudents, setPickedStudents] = useState(new Set());

  const [scopeIds, setScopeIds] = useState(new Set(defaultScopeId ? [defaultScopeId] : []));
  const [assetIds, setAssetIds] = useState(new Set(defaultAssetId ? [defaultAssetId] : []));

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [conflicts, setConflicts] = useState(null); // null | [{userId, userName, scopeLabel, assetLabel}]
  const [conflictPolicy, setConflictPolicy] = useState(null); // skip | overwrite

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
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  };

  const buildBody = () => {
    const body = {
      targetScope,
      scopeIds: Array.from(scopeIds),
      assetIds: Array.from(assetIds),
    };
    if (targetScope === "class") body.classId = classId;
    if (targetScope === "users") body.userIds = Array.from(pickedStudents);
    if (conflictPolicy) body.conflictPolicy = conflictPolicy;
    return body;
  };

  const validate = () => {
    if (scopeIds.size === 0 && assetIds.size === 0) {
      return "복제할 행 또는 열을 1개 이상 선택해 주세요.";
    }
    if (targetScope === "class" && !classId) return "수강반을 선택해 주세요.";
    if (targetScope === "users" && pickedStudents.size === 0) return "학생을 1명 이상 선택해 주세요.";
    return null;
  };

  const submit = async (policy) => {
    const v = validate();
    if (v) { setError(v); return; }
    setSubmitting(true);
    setError(null);
    try {
      const body = { ...buildBody(), ...(policy ? { conflictPolicy: policy } : {}) };
      const res = await apiPost(`/v1/admin/study-plans/${planId}/propagate-delta`, body);
      // 충돌 응답
      if (res?.conflicts && Array.isArray(res.conflicts) && res.conflicts.length > 0 && (res.appliedCount === 0 || res.appliedCount == null)) {
        setConflicts(res.conflicts);
      } else {
        const applied = res?.appliedCount ?? res?.applied ?? "?";
        const skipped = res?.skippedCount ?? 0;
        const overwritten = res?.overwrittenCount ?? 0;
        alert(`완료: 적용 ${applied}건 / 스킵 ${skipped}건 / 덮어쓰기 ${overwritten}건`);
        onApplied?.();
        onClose?.();
      }
    } catch (e) {
      setError(e?.message || "일괄 적용 실패");
    } finally {
      setSubmitting(false);
    }
  };

  // 충돌 응답 받은 뒤 정책 결정 → 재호출
  const resolveConflict = (policy) => {
    setConflictPolicy(policy);
    setConflicts(null);
    submit(policy);
  };

  // 모달 1 — 충돌 모달
  if (conflicts) {
    return (
      <div className="admin-modal-overlay" onClick={() => setConflicts(null)}>
        <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
          <h2>중복 항목 발견</h2>
          <p style={{ color: "var(--admin-muted)", fontSize: 13 }}>
            다음 {conflicts.length}건의 학생들에게 같은 라벨이 이미 있습니다.
          </p>
          <div style={{ maxHeight: 240, overflowY: "auto", border: "1px solid var(--admin-stroke)", borderRadius: 6, marginTop: 8 }}>
            <table className="admin-detail-table">
              <thead>
                <tr><th>학생</th><th>중복 항목</th></tr>
              </thead>
              <tbody>
                {conflicts.map((c, i) => (
                  <tr key={i}>
                    <td>{c.userName || c.userId}</td>
                    <td>{c.scopeLabel || c.assetLabel || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-modal-actions" style={{ marginTop: 12 }}>
            <button className="admin-detail-btn secondary" onClick={() => setConflicts(null)}>취소</button>
            <button className="admin-detail-btn ghost" onClick={() => resolveConflict("skip")} disabled={submitting}>중복은 건너뛰기</button>
            <button className="admin-detail-btn" onClick={() => resolveConflict("overwrite")} disabled={submitting}>덮어쓰기</button>
          </div>
        </div>
      </div>
    );
  }

  // 메인 모달
  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal admin-modal-wide" onClick={(e) => e.stopPropagation()}>
        <h2>다른 학생에게 동일하게 추가</h2>

        <div className="admin-modal-section">
          <h3>대상</h3>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input
                type="radio"
                name="targetScope"
                checked={targetScope === "org"}
                onChange={() => setTargetScope("org")}
              /> 같은 기관 전원
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input
                type="radio"
                name="targetScope"
                checked={targetScope === "class"}
                onChange={() => setTargetScope("class")}
              /> 같은 수강반
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <input
                type="radio"
                name="targetScope"
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
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
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

        <div className="admin-modal-section">
          <h3>적용할 행/열</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div style={{ fontSize: 12, color: "var(--admin-muted)", marginBottom: 4 }}>행 (범위)</div>
              {(plan?.scopes || []).map((s) => (
                <label key={s.id} style={{ display: "flex", gap: 6, padding: "4px 0", alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={scopeIds.has(s.id)}
                    onChange={() => setScopeIds((p) => toggle(p, s.id))}
                  />
                  <span>{s.label}</span>
                </label>
              ))}
              {(plan?.scopes || []).length === 0 && (
                <div style={{ color: "var(--admin-muted)", fontSize: 12 }}>행이 없습니다.</div>
              )}
            </div>
            <div>
              <div style={{ fontSize: 12, color: "var(--admin-muted)", marginBottom: 4 }}>열 (자산)</div>
              {(plan?.assets || []).map((a) => (
                <label key={a.id} style={{ display: "flex", gap: 6, padding: "4px 0", alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={assetIds.has(a.id)}
                    onChange={() => setAssetIds((p) => toggle(p, a.id))}
                  />
                  <span>{a.label}</span>
                </label>
              ))}
              {(plan?.assets || []).length === 0 && (
                <div style={{ color: "var(--admin-muted)", fontSize: 12 }}>열이 없습니다.</div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <p className="admin-detail-note error" style={{ marginTop: 8 }}>{error}</p>
        )}

        <div className="admin-modal-actions">
          <button className="admin-detail-btn secondary" onClick={onClose}>취소</button>
          <button className="admin-detail-btn" onClick={() => submit()} disabled={submitting}>
            {submitting ? "적용 중..." : "일괄 적용"}
          </button>
        </div>
      </div>
    </div>
  );
}
