import { useMemo, useState } from "react";
import { apiPost } from "../utils/adminApi";
import { useAdminList } from "../hooks/useAdminList";
import AdminLayout from "../components/AdminLayout";
import "../styles/admin-detail.css";

const ASSIGNMENTS = [
  { title: "중간 글쓰기", type: "writing", due: "2026-01-28", status: "active" },
];

const FEEDBACK = [
  { student: "김서연", task: "중간 글쓰기", status: "대기", statusKey: "pending" },
];

const normalizeAssignmentStatus = (status) => {
  if (!status) return "active";
  if (status === "open") return "active";
  if (status === "closed") return "draft";
  return status;
};

const mapAssignmentList = (items) =>
  items.map((a) => ({
    id: a.id || a.assignment_id || a.title,
    title: a.title,
    type: a.assignment_type || a.assignmentType,
    due: a.due_at || a.dueAt || "-",
    status: normalizeAssignmentStatus(a.status),
  }));

const mapFeedbackList = (items) =>
  items.map((s) => {
    const status = s.status || "pending";
    const statusKey = status === "submitted" ? "pending" : status;
    return {
      student: s.student_name || s.studentName || s.user_id || "-",
      task: s.prompt_id || s.promptId || "-",
      status,
      statusKey,
    };
  });

function AdminAssignmentsPage() {
  const { data: assignments, loading, error } = useAdminList(
    "/v1/admin/assignments",
    ASSIGNMENTS,
    mapAssignmentList
  );
  const {
    data: feedbackList,
    loading: feedbackLoading,
    error: feedbackError,
  } = useAdminList("/v1/admin/writing/submissions", FEEDBACK, mapFeedbackList);
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const [feedbackSearch, setFeedbackSearch] = useState("");
  const [feedbackFilter, setFeedbackFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    assignmentType: "writing",
    dueAt: "",
  });
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const filteredAssignments = useMemo(() => {
    const term = assignmentSearch.trim().toLowerCase();
    return assignments.filter((a) => {
      if (assignmentFilter !== "all" && a.status !== assignmentFilter) return false;
      if (!term) return true;
      return [a.title, a.type, a.status, a.due]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(term));
    });
  }, [assignments, assignmentSearch, assignmentFilter]);

  const filteredFeedback = useMemo(() => {
    const term = feedbackSearch.trim().toLowerCase();
    return feedbackList.filter((item) => {
      if (feedbackFilter !== "all" && item.statusKey !== feedbackFilter) return false;
      if (!term) return true;
      return [item.student, item.task, item.status]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(term));
    });
  }, [feedbackList, feedbackSearch, feedbackFilter]);

  const handleCreate = async () => {
    setActionError("");
    if (!formData.title.trim()) {
      setActionError("과제명을 입력해 주세요.");
      return;
    }
    setActionLoading(true);
    try {
      await apiPost("/v1/admin/assignments", {
        title: formData.title.trim(),
        assignmentType: formData.assignmentType,
        payload: {},
        dueAt: formData.dueAt || undefined,
      });
      setShowCreateModal(false);
      setFormData({ title: "", assignmentType: "writing", dueAt: "" });
      window.location.reload();
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
          <h1>과제/피드백</h1>
          <div className="admin-detail-actions">
            <button
              className="admin-detail-btn"
              type="button"
              onClick={() => {
                setFormData({ title: "", assignmentType: "writing", dueAt: "" });
                setActionError("");
                setShowCreateModal(true);
              }}
            >
              과제 생성
            </button>
          </div>
        </div>
        <div className="admin-detail-grid">
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
                {["all", "active", "scheduled", "draft"].map((f) => (
                  <button
                    key={f}
                    className={`admin-filter ${assignmentFilter === f ? "active" : ""}`}
                    type="button"
                    onClick={() => setAssignmentFilter(f)}
                  >
                    {f === "all" ? "전체" : f === "active" ? "진행중" : f === "scheduled" ? "예정" : "초안"}
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
                  <tr key={a.id}>
                    <td>{a.title}</td>
                    <td>{a.type}</td>
                    <td>{a.due}</td>
                    <td>
                      <span className="status-pill" data-status={a.status}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-detail-card">
            <h2>글쓰기 피드백</h2>
            <div className="admin-detail-toolbar">
              <div className="admin-detail-search">
                <span className="material-symbols-outlined">search</span>
                <input
                  placeholder="학생/과제 검색"
                  value={feedbackSearch}
                  onChange={(e) => setFeedbackSearch(e.target.value)}
                />
              </div>
              <div className="admin-detail-filters">
                {["all", "pending", "review", "done"].map((f) => (
                  <button
                    key={f}
                    className={`admin-filter ${feedbackFilter === f ? "active" : ""}`}
                    type="button"
                    onClick={() => setFeedbackFilter(f)}
                  >
                    {f === "all" ? "전체" : f === "pending" ? "대기" : f === "review" ? "검토" : "완료"}
                  </button>
                ))}
              </div>
            </div>
            {feedbackLoading ? <p className="admin-detail-note">피드백을 불러오는 중...</p> : null}
            {feedbackError ? <p className="admin-detail-note error">{feedbackError}</p> : null}
            <table className="admin-detail-table">
              <thead>
                <tr>
                  <th>학생</th>
                  <th>과제</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeedback.map((item) => (
                  <tr key={`${item.student}-${item.task}`}>
                    <td>{item.student}</td>
                    <td>{item.task}</td>
                    <td>
                      <span className="status-pill" data-status={item.statusKey}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showCreateModal ? (
        <div className="admin-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
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
            <div className="admin-modal-field">
              <label>유형</label>
              <select
                value={formData.assignmentType}
                onChange={(e) => setFormData({ ...formData, assignmentType: e.target.value })}
              >
                <option value="writing">글쓰기</option>
                <option value="reading">독해</option>
                <option value="quiz">퀴즈</option>
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
    </AdminLayout>
  );
}

export default AdminAssignmentsPage;
