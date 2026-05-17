/**
 * 본사 — 학원 도입 신청 검토 화면 (HQ_ADMIN 전용).
 * 승인 시 orgs + ORG_ADMIN 자동 생성. 임시 비밀번호는 행에 한 번만 표시.
 */
import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../utils/adminApi";
import AdminLayout from "../components/AdminLayout";
import "../styles/admin-detail.css";

const STATUS_TABS = [
  { key: "pending",  label: "검토 대기" },
  { key: "approved", label: "승인됨" },
  { key: "rejected", label: "거절됨" },
  { key: "all",      label: "전체" },
];

const pick = (obj, ...keys) => keys.map((k) => obj?.[k]).find((v) => v !== undefined && v !== null);

export default function AdminOrgApplicationsPage() {
  const [tab, setTab] = useState("pending");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState("");
  const [rejectModal, setRejectModal] = useState(null);
  const [approvedInfo, setApprovedInfo] = useState(null);

  const load = async () => {
    setLoading(true); setError("");
    try {
      const path = tab === "all" ? "/v1/admin/org-applications"
                                  : `/v1/admin/org-applications?status=${tab}`;
      const res = await apiGet(path);
      setRows((res?.data ?? res ?? []).map((r) => ({
        id: r.id,
        orgName: pick(r, "orgName", "org_name"),
        orgType: pick(r, "orgType", "org_type"),
        contactPhone: pick(r, "contactPhone", "contact_phone"),
        contactEmail: pick(r, "contactEmail", "contact_email"),
        businessNumber: pick(r, "businessNumber", "business_number"),
        representativeName: pick(r, "representativeName", "representative_name"),
        addressRegion: pick(r, "addressRegion", "address_region"),
        addressDetail: pick(r, "addressDetail", "address_detail"),
        estimatedStudents: pick(r, "estimatedStudents", "estimated_students"),
        applicantLoginId: pick(r, "applicantLoginId", "applicant_login_id"),
        applicantName: pick(r, "applicantName", "applicant_name"),
        message: r.message,
        status: r.status,
        adminTemporaryPassword: pick(r, "adminTemporaryPassword", "admin_temporary_password"),
        rejectionReason: pick(r, "rejectionReason", "rejection_reason"),
        createdAt: pick(r, "createdAt", "created_at"),
      })));
    } catch (e) { setError(e.message || String(e)); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [tab]);

  const approve = async (id) => {
    if (!confirm("이 신청을 승인하시겠습니까? 학원과 관리자 계정이 자동 생성됩니다.")) return;
    setActionId(id);
    try {
      const res = await apiPost(`/v1/admin/org-applications/${id}/approve`, {});
      const data = res?.data ?? res;
      const tempPwd = pick(data, "adminTemporaryPassword", "admin_temporary_password");
      if (tempPwd) {
        setApprovedInfo({
          orgName: pick(data, "orgName", "org_name"),
          loginId: pick(data, "applicantLoginId", "applicant_login_id"),
          name: pick(data, "applicantName", "applicant_name"),
          temporaryPassword: tempPwd,
        });
      }
      await load();
    } catch (e) { alert(e.message); }
    finally { setActionId(null); }
  };

  const reject = async (id, reason) => {
    if (!reason.trim()) { alert("거절 사유를 입력해 주세요."); return; }
    setActionId(id);
    try {
      await apiPost(`/v1/admin/org-applications/${id}/reject`, { reason });
      setRejectModal(null);
      await load();
    } catch (e) { alert(e.message); }
    finally { setActionId(null); }
  };

  return (
    <AdminLayout>
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>학원 도입 신청</h1>
          <div className="admin-detail-actions">
            <button className="admin-detail-btn secondary" onClick={load}>새로고침</button>
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, marginBottom: 12, borderBottom: "2px solid #eee" }}>
          {STATUS_TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} type="button"
              style={{
                padding: "10px 16px", border: "none",
                borderBottom: tab === t.key ? "2px solid #2d6a4f" : "2px solid transparent",
                marginBottom: -2, background: "transparent",
                color: tab === t.key ? "#2d6a4f" : "#666",
                fontWeight: tab === t.key ? 700 : 400, cursor: "pointer",
              }}>{t.label}</button>
          ))}
        </div>

        {error && <p className="admin-detail-note error">{error}</p>}
        <div className="admin-detail-grid">
          <div className="admin-detail-card">
            {loading ? <p style={{ padding: 20, textAlign: "center" }}>로딩 중...</p>
              : rows.length === 0 ? <p style={{ padding: 20, textAlign: "center", color: "#888" }}>신청이 없습니다.</p>
              : (
                <table className="admin-detail-table">
                  <thead>
                    <tr>
                      <th>기관</th><th>희망 관리자</th><th>연락처</th><th>예상학생</th><th>상태</th><th>신청일</th><th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <strong>{r.orgName}</strong>
                          <div style={{ fontSize: 11, color: "#888" }}>{r.orgType} · {r.addressRegion}</div>
                          {r.businessNumber && <div style={{ fontSize: 10, color: "#aaa" }}>{r.businessNumber}</div>}
                        </td>
                        <td>
                          {r.applicantName || "-"} ({r.applicantLoginId || "-"})
                        </td>
                        <td>{r.contactPhone}<br /><span style={{ fontSize: 11, color: "#888" }}>{r.contactEmail}</span></td>
                        <td>{r.estimatedStudents ?? "-"}</td>
                        <td>
                          <StatusBadge status={r.status} />
                          {r.rejectionReason && (
                            <div style={{ fontSize: 10, color: "#c0392b", marginTop: 2 }}>{r.rejectionReason}</div>
                          )}
                        </td>
                        <td>{r.createdAt?.slice(0, 10)}</td>
                        <td style={{ whiteSpace: "nowrap" }}>
                          {r.status === "pending" && (
                            <>
                              <button className="admin-detail-btn sm" disabled={actionId === r.id}
                                onClick={() => approve(r.id)} style={{ marginRight: 4 }}>승인</button>
                              <button className="admin-detail-btn danger sm" disabled={actionId === r.id}
                                onClick={() => setRejectModal({ id: r.id, reason: "" })}>거절</button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
          </div>
        </div>

        {rejectModal && (
          <div className="admin-modal-overlay" onClick={() => setRejectModal(null)}>
            <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
              <h2>거절 사유</h2>
              <textarea value={rejectModal.reason}
                onChange={(e) => setRejectModal({ ...rejectModal, reason: e.target.value })}
                rows={4} style={{ width: "100%", padding: 8, border: "1px solid #ddd", borderRadius: 4 }} />
              <div className="admin-modal-actions">
                <button className="admin-detail-btn danger"
                  onClick={() => reject(rejectModal.id, rejectModal.reason)}>거절 처리</button>
                <button className="admin-detail-btn secondary" onClick={() => setRejectModal(null)}>취소</button>
              </div>
            </div>
          </div>
        )}

        {approvedInfo && (
          <div className="admin-modal-overlay" onClick={() => setApprovedInfo(null)}>
            <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
              <h2>승인 완료</h2>
              <p style={{ color: "#c0392b", fontWeight: 600 }}>
                ⚠ 임시 비밀번호는 이 창을 닫으면 다시 볼 수 없습니다.
              </p>
              <div style={{ background: "#f7f7f5", border: "1px solid #ddd", borderRadius: 6, padding: 12 }}>
                <div style={{ fontSize: 12, color: "#666" }}>기관</div>
                <div style={{ fontWeight: 600, marginBottom: 8 }}>{approvedInfo.orgName}</div>
                <div style={{ fontSize: 12, color: "#666" }}>관리자</div>
                <div style={{ marginBottom: 8 }}>{approvedInfo.name} ({approvedInfo.loginId})</div>
                <div style={{ fontSize: 12, color: "#666" }}>임시 비밀번호</div>
                <div style={{ fontFamily: "monospace", fontSize: 18, fontWeight: 700,
                              background: "#fff", padding: "8px 10px", border: "1px solid #ccc",
                              borderRadius: 4, userSelect: "all" }}>
                  {approvedInfo.temporaryPassword}
                </div>
              </div>
              <div className="admin-modal-actions">
                <button className="admin-detail-btn"
                  onClick={() => {
                    navigator.clipboard?.writeText(
                      `[국어농장 로그인 정보]\n학원: ${approvedInfo.orgName}\n아이디: ${approvedInfo.loginId}\n임시 비밀번호: ${approvedInfo.temporaryPassword}`
                    );
                    alert("복사됨");
                  }}>복사</button>
                <button className="admin-detail-btn secondary" onClick={() => setApprovedInfo(null)}>닫기</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

function StatusBadge({ status }) {
  const styles = {
    pending:  { bg: "rgba(245,158,11,0.15)", color: "#b45309", label: "검토 대기" },
    approved: { bg: "rgba(46,125,50,0.15)",  color: "#2e7d32", label: "승인" },
    rejected: { bg: "rgba(192,57,43,0.15)",  color: "#c0392b", label: "거절" },
  };
  const s = styles[status] || { bg: "#eee", color: "#666", label: status };
  return (
    <span style={{ background: s.bg, color: s.color, padding: "2px 6px",
                   borderRadius: 3, fontSize: 11, fontWeight: 600 }}>{s.label}</span>
  );
}
