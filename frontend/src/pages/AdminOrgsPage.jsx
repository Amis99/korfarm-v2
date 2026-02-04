import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost, apiPatch } from "../utils/adminApi";
import { useAdminList } from "../hooks/useAdminList";
import AdminLayout from "../components/AdminLayout";
import "../styles/admin-detail.css";

const REGIONS = [
  "서울", "부산", "대구", "인천", "광주", "대전", "울산", "세종",
  "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주",
];

const ORG_TYPES = [
  { value: "", label: "선택 안 함" },
  { value: "학원", label: "학원" },
  { value: "학교", label: "학교" },
  { value: "공공기관", label: "공공기관" },
  { value: "기타", label: "기타" },
];

const ORGS = [
  { id: "sample1", name: "Korfarm Academy", plan: "Pro", seats: 120, status: "active", admins: [] },
];

const mapOrgList = (items) =>
  items.map((org) => ({
    id: org.orgId || org.id || org.org_id || org.name,
    name: org.name,
    plan: org.plan || "-",
    orgType: org.orgType || org.org_type || "",
    addressRegion: org.addressRegion || org.address_region || "",
    addressDetail: org.addressDetail || org.address_detail || "",
    seats: org.seat_limit ?? org.seatLimit ?? 0,
    admins: (org.admins || []).map((a) => ({
      userId: a.userId || a.user_id,
      loginId: a.loginId || a.login_id || a.email || "",
      name: a.name || "",
      phone: a.phone || "",
      role: a.role || "ORG_ADMIN",
    })),
    status: org.status || "active",
  }));

function AdminOrgsPage() {
  const { data: orgs, loading, error } = useAdminList("/v1/admin/orgs", ORGS, mapOrgList);
  const [rows, setRows] = useState(ORGS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editOrg, setEditOrg] = useState(null);
  const [formData, setFormData] = useState({
    name: "", plan: "Basic", seatLimit: 50,
    orgType: "", addressRegion: "", addressDetail: "",
  });
  const [adminLoginId, setAdminLoginId] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setRows(orgs);
  }, [orgs]);

  const filteredOrgs = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((org) => {
      if (statusFilter !== "all" && org.status !== statusFilter) return false;
      if (!term) return true;
      return [org.name, org.plan, org.orgType, org.addressRegion, org.status]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(term));
    });
  }, [rows, search, statusFilter]);

  const handleCreate = async () => {
    setActionError("");
    if (!formData.name.trim()) {
      setActionError("기관명을 입력해 주세요.");
      return;
    }
    setActionLoading(true);
    try {
      const result = await apiPost("/v1/admin/orgs", {
        name: formData.name.trim(),
        plan: formData.plan,
        seatLimit: Number(formData.seatLimit) || 50,
        orgType: formData.orgType || undefined,
        addressRegion: formData.addressRegion || undefined,
        addressDetail: formData.addressDetail.trim() || undefined,
      });
      const mapped = mapOrgList([result])[0];
      setRows((prev) => [mapped, ...prev]);
      setShowCreateModal(false);
      setFormData({ name: "", plan: "Basic", seatLimit: 50, orgType: "", addressRegion: "", addressDetail: "" });
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editOrg) return;
    setActionError("");
    setActionLoading(true);
    try {
      const result = await apiPatch(`/v1/admin/orgs/${editOrg.id}`, {
        name: formData.name.trim() || undefined,
        plan: formData.plan || undefined,
        seatLimit: Number(formData.seatLimit) || undefined,
        orgType: formData.orgType || undefined,
        addressRegion: formData.addressRegion || undefined,
        addressDetail: formData.addressDetail.trim() || undefined,
      });
      const mapped = mapOrgList([result])[0];
      setRows((prev) => prev.map((r) => (r.id === mapped.id ? mapped : r)));
      setEditOrg(mapped);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async (orgId) => {
    setActionError("");
    setActionLoading(true);
    try {
      await apiPost(`/v1/admin/orgs/${orgId}/deactivate`);
      setRows((prev) =>
        prev.map((r) => (r.id === orgId ? { ...r, status: "inactive" } : r))
      );
      setShowEditModal(false);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddAdmin = async () => {
    if (!editOrg) return;
    if (!adminLoginId.trim()) {
      setActionError("국어농장 아이디를 입력해 주세요.");
      return;
    }
    setActionError("");
    setActionLoading(true);
    try {
      const result = await apiPost(`/v1/admin/orgs/${editOrg.id}/admins`, {
        loginId: adminLoginId.trim(),
      });
      const mapped = mapOrgList([result])[0];
      setRows((prev) => prev.map((r) => (r.id === mapped.id ? mapped : r)));
      setEditOrg(mapped);
      setAdminLoginId("");
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveAdmin = async (userId) => {
    if (!editOrg) return;
    setActionError("");
    setActionLoading(true);
    try {
      await apiPost(`/v1/admin/orgs/${editOrg.id}/admins/${userId}/remove`);
      const freshOrgs = await apiGet("/v1/admin/orgs");
      const mapped = mapOrgList(Array.isArray(freshOrgs) ? freshOrgs : []);
      setRows(mapped);
      const updated = mapped.find((o) => o.id === editOrg.id);
      if (updated) setEditOrg(updated);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openEdit = (org) => {
    setEditOrg(org);
    setFormData({
      name: org.name,
      plan: org.plan,
      seatLimit: org.seats,
      orgType: org.orgType || "",
      addressRegion: org.addressRegion || "",
      addressDetail: org.addressDetail || "",
    });
    setAdminLoginId("");
    setActionError("");
    setShowEditModal(true);
  };

  const formatAddress = (org) => {
    const parts = [org.addressRegion, org.addressDetail].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : "-";
  };

  return (
    <AdminLayout>
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>기관 관리</h1>
          <div className="admin-detail-actions">
            <button
              className="admin-detail-btn"
              type="button"
              onClick={() => {
                setFormData({ name: "", plan: "Basic", seatLimit: 50, orgType: "", addressRegion: "", addressDetail: "" });
                setActionError("");
                setShowCreateModal(true);
              }}
            >
              신규 기관 등록
            </button>
          </div>
        </div>
        <div className="admin-detail-grid">
          <div className="admin-detail-card">
            <h2>기관 목록</h2>
            <div className="admin-detail-toolbar">
              <div className="admin-detail-search">
                <span className="material-symbols-outlined">search</span>
                <input
                  placeholder="기관 검색"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="admin-detail-filters">
                {["all", "active", "pending"].map((f) => (
                  <button
                    key={f}
                    className={`admin-filter ${statusFilter === f ? "active" : ""}`}
                    type="button"
                    onClick={() => setStatusFilter(f)}
                  >
                    {f === "all" ? "전체" : f === "active" ? "활성" : "보류"}
                  </button>
                ))}
              </div>
            </div>
            {loading ? <p className="admin-detail-note">기관 목록을 불러오는 중...</p> : null}
            {error ? <p className="admin-detail-note error">{error}</p> : null}
            <table className="admin-detail-table">
              <thead>
                <tr>
                  <th>기관명</th>
                  <th>종류</th>
                  <th>주소</th>
                  <th>플랜</th>
                  <th>좌석</th>
                  <th>관리자</th>
                  <th>상태</th>
                  <th>조치</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrgs.map((org) => (
                  <tr key={org.id}>
                    <td>{org.name}</td>
                    <td>{org.orgType || "-"}</td>
                    <td>{formatAddress(org)}</td>
                    <td>{org.plan}</td>
                    <td>{org.seats}</td>
                    <td>
                      {org.admins.length > 0
                        ? org.admins.map((a) => a.name || a.loginId).join(", ")
                        : "-"}
                    </td>
                    <td>
                      <span className="status-pill" data-status={org.status}>
                        {org.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="admin-detail-btn secondary"
                        type="button"
                        onClick={() => openEdit(org)}
                        style={{ fontSize: "12px", padding: "4px 8px" }}
                      >
                        수정
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-detail-card">
            <h3>기관 요약</h3>
            <p>전체 {rows.length}개</p>
            <p>활성 {rows.filter((r) => r.status === "active").length}개</p>
          </div>
        </div>
      </div>

      {showCreateModal ? (
        <div className="admin-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>신규 기관 등록</h2>
            {actionError ? <p className="admin-detail-note error">{actionError}</p> : null}
            <div className="admin-modal-field">
              <label>기관명</label>
              <input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="기관명"
              />
            </div>
            <div className="admin-modal-row">
              <div className="admin-modal-field">
                <label>기관 종류</label>
                <select
                  value={formData.orgType}
                  onChange={(e) => setFormData({ ...formData, orgType: e.target.value })}
                >
                  {ORG_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>
              <div className="admin-modal-field">
                <label>플랜</label>
                <select
                  value={formData.plan}
                  onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                >
                  <option value="Basic">Basic</option>
                  <option value="Pro">Pro</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </div>
            </div>
            <div className="admin-modal-row">
              <div className="admin-modal-field">
                <label>시/도</label>
                <select
                  value={formData.addressRegion}
                  onChange={(e) => setFormData({ ...formData, addressRegion: e.target.value })}
                >
                  <option value="">선택 안 함</option>
                  {REGIONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="admin-modal-field">
                <label>좌석 수</label>
                <input
                  type="number"
                  value={formData.seatLimit}
                  onChange={(e) => setFormData({ ...formData, seatLimit: e.target.value })}
                />
              </div>
            </div>
            <div className="admin-modal-field">
              <label>상세주소</label>
              <input
                value={formData.addressDetail}
                onChange={(e) => setFormData({ ...formData, addressDetail: e.target.value })}
                placeholder="상세주소 입력"
              />
            </div>
            <div className="admin-modal-actions">
              <button className="admin-detail-btn" onClick={handleCreate} disabled={actionLoading}>
                등록
              </button>
              <button
                className="admin-detail-btn secondary"
                onClick={() => setShowCreateModal(false)}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showEditModal && editOrg ? (
        <div className="admin-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="admin-modal admin-modal-wide" onClick={(e) => e.stopPropagation()}>
            <h2>기관 수정</h2>
            {actionError ? <p className="admin-detail-note error">{actionError}</p> : null}

            <div className="admin-modal-section">
              <h3>기관 정보</h3>
              <div className="admin-modal-field">
                <label>기관명</label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="admin-modal-row">
                <div className="admin-modal-field">
                  <label>기관 종류</label>
                  <select
                    value={formData.orgType}
                    onChange={(e) => setFormData({ ...formData, orgType: e.target.value })}
                  >
                    {ORG_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="admin-modal-field">
                  <label>플랜</label>
                  <select
                    value={formData.plan}
                    onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                  >
                    <option value="Basic">Basic</option>
                    <option value="Pro">Pro</option>
                    <option value="Enterprise">Enterprise</option>
                  </select>
                </div>
              </div>
              <div className="admin-modal-row">
                <div className="admin-modal-field">
                  <label>시/도</label>
                  <select
                    value={formData.addressRegion}
                    onChange={(e) => setFormData({ ...formData, addressRegion: e.target.value })}
                  >
                    <option value="">선택 안 함</option>
                    {REGIONS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div className="admin-modal-field">
                  <label>좌석 수</label>
                  <input
                    type="number"
                    value={formData.seatLimit}
                    onChange={(e) => setFormData({ ...formData, seatLimit: e.target.value })}
                  />
                </div>
              </div>
              <div className="admin-modal-field">
                <label>상세주소</label>
                <input
                  value={formData.addressDetail}
                  onChange={(e) => setFormData({ ...formData, addressDetail: e.target.value })}
                  placeholder="상세주소 입력"
                />
              </div>
            </div>

            <div className="admin-modal-section">
              <h3>기관 관리자</h3>
              {editOrg.admins && editOrg.admins.length > 0 ? (
                <table className="admin-detail-table" style={{ marginBottom: 12 }}>
                  <thead>
                    <tr>
                      <th>아이디</th>
                      <th>이름</th>
                      <th>연락처</th>
                      <th>역할</th>
                      <th>조치</th>
                    </tr>
                  </thead>
                  <tbody>
                    {editOrg.admins.map((a) => (
                      <tr key={a.userId}>
                        <td>{a.loginId}</td>
                        <td>{a.name || "-"}</td>
                        <td>{a.phone || "-"}</td>
                        <td>
                          <span className="status-pill" data-status="active">
                            {a.role === "HQ_ADMIN" ? "본사" : "기관"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="admin-detail-btn secondary"
                            type="button"
                            onClick={() => handleRemoveAdmin(a.userId)}
                            disabled={actionLoading}
                            style={{ fontSize: "11px", padding: "3px 8px" }}
                          >
                            해제
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="admin-detail-note">등록된 관리자가 없습니다.</p>
              )}
              <div className="admin-modal-row">
                <div className="admin-modal-field" style={{ flex: 1 }}>
                  <label>국어농장 아이디</label>
                  <input
                    value={adminLoginId}
                    onChange={(e) => setAdminLoginId(e.target.value)}
                    placeholder="국어농장 아이디 입력"
                  />
                </div>
              </div>
              <button
                className="admin-detail-btn secondary"
                type="button"
                onClick={handleAddAdmin}
                disabled={actionLoading}
                style={{ marginTop: 4 }}
              >
                관리자 추가
              </button>
            </div>

            <div className="admin-modal-actions">
              <button className="admin-detail-btn" onClick={handleEdit} disabled={actionLoading}>
                저장
              </button>
              <button
                className="admin-detail-btn secondary"
                onClick={() => handleDeactivate(editOrg.id)}
                disabled={actionLoading}
              >
                비활성화
              </button>
              <button
                className="admin-detail-btn secondary"
                onClick={() => setShowEditModal(false)}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}

export default AdminOrgsPage;
