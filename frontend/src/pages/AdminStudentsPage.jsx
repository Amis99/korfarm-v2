import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost, apiPatch } from "../utils/adminApi";
import { useAdminList } from "../hooks/useAdminList";
import AdminLayout from "../components/AdminLayout";
import OrgSelect from "../components/OrgSelect";
import "../styles/admin-detail.css";

const STUDENTS = [
  { id: "s1", name: "김서연", email: "", level: "프레게1", org: "해든 국어학원", status: "active" },
];

const mapStudents = (items) =>
  items.map((s) => ({
    id: s.userId || s.id || s.user_id,
    name: s.name,
    email: s.loginId || s.email || "",
    level: s.levelId || s.level_id || "-",
    school: s.school || "",
    gradeLabel: s.gradeLabel || s.grade_label || "",
    studentPhone: s.studentPhone || s.student_phone || "",
    parentPhone: s.parentPhone || s.parent_phone || "",
    region: s.region || "",
    orgId: s.orgId || s.org_id || "",
    org: s.orgName || s.org_name || "국어농장",
    classIds: s.classIds || s.class_ids || [],
    classNames: s.classNames || s.class_names || [],
    subscriptionStatus: s.subscriptionStatus || s.subscription_status || null,
    subscriptionEndAt: s.subscriptionEndAt || s.subscription_end_at || null,
    status: s.status || "active",
  }));

const subscriptionLabel = (status) => {
  if (!status || status === "expired") return "무료";
  if (status === "active") return "유료";
  if (status === "canceled") return "해지";
  return status;
};

function AdminStudentsPage() {
  const { data: students, loading, error } = useAdminList("/v1/admin/students", STUDENTS, mapStudents);
  const [rows, setRows] = useState(STUDENTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [formData, setFormData] = useState({ email: "", name: "", orgId: "", password: "" });
  const [editFormData, setEditFormData] = useState({
    name: "", status: "", school: "", gradeLabel: "", levelId: "",
    studentPhone: "", parentPhone: "", region: "",
    orgId: "", classIds: [],
    subscriptionStatus: "free", subscriptionEndAt: "",
  });
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [orgs, setOrgs] = useState([]);
  const [classes, setClasses] = useState([]);

  useEffect(() => {
    setRows(students);
  }, [students]);

  useEffect(() => {
    apiGet("/v1/admin/orgs").then((data) => setOrgs(Array.isArray(data) ? data : [])).catch(() => {});
    apiGet("/v1/admin/classes").then((data) => setClasses(Array.isArray(data) ? data : [])).catch(() => {});
  }, []);

  const filteredClasses = useMemo(() => {
    if (!editFormData.orgId) return classes;
    return classes.filter((c) => (c.orgId || c.org_id) === editFormData.orgId);
  }, [classes, editFormData.orgId]);

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((s) => {
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      if (!term) return true;
      return [s.name, s.email, s.level, s.org, s.school, s.status]
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
        school: editFormData.school.trim() || undefined,
        gradeLabel: editFormData.gradeLabel.trim() || undefined,
        levelId: editFormData.levelId.trim() || undefined,
        studentPhone: editFormData.studentPhone.trim() || undefined,
        parentPhone: editFormData.parentPhone.trim() || undefined,
        region: editFormData.region.trim() || undefined,
        orgId: editFormData.orgId || undefined,
        classIds: editFormData.classIds.length > 0 ? editFormData.classIds : undefined,
      });
      const mapped = mapStudents([result])[0];

      // Handle subscription change
      const currentSubStatus = editStudent.subscriptionStatus;
      const newSubStatus = editFormData.subscriptionStatus;
      const isCurrentlyPaid = currentSubStatus === "active";
      const wantsPaid = newSubStatus === "active";

      if (isCurrentlyPaid !== wantsPaid || (wantsPaid && editFormData.subscriptionEndAt !== (editStudent.subscriptionEndAt || "").slice(0, 10))) {
        const subResult = await apiPost(`/v1/admin/students/${editStudent.id}/subscription`, {
          status: wantsPaid ? "active" : "free",
          endAt: wantsPaid && editFormData.subscriptionEndAt ? editFormData.subscriptionEndAt : undefined,
        });
        const subMapped = mapStudents([subResult])[0];
        setRows((prev) => prev.map((r) => (r.id === editStudent.id ? { ...r, ...subMapped } : r)));
      } else {
        setRows((prev) => prev.map((r) => (r.id === editStudent.id ? { ...r, ...mapped } : r)));
      }

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
    setEditFormData({
      name: student.name || "",
      status: student.status || "active",
      school: student.school || "",
      gradeLabel: student.gradeLabel || "",
      levelId: student.level === "-" ? "" : student.level || "",
      studentPhone: student.studentPhone || "",
      parentPhone: student.parentPhone || "",
      region: student.region || "",
      orgId: student.orgId || "",
      classIds: student.classIds || [],
      subscriptionStatus: student.subscriptionStatus === "active" ? "active" : "free",
      subscriptionEndAt: student.subscriptionEndAt ? student.subscriptionEndAt.slice(0, 10) : "",
    });
    setActionError("");
    setShowEditModal(true);
  };

  const toggleClassId = (classId) => {
    setEditFormData((prev) => {
      const ids = prev.classIds.includes(classId)
        ? prev.classIds.filter((id) => id !== classId)
        : [...prev.classIds, classId];
      return { ...prev, classIds: ids };
    });
  };

  return (
    <AdminLayout>
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
          </div>
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
                  <th>학교</th>
                  <th>구독</th>
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
                    <td>{s.school || "-"}</td>
                    <td>
                      <span
                        className="status-pill"
                        data-status={s.subscriptionStatus === "active" ? "active" : "inactive"}
                      >
                        {subscriptionLabel(s.subscriptionStatus)}
                      </span>
                    </td>
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
              <label>기관</label>
              <OrgSelect
                orgs={orgs.map((o) => ({ id: o.orgId || o.id, name: o.name }))}
                value={formData.orgId}
                onChange={(v) => setFormData({ ...formData, orgId: v })}
                placeholder="기관 선택"
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
          <div className="admin-modal admin-modal-wide" onClick={(e) => e.stopPropagation()}>
            <h2>학생 수정</h2>
            {actionError ? <p className="admin-detail-note error">{actionError}</p> : null}

            <div className="admin-modal-section">
              <h3>개인정보</h3>
              <div className="admin-modal-row">
                <div className="admin-modal-field">
                  <label>이름</label>
                  <input
                    value={editFormData.name}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  />
                </div>
                <div className="admin-modal-field">
                  <label>학교</label>
                  <input
                    value={editFormData.school}
                    onChange={(e) => setEditFormData({ ...editFormData, school: e.target.value })}
                    placeholder="학교명"
                  />
                </div>
              </div>
              <div className="admin-modal-row">
                <div className="admin-modal-field">
                  <label>학년</label>
                  <input
                    value={editFormData.gradeLabel}
                    onChange={(e) => setEditFormData({ ...editFormData, gradeLabel: e.target.value })}
                    placeholder="예: 중1"
                  />
                </div>
                <div className="admin-modal-field">
                  <label>지역</label>
                  <input
                    value={editFormData.region}
                    onChange={(e) => setEditFormData({ ...editFormData, region: e.target.value })}
                    placeholder="지역"
                  />
                </div>
              </div>
              <div className="admin-modal-row">
                <div className="admin-modal-field">
                  <label>학생 연락처</label>
                  <input
                    value={editFormData.studentPhone}
                    onChange={(e) => setEditFormData({ ...editFormData, studentPhone: e.target.value })}
                    placeholder="010-0000-0000"
                  />
                </div>
                <div className="admin-modal-field">
                  <label>학부모 연락처</label>
                  <input
                    value={editFormData.parentPhone}
                    onChange={(e) => setEditFormData({ ...editFormData, parentPhone: e.target.value })}
                    placeholder="010-0000-0000"
                  />
                </div>
              </div>
            </div>

            <div className="admin-modal-section">
              <h3>소속 정보</h3>
              <div className="admin-modal-row">
                <div className="admin-modal-field">
                  <label>기관</label>
                  <OrgSelect
                    orgs={orgs.map((o) => ({ id: o.orgId || o.id, name: o.name }))}
                    value={editFormData.orgId}
                    onChange={(v) => setEditFormData({ ...editFormData, orgId: v, classIds: [] })}
                    placeholder="기관 없음"
                  />
                </div>
                <div className="admin-modal-field">
                  <label>레벨</label>
                  <input
                    value={editFormData.levelId}
                    onChange={(e) => setEditFormData({ ...editFormData, levelId: e.target.value })}
                    placeholder="레벨 ID"
                  />
                </div>
              </div>
              <div className="admin-modal-field">
                <label>수강반</label>
                {filteredClasses.length === 0 ? (
                  <p className="admin-detail-note">수강반이 없습니다.</p>
                ) : (
                  <div className="admin-checkbox-group">
                    {filteredClasses.map((c) => {
                      const cId = c.classId || c.id;
                      return (
                        <label key={cId} className="admin-checkbox-label">
                          <input
                            type="checkbox"
                            checked={editFormData.classIds.includes(cId)}
                            onChange={() => toggleClassId(cId)}
                          />
                          {c.name}
                        </label>
                      );
                    })}
                  </div>
                )}
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
            </div>

            <div className="admin-modal-section">
              <h3>구독 정보</h3>
              <div className="admin-modal-row">
                <div className="admin-modal-field">
                  <label>유형</label>
                  <select
                    value={editFormData.subscriptionStatus}
                    onChange={(e) => setEditFormData({ ...editFormData, subscriptionStatus: e.target.value })}
                  >
                    <option value="free">무료</option>
                    <option value="active">유료</option>
                  </select>
                </div>
                {editFormData.subscriptionStatus === "active" ? (
                  <div className="admin-modal-field">
                    <label>구독 종료일</label>
                    <input
                      type="date"
                      value={editFormData.subscriptionEndAt}
                      onChange={(e) => setEditFormData({ ...editFormData, subscriptionEndAt: e.target.value })}
                    />
                  </div>
                ) : null}
              </div>
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
    </AdminLayout>
  );
}

export default AdminStudentsPage;
