import { useState } from "react";
import { apiPost } from "../../../utils/adminApi";

/**
 * 학생 구독 수정 카드 (2026-05-18). HQ_ADMIN 만 노출.
 * 백엔드: POST /v1/admin/students/{userId}/subscription { status, endAt }
 */
function StudentSubscriptionSection({ userId, subStatus, subEnd, onUpdated }) {
  const [status, setStatus] = useState(subStatus || "inactive");
  const [endAt, setEndAt] = useState((subEnd || "").slice(0, 10));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const handleSave = async () => {
    setSaving(true); setMessage(null);
    try {
      const body = { status, endAt: endAt ? `${endAt}T23:59:59` : null };
      await apiPost(`/v1/admin/students/${userId}/subscription`, body);
      setMessage({ ok: true, text: "구독 정보를 저장했습니다." });
      onUpdated?.();
    } catch (e) {
      setMessage({ ok: false, text: e?.message || "저장에 실패했습니다." });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-detail-card">
      <h2>구독 관리</h2>
      <p className="admin-detail-note">본사 관리자만 수정할 수 있어요.</p>
      <div className="admin-modal-field">
        <label>구독 상태</label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="inactive">무료</option>
          <option value="active">유료 (active)</option>
          <option value="canceled">해지 (canceled)</option>
        </select>
      </div>
      <div className="admin-modal-field">
        <label>구독 만료일</label>
        <input
          type="date"
          value={endAt}
          onChange={(e) => setEndAt(e.target.value)}
        />
      </div>
      {message ? (
        <p className={`admin-detail-note ${message.ok ? "" : "error"}`}>{message.text}</p>
      ) : null}
      <div className="admin-modal-actions">
        <button
          type="button"
          className="admin-detail-btn"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? "저장 중…" : "저장"}
        </button>
      </div>
    </div>
  );
}

export default StudentSubscriptionSection;
