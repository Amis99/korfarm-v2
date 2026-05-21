import { useEffect, useMemo, useState } from "react";
import { apiGet, apiGetCamel, apiPost, apiPatch, apiDelete } from "../../../utils/adminApi";

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
              <tr><th>이름</th><th>아이디</th><th>기관</th><th>연락처</th><th>이메일</th><th>가입일</th><th></th></tr>
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
                  <td onClick={(e) => e.stopPropagation()}>
                    <button
                      className="admin-detail-btn secondary xs"
                      type="button"
                      title="임시 비밀번호 발급 (N-29)"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!window.confirm(`${r.name || r.loginId} 의 임시 비밀번호를 발급할까요?`)) return;
                        try {
                          const res = await apiPost(`/v1/admin/users/${r.userId}/reset-password`, {});
                          const tempPwd = res?.tempPassword || res?.data?.tempPassword;
                          if (tempPwd) {
                            window.prompt(
                              `${r.name || r.loginId} 의 임시 비밀번호입니다.\n이 창을 닫으면 다시 볼 수 없습니다.\n복사 후 관리자에게 직접 전달하세요.`,
                              tempPwd
                            );
                          } else {
                            window.alert("임시 비밀번호가 생성되지 않았습니다.");
                          }
                        } catch (err) {
                          window.alert(err?.message || "비밀번호 재설정 실패");
                        }
                      }}
                    >
                      비번 재설정
                    </button>
                  </td>
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
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  // 기관 선택 시 그 기관의 pending ORG_ADMIN 가입 신청자 목록 조회
  useEffect(() => {
    if (!orgId) { setPending([]); return; }
    setLoading(true); setMessage(null);
    apiGetCamel(`/v1/admin/memberships/pending?orgId=${encodeURIComponent(orgId)}`)
      .then((data) => {
        const list = Array.isArray(data) ? data : (Array.isArray(data?.data) ? data.data : []);
        // ORG_ADMIN 신청만
        setPending(list.filter((m) => m.role === "ORG_ADMIN"));
      })
      .catch((e) => setMessage({ ok: false, text: e?.message || "신청자 조회 실패" }))
      .finally(() => setLoading(false));
  }, [orgId]);

  const handleApprove = async (membershipId) => {
    setBusy(true); setMessage(null);
    try {
      await apiPost(`/v1/admin/memberships/${membershipId}/approve`, {});
      onAdded();
    } catch (e) {
      setMessage({ ok: false, text: e?.message || "승인 실패" });
    } finally {
      setBusy(false);
    }
  };

  const handleReject = async (membershipId) => {
    const reason = window.prompt("거절 사유 (선택)") || "";
    setBusy(true); setMessage(null);
    try {
      await apiPost(`/v1/admin/memberships/${membershipId}/reject`, { reason });
      // 목록만 갱신 (모달 유지)
      setPending((prev) => prev.filter((p) => p.id !== membershipId));
    } catch (e) {
      setMessage({ ok: false, text: e?.message || "거절 실패" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal admin-modal-xl" onClick={(e) => e.stopPropagation()}>
        <h2>기관 관리자 가입 승인</h2>
        <p className="admin-detail-note">
          회원가입 시 "기관 관리자" 로 신청한 사용자가 기관별로 표시됩니다. 승인을 누르면 권한이 활성화돼요.
        </p>
        <div className="admin-modal-field">
          <label>기관</label>
          <select value={orgId} onChange={(e) => setOrgId(e.target.value)}>
            <option value="">— 기관 선택 —</option>
            {orgs.map((o) => (
              <option key={o.orgId || o.id} value={o.orgId || o.id}>{o.name}</option>
            ))}
          </select>
        </div>

        {orgId ? (
          loading ? (
            <p className="admin-detail-note">불러오는 중…</p>
          ) : pending.length === 0 ? (
            <p className="admin-detail-note">이 기관에 대기 중인 기관 관리자 가입 신청이 없습니다.</p>
          ) : (
            <table className="admin-detail-table">
              <thead><tr><th>이름</th><th>아이디</th><th>신청일</th><th></th></tr></thead>
              <tbody>
                {pending.map((p) => (
                  <tr key={p.id}>
                    <td><strong>{p.userName || "-"}</strong></td>
                    <td style={{ fontSize: 12 }}>{p.userLoginId}</td>
                    <td style={{ fontSize: 12 }}>{(p.requestedAt || "").replace("T", " ").slice(0, 16)}</td>
                    <td style={{ display: "flex", gap: 6 }}>
                      <button type="button" className="admin-detail-btn" onClick={() => handleApprove(p.id)} disabled={busy}>승인</button>
                      <button type="button" className="admin-detail-btn ghost" onClick={() => handleReject(p.id)} disabled={busy}>거절</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        ) : null}

        {message ? <p className={`admin-detail-note ${message.ok ? "" : "error"}`}>{message.text}</p> : null}
        <div className="admin-modal-actions">
          <button type="button" className="admin-detail-btn secondary" onClick={onClose}>닫기</button>
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
  const [form, setForm] = useState({
    name: admin.name || "",
    phone: admin.phone || "",
    email: admin.loginId || admin.email || "",
  });

  const handleSave = async () => {
    setBusy(true); setMessage(null);
    try {
      await apiPatch(`/v1/admin/users/${admin.userId}`, {
        name: form.name, phone: form.phone, email: form.email,
      });
      setMessage({ ok: true, text: "저장했습니다." });
      onChanged();
    } catch (e) {
      setMessage({ ok: false, text: e?.message || "저장 실패" });
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`${admin.name} 계정을 삭제할까요? (소속 기관 권한도 모두 해제됩니다)`)) return;
    setBusy(true); setMessage(null);
    try {
      await apiDelete(`/v1/admin/users/${admin.userId}`);
      onChanged();
    } catch (e) {
      setMessage({ ok: false, text: e?.message || "삭제 실패" });
    } finally {
      setBusy(false);
    }
  };

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
        <h2>기관 관리자 정보</h2>
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
        <p className="admin-detail-note" style={{ marginTop: 4 }}>현재 기관: <strong>{admin.orgName}</strong></p>

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
          <button type="button" className="admin-detail-btn" onClick={handleSave} disabled={busy}>저장</button>
          <button type="button" className="admin-detail-btn ghost" onClick={handleRemove} disabled={busy}>권한 제거</button>
          <button type="button" className="admin-detail-btn danger" onClick={handleDelete} disabled={busy}>계정 삭제</button>
          <button type="button" className="admin-detail-btn secondary" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}

export default OrgAdminsTab;
