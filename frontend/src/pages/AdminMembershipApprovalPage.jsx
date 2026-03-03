import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { apiGet, apiPost } from "../utils/api";
import "../styles/admin-detail.css";

const ROLE_LABELS = {
  STUDENT: "학생",
  PARENT: "학부모",
  ORG_ADMIN: "기관 관리자",
};

const ROLE_STATUS_MAP = {
  STUDENT: "active",
  PARENT: "pending",
  ORG_ADMIN: "scheduled",
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
      const result = await apiPost(`/v1/admin/memberships/${membershipId}/approve`, {});
      if (result?.autoLinked) {
        alert("승인 완료! 자녀와 자동 연결되었습니다.");
      }
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
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>가입 승인 관리</h1>
        </div>
        <p style={{ color: "var(--admin-muted)", marginTop: 4 }}>
          회원가입 승인 대기 목록입니다. 승인 또는 거절 처리를 할 수 있습니다.
        </p>

        {error && <div className="admin-error">{error}</div>}

        {loading ? (
          <div className="admin-loading">불러오는 중...</div>
        ) : memberships.length === 0 ? (
          <div className="admin-empty">
            <span className="material-symbols-outlined">check_circle</span>
            <p>승인 대기 중인 회원이 없습니다.</p>
          </div>
        ) : (
          <div className="admin-detail-card" style={{ marginTop: 16 }}>
            <table className="admin-detail-table">
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
                      <span
                        className="status-pill"
                        data-status={ROLE_STATUS_MAP[m.role] || "hold"}
                      >
                        {ROLE_LABELS[m.role] || m.role || "-"}
                      </span>
                    </td>
                    <td>{m.org_name || m.orgName || "-"}</td>
                    <td>{formatDate(m.requested_at || m.requestedAt)}</td>
                    <td>
                      {m.role === "PARENT" ? (
                        <span
                          className="status-pill"
                          data-status={
                            (m.student_matched || m.studentMatched) ? "active" : "inactive"
                          }
                        >
                          {(m.student_matched || m.studentMatched) ? "매칭됨" : "미매칭"}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>
                      <div className="admin-detail-actions">
                        <button
                          className="admin-detail-btn sm"
                          onClick={() => handleApprove(m.id)}
                          disabled={actionLoading === m.id}
                        >
                          {actionLoading === m.id ? "처리 중..." : "승인"}
                        </button>
                        <button
                          className="admin-detail-btn danger sm"
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
          <div style={{ marginTop: 24 }}>
            <h2 style={{ fontSize: 18, marginBottom: 12 }}>학부모 연결 정보</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 16 }}>
              {memberships
                .filter((m) => m.role === "PARENT")
                .map((m) => (
                  <div key={m.id} className="admin-detail-card">
                    <h3 style={{ margin: "0 0 12px", fontSize: 16 }}>{m.user_name || m.userName}</h3>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <span style={{ color: "var(--admin-muted)" }}>연결 학생:</span>
                      <span>{m.linked_student_name || m.linkedStudentName || "-"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <span style={{ color: "var(--admin-muted)" }}>학생 전화번호:</span>
                      <span>{m.linked_student_phone || m.linkedStudentPhone || "-"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <span style={{ color: "var(--admin-muted)" }}>학부모 전화번호:</span>
                      <span>{m.linked_parent_phone || m.linkedParentPhone || "-"}</span>
                    </div>
                    <div style={{ marginTop: 12 }}>
                      {(m.student_matched || m.studentMatched) ? (
                        <>
                          <span className="status-pill" data-status="active">매칭됨</span>
                          <span className="status-pill" data-status="completed" style={{ marginLeft: 8 }}>
                            승인 시 자동 연결
                          </span>
                        </>
                      ) : (
                        <span className="status-pill" data-status="inactive">미매칭 - 수동 확인 필요</span>
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
        <div className="admin-modal-overlay" onClick={() => setRejectModal(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>가입 거절</h2>
            <p style={{ color: "var(--admin-muted)", margin: "0 0 16px" }}>
              <strong>{rejectModal.user_name || rejectModal.userName}</strong>님의 가입을 거절합니다.
            </p>
            <div className="admin-modal-field">
              <label>거절 사유</label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="거절 사유를 입력해 주세요"
                rows={3}
              />
            </div>
            <div className="admin-modal-actions">
              <button
                className="admin-detail-btn danger"
                onClick={handleReject}
                disabled={actionLoading === rejectModal.id}
              >
                {actionLoading === rejectModal.id ? "처리 중..." : "거절 처리"}
              </button>
              <button className="admin-detail-btn secondary" onClick={() => setRejectModal(null)}>
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
