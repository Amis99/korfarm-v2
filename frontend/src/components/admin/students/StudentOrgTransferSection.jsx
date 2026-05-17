import { useEffect, useState } from "react";
import { apiGetCamel, apiPost } from "../../../utils/adminApi";

/**
 * 학생 기관 이동 카드 (2026-05-18). HQ_ADMIN 만.
 * 백엔드: POST /v1/admin/students/{userId}/transfer { toOrgId }
 */
function StudentOrgTransferSection({ userId, currentOrgId, currentOrgName, onTransferred }) {
  const [orgs, setOrgs] = useState([]);
  const [target, setTarget] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    apiGetCamel("/v1/admin/orgs/available")
      .then((data) => setOrgs(Array.isArray(data) ? data : []))
      .catch(() => setOrgs([]));
  }, []);

  const handleTransfer = async () => {
    if (!target) {
      setMessage({ ok: false, text: "이동할 기관을 선택하세요." });
      return;
    }
    if (target === currentOrgId) {
      setMessage({ ok: false, text: "현재 소속과 같은 기관입니다." });
      return;
    }
    if (!window.confirm("학생을 다른 기관으로 이동합니다. 진행할까요?")) return;
    setBusy(true); setMessage(null);
    try {
      const res = await apiPost(`/v1/admin/students/${userId}/transfer`, { toOrgId: target });
      setMessage({ ok: true, text: res?.message || "이동 완료" });
      onTransferred?.();
    } catch (e) {
      setMessage({ ok: false, text: e?.message || "이동에 실패했습니다." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-detail-card">
      <h2>기관 이동</h2>
      <p className="admin-detail-note">
        현재 소속: <strong>{currentOrgName || "(미지정)"}</strong>
      </p>
      <div className="admin-modal-field">
        <label>이동할 기관</label>
        <select value={target} onChange={(e) => setTarget(e.target.value)}>
          <option value="">— 선택 —</option>
          {orgs.map((o) => (
            <option key={o.orgId || o.id} value={o.orgId || o.id}>
              {o.name}
              {(o.orgId || o.id) === currentOrgId ? " (현재)" : ""}
            </option>
          ))}
        </select>
      </div>
      {message ? (
        <p className={`admin-detail-note ${message.ok ? "" : "error"}`}>{message.text}</p>
      ) : null}
      <div className="admin-modal-actions">
        <button
          type="button"
          className="admin-detail-btn"
          onClick={handleTransfer}
          disabled={busy || !target}
        >
          {busy ? "이동 중…" : "이동"}
        </button>
      </div>
    </div>
  );
}

export default StudentOrgTransferSection;
