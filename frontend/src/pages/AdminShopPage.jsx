import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiPost, apiPatch, apiDelete } from "../utils/adminApi";
import { useAdminList } from "../hooks/useAdminList";
import AdminLayout from "../components/AdminLayout";
import "../styles/admin-detail.css";

/* ── 상품 탭 ── */

const PRODUCTS_SEED = [
  { id: "p1", title: "국어농장 1단계 교재", category: "교재", stock: 120, status: "active" },
];

const mapProducts = (items) =>
  items.map((item) => ({
    id: item.id || item.product_id || item.title,
    title: item.title || item.name || "-",
    category: item.category || "-",
    price: item.price ?? 0,
    stock: item.stock ?? 0,
    status: item.status || "active",
  }));

function ShopProductsTab() {
  const { data: products, loading, error } = useAdminList(
    "/v1/admin/shop/products",
    PRODUCTS_SEED,
    mapProducts
  );
  const [rows, setRows] = useState(PRODUCTS_SEED);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [formData, setFormData] = useState({ name: "", price: 0, stock: 0 });
  const [editFormData, setEditFormData] = useState({ name: "", price: 0, stock: 0, status: "active" });
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { setRows(products); }, [products]);

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((product) => {
      if (statusFilter !== "all" && product.status !== statusFilter) return false;
      if (!term) return true;
      return [product.title, product.category, product.status]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(term));
    });
  }, [rows, search, statusFilter]);

  const handleCreate = async () => {
    setActionError("");
    if (!formData.name.trim()) { setActionError("상품명을 입력해 주세요."); return; }
    setActionLoading(true);
    try {
      const result = await apiPost("/v1/admin/shop/products", {
        name: formData.name.trim(),
        price: Number(formData.price) || 0,
        stock: Number(formData.stock) || 0,
      });
      const mapped = mapProducts([result])[0];
      setRows((prev) => [mapped, ...prev]);
      setShowCreateModal(false);
      setFormData({ name: "", price: 0, stock: 0 });
    } catch (err) { setActionError(err.message); }
    finally { setActionLoading(false); }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm("상품을 삭제하시겠습니까?")) return;
    setActionLoading(true);
    try {
      await apiDelete(`/v1/admin/shop/products/${productId}`);
      setRows((prev) => prev.filter((r) => r.id !== productId));
    } catch (err) { setActionError(err.message); }
    finally { setActionLoading(false); }
  };

  const openEditModal = (product) => {
    setEditTarget(product);
    setEditFormData({ name: product.title || "", price: product.price ?? 0, stock: product.stock ?? 0, status: product.status || "active" });
    setActionError("");
    setShowEditModal(true);
  };

  const handleEdit = async () => {
    setActionError("");
    if (!editFormData.name.trim()) { setActionError("상품명을 입력해 주세요."); return; }
    setActionLoading(true);
    try {
      const result = await apiPatch(`/v1/admin/shop/products/${editTarget.id}`, {
        name: editFormData.name.trim(),
        price: Number(editFormData.price) || 0,
        stock: Number(editFormData.stock) || 0,
        status: editFormData.status,
      });
      const mapped = mapProducts([result])[0];
      setRows((prev) => prev.map((r) => (r.id === editTarget.id ? mapped : r)));
      setShowEditModal(false);
      setEditTarget(null);
    } catch (err) { setActionError(err.message); }
    finally { setActionLoading(false); }
  };

  return (
    <>
      <div className="admin-detail-header" style={{ marginBottom: 12 }}>
        <div />
        <div className="admin-detail-actions">
          <button
            className="admin-detail-btn"
            type="button"
            onClick={() => { setFormData({ name: "", price: 0, stock: 0 }); setActionError(""); setShowCreateModal(true); }}
          >
            상품 등록
          </button>
        </div>
      </div>
      <div className="admin-detail-grid">
        <div className="admin-detail-card">
          <h2>상품 목록</h2>
          <div className="admin-detail-toolbar">
            <div className="admin-detail-search">
              <span className="material-symbols-outlined">search</span>
              <input placeholder="상품 검색" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="admin-detail-filters">
              {["all", "active", "sold_out"].map((f) => (
                <button key={f} className={`admin-filter ${statusFilter === f ? "active" : ""}`} type="button" onClick={() => setStatusFilter(f)}>
                  {f === "all" ? "전체" : f === "active" ? "판매중" : "품절"}
                </button>
              ))}
            </div>
          </div>
          {loading ? <p className="admin-detail-note">상품을 불러오는 중...</p> : null}
          {error ? <p className="admin-detail-note error">{error}</p> : null}
          {actionError ? <p className="admin-detail-note error">{actionError}</p> : null}
          <table className="admin-detail-table">
            <thead>
              <tr><th>상품명</th><th>카테고리</th><th>가격</th><th>재고</th><th>상태</th><th>조치</th></tr>
            </thead>
            <tbody>
              {filteredProducts.map((product) => (
                <tr key={product.id}>
                  <td>{product.title}</td>
                  <td>{product.category}</td>
                  <td>{product.price?.toLocaleString() ?? 0}원</td>
                  <td>{product.stock}</td>
                  <td><span className="status-pill" data-status={product.status}>{product.status}</span></td>
                  <td>
                    <div className="admin-detail-actions">
                      <button className="admin-detail-btn sm" type="button" onClick={() => openEditModal(product)} disabled={actionLoading}>수정</button>
                      <button className="admin-detail-btn secondary sm" type="button" onClick={() => handleDelete(product.id)} disabled={actionLoading}>삭제</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="admin-detail-card">
          <h3>재고 요약</h3>
          <p>전체 {rows.length}개</p>
          <p>판매중 {rows.filter((r) => r.status === "active").length}개</p>
        </div>
      </div>

      {showEditModal && editTarget ? (
        <div className="admin-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>상품 수정</h2>
            {actionError ? <p className="admin-detail-note error">{actionError}</p> : null}
            <div className="admin-modal-field"><label>상품명</label><input value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} placeholder="상품명" /></div>
            <div className="admin-modal-field"><label>가격</label><input type="number" value={editFormData.price} onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })} /></div>
            <div className="admin-modal-field"><label>재고</label><input type="number" value={editFormData.stock} onChange={(e) => setEditFormData({ ...editFormData, stock: e.target.value })} /></div>
            <div className="admin-modal-field">
              <label>상태</label>
              <select value={editFormData.status} onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}>
                <option value="active">판매중</option><option value="sold_out">품절</option>
              </select>
            </div>
            <div className="admin-modal-actions">
              <button className="admin-detail-btn" onClick={handleEdit} disabled={actionLoading}>저장</button>
              <button className="admin-detail-btn secondary" onClick={() => setShowEditModal(false)}>취소</button>
            </div>
          </div>
        </div>
      ) : null}

      {showCreateModal ? (
        <div className="admin-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>상품 등록</h2>
            {actionError ? <p className="admin-detail-note error">{actionError}</p> : null}
            <div className="admin-modal-field"><label>상품명</label><input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="상품명" /></div>
            <div className="admin-modal-field"><label>가격</label><input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} /></div>
            <div className="admin-modal-field"><label>재고</label><input type="number" value={formData.stock} onChange={(e) => setFormData({ ...formData, stock: e.target.value })} /></div>
            <div className="admin-modal-actions">
              <button className="admin-detail-btn" onClick={handleCreate} disabled={actionLoading}>등록</button>
              <button className="admin-detail-btn secondary" onClick={() => setShowCreateModal(false)}>취소</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/* ── 주문 탭 ── */

const ORDERS_SEED = [
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

function ShopOrdersTab() {
  const { data: orders, loading, error } = useAdminList(
    "/v1/admin/shop/orders",
    ORDERS_SEED,
    mapOrders
  );
  const [rows, setRows] = useState(ORDERS_SEED);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("shipping");
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => { setRows(orders); }, [orders]);

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
      setRows((prev) => prev.map((r) => (r.id === selectedOrder.id ? { ...r, status: newStatus } : r)));
      setShowUpdateModal(false);
      setSelectedOrder(null);
    } catch (err) { setActionError(err.message); }
    finally { setActionLoading(false); }
  };

  const openDetail = (order) => { setSelectedOrder(order); setShowDetailModal(true); };
  const openUpdate = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.status === "pending" ? "shipping" : "delivered");
    setActionError("");
    setShowDetailModal(false);
    setShowUpdateModal(true);
  };

  return (
    <>
      <div className="admin-detail-grid">
        <div className="admin-detail-card">
          <h2>주문 목록</h2>
          <div className="admin-detail-toolbar">
            <div className="admin-detail-search">
              <span className="material-symbols-outlined">search</span>
              <input placeholder="주문 검색" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="admin-detail-filters">
              {["all", "pending", "shipping", "delivered"].map((f) => (
                <button key={f} className={`admin-filter ${statusFilter === f ? "active" : ""}`} type="button" onClick={() => setStatusFilter(f)}>
                  {STATUS_LABELS[f]}
                </button>
              ))}
            </div>
          </div>
          {loading ? <p className="admin-detail-note">주문을 불러오는 중...</p> : null}
          {error ? <p className="admin-detail-note error">{error}</p> : null}
          <table className="admin-detail-table">
            <thead>
              <tr><th>주문 번호</th><th>고객</th><th>금액</th><th>상태</th><th>조치</th></tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id}>
                  <td>
                    <span style={{ color: "#4a7c59", cursor: "pointer", textDecoration: "underline" }} onClick={() => openDetail(order)}>
                      {order.id}
                    </span>
                  </td>
                  <td>{order.customer}</td>
                  <td>{formatAmount(order.amount)}</td>
                  <td><span className="status-pill" data-status={order.status}>{STATUS_LABELS[order.status] || order.status}</span></td>
                  <td>
                    <button className="admin-detail-btn secondary sm" type="button" onClick={() => openUpdate(order)} disabled={order.status === "delivered"}>
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

      {showDetailModal && selectedOrder ? (
        <div className="admin-modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>주문 상세</h2>
            <div className="admin-modal-field"><label>주문 번호</label><p>{selectedOrder.id}</p></div>
            <div className="admin-modal-field"><label>고객</label><p>{selectedOrder.customer}</p></div>
            <div className="admin-modal-field"><label>금액</label><p>{formatAmount(selectedOrder.amount)}</p></div>
            <div className="admin-modal-field"><label>상태</label><p>{STATUS_LABELS[selectedOrder.status] || selectedOrder.status}</p></div>
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
              <button className="admin-detail-btn" onClick={() => openUpdate(selectedOrder)} disabled={selectedOrder.status === "delivered"}>상태 변경</button>
              <button className="admin-detail-btn secondary" onClick={() => setShowDetailModal(false)}>닫기</button>
            </div>
          </div>
        </div>
      ) : null}

      {showUpdateModal && selectedOrder ? (
        <div className="admin-modal-overlay" onClick={() => setShowUpdateModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>주문 상태 변경</h2>
            {actionError ? <p className="admin-detail-note error">{actionError}</p> : null}
            <div className="admin-modal-field"><label>주문 번호</label><p>{selectedOrder.id}</p></div>
            <div className="admin-modal-field"><label>현재 상태</label><p>{STATUS_LABELS[selectedOrder.status] || selectedOrder.status}</p></div>
            <div className="admin-modal-field">
              <label>변경할 상태</label>
              <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                <option value="pending">준비중</option><option value="shipping">배송중</option><option value="delivered">배송완료</option>
              </select>
            </div>
            <div className="admin-modal-actions">
              <button className="admin-detail-btn" onClick={handleUpdateStatus} disabled={actionLoading}>변경</button>
              <button className="admin-detail-btn secondary" onClick={() => setShowUpdateModal(false)}>취소</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/* ── 메인 페이지 ── */

function AdminShopPage() {
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") || "products";

  return (
    <AdminLayout>
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>상점 관리</h1>
        </div>
        <div className="admin-tabs">
          <button className={`admin-tab ${tab === "products" ? "active" : ""}`} onClick={() => setParams({ tab: "products" })}>
            상품
          </button>
          <button className={`admin-tab ${tab === "orders" ? "active" : ""}`} onClick={() => setParams({ tab: "orders" })}>
            주문
          </button>
        </div>
        {tab === "products" ? <ShopProductsTab /> : <ShopOrdersTab />}
      </div>
    </AdminLayout>
  );
}

export default AdminShopPage;
