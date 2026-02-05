import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { apiGet, apiPost } from "../utils/api";
import "../styles/admin.css";

const ROLE_LABELS = {
  STUDENT: "학생",
  PARENT: "학부모",
  ORG_ADMIN: "기관 관리자",
};

function AdminMembershipApprovalPage() {
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const loadPendingMemberships = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await apiGet("/v1/admin/memberships/pending");
      setMemberships(data || []);
    } catch (err) {
      setError(err.message || "데이터를 불러오는데 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPendingMemberships();
  }, []);

  const handleApprove = async (membershipId) => {
    if (!window.confirm("해당 회원을 승인하시겠습니까?")) return;
    setActionLoading(membershipId);
    try {
      await apiPost(`/v1/admin/memberships/${membershipId}/approve`, {});
      await loadPendingMemberships();
    } catch (err) {
      alert(err.message || "승인 처리에 실패했습니다.");
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (membership) => {
    setRejectModal(membership);
    setRejectReason("");
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert("거절 사유를 입력해 주세요.");
      return;
    }
    setActionLoading(rejectModal.id);
    try {
      await apiPost(`/v1/admin/memberships/${rejectModal.id}/reject`, {
        reason: rejectReason.trim(),
      });
      setRejectModal(null);
      await loadPendingMemberships();
    } catch (err) {
      alert(err.message || "거절 처리에 실패했습니다.");
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AdminLayout>
      <div className="admin-content">
        <header className="admin-header">
          <h1>가입 승인 관리</h1>
          <p>회원가입 승인 대기 목록입니다. 승인 또는 거절 처리를 할 수 있습니다.</p>
        </header>

        {error && <div className="admin-error">{error}</div>}

        {loading ? (
          <div className="admin-loading">불러오는 중...</div>
        ) : memberships.length === 0 ? (
          <div className="admin-empty">
            <span className="material-symbols-outlined">check_circle</span>
            <p>승인 대기 중인 회원이 없습니다.</p>
          </div>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>이름</th>
                  <th>아이디</th>
                  <th>회원 유형</th>
                  <th>소속 기관</th>
                  <th>요청일</th>
                  <th>학생 매칭</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {memberships.map((m) => (
                  <tr key={m.id}>
                    <td>{m.user_name || m.userName || "-"}</td>
                    <td>{m.user_login_id || m.userLoginId || "-"}</td>
                    <td>
                      <span className={`role-badge role-${(m.role || "").toLowerCase()}`}>
                        {ROLE_LABELS[m.role] || m.role || "-"}
                      </span>
                    </td>
                    <td>{m.org_name || m.orgName || "-"}</td>
                    <td>{formatDate(m.requested_at || m.requestedAt)}</td>
                    <td>
                      {m.role === "PARENT" ? (
                        <span className={`match-badge ${(m.student_matched || m.studentMatched) ? "matched" : "unmatched"}`}>
                          {(m.student_matched || m.studentMatched) ? "매칭됨" : "미매칭"}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-approve"
                          onClick={() => handleApprove(m.id)}
                          disabled={actionLoading === m.id}
                        >
                          {actionLoading === m.id ? "처리 중..." : "승인"}
                        </button>
                        <button
                          className="btn-reject"
                          onClick={() => openRejectModal(m)}
                          disabled={actionLoading === m.id}
                        >
                          거절
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 학부모 정보 표시 */}
        {memberships.filter((m) => m.role === "PARENT").length > 0 && (
          <div className="admin-section">
            <h2>학부모 연결 정보</h2>
            <div className="parent-info-grid">
              {memberships
                .filter((m) => m.role === "PARENT")
                .map((m) => (
                  <div key={m.id} className="parent-info-card">
                    <h3>{m.user_name || m.userName}</h3>
                    <div className="info-row">
                      <span className="label">연결 학생:</span>
                      <span>{m.linked_student_name || m.linkedStudentName || "-"}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">학생 전화번호:</span>
                      <span>{m.linked_student_phone || m.linkedStudentPhone || "-"}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">학부모 전화번호:</span>
                      <span>{m.linked_parent_phone || m.linkedParentPhone || "-"}</span>
                    </div>
                    <div className="match-status">
                      {(m.student_matched || m.studentMatched) ? (
                        <span className="matched">학생 정보 매칭됨</span>
                      ) : (
                        <span className="unmatched">학생 정보 미매칭 - 수동 확인 필요</span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* 거절 모달 */}
      {rejectModal && (
        <div className="modal-backdrop" onClick={() => setRejectModal(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>가입 거절</h2>
            <p>
              <strong>{rejectModal.user_name || rejectModal.userName}</strong>님의 가입을 거절합니다.
            </p>
            <label>
              거절 사유
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="거절 사유를 입력해 주세요"
                rows={3}
              />
            </label>
            <div className="modal-actions">
              <button
                className="btn-reject"
                onClick={handleReject}
                disabled={actionLoading === rejectModal.id}
              >
                {actionLoading === rejectModal.id ? "처리 중..." : "거절 처리"}
              </button>
              <button className="btn-cancel" onClick={() => setRejectModal(null)}>
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default AdminMembershipApprovalPage;
