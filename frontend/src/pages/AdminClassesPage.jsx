import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost, apiPatch } from "../utils/adminApi";
import { useAdminList } from "../hooks/useAdminList";
import { useAuth } from "../hooks/useAuth";
import AdminLayout from "../components/AdminLayout";
import "../styles/admin-detail.css";

const mapClassList = (items) =>
  items.map((c) => ({
    id: c.classId || c.class_id || c.id || c.name,
    name: c.name,
    description: c.description || "",
    orgId: c.orgId || c.org_id || "",
    orgName: c.orgName || c.org_name || "-",
    seatCount: c.seatCount ?? c.seat_count ?? 0,
    status: c.status || "active",
  }));

const EMPTY = [];

function AdminClassesPage() {
  const { user } = useAuth();
  const isHQ = user?.roles?.includes("HQ_ADMIN");

  const { data: classes, loading, error } = useAdminList("/v1/admin/classes", EMPTY, mapClassList);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // 기관 목록 (드롭다운용)
  const [orgs, setOrgs] = useState([]);
  useEffect(() => {
    apiGet("/v1/admin/orgs/available")
      .then((data) => {
        const list = Array.isArray(data) ? data : [];
        setOrgs(list.map((o) => ({ id: o.id || o.org_id, name: o.name })));
      })
      .catch(() => {});
  }, []);

  // 생성 모달
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ orgId: "", name: "", description: "" });

  // 수정 모달
  const [showEditModal, setShowEditModal] = useState(false);
  const [editClass, setEditClass] = useState(null);

  // 학생 관리
  const [classStudents, setClassStudents] = useState([]);
  const [studentLoginId, setStudentLoginId] = useState("");

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
      return [c.name, c.description, c.orgName, c.status]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(term));
    });
  }, [rows, search, statusFilter]);

  const refreshList = async () => {
    try {
      const freshClasses = await apiGet("/v1/admin/classes");
      setRows(mapClassList(Array.isArray(freshClasses) ? freshClasses : []));
    } catch {}
  };

  const handleCreate = async () => {
    setActionError("");
    if (!formData.name.trim()) {
      setActionError("반 이름을 입력해 주세요.");
      return;
    }
    if (!formData.orgId) {
      setActionError("기관을 선택해 주세요.");
      return;
    }
    setActionLoading(true);
    try {
      await apiPost("/v1/admin/classes", {
        org_id: formData.orgId,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
      });
      await refreshList();
      setShowCreateModal(false);
      setFormData({ orgId: "", name: "", description: "" });
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEdit = async () => {
    if (!editClass) return;
    setActionError("");
    setActionLoading(true);
    try {
      await apiPatch(`/v1/admin/classes/${editClass.id}`, {
        name: formData.name.trim() || undefined,
        description: formData.description.trim() || undefined,
      });
      await refreshList();
      setShowEditModal(false);
      setEditClass(null);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async (classId) => {
    setActionError("");
    setActionLoading(true);
    try {
      await apiPost(`/v1/admin/classes/${classId}/deactivate`);
      await refreshList();
      setShowEditModal(false);
      setEditClass(null);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openEdit = async (cls) => {
    setEditClass(cls);
    setFormData({
      orgId: cls.orgId,
      name: cls.name,
      description: cls.description || "",
    });
    setStudentLoginId("");
    setActionError("");
    setShowEditModal(true);
    // 학생 목록 로드
    try {
      const students = await apiGet(`/v1/admin/classes/${cls.id}/students`);
      setClassStudents(Array.isArray(students) ? students : []);
    } catch {
      setClassStudents([]);
    }
  };

  const handleAddStudent = async () => {
    if (!editClass) return;
    if (!studentLoginId.trim()) {
      setActionError("학생 아이디를 입력해 주세요.");
      return;
    }
    setActionError("");
    setActionLoading(true);
    try {
      // 학생 목록에서 loginId로 userId 찾기
      const allStudents = await apiGet("/v1/admin/students");
      const list = Array.isArray(allStudents) ? allStudents : [];
      const found = list.find(
        (s) => (s.loginId || s.login_id) === studentLoginId.trim()
      );
      if (!found) {
        setActionError("해당 아이디의 학생을 찾을 수 없습니다.");
        setActionLoading(false);
        return;
      }
      const userId = found.userId || found.user_id;
      await apiPost(`/v1/admin/classes/${editClass.id}/students`, {
        user_ids: [userId],
      });
      // 학생 목록 새로고침
      const students = await apiGet(`/v1/admin/classes/${editClass.id}/students`);
      setClassStudents(Array.isArray(students) ? students : []);
      await refreshList();
      // editClass 갱신
      const freshRows = await apiGet("/v1/admin/classes");
      const mapped = mapClassList(Array.isArray(freshRows) ? freshRows : []);
      const updated = mapped.find((c) => c.id === editClass.id);
      if (updated) setEditClass(updated);
      setStudentLoginId("");
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveStudent = async (userId) => {
    if (!editClass) return;
    setActionError("");
    setActionLoading(true);
    try {
      await apiPost(`/v1/admin/classes/${editClass.id}/students/${userId}/remove`);
      const students = await apiGet(`/v1/admin/classes/${editClass.id}/students`);
      setClassStudents(Array.isArray(students) ? students : []);
      await refreshList();
      const freshRows = await apiGet("/v1/admin/classes");
      const mapped = mapClassList(Array.isArray(freshRows) ? freshRows : []);
      const updated = mapped.find((c) => c.id === editClass.id);
      if (updated) setEditClass(updated);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // 기관관리자면 기관 자동 선택
  const effectiveOrgId = isHQ ? formData.orgId : (orgs.length > 0 ? orgs[0].id : "");

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
                setFormData({
                  orgId: isHQ ? "" : (orgs.length > 0 ? orgs[0].id : ""),
                  name: "",
                  description: "",
                });
                setActionError("");
                setShowCreateModal(true);
              }}
            >
              반 생성
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
                {["all", "active", "inactive"].map((f) => (
                  <button
                    key={f}
                    className={`admin-filter ${statusFilter === f ? "active" : ""}`}
                    type="button"
                    onClick={() => setStatusFilter(f)}
                  >
                    {f === "all" ? "전체" : f === "active" ? "활성" : "비활성"}
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
                  <th>설명</th>
                  <th>기관</th>
                  <th>학생 수</th>
                  <th>상태</th>
                  <th>조치</th>
                </tr>
              </thead>
              <tbody>
                {filteredClasses.map((c) => (
                  <tr key={c.id}>
                    <td>{c.name}</td>
                    <td>{c.description || "-"}</td>
                    <td>{c.orgName}</td>
                    <td>{c.seatCount}</td>
                    <td>
                      <span className="status-pill" data-status={c.status}>
                        {c.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="admin-detail-btn secondary"
                        type="button"
                        onClick={() => openEdit(c)}
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
            <h3>반 운영 요약</h3>
            <p>전체 {rows.length}개</p>
            <p>활성 {rows.filter((r) => r.status === "active").length}개</p>
          </div>
        </div>
      </div>

      {/* 생성 모달 */}
      {showCreateModal ? (
        <div className="admin-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>반 생성</h2>
            {actionError ? <p className="admin-detail-note error">{actionError}</p> : null}
            <div className="admin-modal-field">
              <label>기관</label>
              {isHQ ? (
                <select
                  value={formData.orgId}
                  onChange={(e) => setFormData({ ...formData, orgId: e.target.value })}
                >
                  <option value="">기관 선택</option>
                  {orgs.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              ) : (
                <input
                  value={orgs.length > 0 ? orgs[0].name : ""}
                  disabled
                  style={{ opacity: 0.7 }}
                />
              )}
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
              <label>설명</label>
              <input
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="반 설명 (선택사항)"
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

      {/* 수정 모달 */}
      {showEditModal && editClass ? (
        <div className="admin-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="admin-modal admin-modal-wide" onClick={(e) => e.stopPropagation()}>
            <h2>반 수정</h2>
            {actionError ? <p className="admin-detail-note error">{actionError}</p> : null}

            <div className="admin-modal-section">
              <h3>반 정보</h3>
              <div className="admin-modal-field">
                <label>기관</label>
                <input value={editClass.orgName} disabled style={{ opacity: 0.7 }} />
              </div>
              <div className="admin-modal-field">
                <label>반 이름</label>
                <input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="admin-modal-field">
                <label>설명</label>
                <input
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="반 설명"
                />
              </div>
            </div>

            <div className="admin-modal-section">
              <h3>소속 학생 ({classStudents.length}명)</h3>
              {classStudents.length > 0 ? (
                <table className="admin-detail-table" style={{ marginBottom: 12 }}>
                  <thead>
                    <tr>
                      <th>아이디</th>
                      <th>이름</th>
                      <th>레벨</th>
                      <th>조치</th>
                    </tr>
                  </thead>
                  <tbody>
                    {classStudents.map((s) => (
                      <tr key={s.userId || s.user_id}>
                        <td>{s.loginId || s.login_id}</td>
                        <td>{s.name || "-"}</td>
                        <td>{s.levelId || s.level_id || "-"}</td>
                        <td>
                          <button
                            className="admin-detail-btn secondary"
                            type="button"
                            onClick={() => handleRemoveStudent(s.userId || s.user_id)}
                            disabled={actionLoading}
                            style={{ fontSize: "11px", padding: "3px 8px" }}
                          >
                            제거
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="admin-detail-note">소속 학생이 없습니다.</p>
              )}
              <div className="admin-modal-row">
                <div className="admin-modal-field" style={{ flex: 1 }}>
                  <label>학생 아이디 (국어농장 아이디)</label>
                  <input
                    value={studentLoginId}
                    onChange={(e) => setStudentLoginId(e.target.value)}
                    placeholder="학생 아이디 입력"
                  />
                </div>
              </div>
              <button
                className="admin-detail-btn secondary"
                type="button"
                onClick={handleAddStudent}
                disabled={actionLoading}
                style={{ marginTop: 4 }}
              >
                학생 추가
              </button>
            </div>

            <div className="admin-modal-actions">
              <button className="admin-detail-btn" onClick={handleEdit} disabled={actionLoading}>
                저장
              </button>
              <button
                className="admin-detail-btn secondary"
                onClick={() => handleDeactivate(editClass.id)}
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

export default AdminClassesPage;
