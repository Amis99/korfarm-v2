import { useEffect, useMemo, useState, useCallback } from "react";
import { apiPost, apiGet } from "../utils/adminApi";
import { useAdminList } from "../hooks/useAdminList";
import { useAuth } from "../hooks/useAuth";
import { LEARNING_CATALOG, LEARNING_CATEGORIES } from "../data/learning/learningCatalog";
import AdminLayout from "../components/AdminLayout";
import "../styles/admin-detail.css";

const ASSIGNMENTS = [];
const FEEDBACK = [];

const TYPE_LABELS = { farm: "농장 학습", pro: "프로 학습", writing: "글쓰기" };

const normalizeAssignmentStatus = (status) => {
  if (!status) return "active";
  if (status === "open") return "active";
  if (status === "closed") return "closed";
  return status;
};

const mapAssignmentList = (items) =>
  items.map((a) => ({
    id: a.id || a.assignmentId || a.assignment_id || a.title,
    title: a.title,
    type: a.assignmentType || a.assignment_type || a.type,
    due: a.dueAt || a.due_at || "-",
    status: normalizeAssignmentStatus(a.status),
  }));

/* 피드백 상태 한글 매핑 */
const STATUS_LABEL = {
  pending: "대기",
  submitted: "대기",
  reviewing: "검토",
  completed: "완료",
};

const normalizeStatusKey = (status) => {
  if (!status || status === "submitted") return "pending";
  return status;
};

const mapFeedbackList = (items) =>
  items.map((s) => {
    const rawStatus = s.status || "pending";
    const statusKey = normalizeStatusKey(rawStatus);
    return {
      submissionId: s.submissionId || s.submission_id || "",
      student: s.studentName || s.student_name || s.userId || s.user_id || "-",
      promptId: s.promptId || s.prompt_id || "-",
      status: rawStatus,
      statusKey,
      statusLabel: STATUS_LABEL[statusKey] || rawStatus,
      submittedAt: s.submittedAt || s.submitted_at || null,
    };
  });

/* 날짜 포맷 유틸 */
const fmtDate = (d) => {
  if (!d) return "-";
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return "-";
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
};

function AdminAssignmentsPage() {
  const { user } = useAuth();
  const userRoles = user?.roles || [];
  const isHqAdmin = userRoles.includes("HQ_ADMIN");

  /* === 탭 상태 === */
  const [activeTab, setActiveTab] = useState("assignments");

  /* === 과제 탭 데이터 === */
  const { data: assignments, loading, error } = useAdminList(
    "/v1/admin/assignments",
    ASSIGNMENTS,
    mapAssignmentList
  );
  const [rows, setRows] = useState(ASSIGNMENTS);
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState("all");

  /* === 과제 생성 모달 === */
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    assignmentType: "farm",
    dueAt: "",
    selectedContentIds: [],
    selectedOrgId: "",
    selectedClassIds: [],
    selectedStudentIds: [],
  });
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [contentCategoryFilter, setContentCategoryFilter] = useState("all");

  /* === 대상 지정 데이터 === */
  const [orgs, setOrgs] = useState([]);
  const [classes, setClasses] = useState([]);
  const [classStudents, setClassStudents] = useState([]);

  /* === 과제 상세 모달 === */
  const [detailModal, setDetailModal] = useState(null);
  const [detailSubmissions, setDetailSubmissions] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  /* === 피드백 탭 데이터 === */
  const {
    data: feedbackList,
    loading: feedbackLoading,
    error: feedbackError,
  } = useAdminList("/v1/admin/writing/submissions", FEEDBACK, mapFeedbackList);
  const [submissions, setSubmissions] = useState(FEEDBACK);
  const [feedbackSearch, setFeedbackSearch] = useState("");
  const [feedbackFilter, setFeedbackFilter] = useState("all");

  /* === 피드백 작성 모달 === */
  const [feedbackModal, setFeedbackModal] = useState(null);
  const [feedbackComment, setFeedbackComment] = useState("");
  const [feedbackRubric, setFeedbackRubric] = useState({
    content: 3,
    structure: 3,
    expression: 3,
  });
  const [feedbackSaving, setFeedbackSaving] = useState(false);
  const [feedbackModalError, setFeedbackModalError] = useState("");
  const [feedbackModalSuccess, setFeedbackModalSuccess] = useState("");

  useEffect(() => {
    setRows(assignments);
  }, [assignments]);

  useEffect(() => {
    setSubmissions(feedbackList);
  }, [feedbackList]);

  /* 기관/반 목록 로드 (모달 열릴 때) */
  useEffect(() => {
    if (!showCreateModal) return;
    apiGet("/v1/admin/orgs/available")
      .then((data) => setOrgs(Array.isArray(data) ? data : []))
      .catch(() => setOrgs([]));
    apiGet("/v1/admin/classes")
      .then((data) => setClasses(Array.isArray(data) ? data : []))
      .catch(() => setClasses([]));
  }, [showCreateModal]);

  /* 반 선택 시 학생 목록 로드 */
  useEffect(() => {
    if (formData.selectedClassIds.length === 0) {
      setClassStudents([]);
      return;
    }
    const lastClassId = formData.selectedClassIds[formData.selectedClassIds.length - 1];
    apiGet(`/v1/admin/classes/${lastClassId}/students`)
      .then((data) => setClassStudents(Array.isArray(data) ? data : []))
      .catch(() => setClassStudents([]));
  }, [formData.selectedClassIds]);

  /* ORG_ADMIN이면 자동으로 첫 번째 기관 선택 */
  useEffect(() => {
    if (!isHqAdmin && orgs.length > 0 && !formData.selectedOrgId) {
      setFormData((prev) => ({ ...prev, selectedOrgId: orgs[0].orgId || orgs[0].id || "" }));
    }
  }, [orgs, isHqAdmin, formData.selectedOrgId]);

  /* === 콘텐츠 필터링 === */
  const filteredContent = useMemo(() => {
    if (contentCategoryFilter === "all") return LEARNING_CATALOG;
    return LEARNING_CATALOG.filter((item) => item.category === contentCategoryFilter);
  }, [contentCategoryFilter]);

  /* === 과제 필터 === */
  const filteredAssignments = useMemo(() => {
    const term = assignmentSearch.trim().toLowerCase();
    return rows.filter((a) => {
      if (assignmentFilter !== "all" && a.status !== assignmentFilter) return false;
      if (!term) return true;
      return [a.title, a.type, a.status, a.due]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(term));
    });
  }, [rows, assignmentSearch, assignmentFilter]);

  /* === 피드백 필터 === */
  const filteredFeedback = useMemo(() => {
    const term = feedbackSearch.trim().toLowerCase();
    return submissions.filter((item) => {
      if (feedbackFilter !== "all" && item.statusKey !== feedbackFilter) return false;
      if (!term) return true;
      return [item.student, item.promptId, item.statusLabel]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(term));
    });
  }, [submissions, feedbackSearch, feedbackFilter]);

  /* === 과제 생성 === */
  const handleCreate = async () => {
    setActionError("");
    if (!formData.title.trim()) {
      setActionError("과제명을 입력해 주세요.");
      return;
    }
    if (!formData.selectedOrgId) {
      setActionError("기관을 선택해 주세요.");
      return;
    }
    if (formData.assignmentType !== "writing" && formData.selectedContentIds.length === 0) {
      setActionError("콘텐츠를 1개 이상 선택해 주세요.");
      return;
    }
    setActionLoading(true);
    try {
      const targets = [];
      targets.push({ target_type: "org", target_id: formData.selectedOrgId });
      formData.selectedClassIds.forEach((cid) => {
        targets.push({ target_type: "class", target_id: cid });
      });
      formData.selectedStudentIds.forEach((uid) => {
        targets.push({ target_type: "user", target_id: uid });
      });

      const payload =
        formData.assignmentType === "writing"
          ? {}
          : { contentIds: formData.selectedContentIds };

      await apiPost("/v1/admin/assignments", {
        title: formData.title.trim(),
        assignmentType: formData.assignmentType,
        payload,
        dueAt: formData.dueAt ? formData.dueAt + "T23:59:00" : undefined,
        targets,
      });
      setShowCreateModal(false);
      setFormData({
        title: "",
        assignmentType: "farm",
        dueAt: "",
        selectedContentIds: [],
        selectedOrgId: "",
        selectedClassIds: [],
        selectedStudentIds: [],
      });
      const refreshed = await apiGet("/v1/admin/assignments");
      setRows(mapAssignmentList(refreshed));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  /* === 과제 상세 열기 === */
  const openDetail = async (assignment) => {
    setDetailModal(assignment);
    setDetailSubmissions(null);
    setDetailLoading(true);
    try {
      const data = await apiGet(`/v1/admin/assignments/${assignment.id}/submissions`);
      setDetailSubmissions(data);
    } catch {
      setDetailSubmissions({ totalStudents: 0, submittedCount: 0, submissions: [] });
    } finally {
      setDetailLoading(false);
    }
  };

  /* === 과제 마감/재오픈 === */
  const handleCloseAssignment = async () => {
    if (!detailModal) return;
    try {
      await apiPost(`/v1/admin/assignments/${detailModal.id}/close`);
      setDetailModal({ ...detailModal, status: "closed" });
      const refreshed = await apiGet("/v1/admin/assignments");
      setRows(mapAssignmentList(refreshed));
    } catch {}
  };

  const handleReopenAssignment = async () => {
    if (!detailModal) return;
    try {
      await apiPost(`/v1/admin/assignments/${detailModal.id}/reopen`);
      setDetailModal({ ...detailModal, status: "active" });
      const refreshed = await apiGet("/v1/admin/assignments");
      setRows(mapAssignmentList(refreshed));
    } catch {}
  };

  /* === 콘텐츠 체크박스 토글 === */
  const toggleContent = (contentId) => {
    setFormData((prev) => {
      const ids = prev.selectedContentIds.includes(contentId)
        ? prev.selectedContentIds.filter((c) => c !== contentId)
        : [...prev.selectedContentIds, contentId];
      return { ...prev, selectedContentIds: ids };
    });
  };

  /* === 반 체크박스 토글 === */
  const toggleClass = (classId) => {
    setFormData((prev) => {
      const ids = prev.selectedClassIds.includes(classId)
        ? prev.selectedClassIds.filter((c) => c !== classId)
        : [...prev.selectedClassIds, classId];
      return { ...prev, selectedClassIds: ids };
    });
  };

  /* === 학생 체크박스 토글 === */
  const toggleStudent = (userId) => {
    setFormData((prev) => {
      const ids = prev.selectedStudentIds.includes(userId)
        ? prev.selectedStudentIds.filter((u) => u !== userId)
        : [...prev.selectedStudentIds, userId];
      return { ...prev, selectedStudentIds: ids };
    });
  };

  /* === 피드백 모달 열기 === */
  const openFeedbackModal = useCallback((item) => {
    setFeedbackModal(item);
    setFeedbackComment("");
    setFeedbackRubric({ content: 3, structure: 3, expression: 3 });
    setFeedbackModalError("");
    setFeedbackModalSuccess("");
  }, []);

  /* === 피드백 제출 === */
  const handleFeedbackSubmit = async () => {
    if (!feedbackModal) return;
    setFeedbackModalError("");
    setFeedbackModalSuccess("");
    setFeedbackSaving(true);
    try {
      await apiPost(`/v1/admin/writing/${feedbackModal.submissionId}/feedback`, {
        rubric: feedbackRubric,
        comment: feedbackComment || null,
      });
      setFeedbackModalSuccess("피드백이 저장되었습니다.");
      const refreshed = await apiGet("/v1/admin/writing/submissions");
      setSubmissions(mapFeedbackList(refreshed));
      setTimeout(() => {
        setFeedbackModal(null);
      }, 1000);
    } catch (err) {
      setFeedbackModalError(err.message || "피드백 저장에 실패했습니다.");
    } finally {
      setFeedbackSaving(false);
    }
  };

  /* 기관에 맞는 반만 필터링 */
  const filteredClasses = useMemo(() => {
    if (!formData.selectedOrgId) return classes;
    return classes.filter((c) => c.orgId === formData.selectedOrgId || c.org_id === formData.selectedOrgId);
  }, [classes, formData.selectedOrgId]);

  return (
    <AdminLayout>
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>과제/피드백</h1>
          <div className="admin-detail-actions">
            {activeTab === "assignments" && (
              <button
                className="admin-detail-btn"
                type="button"
                onClick={() => {
                  setFormData({
                    title: "",
                    assignmentType: "farm",
                    dueAt: "",
                    selectedContentIds: [],
                    selectedOrgId: "",
                    selectedClassIds: [],
                    selectedStudentIds: [],
                  });
                  setContentCategoryFilter("all");
                  setActionError("");
                  setShowCreateModal(true);
                }}
              >
                과제 생성
              </button>
            )}
          </div>
        </div>

        {/* 탭 전환 */}
        <div className="admin-detail-filters" style={{ marginTop: 16, marginBottom: 20 }}>
          <button
            className={`admin-filter ${activeTab === "assignments" ? "active" : ""}`}
            type="button"
            onClick={() => setActiveTab("assignments")}
            style={{ fontSize: 14, padding: "8px 20px" }}
          >
            과제
          </button>
          <button
            className={`admin-filter ${activeTab === "feedback" ? "active" : ""}`}
            type="button"
            onClick={() => setActiveTab("feedback")}
            style={{ fontSize: 14, padding: "8px 20px" }}
          >
            피드백
          </button>
        </div>

        {/* === 과제 탭 === */}
        {activeTab === "assignments" && (
          <div className="admin-detail-card">
            <h2>과제 현황</h2>
            <div className="admin-detail-toolbar">
              <div className="admin-detail-search">
                <span className="material-symbols-outlined">search</span>
                <input
                  placeholder="과제 검색"
                  value={assignmentSearch}
                  onChange={(e) => setAssignmentSearch(e.target.value)}
                />
              </div>
              <div className="admin-detail-filters">
                {["all", "active", "closed"].map((f) => (
                  <button
                    key={f}
                    className={`admin-filter ${assignmentFilter === f ? "active" : ""}`}
                    type="button"
                    onClick={() => setAssignmentFilter(f)}
                  >
                    {f === "all" ? "전체" : f === "active" ? "진행중" : "마감"}
                  </button>
                ))}
              </div>
            </div>
            {loading ? <p className="admin-detail-note">과제를 불러오는 중...</p> : null}
            {error ? <p className="admin-detail-note error">{error}</p> : null}
            <table className="admin-detail-table">
              <thead>
                <tr>
                  <th>과제명</th>
                  <th>유형</th>
                  <th>마감일</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map((a) => (
                  <tr
                    key={a.id}
                    style={{ cursor: "pointer" }}
                    onClick={() => openDetail(a)}
                  >
                    <td>{a.title}</td>
                    <td>{TYPE_LABELS[a.type] || a.type}</td>
                    <td>{fmtDate(a.due)}</td>
                    <td>
                      <span className="status-pill" data-status={a.status}>
                        {a.status === "active" ? "진행중" : a.status === "closed" ? "마감" : a.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {!loading && filteredAssignments.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", color: "#a6b6a9", padding: 24 }}>
                      과제가 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* === 피드백 탭 === */}
        {activeTab === "feedback" && (
          <div className="admin-detail-card">
            <h2>글쓰기 피드백</h2>
            <div className="admin-detail-toolbar">
              <div className="admin-detail-search">
                <span className="material-symbols-outlined">search</span>
                <input
                  placeholder="학생명/주제 검색"
                  value={feedbackSearch}
                  onChange={(e) => setFeedbackSearch(e.target.value)}
                />
              </div>
              <div className="admin-detail-filters">
                {["all", "pending", "reviewing", "completed"].map((f) => (
                  <button
                    key={f}
                    className={`admin-filter ${feedbackFilter === f ? "active" : ""}`}
                    type="button"
                    onClick={() => setFeedbackFilter(f)}
                  >
                    {f === "all" ? "전체" : f === "pending" ? "대기" : f === "reviewing" ? "검토" : "완료"}
                  </button>
                ))}
              </div>
            </div>
            {feedbackLoading ? <p className="admin-detail-note">제출물을 불러오는 중...</p> : null}
            {feedbackError ? <p className="admin-detail-note error">{feedbackError}</p> : null}
            <table className="admin-detail-table">
              <thead>
                <tr>
                  <th>학생명</th>
                  <th>주제</th>
                  <th>상태</th>
                  <th>제출일</th>
                  <th>피드백</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeedback.map((item) => (
                  <tr key={item.submissionId || `${item.student}-${item.promptId}`}>
                    <td>{item.student}</td>
                    <td>{item.promptId}</td>
                    <td>
                      <span className="status-pill" data-status={item.statusKey}>
                        {item.statusLabel}
                      </span>
                    </td>
                    <td>{fmtDate(item.submittedAt)}</td>
                    <td>
                      <button
                        className="admin-detail-btn"
                        type="button"
                        style={{ padding: "6px 12px", fontSize: 12 }}
                        onClick={() => openFeedbackModal(item)}
                      >
                        피드백 작성
                      </button>
                    </td>
                  </tr>
                ))}
                {!feedbackLoading && filteredFeedback.length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", color: "#a6b6a9", padding: 24 }}>
                      제출물이 없습니다.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* === 과제 생성 모달 === */}
      {showCreateModal ? (
        <div className="admin-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="admin-modal admin-modal-wide" onClick={(e) => e.stopPropagation()} style={{ maxHeight: "85vh", overflowY: "auto" }}>
            <h2>과제 생성</h2>
            {actionError ? <p className="admin-detail-note error">{actionError}</p> : null}

            <div className="admin-modal-field">
              <label>과제명</label>
              <input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="과제명"
              />
            </div>

            <div className="admin-modal-row">
              <div className="admin-modal-field">
                <label>유형</label>
                <select
                  value={formData.assignmentType}
                  onChange={(e) =>
                    setFormData({ ...formData, assignmentType: e.target.value, selectedContentIds: [] })
                  }
                >
                  <option value="farm">농장 학습</option>
                  <option value="pro">프로 학습</option>
                  <option value="writing">글쓰기</option>
                </select>
              </div>
              <div className="admin-modal-field">
                <label>마감일</label>
                <input
                  type="date"
                  value={formData.dueAt}
                  onChange={(e) => setFormData({ ...formData, dueAt: e.target.value })}
                />
              </div>
            </div>

            {/* 콘텐츠 선택 (farm/pro 유형) */}
            {formData.assignmentType !== "writing" && (
              <div className="admin-modal-section">
                <h3>콘텐츠 선택</h3>
                <div className="admin-detail-filters" style={{ marginBottom: 8, flexWrap: "wrap" }}>
                  <button
                    className={`admin-filter ${contentCategoryFilter === "all" ? "active" : ""}`}
                    type="button"
                    onClick={() => setContentCategoryFilter("all")}
                    style={{ fontSize: 12, padding: "4px 10px" }}
                  >
                    전체
                  </button>
                  {Object.keys(LEARNING_CATEGORIES).map((cat) => (
                    <button
                      key={cat}
                      className={`admin-filter ${contentCategoryFilter === cat ? "active" : ""}`}
                      type="button"
                      onClick={() => setContentCategoryFilter(cat)}
                      style={{ fontSize: 12, padding: "4px 10px" }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div style={{ maxHeight: 200, overflowY: "auto", border: "1px solid #3a4a3e", borderRadius: 8, padding: 8 }}>
                  {filteredContent.map((item) => (
                    <label
                      key={item.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 4px",
                        cursor: "pointer",
                        fontSize: 13,
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={formData.selectedContentIds.includes(item.id)}
                        onChange={() => toggleContent(item.id)}
                      />
                      <span style={{ color: "#a6b6a9", fontSize: 11, minWidth: 70 }}>{item.category}</span>
                      <span>{item.title}</span>
                    </label>
                  ))}
                </div>
                {formData.selectedContentIds.length > 0 && (
                  <p style={{ fontSize: 12, color: "#9dd6b0", marginTop: 4 }}>
                    {formData.selectedContentIds.length}개 선택됨
                  </p>
                )}
              </div>
            )}

            {/* 대상 지정 */}
            <div className="admin-modal-section">
              <h3>대상 지정</h3>

              {/* 기관 선택 */}
              <div className="admin-modal-field">
                <label>기관</label>
                {isHqAdmin ? (
                  <select
                    value={formData.selectedOrgId}
                    onChange={(e) => setFormData({ ...formData, selectedOrgId: e.target.value, selectedClassIds: [], selectedStudentIds: [] })}
                  >
                    <option value="">기관을 선택하세요</option>
                    {orgs.map((org) => (
                      <option key={org.orgId || org.id} value={org.orgId || org.id}>
                        {org.name || org.orgName || org.orgId || org.id}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    readOnly
                    value={orgs[0]?.name || orgs[0]?.orgName || formData.selectedOrgId || "로딩 중..."}
                    style={{ opacity: 0.7 }}
                  />
                )}
              </div>

              {/* 반 선택 */}
              {filteredClasses.length > 0 && (
                <div className="admin-modal-field">
                  <label>반 (선택 사항)</label>
                  <div style={{ maxHeight: 120, overflowY: "auto", border: "1px solid #3a4a3e", borderRadius: 8, padding: 8 }}>
                    {filteredClasses.map((cls) => (
                      <label
                        key={cls.classId || cls.id}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", cursor: "pointer", fontSize: 13 }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.selectedClassIds.includes(cls.classId || cls.id)}
                          onChange={() => toggleClass(cls.classId || cls.id)}
                        />
                        <span>{cls.name || cls.className || cls.classId || cls.id}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* 학생 선택 (반 선택 시) */}
              {classStudents.length > 0 && (
                <div className="admin-modal-field">
                  <label>학생 (선택 사항)</label>
                  <div style={{ maxHeight: 120, overflowY: "auto", border: "1px solid #3a4a3e", borderRadius: 8, padding: 8 }}>
                    {classStudents.map((stu) => (
                      <label
                        key={stu.userId || stu.id}
                        style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0", cursor: "pointer", fontSize: 13 }}
                      >
                        <input
                          type="checkbox"
                          checked={formData.selectedStudentIds.includes(stu.userId || stu.id)}
                          onChange={() => toggleStudent(stu.userId || stu.id)}
                        />
                        <span>{stu.name || stu.studentName || stu.userId || stu.id}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="admin-modal-actions">
              <button className="admin-detail-btn" onClick={handleCreate} disabled={actionLoading}>
                {actionLoading ? "생성 중..." : "생성"}
              </button>
              <button className="admin-detail-btn secondary" onClick={() => setShowCreateModal(false)}>
                취소
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* === 과제 상세 모달 === */}
      {detailModal ? (
        <div className="admin-modal-overlay" onClick={() => setDetailModal(null)}>
          <div className="admin-modal admin-modal-wide" onClick={(e) => e.stopPropagation()}>
            <h2>과제 상세</h2>

            <div className="admin-modal-section">
              <table className="admin-detail-table" style={{ fontSize: 13 }}>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 700, width: 80 }}>과제명</td>
                    <td>{detailModal.title}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>유형</td>
                    <td>{TYPE_LABELS[detailModal.type] || detailModal.type}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>마감일</td>
                    <td>{fmtDate(detailModal.due)}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>상태</td>
                    <td>
                      <span className="status-pill" data-status={detailModal.status}>
                        {detailModal.status === "active" ? "진행중" : detailModal.status === "closed" ? "마감" : detailModal.status}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* 제출 현황 */}
            <div className="admin-modal-section">
              <h3>제출 현황</h3>
              {detailLoading ? (
                <p className="admin-detail-note">불러오는 중...</p>
              ) : detailSubmissions ? (
                <>
                  <p style={{ fontSize: 13, marginBottom: 8 }}>
                    대상 학생: <strong>{detailSubmissions.totalStudents}명</strong> /
                    제출: <strong>{detailSubmissions.submittedCount}명</strong>
                  </p>
                  {detailSubmissions.submissions && detailSubmissions.submissions.length > 0 && (
                    <table className="admin-detail-table" style={{ fontSize: 12 }}>
                      <thead>
                        <tr>
                          <th>학생 ID</th>
                          <th>상태</th>
                          <th>제출일</th>
                        </tr>
                      </thead>
                      <tbody>
                        {detailSubmissions.submissions.map((sub, idx) => (
                          <tr key={idx}>
                            <td>{sub.userId}</td>
                            <td>{sub.status}</td>
                            <td>{fmtDate(sub.submittedAt)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              ) : null}
            </div>

            <div className="admin-modal-actions">
              {detailModal.status === "active" ? (
                <button className="admin-detail-btn" onClick={handleCloseAssignment}>
                  마감
                </button>
              ) : (
                <button className="admin-detail-btn" onClick={handleReopenAssignment}>
                  재오픈
                </button>
              )}
              <button className="admin-detail-btn secondary" onClick={() => setDetailModal(null)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {/* === 피드백 작성 모달 === */}
      {feedbackModal ? (
        <div className="admin-modal-overlay" onClick={() => setFeedbackModal(null)}>
          <div className="admin-modal admin-modal-wide" onClick={(e) => e.stopPropagation()}>
            <h2>피드백 작성</h2>

            <div className="admin-modal-section">
              <h3>제출물 정보</h3>
              <table className="admin-detail-table" style={{ fontSize: 13 }}>
                <tbody>
                  <tr>
                    <td style={{ fontWeight: 700, width: 80 }}>학생명</td>
                    <td>{feedbackModal.student}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>주제</td>
                    <td>{feedbackModal.promptId}</td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>상태</td>
                    <td>
                      <span className="status-pill" data-status={feedbackModal.statusKey}>
                        {feedbackModal.statusLabel}
                      </span>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ fontWeight: 700 }}>제출일</td>
                    <td>{fmtDate(feedbackModal.submittedAt)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="admin-modal-section">
              <h3>평가 항목 (1~5점)</h3>
              <div className="admin-modal-row">
                <div className="admin-modal-field">
                  <label>내용</label>
                  <select
                    value={feedbackRubric.content}
                    onChange={(e) =>
                      setFeedbackRubric({ ...feedbackRubric, content: Number(e.target.value) })
                    }
                  >
                    {[1, 2, 3, 4, 5].map((v) => (
                      <option key={v} value={v}>{v}점</option>
                    ))}
                  </select>
                </div>
                <div className="admin-modal-field">
                  <label>구성</label>
                  <select
                    value={feedbackRubric.structure}
                    onChange={(e) =>
                      setFeedbackRubric({ ...feedbackRubric, structure: Number(e.target.value) })
                    }
                  >
                    {[1, 2, 3, 4, 5].map((v) => (
                      <option key={v} value={v}>{v}점</option>
                    ))}
                  </select>
                </div>
                <div className="admin-modal-field">
                  <label>표현</label>
                  <select
                    value={feedbackRubric.expression}
                    onChange={(e) =>
                      setFeedbackRubric({ ...feedbackRubric, expression: Number(e.target.value) })
                    }
                  >
                    {[1, 2, 3, 4, 5].map((v) => (
                      <option key={v} value={v}>{v}점</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="admin-modal-section">
              <h3>코멘트</h3>
              <div className="admin-modal-field">
                <textarea
                  className="admin-json-input"
                  style={{ minHeight: 120, fontFamily: "inherit", fontSize: 14 }}
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  placeholder="피드백 코멘트를 작성하세요..."
                />
              </div>
            </div>

            {feedbackModalError ? (
              <p className="admin-detail-note error">{feedbackModalError}</p>
            ) : null}
            {feedbackModalSuccess ? (
              <p className="admin-detail-note" style={{ color: "#9dd6b0" }}>
                {feedbackModalSuccess}
              </p>
            ) : null}

            <div className="admin-modal-actions">
              <button
                className="admin-detail-btn"
                onClick={handleFeedbackSubmit}
                disabled={feedbackSaving}
              >
                {feedbackSaving ? "저장 중..." : "피드백 저장"}
              </button>
              <button
                className="admin-detail-btn secondary"
                onClick={() => setFeedbackModal(null)}
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

export default AdminAssignmentsPage;
