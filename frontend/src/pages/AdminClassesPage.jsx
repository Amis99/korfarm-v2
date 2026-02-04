import { useEffect, useMemo, useState } from "react";
import { apiPost, apiPatch } from "../utils/adminApi";
import { useAdminList } from "../hooks/useAdminList";
import AdminLayout from "../components/AdminLayout";
import "../styles/admin-detail.css";

const CLASSES = [
  { id: "c1", name: "초4 A반", level: "프레게1", org: "해든 국어학원", seats: 28, status: "active" },
];

const mapClassList = (items) =>
  items.map((c) => ({
    id: c.id || c.class_id || c.name,
    name: c.name,
    level: c.level_id || c.levelId || "-",
    orgId: c.org_id || c.orgId || "",
    org: c.org_name || c.orgName || c.org_id || "-",
    seats: c.seat_count ?? c.seatCount ?? 0,
    status: c.status || "active",
  }));

function AdminClassesPage() {
  const { data: classes, loading, error } = useAdminList("/v1/admin/classes", CLASSES, mapClassList);
  const [rows, setRows] = useState(CLASSES);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [formData, setFormData] = useState({ orgId: "", name: "", levelId: "", grade: "" });
  const [assignData, setAssignData] = useState({ classId: "", userIds: "" });
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setRows(classes);
  }, [classes]);

  const filteredClasses = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (!term) return true;
      return [c.name, c.level, c.org, c.status]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(term));
    });
  }, [rows, search, statusFilter]);

  const handleCreate = async () => {
    setActionError("");
    if (!formData.name.trim()) {
      setActionError("반 이름을 입력해 주세요.");
      return;
    }
    if (!formData.orgId.trim()) {
      setActionError("기관 ID를 입력해 주세요.");
      return;
    }
    setActionLoading(true);
    try {
      const result = await apiPost("/v1/admin/classes", {
        orgId: formData.orgId.trim(),
        name: formData.name.trim(),
        levelId: formData.levelId.trim() || undefined,
        grade: formData.grade.trim() || undefined,
      });
      const mapped = mapClassList([result])[0];
      setRows((prev) => [mapped, ...prev]);
      setShowCreateModal(false);
      setFormData({ orgId: "", name: "", levelId: "", grade: "" });
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssign = async () => {
    setActionError("");
    if (!assignData.classId.trim()) {
      setActionError("반 ID를 입력해 주세요.");
      return;
    }
    if (!assignData.userIds.trim()) {
      setActionError("학생 ID를 입력해 주세요.");
      return;
    }
    setActionLoading(true);
    try {
      const userIds = assignData.userIds.split(",").map((s) => s.trim()).filter(Boolean);
      await apiPost(`/v1/admin/classes/${assignData.classId.trim()}/students`, { userIds });
      setShowAssignModal(false);
      setAssignData({ classId: "", userIds: "" });
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>반 관리</h1>
          <div className="admin-detail-actions">
            <button
              className="admin-detail-btn"
              type="button"
              onClick={() => {
                setFormData({ orgId: "", name: "", levelId: "", grade: "" });
                setActionError("");
                setShowCreateModal(true);
              }}
            >
              반 생성
            </button>
            <button
              className="admin-detail-btn secondary"
              type="button"
              onClick={() => {
                setAssignData({ classId: "", userIds: "" });
                setActionError("");
                setShowAssignModal(true);
              }}
            >
              학생 배정
            </button>
          </div>
        </div>
        <div className="admin-detail-grid">
          <div className="admin-detail-card">
            <h2>반 리스트</h2>
            <div className="admin-detail-toolbar">
              <div className="admin-detail-search">
                <span className="material-symbols-outlined">search</span>
                <input
                  placeholder="반/기관 검색"
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
            {loading ? <p className="admin-detail-note">반 목록을 불러오는 중...</p> : null}
            {error ? <p className="admin-detail-note error">{error}</p> : null}
            <table className="admin-detail-table">
              <thead>
                <tr>
                  <th>반명</th>
                  <th>레벨</th>
                  <th>기관</th>
                  <th>학생 수</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {filteredClasses.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.level}</td>
                    <td>{c.org}</td>
                    <td>{c.seats}</td>
                    <td>
                      <span className="status-pill" data-status={c.status}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-detail-card">
            <h3>반 운영 요약</h3>
            <p>전체 {rows.length}개</p>
            <p>활성 {rows.filter((r) => r.status === "active").length}개</p>
          </div>
        </div>
      </div>

      {showCreateModal ? (
        <div className="admin-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>반 생성</h2>
            {actionError ? <p className="admin-detail-note error">{actionError}</p> : null}
            <div className="admin-modal-field">
              <label>기관 ID</label>
              <input
                value={formData.orgId}
                onChange={(e) => setFormData({ ...formData, orgId: e.target.value })}
                placeholder="기관 ID"
              />
            </div>
            <div className="admin-modal-field">
              <label>반 이름</label>
              <input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="반 이름"
              />
            </div>
            <div className="admin-modal-field">
              <label>레벨 ID</label>
              <input
                value={formData.levelId}
                onChange={(e) => setFormData({ ...formData, levelId: e.target.value })}
                placeholder="선택사항"
              />
            </div>
            <div className="admin-modal-field">
              <label>학년</label>
              <input
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                placeholder="선택사항"
              />
            </div>
            <div className="admin-modal-actions">
              <button className="admin-detail-btn" onClick={handleCreate} disabled={actionLoading}>
                생성
              </button>
              <button className="admin-detail-btn secondary" onClick={() => setShowCreateModal(false)}>
                취소
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showAssignModal ? (
        <div className="admin-modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>학생 배정</h2>
            {actionError ? <p className="admin-detail-note error">{actionError}</p> : null}
            <div className="admin-modal-field">
              <label>반 ID</label>
              <input
                value={assignData.classId}
                onChange={(e) => setAssignData({ ...assignData, classId: e.target.value })}
                placeholder="반 ID"
              />
            </div>
            <div className="admin-modal-field">
              <label>학생 ID (쉼표 구분)</label>
              <input
                value={assignData.userIds}
                onChange={(e) => setAssignData({ ...assignData, userIds: e.target.value })}
                placeholder="user1, user2, user3"
              />
            </div>
            <div className="admin-modal-actions">
              <button className="admin-detail-btn" onClick={handleAssign} disabled={actionLoading}>
                배정
              </button>
              <button className="admin-detail-btn secondary" onClick={() => setShowAssignModal(false)}>
                취소
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}

export default AdminClassesPage;
