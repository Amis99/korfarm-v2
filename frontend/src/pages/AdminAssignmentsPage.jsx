import { useEffect, useMemo, useState, useCallback } from "react";
import { apiPost, apiGet } from "../utils/adminApi";
import { useAdminList } from "../hooks/useAdminList";
import AdminLayout from "../components/AdminLayout";
import "../styles/admin-detail.css";

const ASSIGNMENTS = [
  { title: "중간 글쓰기", type: "writing", due: "2026-01-28", status: "active" },
];

const FEEDBACK = [];

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
  /* === 탭 상태 === */
  const [activeTab, setActiveTab] = useState("assignments"); // "assignments" | "feedback"

  /* === 과제 탭 데이터 === */
  const { data: assignments, loading, error } = useAdminList(
    "/v1/admin/assignments",
    ASSIGNMENTS,
    mapAssignmentList
  );
  const [rows, setRows] = useState(ASSIGNMENTS);
  const [assignmentSearch, setAssignmentSearch] = useState("");
  const [assignmentFilter, setAssignmentFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    assignmentType: "writing",
    dueAt: "",
  });
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

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
  const [feedbackModal, setFeedbackModal] = useState(null); // 선택된 제출물 객체
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
      const refreshed = await apiGet("/v1/admin/assignments");
      setRows(mapAssignmentList(refreshed));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
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
      // 목록 새로고침
      const refreshed = await apiGet("/v1/admin/writing/submissions");
      setSubmissions(mapFeedbackList(refreshed));
      // 1초 후 모달 닫기
      setTimeout(() => {
        setFeedbackModal(null);
      }, 1000);
    } catch (err) {
      setFeedbackModalError(err.message || "피드백 저장에 실패했습니다.");
    } finally {
      setFeedbackSaving(false);
    }
  };

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
                  setFormData({ title: "", assignmentType: "writing", dueAt: "" });
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

      {/* === 피드백 작성 모달 === */}
      {feedbackModal ? (
        <div className="admin-modal-overlay" onClick={() => setFeedbackModal(null)}>
          <div className="admin-modal admin-modal-wide" onClick={(e) => e.stopPropagation()}>
            <h2>피드백 작성</h2>

            {/* 제출물 정보 */}
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

            {/* 루브릭 평가 */}
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

            {/* 코멘트 */}
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

            {/* 에러/성공 메시지 */}
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
