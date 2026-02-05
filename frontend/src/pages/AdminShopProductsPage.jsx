import { useEffect, useMemo, useState } from "react";
import { apiPost, apiPatch, apiDelete } from "../utils/adminApi";
import { useAdminList } from "../hooks/useAdminList";
import AdminLayout from "../components/AdminLayout";
import "../styles/admin-detail.css";

const PRODUCTS = [
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

function AdminShopProductsPage() {
  const { data: products, loading, error } = useAdminList(
    "/v1/admin/shop/products",
    PRODUCTS,
    mapProducts
  );
  const [rows, setRows] = useState(PRODUCTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [formData, setFormData] = useState({ name: "", price: 0, stock: 0 });
  const [editFormData, setEditFormData] = useState({ name: "", price: 0, stock: 0, status: "active" });
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setRows(products);
  }, [products]);

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
    if (!formData.name.trim()) {
      setActionError("상품명을 입력해 주세요.");
      return;
    }
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
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm("상품을 삭제하시겠습니까?")) return;
    setActionLoading(true);
    try {
      await apiDelete(`/v1/admin/shop/products/${productId}`);
      setRows((prev) => prev.filter((r) => r.id !== productId));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (product) => {
    setEditTarget(product);
    setEditFormData({
      name: product.title || "",
      price: product.price ?? 0,
      stock: product.stock ?? 0,
      status: product.status || "active",
    });
    setActionError("");
    setShowEditModal(true);
  };

  const handleEdit = async () => {
    setActionError("");
    if (!editFormData.name.trim()) {
      setActionError("상품명을 입력해 주세요.");
      return;
    }
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
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>상품 관리</h1>
          <div className="admin-detail-actions">
            <button
              className="admin-detail-btn"
              type="button"
              onClick={() => {
                setFormData({ name: "", price: 0, stock: 0 });
                setActionError("");
                setShowCreateModal(true);
              }}
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
                <input
                  placeholder="상품 검색"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="admin-detail-filters">
                {["all", "active", "sold_out"].map((f) => (
                  <button
                    key={f}
                    className={`admin-filter ${statusFilter === f ? "active" : ""}`}
                    type="button"
                    onClick={() => setStatusFilter(f)}
                  >
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
                <tr>
                  <th>상품명</th>
                  <th>카테고리</th>
                  <th>가격</th>
                  <th>재고</th>
                  <th>상태</th>
                  <th>조치</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td>{product.title}</td>
                    <td>{product.category}</td>
                    <td>{product.price?.toLocaleString() ?? 0}원</td>
                    <td>{product.stock}</td>
                    <td>
                      <span className="status-pill" data-status={product.status}>
                        {product.status}
                      </span>
                    </td>
                    <td>
                      <div className="admin-detail-actions">
                        <button
                          className="admin-detail-btn"
                          type="button"
                          onClick={() => openEditModal(product)}
                          disabled={actionLoading}
                          style={{ fontSize: "12px", padding: "4px 8px" }}
                        >
                          수정
                        </button>
                        <button
                          className="admin-detail-btn secondary"
                          type="button"
                          onClick={() => handleDelete(product.id)}
                          disabled={actionLoading}
                          style={{ fontSize: "12px", padding: "4px 8px" }}
                        >
                          삭제
                        </button>
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
      </div>

      {showEditModal && editTarget ? (
        <div className="admin-modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>상품 수정</h2>
            {actionError ? <p className="admin-detail-note error">{actionError}</p> : null}
            <div className="admin-modal-field">
              <label>상품명</label>
              <input
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="상품명"
              />
            </div>
            <div className="admin-modal-field">
              <label>가격</label>
              <input
                type="number"
                value={editFormData.price}
                onChange={(e) => setEditFormData({ ...editFormData, price: e.target.value })}
              />
            </div>
            <div className="admin-modal-field">
              <label>재고</label>
              <input
                type="number"
                value={editFormData.stock}
                onChange={(e) => setEditFormData({ ...editFormData, stock: e.target.value })}
              />
            </div>
            <div className="admin-modal-field">
              <label>상태</label>
              <select
                value={editFormData.status}
                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
              >
                <option value="active">판매중</option>
                <option value="sold_out">품절</option>
              </select>
            </div>
            <div className="admin-modal-actions">
              <button className="admin-detail-btn" onClick={handleEdit} disabled={actionLoading}>
                저장
              </button>
              <button className="admin-detail-btn secondary" onClick={() => setShowEditModal(false)}>
                취소
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showCreateModal ? (
        <div className="admin-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>상품 등록</h2>
            {actionError ? <p className="admin-detail-note error">{actionError}</p> : null}
            <div className="admin-modal-field">
              <label>상품명</label>
              <input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="상품명"
              />
            </div>
            <div className="admin-modal-field">
              <label>가격</label>
              <input
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
              />
            </div>
            <div className="admin-modal-field">
              <label>재고</label>
              <input
                type="number"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
              />
            </div>
            <div className="admin-modal-actions">
              <button className="admin-detail-btn" onClick={handleCreate} disabled={actionLoading}>
                등록
              </button>
              <button className="admin-detail-btn secondary" onClick={() => setShowCreateModal(false)}>
                취소
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AdminLayout>
  );
}

export default AdminShopProductsPage;
