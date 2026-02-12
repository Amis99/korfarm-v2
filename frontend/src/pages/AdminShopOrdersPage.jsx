import { useEffect, useMemo, useState } from "react";
import { apiPatch } from "../utils/adminApi";
import { useAdminList } from "../hooks/useAdminList";
import AdminLayout from "../components/AdminLayout";
import "../styles/admin-detail.css";

const ORDERS = [
  { id: "ORD-20260124-01", customer: "김서연", amount: 19900, status: "shipping" },
];

const mapOrders = (items) =>
  items.map((item) => ({
    id: item.id || item.order_id || "-",
    customer: item.customer_name || item.customerName || item.user_name || item.userName || "-",
    amount: item.amount ?? item.total_amount ?? 0,
    status: item.status || "pending",
    address: item.address || null,
  }));

const formatAddress = (addr) => {
  if (!addr) return "-";
  const parts = [addr.address, addr.addressDetail].filter(Boolean);
  return parts.join(" ") || "-";
};

const formatAmount = (value) => `₩${value.toLocaleString("ko-KR")}`;

const STATUS_LABELS = {
  all: "전체",
  pending: "준비중",
  shipping: "배송중",
  delivered: "배송완료",
};

function AdminShopOrdersPage() {
  const { data: orders, loading, error } = useAdminList(
    "/v1/admin/shop/orders",
    ORDERS,
    mapOrders
  );
  const [rows, setRows] = useState(ORDERS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("shipping");
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setRows(orders);
  }, [orders]);

  const filteredOrders = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (!term) return true;
      return [order.id, order.customer, order.status]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(term));
    });
  }, [rows, search, statusFilter]);

  const handleUpdateStatus = async () => {
    if (!selectedOrder) return;
    setActionError("");
    setActionLoading(true);
    try {
      await apiPatch(`/v1/admin/shop/orders/${selectedOrder.id}`, { status: newStatus });
      setRows((prev) =>
        prev.map((r) => (r.id === selectedOrder.id ? { ...r, status: newStatus } : r))
      );
      setShowUpdateModal(false);
      setSelectedOrder(null);
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openDetail = (order) => {
    setSelectedOrder(order);
    setShowDetailModal(true);
  };

  const openUpdate = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status === "pending" ? "shipping" : "delivered");
    setActionError("");
    setShowDetailModal(false);
    setShowUpdateModal(true);
  };

  return (
    <AdminLayout>
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>주문 관리</h1>
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
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="admin-detail-filters">
                {["all", "pending", "shipping", "delivered"].map((f) => (
                  <button
                    key={f}
                    className={`admin-filter ${statusFilter === f ? "active" : ""}`}
                    type="button"
                    onClick={() => setStatusFilter(f)}
                  >
                    {STATUS_LABELS[f]}
                  </button>
                ))}
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
                  <th>조치</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <span
                        style={{ color: "#4a7c59", cursor: "pointer", textDecoration: "underline" }}
                        onClick={() => openDetail(order)}
                      >
                        {order.id}
                      </span>
                    </td>
                    <td>{order.customer}</td>
                    <td>{formatAmount(order.amount)}</td>
                    <td>
                      <span className="status-pill" data-status={order.status}>
                        {STATUS_LABELS[order.status] || order.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className="admin-detail-btn secondary"
                        type="button"
                        onClick={() => openUpdate(order)}
                        disabled={order.status === "delivered"}
                        style={{ fontSize: "12px", padding: "4px 8px" }}
                      >
                        상태 변경
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-detail-card">
            <h3>주문 요약</h3>
            <p>전체 {rows.length}건</p>
            <p>배송중 {rows.filter((r) => r.status === "shipping").length}건</p>
          </div>
        </div>
      </div>

      {showDetailModal && selectedOrder ? (
        <div className="admin-modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>주문 상세</h2>
            <div className="admin-modal-field">
              <label>주문 번호</label>
              <p>{selectedOrder.id}</p>
            </div>
            <div className="admin-modal-field">
              <label>고객</label>
              <p>{selectedOrder.customer}</p>
            </div>
            <div className="admin-modal-field">
              <label>금액</label>
              <p>{formatAmount(selectedOrder.amount)}</p>
            </div>
            <div className="admin-modal-field">
              <label>상태</label>
              <p>{STATUS_LABELS[selectedOrder.status] || selectedOrder.status}</p>
            </div>
            {selectedOrder.address ? (
              <div className="admin-modal-field">
                <label>배송지</label>
                <div style={{ fontSize: "13px", lineHeight: "1.6" }}>
                  {selectedOrder.address.recipientName ? <div>수령인: {selectedOrder.address.recipientName}</div> : null}
                  {selectedOrder.address.phone ? <div>연락처: {selectedOrder.address.phone}</div> : null}
                  <div>{formatAddress(selectedOrder.address)}</div>
                  {selectedOrder.address.zipCode ? <div>우편번호: {selectedOrder.address.zipCode}</div> : null}
                </div>
              </div>
            ) : null}
            <div className="admin-modal-actions">
              <button
                className="admin-detail-btn"
                onClick={() => openUpdate(selectedOrder)}
                disabled={selectedOrder.status === "delivered"}
              >
                상태 변경
              </button>
              <button className="admin-detail-btn secondary" onClick={() => setShowDetailModal(false)}>
                닫기
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showUpdateModal && selectedOrder ? (
        <div className="admin-modal-overlay" onClick={() => setShowUpdateModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>주문 상태 변경</h2>
            {actionError ? <p className="admin-detail-note error">{actionError}</p> : null}
            <div className="admin-modal-field">
              <label>주문 번호</label>
              <p>{selectedOrder.id}</p>
            </div>
            <div className="admin-modal-field">
              <label>현재 상태</label>
              <p>{STATUS_LABELS[selectedOrder.status] || selectedOrder.status}</p>
            </div>
            <div className="admin-modal-field">
              <label>변경할 상태</label>
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                <option value="pending">준비중</option>
                <option value="shipping">배송중</option>
                <option value="delivered">배송완료</option>
              </select>
            </div>
            <div className="admin-modal-actions">
              <button className="admin-detail-btn" onClick={handleUpdateStatus} disabled={actionLoading}>
                변경
              </button>
              <button className="admin-detail-btn secondary" onClick={() => setShowUpdateModal(false)}>
                취소
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}

export default AdminShopOrdersPage;
