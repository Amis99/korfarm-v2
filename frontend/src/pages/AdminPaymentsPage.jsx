import { useMemo, useState } from "react";
import { useAdminList } from "../hooks/useAdminList";
import AdminLayout from "../components/AdminLayout";
import "../styles/admin-detail.css";

const PAYMENTS = [
  { id: "PAY-20260124-01", org: "Korfarm Academy", amount: 9900, status: "paid" },
];

const mapPayments = (items) =>
  items.map((item) => ({
    id: item.id || item.payment_id || "-",
    org: item.org_name || item.orgName || "-",
    user: item.user_name || item.userName || item.user_id || "-",
    amount: item.amount ?? 0,
    status: item.status || "paid",
    createdAt: item.created_at || item.createdAt || "-",
  }));

const formatAmount = (value) => `₩${value.toLocaleString("ko-KR")}`;

function AdminPaymentsPage() {
  const { data: payments, loading, error } = useAdminList(
    "/v1/admin/payments",
    PAYMENTS,
    mapPayments
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState(null);

  const filteredPayments = useMemo(() => {
    const term = search.trim().toLowerCase();
    return payments.filter((payment) => {
      if (statusFilter !== "all" && payment.status !== statusFilter) return false;
      if (!term) return true;
      return [payment.id, payment.org, payment.user, payment.status]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(term));
    });
  }, [payments, search, statusFilter]);

  return (
    <AdminLayout>
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>결제 관리</h1>
        </div>
        <div className="admin-detail-grid">
          <div className="admin-detail-card">
            <h2>결제 목록</h2>
            <div className="admin-detail-toolbar">
              <div className="admin-detail-search">
                <span className="material-symbols-outlined">search</span>
                <input
                  placeholder="결제 검색"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="admin-detail-filters">
                {["all", "paid", "failed"].map((f) => (
                  <button
                    key={f}
                    className={`admin-filter ${statusFilter === f ? "active" : ""}`}
                    type="button"
                    onClick={() => setStatusFilter(f)}
                  >
                    {f === "all" ? "전체" : f === "paid" ? "결제 완료" : "실패"}
                  </button>
                ))}
              </div>
            </div>
            {loading ? <p className="admin-detail-note">결제를 불러오는 중...</p> : null}
            {error ? <p className="admin-detail-note error">{error}</p> : null}
            <table className="admin-detail-table">
              <thead>
                <tr>
                  <th>결제 ID</th>
                  <th>기관</th>
                  <th>금액</th>
                  <th>상태</th>
                  <th>조치</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.map((payment) => (
                  <tr key={payment.id}>
                    <td>{payment.id}</td>
                    <td>{payment.org}</td>
                    <td>{formatAmount(payment.amount)}</td>
                    <td>
                      <span className="status-pill" data-status={payment.status}>
                        {payment.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="admin-detail-btn secondary"
                        type="button"
                        onClick={() => setSelectedPayment(payment)}
                        style={{ fontSize: "12px", padding: "4px 8px" }}
                      >
                        상세
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-detail-card">
            <h3>결제 요약</h3>
            <p>전체 {payments.length}건</p>
            <p>완료 {payments.filter((p) => p.status === "paid").length}건</p>
          </div>
        </div>
      </div>

      {selectedPayment ? (
        <div className="admin-modal-overlay" onClick={() => setSelectedPayment(null)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>결제 상세</h2>
            <div className="admin-modal-field">
              <label>결제 ID</label>
              <p>{selectedPayment.id}</p>
            </div>
            <div className="admin-modal-field">
              <label>기관</label>
              <p>{selectedPayment.org}</p>
            </div>
            <div className="admin-modal-field">
              <label>금액</label>
              <p>{formatAmount(selectedPayment.amount)}</p>
            </div>
            <div className="admin-modal-field">
              <label>상태</label>
              <p>{selectedPayment.status}</p>
            </div>
            <div className="admin-modal-field">
              <label>일시</label>
              <p>{selectedPayment.createdAt}</p>
            </div>
            <div className="admin-modal-actions">
              <button className="admin-detail-btn secondary" onClick={() => setSelectedPayment(null)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}

export default AdminPaymentsPage;
