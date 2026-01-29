import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAdminList } from "../hooks/useAdminList";
import "../styles/admin-detail.css";

const ASSIGNMENTS = [
  { title: "중간 글쓰기", type: "writing", due: "2026-01-28", status: "active" },
  { title: "독해 복습 과제", type: "reading", due: "2026-01-30", status: "scheduled" },
  { title: "문법 퀴즈", type: "quiz", due: "2026-02-02", status: "draft" },
];

const FEEDBACK = [
  { student: "김서연", task: "중간 글쓰기", status: "대기", statusKey: "pending" },
  { student: "이준호", task: "독해 복습 과제", status: "검토", statusKey: "review" },
  { student: "박예은", task: "문법 퀴즈", status: "완료", statusKey: "done" },
];

const normalizeAssignmentStatus = (status) => {
  if (!status) {
    return "active";
  }
  if (status === "open") {
    return "active";
  }
  if (status === "closed") {
    return "draft";
  }
  return status;
};

const mapAssignmentList = (items) =>
  items.map((assignment) => ({
    title: assignment.title,
    type: assignment.assignment_type || assignment.assignmentType,
    due: assignment.due_at || assignment.dueAt || "-",
    status: normalizeAssignmentStatus(assignment.status),
  }));

const mapFeedbackList = (items) =>
  items.map((submission) => {
    const status = submission.status || "pending";
    const statusKey = status === "submitted" ? "pending" : status;
    return {
      student: submission.student_name || submission.studentName || submission.user_id || "-",
      task: submission.prompt_id || submission.promptId || "-",
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

  const filteredAssignments = useMemo(() => {
    const term = assignmentSearch.trim().toLowerCase();
    return assignments.filter((assignment) => {
      if (assignmentFilter !== "all" && assignment.status !== assignmentFilter) {
        return false;
      }
      if (!term) {
        return true;
      }
      return [assignment.title, assignment.type, assignment.status, assignment.due]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term));
    });
  }, [assignments, assignmentSearch, assignmentFilter]);

  const filteredFeedback = useMemo(() => {
    const term = feedbackSearch.trim().toLowerCase();
    return feedbackList.filter((item) => {
      if (feedbackFilter !== "all" && item.statusKey !== feedbackFilter) {
        return false;
      }
      if (!term) {
        return true;
      }
      return [item.student, item.task, item.status]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term));
    });
  }, [feedbackList, feedbackSearch, feedbackFilter]);

  return (
    <div className="admin-detail-page">
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>과제/피드백</h1>
          <div className="admin-detail-actions">
            <button className="admin-detail-btn" type="button">
              과제 생성
            </button>
            <button className="admin-detail-btn secondary" type="button">
              피드백 일괄 배정
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
            <h2>과제 현황</h2>
            <div className="admin-detail-toolbar">
              <div className="admin-detail-search">
                <span className="material-symbols-outlined">search</span>
                <input
                  placeholder="과제 검색"
                  value={assignmentSearch}
                  onChange={(event) => setAssignmentSearch(event.target.value)}
                />
              </div>
              <div className="admin-detail-filters">
                <button
                  className={`admin-filter ${assignmentFilter === "all" ? "active" : ""}`}
                  type="button"
                  onClick={() => setAssignmentFilter("all")}
                >
                  전체
                </button>
                <button
                  className={`admin-filter ${assignmentFilter === "active" ? "active" : ""}`}
                  type="button"
                  onClick={() => setAssignmentFilter("active")}
                >
                  진행중
                </button>
                <button
                  className={`admin-filter ${assignmentFilter === "scheduled" ? "active" : ""}`}
                  type="button"
                  onClick={() => setAssignmentFilter("scheduled")}
                >
                  예정
                </button>
                <button
                  className={`admin-filter ${assignmentFilter === "draft" ? "active" : ""}`}
                  type="button"
                  onClick={() => setAssignmentFilter("draft")}
                >
                  초안
                </button>
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
                {filteredAssignments.map((assignment) => (
                  <tr key={assignment.title}>
                    <td>{assignment.title}</td>
                    <td>{assignment.type}</td>
                    <td>{assignment.due}</td>
                    <td>
                      <span className="status-pill" data-status={assignment.status}>
                        {assignment.status}
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
                  onChange={(event) => setFeedbackSearch(event.target.value)}
                />
              </div>
              <div className="admin-detail-filters">
                <button
                  className={`admin-filter ${feedbackFilter === "all" ? "active" : ""}`}
                  type="button"
                  onClick={() => setFeedbackFilter("all")}
                >
                  전체
                </button>
                <button
                  className={`admin-filter ${feedbackFilter === "pending" ? "active" : ""}`}
                  type="button"
                  onClick={() => setFeedbackFilter("pending")}
                >
                  대기
                </button>
                <button
                  className={`admin-filter ${feedbackFilter === "review" ? "active" : ""}`}
                  type="button"
                  onClick={() => setFeedbackFilter("review")}
                >
                  검토
                </button>
                <button
                  className={`admin-filter ${feedbackFilter === "done" ? "active" : ""}`}
                  type="button"
                  onClick={() => setFeedbackFilter("done")}
                >
                  완료
                </button>
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
            <div className="admin-detail-tag" style={{ marginTop: "12px" }}>
              피드백 대기 12건
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminAssignmentsPage;
