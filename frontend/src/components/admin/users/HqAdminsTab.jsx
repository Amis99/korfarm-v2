import { useEffect, useMemo, useState } from "react";
import { apiGetCamel, apiPost, apiPatch, apiDelete } from "../../../utils/adminApi";

/**
 * 본사 관리자 탭 (2026-05-18). HQ_ADMIN 전용.
 * - 목록: GET /v1/admin/hq-admins
 * - 추가: POST /v1/admin/hq-admins (응답에 임시 PW 평문 1회 노출)
 * - 정지: POST /v1/admin/hq-admins/{userId}/suspend
 * - 삭제: DELETE /v1/admin/hq-admins/{userId}
 * - 임시 PW 재발급: POST /v1/admin/hq-admins/{userId}/reset-password
 * - 마지막 활성 1명은 백엔드에서 정지/삭제 거부.
 */
function HqAdminsTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [tempPassword, setTempPassword] = useState(null);   // { loginId, password }

  const reload = async () => {
    setLoading(true); setError("");
    try {
      // 백엔드 SNAKE_CASE → camelCase 변환 필요 (loginId/createdAt 등)
      const res = await apiGetCamel("/v1/admin/hq-admins");
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      setRows(list);
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.name, r.loginId, r.phone].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
    );
  }, [rows, search]);

  const handleSuspend = async (admin) => {
    if (!window.confirm(`${admin.name} 의 본사 관리자 권한을 정지할까요?`)) return;
    try {
      await apiPost(`/v1/admin/hq-admins/${admin.userId}/suspend`, {});
      reload();
    } catch (e) {
      alert(e?.message || "정지 실패");
    }
  };

  const handleDelete = async (admin) => {
    if (!window.confirm(`${admin.name} 의 본사 관리자 계정을 삭제할까요? (soft delete)`)) return;
    try {
      await apiDelete(`/v1/admin/hq-admins/${admin.userId}`);
      reload();
    } catch (e) {
      alert(e?.message || "삭제 실패");
    }
  };

  const handleResetPw = async (admin) => {
    if (!window.confirm(`${admin.name} 의 임시 비밀번호를 재발급할까요?`)) return;
    try {
      const res = await apiPost(`/v1/admin/hq-admins/${admin.userId}/reset-password`, {});
      const pw = res?.tempPassword || res?.data?.tempPassword;
      if (pw) setTempPassword({ loginId: admin.loginId, password: pw, isReset: true });
    } catch (e) {
      alert(e?.message || "재발급 실패");
    }
  };

  return (
    <>
      <div className="admin-detail-card">
        <div className="admin-detail-toolbar">
          <div className="admin-detail-search">
            <span className="material-symbols-outlined">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이름·아이디·전화"
            />
          </div>
          <button type="button" className="admin-detail-btn" onClick={() => setShowAdd(true)}>
            + 본사 관리자 추가
          </button>
        </div>

        {error ? <p className="admin-detail-note error">오류: {error}</p> : null}

        {loading ? (
          <p className="admin-detail-note">로딩 중…</p>
        ) : filtered.length === 0 ? (
          <p className="admin-detail-note">등록된 본사 관리자가 없습니다.</p>
        ) : (
          <table className="admin-detail-table">
            <thead>
              <tr><th>이름</th><th>아이디</th><th>연락처</th><th>상태</th><th></th></tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.userId}>
                  <td><strong>{r.name || "-"}</strong></td>
                  <td style={{ fontSize: 12 }}>{r.loginId || "-"}</td>
                  <td>{r.phone || "-"}</td>
                  <td><span className="status-pill" data-status={r.status === "active" ? "active" : "inactive"}>{r.status}</span></td>
                  <td style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <button type="button" className="admin-detail-btn ghost" onClick={() => setEditTarget(r)}>수정</button>
                    <button type="button" className="admin-detail-btn ghost" onClick={() => handleResetPw(r)}>임시 PW</button>
                    {r.status === "active" ? (
                      <button type="button" className="admin-detail-btn ghost" onClick={() => handleSuspend(r)}>정지</button>
                    ) : null}
                    <button type="button" className="admin-detail-btn ghost" onClick={() => handleDelete(r)}>삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd ? (
        <AddHqAdminModal
          onClose={() => setShowAdd(false)}
          onCreated={(res) => {
            setShowAdd(false);
            const pw = res?.tempPassword || res?.data?.tempPassword;
            const loginId = (res?.admin || res?.data?.admin)?.loginId;
            if (pw) setTempPassword({ loginId, password: pw, isReset: false });
            reload();
          }}
        />
      ) : null}

      {editTarget ? (
        <EditHqAdminModal
          admin={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={() => { setEditTarget(null); reload(); }}
        />
      ) : null}

      {tempPassword ? (
        <TempPasswordModal info={tempPassword} onClose={() => setTempPassword(null)} />
      ) : null}
    </>
  );
}

function EditHqAdminModal({ admin, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: admin.name || "",
    phone: admin.phone || "",
    email: admin.loginId || admin.email || "",
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const save = async () => {
    setBusy(true); setMessage(null);
    try {
      await apiPatch(`/v1/admin/hq-admins/${admin.userId}`, {
        name: form.name, phone: form.phone, email: form.email,
      });
      onSaved();
    } catch (e) {
      setMessage({ ok: false, text: e?.message || "저장 실패" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <h2>본사 관리자 수정</h2>
        <div className="admin-modal-field">
          <label>이름</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="admin-modal-field">
          <label>아이디</label>
          <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>
        <div className="admin-modal-field">
          <label>연락처</label>
          <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        </div>
        {message ? <p className={`admin-detail-note ${message.ok ? "" : "error"}`}>{message.text}</p> : null}
        <div className="admin-modal-actions">
          <button type="button" className="admin-detail-btn" onClick={save} disabled={busy}>
            {busy ? "저장 중…" : "저장"}
          </button>
          <button type="button" className="admin-detail-btn secondary" onClick={onClose}>취소</button>
        </div>
      </div>
    </div>
  );
}

function AddHqAdminModal({ onClose, onCreated }) {
  const [loginId, setLoginId] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const handleAdd = async () => {
    if (!loginId.trim()) {
      setMessage({ ok: false, text: "아이디를 입력하세요." });
      return;
    }
    setBusy(true); setMessage(null);
    try {
      const res = await apiPost("/v1/admin/hq-admins", {
        loginId: loginId.trim(),
        name: name.trim() || null,
        phone: phone.trim() || null,
      });
      onCreated(res);
    } catch (e) {
      setMessage({ ok: false, text: e?.message || "추가 실패" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <h2>본사 관리자 추가</h2>
        <p className="admin-detail-note">
          신규 계정을 생성합니다. 임시 비밀번호는 추가 후 모달에 1회만 표시됩니다.
        </p>
        <div className="admin-modal-field">
          <label>아이디 (loginId / email)</label>
          <input value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder="hq.admin@example.com 또는 아이디" />
        </div>
        <div className="admin-modal-field">
          <label>이름</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="홍길동" />
        </div>
        <div className="admin-modal-field">
          <label>연락처</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="010-0000-0000" />
        </div>
        {message ? <p className={`admin-detail-note ${message.ok ? "" : "error"}`}>{message.text}</p> : null}
        <div className="admin-modal-actions">
          <button type="button" className="admin-detail-btn" onClick={handleAdd} disabled={busy}>
            {busy ? "추가 중…" : "추가"}
          </button>
          <button type="button" className="admin-detail-btn secondary" onClick={onClose}>취소</button>
        </div>
      </div>
    </div>
  );
}

function TempPasswordModal({ info, onClose }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(info.password);
      alert("복사되었습니다.");
    } catch {
      // silent
    }
  };
  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <h2>{info.isReset ? "임시 비밀번호 재발급" : "본사 관리자 생성 완료"}</h2>
        <p className="admin-detail-note">
          아이디: <strong>{info.loginId}</strong>
        </p>
        <p className="admin-detail-note">
          아래 임시 비밀번호는 <strong>이 화면에서만 1회</strong> 확인됩니다.
          본인에게 즉시 전달하고 첫 로그인 후 변경하도록 안내해 주세요.
        </p>
        <div className="admin-modal-field">
          <label>임시 비밀번호</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={info.password}
              readOnly
              style={{ flex: 1, fontFamily: "monospace", fontSize: 16, letterSpacing: 1 }}
            />
            <button type="button" className="admin-detail-btn secondary" onClick={copy}>복사</button>
          </div>
        </div>
        <div className="admin-modal-actions">
          <button type="button" className="admin-detail-btn" onClick={onClose}>확인</button>
        </div>
      </div>
    </div>
  );
}

export default HqAdminsTab;
