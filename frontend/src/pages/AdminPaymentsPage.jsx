import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAdminList } from "../hooks/useAdminList";
import "../styles/admin-detail.css";

const PAYMENTS = [
  { id: "PAY-20260124-01", org: "Korfarm Academy", amount: 9900, status: "paid" },
  { id: "PAY-20260124-02", org: "해든 국어학원", amount: 19900, status: "paid" },
  { id: "PAY-20260124-03", org: "서울 초등학교", amount: 0, status: "failed" },
];

const mapPayments = (items) =>
  items.map((item) => ({
    id: item.id || item.payment_id || "-",
    org: item.org_name || item.orgName || "-",
    amount: item.amount ?? 0,
    status: item.status || "paid",
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

  const filteredPayments = useMemo(() => {
    const term = search.trim().toLowerCase();
    return payments.filter((payment) => {
      if (statusFilter !== "all" && payment.status !== statusFilter) {
        return false;
      }
      if (!term) {
        return true;
      }
      return [payment.id, payment.org, payment.status]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term));
    });
  }, [payments, search, statusFilter]);

  return (
    <div className="admin-detail-page">
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>결제 관리</h1>
          <div className="admin-detail-actions">
            <button className="admin-detail-btn" type="button">
              정산 리포트
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
            <h2>결제 목록</h2>
            <div className="admin-detail-toolbar">
              <div className="admin-detail-search">
                <span className="material-symbols-outlined">search</span>
                <input
                  placeholder="결제 검색"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <div className="admin-detail-filters">
                <button
                  className={`admin-filter ${statusFilter === "all" ? "active" : ""}`}
                  type="button"
                  onClick={() => setStatusFilter("all")}
                >
                  전체
                </button>
                <button
                  className={`admin-filter ${statusFilter === "paid" ? "active" : ""}`}
                  type="button"
                  onClick={() => setStatusFilter("paid")}
                >
                  결제 완료
                </button>
                <button
                  className={`admin-filter ${statusFilter === "failed" ? "active" : ""}`}
                  type="button"
                  onClick={() => setStatusFilter("failed")}
                >
                  실패
                </button>
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-detail-card">
            <h3>결제 요약</h3>
            <p>오늘 결제 32건 · 실패 2건</p>
            <div className="admin-detail-tag">환불 요청 4건</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPaymentsPage;
