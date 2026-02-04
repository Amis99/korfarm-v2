import { useEffect, useMemo, useState } from "react";
import { apiPost, apiPatch } from "../utils/adminApi";
import { useAdminList } from "../hooks/useAdminList";
import AdminLayout from "../components/AdminLayout";
import "../styles/admin-detail.css";

const ORGS = [
  { id: "sample1", name: "Korfarm Academy", plan: "Pro", seats: 120, status: "active" },
];

const mapOrgList = (items) =>
  items.map((org) => ({
    id: org.id || org.org_id || org.name,
    name: org.name,
    plan: org.plan || "-",
    seats: org.seat_limit ?? org.seatLimit ?? 0,
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
  const [formData, setFormData] = useState({ name: "", plan: "Basic", seatLimit: 50 });
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
      return [org.name, org.plan, org.status]
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
      });
      const mapped = mapOrgList([result])[0];
      setRows((prev) => [mapped, ...prev]);
      setShowCreateModal(false);
      setFormData({ name: "", plan: "Basic", seatLimit: 50 });
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
      });
      const mapped = mapOrgList([result])[0];
      setRows((prev) => prev.map((r) => (r.id === editOrg.id ? { ...r, ...mapped } : r)));
      setShowEditModal(false);
      setEditOrg(null);
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

  const openEdit = (org) => {
    setEditOrg(org);
    setFormData({ name: org.name, plan: org.plan, seatLimit: org.seats });
    setActionError("");
    setShowEditModal(true);
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
                setFormData({ name: "", plan: "Basic", seatLimit: 50 });
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
                  <th>플랜</th>
                  <th>좌석</th>
                  <th>상태</th>
                  <th>조치</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrgs.map((org) => (
                  <tr key={org.id}>
                    <td>{org.name}</td>
                    <td>{org.plan}</td>
                    <td>{org.seats}</td>
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
            <div className="admin-modal-field">
              <label>좌석 수</label>
              <input
                type="number"
                value={formData.seatLimit}
                onChange={(e) => setFormData({ ...formData, seatLimit: e.target.value })}
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
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>기관 수정</h2>
            {actionError ? <p className="admin-detail-note error">{actionError}</p> : null}
            <div className="admin-modal-field">
              <label>기관명</label>
              <input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
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
            <div className="admin-modal-field">
              <label>좌석 수</label>
              <input
                type="number"
                value={formData.seatLimit}
                onChange={(e) => setFormData({ ...formData, seatLimit: e.target.value })}
              />
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
