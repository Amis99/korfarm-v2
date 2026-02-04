import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiPost, apiPatch } from "../utils/adminApi";
import { useAdminList } from "../hooks/useAdminList";
import "../styles/admin-detail.css";

const STUDENTS = [
  { id: "s1", name: "김서연", email: "", level: "프레게1", org: "해든 국어학원", status: "active" },
];

const mapStudents = (items) =>
  items.map((s) => ({
    id: s.id || s.user_id || s.userId || s.name,
    name: s.name,
    email: s.email || "",
    level: s.level_id || s.levelId || "-",
    org: s.org_name || s.orgName || "-",
    status: s.status || "active",
  }));

function AdminStudentsPage() {
  const { data: students, loading, error } = useAdminList("/v1/admin/students", STUDENTS, mapStudents);
  const [rows, setRows] = useState(STUDENTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [formData, setFormData] = useState({ email: "", name: "", orgId: "", password: "" });
  const [editFormData, setEditFormData] = useState({ name: "", status: "" });
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setRows(students);
  }, [students]);

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (!term) return true;
      return [s.name, s.email, s.level, s.org, s.status]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(term));
    });
  }, [rows, search, statusFilter]);

  const handleCreate = async () => {
    setActionError("");
    if (!formData.email.trim()) {
      setActionError("아이디를 입력해 주세요.");
      return;
    }
    if (!formData.orgId.trim()) {
      setActionError("기관 ID를 입력해 주세요.");
      return;
    }
    setActionLoading(true);
    try {
      const result = await apiPost("/v1/admin/students", {
        email: formData.email.trim(),
        name: formData.name.trim() || undefined,
        orgId: formData.orgId.trim(),
      });
      const mapped = mapStudents([result])[0];
      setRows((prev) => [mapped, ...prev]);
      setShowCreateModal(false);
      setFormData({ email: "", name: "", orgId: "", password: "" });
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editStudent) return;
    setActionError("");
    setActionLoading(true);
    try {
      const result = await apiPatch(`/v1/admin/students/${editStudent.id}`, {
        name: editFormData.name.trim() || undefined,
        status: editFormData.status || undefined,
      });
      const mapped = mapStudents([result])[0];
      setRows((prev) => prev.map((r) => (r.id === editStudent.id ? { ...r, ...mapped } : r)));
      setShowEditModal(false);
      setEditStudent(null);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisable = async (userId) => {
    setActionError("");
    setActionLoading(true);
    try {
      await apiPost(`/v1/admin/students/${userId}/disable`);
      setRows((prev) =>
        prev.map((r) => (r.id === userId ? { ...r, status: "inactive" } : r))
      );
      setShowEditModal(false);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openEdit = (student) => {
    setEditStudent(student);
    setEditFormData({ name: student.name, status: student.status });
    setActionError("");
    setShowEditModal(true);
  };

  return (
    <div className="admin-detail-page">
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>학생 관리</h1>
          <div className="admin-detail-actions">
            <button
              className="admin-detail-btn"
              type="button"
              onClick={() => {
                setFormData({ email: "", name: "", orgId: "", password: "" });
                setActionError("");
                setShowCreateModal(true);
              }}
            >
              학생 등록
            </button>
            <Link className="admin-detail-btn secondary" to="/admin">
              대시보드
            </Link>
          </div>
        </div>
        <div className="admin-detail-nav">
          <Link to="/admin/orgs">기관</Link>
          <Link to="/admin/classes">반</Link>
          <Link to="/admin/students">학생</Link>
          <Link to="/admin/parents">학부모 관리</Link>
          <Link to="/admin/content">콘텐츠</Link>
          <Link to="/admin/assignments">과제</Link>
          <Link to="/admin/seasons">시즌</Link>
          <Link to="/admin/shop/products">상품</Link>
          <Link to="/admin/shop/orders">주문</Link>
          <Link to="/admin/payments">결제</Link>
          <Link to="/admin/reports">보고</Link>
          <Link to="/admin/flags">플래그</Link>
        </div>
        <div className="admin-detail-grid">
          <div className="admin-detail-card">
            <h2>학생 목록</h2>
            <div className="admin-detail-toolbar">
              <div className="admin-detail-search">
                <span className="material-symbols-outlined">search</span>
                <input
                  placeholder="학생 검색"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="admin-detail-filters">
                {["all", "active", "trial", "inactive"].map((f) => (
                  <button
                    key={f}
                    className={`admin-filter ${statusFilter === f ? "active" : ""}`}
                    type="button"
                    onClick={() => setStatusFilter(f)}
                  >
                    {f === "all" ? "전체" : f === "active" ? "활성" : f === "trial" ? "체험" : "비활성"}
                  </button>
                ))}
              </div>
            </div>
            {loading ? <p className="admin-detail-note">학생을 불러오는 중...</p> : null}
            {error ? <p className="admin-detail-note error">{error}</p> : null}
            <table className="admin-detail-table">
              <thead>
                <tr>
                  <th>학생</th>
                  <th>아이디</th>
                  <th>레벨</th>
                  <th>기관</th>
                  <th>상태</th>
                  <th>조치</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((s) => (
                  <tr key={s.id}>
                    <td>{s.name}</td>
                    <td>{s.email || "-"}</td>
                    <td>{s.level}</td>
                    <td>{s.org}</td>
                    <td>
                      <span className="status-pill" data-status={s.status}>
                        {s.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="admin-detail-btn secondary"
                        type="button"
                        onClick={() => openEdit(s)}
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
            <h3>학생 요약</h3>
            <p>전체 {rows.length}명</p>
            <p>활성 {rows.filter((r) => r.status === "active").length}명</p>
          </div>
        </div>
      </div>

      {showCreateModal ? (
        <div className="admin-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>학생 등록</h2>
            {actionError ? <p className="admin-detail-note error">{actionError}</p> : null}
            <div className="admin-modal-field">
              <label>아이디 (이메일)</label>
              <input
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="student@example.com"
              />
            </div>
            <div className="admin-modal-field">
              <label>이름</label>
              <input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="이름"
              />
            </div>
            <div className="admin-modal-field">
              <label>기관 ID</label>
              <input
                value={formData.orgId}
                onChange={(e) => setFormData({ ...formData, orgId: e.target.value })}
                placeholder="기관 ID"
              />
            </div>
            <div className="admin-modal-actions">
              <button className="admin-detail-btn" onClick={handleCreate} disabled={actionLoading}>
                등록
              </button>
              <button className="admin-detail-btn secondary" onClick={() => setShowCreateModal(false)}>
                취소
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showEditModal && editStudent ? (
        <div className="admin-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>학생 수정</h2>
            {actionError ? <p className="admin-detail-note error">{actionError}</p> : null}
            <div className="admin-modal-field">
              <label>이름</label>
              <input
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              />
            </div>
            <div className="admin-modal-field">
              <label>상태</label>
              <select
                value={editFormData.status}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
              >
                <option value="active">활성</option>
                <option value="trial">체험</option>
                <option value="inactive">비활성</option>
              </select>
            </div>
            <div className="admin-modal-actions">
              <button className="admin-detail-btn" onClick={handleEdit} disabled={actionLoading}>
                저장
              </button>
              <button
                className="admin-detail-btn secondary"
                onClick={() => handleDisable(editStudent.id)}
                disabled={actionLoading}
              >
                비활성화
              </button>
              <button className="admin-detail-btn secondary" onClick={() => setShowEditModal(false)}>
                취소
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default AdminStudentsPage;
