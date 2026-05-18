import { useCallback, useEffect, useState } from "react";
import { apiGetCamel, apiPatch, apiPost, apiDelete } from "../../../utils/adminApi";

/**
 * 학부모 정보 편집 + 자녀 매칭 관리 모달 (2026-05-18).
 * - 학부모 이름·연락처·아이디 편집 (PATCH /v1/admin/users/{userId})
 * - 학부모 삭제 (DELETE /v1/admin/users/{userId}, HQ_ADMIN 전용)
 * - 연결된 자녀 목록 + 자녀 연결/해제 (학생 아이디 직접 입력)
 */
function ParentLinkManageModal({ parent, onClose, onChanged }) {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: parent.name || "",
    phone: parent.phone || "",
    email: parent.loginId || "",
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGetCamel(`/v1/admin/parents/links?parentUserId=${encodeURIComponent(parent.userId)}`);
      const all = Array.isArray(data) ? data : [];
      const filtered = all.filter((l) => l.parentUserId === parent.userId);
      // 중복 제거 (같은 자녀 페어 여러 row)
      const seen = new Set();
      const dedup = [];
      for (const l of filtered) {
        const k = `${l.studentUserId}__${l.status}`;
        if (!seen.has(k)) { seen.add(k); dedup.push(l); }
      }
      setLinks(dedup);
    } catch {
      setLinks([]);
    } finally {
      setLoading(false);
    }
  }, [parent.userId]);

  useEffect(() => { reload(); }, [reload]);

  const handleSave = async () => {
    setBusy(true); setMessage(null);
    try {
      await apiPatch(`/v1/admin/users/${parent.userId}`, {
        name: form.name,
        phone: form.phone,
        email: form.email,
      });
      setMessage({ ok: true, text: "저장했습니다." });
      onChanged?.();
    } catch (e) {
      setMessage({ ok: false, text: e?.message || "저장 실패" });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`${parent.name || parent.loginId} 계정을 삭제할까요? (자녀 연결도 모두 해제됩니다)`)) return;
    setBusy(true); setMessage(null);
    try {
      await apiDelete(`/v1/admin/users/${parent.userId}`);
      onChanged?.();
      onClose();
    } catch (e) {
      setMessage({ ok: false, text: e?.message || "삭제 실패" });
    } finally {
      setBusy(false);
    }
  };

  const handleUnlink = async (linkId) => {
    if (!window.confirm("이 자녀 연결을 해제할까요?")) return;
    try {
      await apiDelete(`/v1/admin/parents/links/${linkId}`);
      await reload();
      onChanged?.();
    } catch (e) {
      alert(e?.message || "해제에 실패했습니다.");
    }
  };

  const activeLinks = links.filter((l) => l.status === "active");

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal admin-modal-xl" onClick={(e) => e.stopPropagation()}>
        <h2>학부모 정보 · 자녀 관리</h2>

        {/* 학부모 정보 편집 */}
        <div className="admin-modal-field">
          <label>이름</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="admin-modal-field">
          <label>아이디 (loginId / email)</label>
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="admin-modal-field">
          <label>연락처</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>

        {/* 연결된 자녀 */}
        <h3 style={{ marginTop: 20, fontSize: 15 }}>연결된 자녀</h3>
        {loading ? (
          <p className="admin-detail-note">불러오는 중…</p>
        ) : activeLinks.length === 0 ? (
          <>
            <p className="admin-detail-note">활성 연결이 없습니다.</p>
            {parent.linkedStudentNames?.length ? (
              <p className="admin-detail-note">
                가입 시 입력한 자녀 정보: <strong>{parent.linkedStudentNames.join(", ")}</strong>
                <br />
                <span style={{ fontSize: 12, color: "#888" }}>
                  자녀 이름·전화 매칭이 정확하지 않아 자동 연결되지 않았어요. "+ 자녀 연결" 로 학생 아이디 입력 후 수동 연결해 주세요.
                </span>
              </p>
            ) : null}
          </>
        ) : (
          <table className="admin-detail-table">
            <thead><tr><th>자녀</th><th>아이디</th><th></th></tr></thead>
            <tbody>
              {activeLinks.map((l) => (
                <tr key={l.linkId}>
                  <td>{l.studentName || "-"}</td>
                  <td style={{ fontSize: 12 }}>{l.studentLoginId || "-"}</td>
                  <td>
                    <button type="button" className="admin-detail-btn ghost" onClick={() => handleUnlink(l.linkId)}>해제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {message ? <p className={`admin-detail-note ${message.ok ? "" : "error"}`}>{message.text}</p> : null}

        <div className="admin-modal-actions">
          <button type="button" className="admin-detail-btn" onClick={handleSave} disabled={busy}>
            {busy ? "저장 중…" : "저장"}
          </button>
          <button type="button" className="admin-detail-btn secondary" onClick={() => setShowAdd(true)}>
            + 자녀 연결
          </button>
          <button type="button" className="admin-detail-btn danger" onClick={handleDelete} disabled={busy}>
            계정 삭제
          </button>
          <button type="button" className="admin-detail-btn ghost" onClick={onClose}>닫기</button>
        </div>
      </div>

      {showAdd ? (
        <ChildLinkAddModal
          parentLoginId={parent.loginId}
          parentName={parent.name}
          onClose={() => setShowAdd(false)}
          onLinked={async () => { setShowAdd(false); await reload(); onChanged?.(); }}
        />
      ) : null}
    </div>
  );
}

function ChildLinkAddModal({ parentLoginId, parentName, onClose, onLinked }) {
  const [loginId, setLoginId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const link = async () => {
    if (!loginId.trim()) {
      setMessage({ ok: false, text: "학생 아이디를 입력해 주세요." });
      return;
    }
    setBusy(true); setMessage(null);
    try {
      await apiPost("/v1/admin/parents/links", {
        studentLoginId: loginId.trim(),
        parentLoginId: parentLoginId,
      });
      onLinked();
    } catch (e) {
      setMessage({ ok: false, text: e?.message || "연결 실패" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <h2>자녀 연결</h2>
        <p className="admin-detail-note">학부모: <strong>{parentName}</strong> ({parentLoginId})</p>
        <div className="admin-modal-field">
          <label>학생 아이디</label>
          <input
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") link(); }}
            placeholder="학생 가입 시 사용한 아이디"
          />
        </div>
        {message ? <p className={`admin-detail-note ${message.ok ? "" : "error"}`}>{message.text}</p> : null}
        <div className="admin-modal-actions">
          <button type="button" className="admin-detail-btn" onClick={link} disabled={busy}>
            {busy ? "연결 중…" : "연결"}
          </button>
          <button type="button" className="admin-detail-btn secondary" onClick={onClose}>취소</button>
        </div>
      </div>
    </div>
  );
}

export default ParentLinkManageModal;
