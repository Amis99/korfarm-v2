import { useEffect, useMemo, useState } from "react";
import { apiGet, apiGetCamel, apiPost } from "../../../utils/adminApi";

/**
 * 기관 관리자 탭 (2026-05-18). HQ_ADMIN 전용.
 * - 목록: GET /v1/admin/members?role=ORG_ADMIN
 * - 추가: POST /v1/admin/orgs/{orgId}/admins (기관 선택 + loginId)
 * - 제거: POST /v1/admin/orgs/{orgId}/admins/{userId}/remove
 * - 기관 변경: 제거 + 추가 조합 (모달 한 번에)
 */
function OrgAdminsTab() {
  const [rows, setRows] = useState([]);
  const [orgs, setOrgs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [orgFilter, setOrgFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [selected, setSelected] = useState(null);

  const reload = async () => {
    setLoading(true); setError("");
    try {
      const [members, orgList] = await Promise.all([
        apiGet("/v1/admin/members?role=ORG_ADMIN"),
        apiGetCamel("/v1/admin/orgs/available"),
      ]);
      const list = Array.isArray(members) ? members : (Array.isArray(members?.data) ? members.data : []);
      setRows(list.map(mapRow));
      setOrgs(Array.isArray(orgList) ? orgList : []);
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const orgOptions = useMemo(() => {
    return [{ id: "all", name: "전체 기관" }, ...orgs.map((o) => ({ id: o.orgId || o.id, name: o.name }))];
  }, [orgs]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (orgFilter !== "all" && r.orgId !== orgFilter) return false;
      if (!q) return true;
      return [r.name, r.loginId, r.orgName, r.phone, r.email]
        .filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
    });
  }, [rows, search, orgFilter]);

  return (
    <>
      <div className="admin-detail-card">
        <div className="admin-detail-toolbar">
          <div className="admin-detail-search">
            <span className="material-symbols-outlined">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이름·아이디·기관·전화"
            />
          </div>
          <select value={orgFilter} onChange={(e) => setOrgFilter(e.target.value)}>
            {orgOptions.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <button type="button" className="admin-detail-btn" onClick={() => setShowAdd(true)}>
            + 기관 관리자 추가
          </button>
        </div>

        {error ? <p className="admin-detail-note error">오류: {error}</p> : null}

        {loading ? (
          <p className="admin-detail-note">로딩 중…</p>
        ) : filtered.length === 0 ? (
          <p className="admin-detail-note">조건에 맞는 기관 관리자가 없습니다.</p>
        ) : (
          <table className="admin-detail-table">
            <thead>
              <tr><th>이름</th><th>아이디</th><th>기관</th><th>연락처</th><th>이메일</th><th>가입일</th></tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={`${r.userId}-${r.orgId}`} className="clickable-row" onClick={() => setSelected(r)}>
                  <td><strong>{r.name || "-"}</strong></td>
                  <td style={{ fontSize: 12 }}>{r.loginId}</td>
                  <td>{r.orgName || "-"}</td>
                  <td>{r.phone || "-"}</td>
                  <td style={{ fontSize: 12 }}>{r.email || "-"}</td>
                  <td style={{ fontSize: 12 }}>{(r.createdAt || "").slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAdd ? (
        <AddOrgAdminModal orgs={orgs} onClose={() => setShowAdd(false)} onAdded={() => { setShowAdd(false); reload(); }} />
      ) : null}

      {selected ? (
        <OrgAdminEditModal admin={selected} orgs={orgs} onClose={() => setSelected(null)} onChanged={() => { setSelected(null); reload(); }} />
      ) : null}
    </>
  );
}

function mapRow(m) {
  return {
    userId: m.userId || m.user_id,
    loginId: m.loginId || m.login_id,
    name: m.name,
    orgId: m.orgId || m.org_id,
    orgName: m.orgName || m.org_name,
    phone: m.phone,
    email: m.email,
    createdAt: m.createdAt || m.created_at,
  };
}

function AddOrgAdminModal({ orgs, onClose, onAdded }) {
  const [orgId, setOrgId] = useState("");
  const [loginId, setLoginId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const handleAdd = async () => {
    if (!orgId || !loginId.trim()) {
      setMessage({ ok: false, text: "기관과 아이디를 모두 입력하세요." });
      return;
    }
    setBusy(true); setMessage(null);
    try {
      await apiPost(`/v1/admin/orgs/${orgId}/admins`, { loginId: loginId.trim() });
      onAdded();
    } catch (e) {
      setMessage({ ok: false, text: e?.message || "추가 실패" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <h2>기관 관리자 추가</h2>
        <p className="admin-detail-note">이미 가입한 사용자의 아이디를 입력해 ORG_ADMIN 권한을 부여합니다.</p>
        <div className="admin-modal-field">
          <label>기관</label>
          <select value={orgId} onChange={(e) => setOrgId(e.target.value)}>
            <option value="">— 선택 —</option>
            {orgs.map((o) => (
              <option key={o.orgId || o.id} value={o.orgId || o.id}>{o.name}</option>
            ))}
          </select>
        </div>
        <div className="admin-modal-field">
          <label>사용자 아이디 (loginId)</label>
          <input value={loginId} onChange={(e) => setLoginId(e.target.value)} placeholder="예: admin01" />
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

function OrgAdminEditModal({ admin, orgs, onClose, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [transferOrgId, setTransferOrgId] = useState("");

  const handleRemove = async () => {
    if (!window.confirm(`${admin.name} 의 기관 관리자 권한을 제거할까요?`)) return;
    setBusy(true); setMessage(null);
    try {
      await apiPost(`/v1/admin/orgs/${admin.orgId}/admins/${admin.userId}/remove`, {});
      onChanged();
    } catch (e) {
      setMessage({ ok: false, text: e?.message || "제거 실패" });
    } finally {
      setBusy(false);
    }
  };

  const handleTransfer = async () => {
    if (!transferOrgId) {
      setMessage({ ok: false, text: "이동할 기관을 선택하세요." });
      return;
    }
    if (transferOrgId === admin.orgId) {
      setMessage({ ok: false, text: "현재 소속과 같은 기관입니다." });
      return;
    }
    if (!window.confirm(`${admin.name} 의 소속 기관을 변경할까요? (기존 기관에서 제거 → 새 기관에 추가)`)) return;
    setBusy(true); setMessage(null);
    try {
      await apiPost(`/v1/admin/orgs/${admin.orgId}/admins/${admin.userId}/remove`, {});
      await apiPost(`/v1/admin/orgs/${transferOrgId}/admins`, { loginId: admin.loginId });
      onChanged();
    } catch (e) {
      setMessage({ ok: false, text: e?.message || "이동 실패" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <h2>기관 관리자 관리</h2>
        <table className="admin-detail-table" style={{ marginBottom: 16 }}>
          <tbody>
            <tr><td style={{ fontWeight: 700, width: 100 }}>이름</td><td>{admin.name}</td></tr>
            <tr><td style={{ fontWeight: 700 }}>아이디</td><td>{admin.loginId}</td></tr>
            <tr><td style={{ fontWeight: 700 }}>현재 기관</td><td>{admin.orgName}</td></tr>
            <tr><td style={{ fontWeight: 700 }}>연락처</td><td>{admin.phone || "-"}</td></tr>
            <tr><td style={{ fontWeight: 700 }}>이메일</td><td>{admin.email || "-"}</td></tr>
          </tbody>
        </table>

        <div className="admin-modal-field">
          <label>소속 기관 변경</label>
          <div style={{ display: "flex", gap: 8 }}>
            <select value={transferOrgId} onChange={(e) => setTransferOrgId(e.target.value)} style={{ flex: 1 }}>
              <option value="">— 새 기관 선택 —</option>
              {orgs.filter((o) => (o.orgId || o.id) !== admin.orgId).map((o) => (
                <option key={o.orgId || o.id} value={o.orgId || o.id}>{o.name}</option>
              ))}
            </select>
            <button type="button" className="admin-detail-btn secondary" onClick={handleTransfer} disabled={busy}>
              {busy ? "이동 중…" : "이동"}
            </button>
          </div>
        </div>

        {message ? <p className={`admin-detail-note ${message.ok ? "" : "error"}`}>{message.text}</p> : null}

        <div className="admin-modal-actions">
          <button type="button" className="admin-detail-btn ghost" onClick={handleRemove} disabled={busy}>권한 제거</button>
          <button type="button" className="admin-detail-btn secondary" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}

export default OrgAdminsTab;
