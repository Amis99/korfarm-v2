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
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 5;

  // 선택된 반 (오른쪽 학생 패널용)
  const [selectedClass, setSelectedClass] = useState(null);
  const [panelStudents, setPanelStudents] = useState([]);
  const [panelAllStudents, setPanelAllStudents] = useState([]);
  const [panelStudentSearch, setPanelStudentSearch] = useState("");
  const [panelSelectedIds, setPanelSelectedIds] = useState(new Set());
  const [panelLoading, setPanelLoading] = useState(false);

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

  // 학생 일괄 배정용
  const [allStudents, setAllStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudentIds, setSelectedStudentIds] = useState(new Set());

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

  const totalPages = Math.max(1, Math.ceil(filteredClasses.length / PAGE_SIZE));
  const pagedClasses = filteredClasses.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // 검색/필터 변경 시 페이지 리셋
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  // 반 선택 → 학생 로드
  const selectClassForPanel = async (cls) => {
    setSelectedClass(cls);
    setPanelStudentSearch("");
    setPanelSelectedIds(new Set());
    setPanelLoading(true);
    try {
      const [studentsRes, allRes] = await Promise.all([
        apiGet(`/v1/admin/classes/${cls.id}/students`),
        apiGet("/v1/admin/students"),
      ]);
      setPanelStudents(Array.isArray(studentsRes) ? studentsRes : []);
      setPanelAllStudents(Array.isArray(allRes) ? allRes : []);
    } catch {
      setPanelStudents([]);
      setPanelAllStudents([]);
    } finally {
      setPanelLoading(false);
    }
  };

  const refreshPanel = async (classId) => {
    try {
      const studentsRes = await apiGet(`/v1/admin/classes/${classId}/students`);
      setPanelStudents(Array.isArray(studentsRes) ? studentsRes : []);
    } catch {}
  };

  const handlePanelBulkAssign = async () => {
    if (!selectedClass || panelSelectedIds.size === 0) return;
    setActionLoading(true);
    try {
      await apiPost(`/v1/admin/classes/${selectedClass.id}/students`, {
        user_ids: Array.from(panelSelectedIds),
      });
      await refreshPanel(selectedClass.id);
      await refreshList();
      setPanelSelectedIds(new Set());
      setPanelStudentSearch("");
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handlePanelRemoveStudent = async (userId) => {
    if (!selectedClass) return;
    setActionLoading(true);
    try {
      await apiPost(`/v1/admin/classes/${selectedClass.id}/students/${userId}/remove`);
      await refreshPanel(selectedClass.id);
      await refreshList();
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const togglePanelSelection = (userId) => {
    setPanelSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  const refreshList = async () => {
    try {
      const freshClasses = await apiGet("/v1/admin/classes");
      const mapped = mapClassList(Array.isArray(freshClasses) ? freshClasses : []);
      setRows(mapped);
      // 선택된 반 정보 갱신
      if (selectedClass) {
        const updated = mapped.find((c) => c.id === selectedClass.id);
        if (updated) setSelectedClass(updated);
      }
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
    setStudentSearch("");
    setSelectedStudentIds(new Set());
    setActionError("");
    setShowEditModal(true);
    // 소속 학생 + 전체 학생 목록 동시 로드
    try {
      const [classStudentsRes, allStudentsRes] = await Promise.all([
        apiGet(`/v1/admin/classes/${cls.id}/students`),
        apiGet("/v1/admin/students"),
      ]);
      setClassStudents(Array.isArray(classStudentsRes) ? classStudentsRes : []);
      setAllStudents(Array.isArray(allStudentsRes) ? allStudentsRes : []);
    } catch {
      setClassStudents([]);
      setAllStudents([]);
    }
  };

  const handleBulkAssign = async () => {
    if (!editClass || selectedStudentIds.size === 0) return;
    setActionError("");
    setActionLoading(true);
    try {
      await apiPost(`/v1/admin/classes/${editClass.id}/students`, {
        user_ids: Array.from(selectedStudentIds),
      });
      // 소속 학생 새로고침
      const students = await apiGet(`/v1/admin/classes/${editClass.id}/students`);
      setClassStudents(Array.isArray(students) ? students : []);
      await refreshList();
      const freshRows = await apiGet("/v1/admin/classes");
      const mapped = mapClassList(Array.isArray(freshRows) ? freshRows : []);
      const updated = mapped.find((c) => c.id === editClass.id);
      if (updated) setEditClass(updated);
      setSelectedStudentIds(new Set());
      setStudentSearch("");
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleStudentSelection = (userId) => {
    setSelectedStudentIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }
      return next;
    });
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
              style={{ background: "#ff7f2a", color: "#fff", padding: "8px 20px" }}
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
                {pagedClasses.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => selectClassForPanel(c)}
                    style={{
                      cursor: "pointer",
                      background: selectedClass?.id === c.id ? "rgba(255,255,255,0.08)" : undefined,
                    }}
                  >
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
                        onClick={(e) => { e.stopPropagation(); openEdit(c); }}
                        style={{ fontSize: "12px", padding: "4px 8px" }}
                      >
                        수정
                      </button>
                      {c.status === "active" ? (
                        <button
                          className="admin-detail-btn secondary"
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`"${c.name}" 반을 삭제(비활성화)하시겠습니까?`)) {
                              handleDeactivate(c.id);
                            }
                          }}
                          style={{ fontSize: "12px", padding: "4px 8px", marginLeft: 4, color: "#c0392b" }}
                        >
                          삭제
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {/* 페이지네이션 */}
            {totalPages > 1 ? (
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, marginTop: 12 }}>
                <button
                  className="admin-detail-btn secondary"
                  style={{ fontSize: 12, padding: "4px 10px" }}
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  이전
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={`admin-detail-btn ${p === currentPage ? "" : "secondary"}`}
                    style={{ fontSize: 12, padding: "4px 10px", minWidth: 32 }}
                    onClick={() => setCurrentPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  className="admin-detail-btn secondary"
                  style={{ fontSize: 12, padding: "4px 10px" }}
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  다음
                </button>
              </div>
            ) : null}
          </div>
          {/* 학생 현황 패널 */}
          <div className="admin-detail-card">
            {selectedClass ? (
              <>
                <h3>학생 현황 — {selectedClass.name}</h3>
                {panelLoading ? (
                  <p className="admin-detail-note">학생 목록 로딩 중...</p>
                ) : (
                  <>
                    {/* 소속 학생 테이블 */}
                    <h4 style={{ margin: "8px 0 4px", fontSize: 13 }}>소속 학생 ({panelStudents.length}명)</h4>
                    {panelStudents.length > 0 ? (
                      <div style={{ maxHeight: 220, overflowY: "auto" }}>
                        <table className="admin-detail-table" style={{ fontSize: 12 }}>
                          <thead>
                            <tr>
                              <th>이름</th>
                              <th>학교</th>
                              <th>학년</th>
                              <th>레벨</th>
                              <th>조치</th>
                            </tr>
                          </thead>
                          <tbody>
                            {panelStudents.map((s) => {
                              const uid = s.userId || s.user_id;
                              return (
                                <tr key={uid}>
                                  <td>{s.name || "-"}</td>
                                  <td>{s.school || "-"}</td>
                                  <td>{s.gradeLabel || s.grade_label || "-"}</td>
                                  <td>{s.levelId || s.level_id || "-"}</td>
                                  <td>
                                    <button
                                      className="admin-detail-btn secondary"
                                      type="button"
                                      onClick={() => handlePanelRemoveStudent(uid)}
                                      disabled={actionLoading}
                                      style={{ fontSize: 11, padding: "2px 6px", color: "#c0392b" }}
                                    >
                                      제거
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="admin-detail-note" style={{ fontSize: 12 }}>소속 학생이 없습니다.</p>
                    )}

                    {/* 학생 배정 드롭다운 */}
                    <h4 style={{ margin: "14px 0 4px", fontSize: 13 }}>학생 배정</h4>
                    <div style={{ border: "1px solid #d5d9e2", borderRadius: 8, overflow: "hidden", background: "#fff" }}>
                      <div style={{ padding: "6px 10px", borderBottom: "1px solid #eee" }}>
                        <input
                          value={panelStudentSearch}
                          onChange={(e) => setPanelStudentSearch(e.target.value)}
                          placeholder="학생 검색 (이름, 학교, 학년, 레벨)"
                          style={{ width: "100%", border: "none", outline: "none", fontSize: 12 }}
                        />
                      </div>
                      <div style={{ maxHeight: 200, overflowY: "auto", padding: "2px 0" }}>
                        {(() => {
                          const assignedIds = new Set(panelStudents.map((s) => s.userId || s.user_id));
                          const term = panelStudentSearch.trim().toLowerCase();
                          const filtered = panelAllStudents.filter((s) => {
                            if (!term) return true;
                            const fields = [s.name, s.loginId || s.login_id, s.school, s.gradeLabel || s.grade_label, s.levelId || s.level_id];
                            return fields.filter(Boolean).some((v) => v.toLowerCase().includes(term));
                          });
                          if (filtered.length === 0) {
                            return <p style={{ padding: "6px 12px", color: "#999", fontSize: 12 }}>검색 결과가 없습니다.</p>;
                          }
                          return filtered.map((s) => {
                            const uid = s.userId || s.user_id;
                            const isAssigned = assignedIds.has(uid);
                            const isSelected = panelSelectedIds.has(uid);
                            return (
                              <label
                                key={uid}
                                style={{
                                  display: "flex", alignItems: "center", gap: 6,
                                  padding: "4px 10px", cursor: isAssigned ? "default" : "pointer",
                                  opacity: isAssigned ? 0.5 : 1,
                                  background: isSelected ? "#d6e4ff" : "transparent", fontSize: 12,
                                }}
                              >
                                <input type="checkbox" checked={isSelected} disabled={isAssigned}
                                  onChange={() => !isAssigned && togglePanelSelection(uid)} />
                                <span style={{ fontWeight: 600, color: "#222" }}>{s.name || "-"}</span>
                                <span style={{ color: "#555" }}>
                                  {[s.school, s.gradeLabel || s.grade_label, s.levelId || s.level_id].filter(Boolean).join(" / ") || "-"}
                                </span>
                                {isAssigned ? <span style={{ color: "#2980b9", fontSize: 10, marginLeft: "auto" }}>배정됨</span> : null}
                              </label>
                            );
                          });
                        })()}
                      </div>
                    </div>
                    {panelSelectedIds.size > 0 ? (
                      <button
                        className="admin-detail-btn"
                        type="button"
                        onClick={handlePanelBulkAssign}
                        disabled={actionLoading}
                        style={{ marginTop: 6, fontSize: 12 }}
                      >
                        선택한 {panelSelectedIds.size}명 배정
                      </button>
                    ) : null}
                  </>
                )}
              </>
            ) : (
              <div style={{ textAlign: "center", color: "#999", padding: "40px 0" }}>
                <p style={{ fontSize: 14 }}>반을 선택하면 학생 현황이 표시됩니다.</p>
              </div>
            )}
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
              <div style={{ marginTop: 12 }}>
                <label style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, display: "block" }}>학생 배정</label>
                <div style={{
                  border: "1px solid #d5d9e2",
                  borderRadius: 8,
                  overflow: "hidden",
                  background: "#fff",
                }}>
                  <div style={{ padding: "8px 10px", borderBottom: "1px solid #eee" }}>
                    <input
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      placeholder="학생 검색 (아이디 또는 이름)"
                      style={{ width: "100%", border: "none", outline: "none", fontSize: 13 }}
                    />
                  </div>
                  <div style={{ maxHeight: 240, overflowY: "auto", padding: "4px 0" }}>
                    {(() => {
                      const assignedIds = new Set(classStudents.map((s) => s.userId || s.user_id));
                      const term = studentSearch.trim().toLowerCase();
                      const filtered = allStudents.filter((s) => {
                        if (!term) return true;
                        const fields = [s.loginId || s.login_id, s.name, s.school, s.gradeLabel || s.grade_label, s.levelId || s.level_id];
                        return fields.filter(Boolean).some((v) => v.toLowerCase().includes(term));
                      });
                      if (filtered.length === 0) {
                        return <p style={{ padding: "8px 12px", color: "#999", fontSize: 13 }}>검색 결과가 없습니다.</p>;
                      }
                      return filtered.map((s) => {
                        const uid = s.userId || s.user_id;
                        const loginId = s.loginId || s.login_id;
                        const isAssigned = assignedIds.has(uid);
                        const isSelected = selectedStudentIds.has(uid);
                        return (
                          <label
                            key={uid}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                              padding: "5px 12px",
                              cursor: isAssigned ? "default" : "pointer",
                              opacity: isAssigned ? 0.5 : 1,
                              background: isSelected ? "#d6e4ff" : "transparent",
                              fontSize: 13,
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={isAssigned}
                              onChange={() => !isAssigned && toggleStudentSelection(uid)}
                            />
                            <span style={{ fontWeight: 600, color: "#222" }}>{s.name || "-"}</span>
                            <span style={{ color: "#555" }}>{[s.school, s.gradeLabel || s.grade_label, s.levelId || s.level_id].filter(Boolean).join(" / ") || "-"}</span>
                            {isAssigned ? <span style={{ color: "#2980b9", fontSize: 11, marginLeft: "auto" }}>배정됨</span> : null}
                          </label>
                        );
                      });
                    })()}
                  </div>
                </div>
                {selectedStudentIds.size > 0 ? (
                  <button
                    className="admin-detail-btn"
                    type="button"
                    onClick={handleBulkAssign}
                    disabled={actionLoading}
                    style={{ marginTop: 8, fontSize: 13 }}
                  >
                    선택한 {selectedStudentIds.size}명 배정
                  </button>
                ) : null}
              </div>
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
