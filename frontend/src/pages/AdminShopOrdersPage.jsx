import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAdminList } from "../hooks/useAdminList";
import "../styles/admin-detail.css";

const ORDERS = [
  { id: "ORD-20260124-01", customer: "김서연", amount: 19900, status: "shipping" },
  { id: "ORD-20260124-02", customer: "이준호", amount: 9900, status: "delivered" },
  { id: "ORD-20260124-03", customer: "박예은", amount: 12900, status: "pending" },
];

const mapOrders = (items) =>
  items.map((item) => ({
    id: item.id || item.order_id || "-",
    customer: item.customer_name || item.customerName || "-",
    amount: item.amount ?? 0,
    status: item.status || "pending",
  }));

const formatAmount = (value) => `₩${value.toLocaleString("ko-KR")}`;

function AdminShopOrdersPage() {
  const { data: orders, loading, error } = useAdminList(
    "/v1/admin/shop/orders",
    ORDERS,
    mapOrders
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) {
        return false;
      }
      if (!term) {
        return true;
      }
      return [order.id, order.customer, order.status]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term));
    });
  }, [orders, search, statusFilter]);

  return (
    <div className="admin-detail-page">
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>주문 관리</h1>
          <div className="admin-detail-actions">
            <button className="admin-detail-btn" type="button">
              송장 등록
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
            <h2>주문 목록</h2>
            <div className="admin-detail-toolbar">
              <div className="admin-detail-search">
                <span className="material-symbols-outlined">search</span>
                <input
                  placeholder="주문 검색"
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
                  className={`admin-filter ${statusFilter === "pending" ? "active" : ""}`}
                  type="button"
                  onClick={() => setStatusFilter("pending")}
                >
                  준비중
                </button>
                <button
                  className={`admin-filter ${statusFilter === "shipping" ? "active" : ""}`}
                  type="button"
                  onClick={() => setStatusFilter("shipping")}
                >
                  배송중
                </button>
                <button
                  className={`admin-filter ${statusFilter === "delivered" ? "active" : ""}`}
                  type="button"
                  onClick={() => setStatusFilter("delivered")}
                >
                  배송완료
                </button>
              </div>
            </div>
            {loading ? <p className="admin-detail-note">주문을 불러오는 중...</p> : null}
            {error ? <p className="admin-detail-note error">{error}</p> : null}
            <table className="admin-detail-table">
              <thead>
                <tr>
                  <th>주문 번호</th>
                  <th>고객</th>
                  <th>금액</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>{order.id}</td>
                    <td>{order.customer}</td>
                    <td>{formatAmount(order.amount)}</td>
                    <td>
                      <span className="status-pill" data-status={order.status}>
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-detail-card">
            <h3>주문 요약</h3>
            <p>오늘 주문 12건 · 배송중 3건</p>
            <div className="admin-detail-tag">배송 완료 8건</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminShopOrdersPage;
