import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { apiPost, apiPatch, apiDelete } from "../utils/adminApi";
import { apiPost as apiPostUser, API_BASE, TOKEN_KEY } from "../utils/api";
import { useAdminList } from "../hooks/useAdminList";
import { useRequireRole } from "../hooks/useRequireRole";
import AdminLayout from "../components/AdminLayout";
import Pagination from "../components/Pagination";
import usePagination from "../hooks/usePagination";
import "../styles/admin-detail.css";

// 이미지 업로드 헬퍼 — 1) presign 으로 fileId 발급 2) multipart upload 3) /v1/files/{id}/download URL 반환
async function uploadShopImage(file) {
  const presign = await apiPostUser("/v1/files/presign", {
    purpose: "shop-product-image",
    mime: file.type || "image/jpeg",
    size: file.size,
    filename: file.name,
  });
  const fileId = presign.fileId || presign.file_id;
  const fd = new FormData();
  fd.append("file", file);
  const token = sessionStorage.getItem(TOKEN_KEY);
  const upRes = await fetch(`${API_BASE}/v1/files/${fileId}/upload`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  if (!upRes.ok) throw new Error(`이미지 업로드 실패 (${upRes.status})`);
  return `${API_BASE}/v1/files/${fileId}/download`;
}

/* ── 상품 탭 ── */

const PRODUCTS_SEED = [
  { id: "p1", title: "국어농장 1단계 교재", category: "교재", stock: 120, status: "active" },
];

const mapProducts = (items) =>
  items.map((item) => ({
    id: item.id || item.product_id || item.productId || item.title,
    title: item.title || item.name || "-",
    name: item.name || item.title || "",
    category: item.category || "textbook",
    levelLabel: item.level_label ?? item.levelLabel ?? "",
    summary: item.summary || "",
    imageUrl: item.image_url ?? item.imageUrl ?? "",
    detailImages: item.detail_images ?? item.detailImages ?? [],
    tags: item.tags || [],
    details: item.details || [],
    badge: item.badge || "",
    price: item.price ?? 0,
    stock: item.stock ?? 0,
    status: item.status || "active",
    sortOrder: item.sort_order ?? item.sortOrder ?? 0,
  }));

const EMPTY_FORM = {
  name: "", price: 0, stock: 0, status: "active",
  category: "textbook", levelLabel: "", summary: "",
  imageUrl: "", detailImages: [], tags: [], details: [],
  badge: "", sortOrder: 0,
};

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
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editFormData, setEditFormData] = useState(EMPTY_FORM);
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

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

  const { page, setPage, totalPages, paged: pagedProducts } = usePagination(filteredProducts, 15);
  useEffect(() => { setPage(1); }, [search, statusFilter, setPage]);

  // 폼 → 백엔드 payload 변환 (carmelCase 필드들)
  const buildPayload = (f) => ({
    name: f.name.trim(),
    price: Number(f.price) || 0,
    stock: Number(f.stock) || 0,
    status: f.status || "active",
    category: f.category || "textbook",
    levelLabel: f.levelLabel?.trim() || null,
    summary: f.summary?.trim() || null,
    imageUrl: f.imageUrl?.trim() || null,
    detailImages: Array.isArray(f.detailImages) ? f.detailImages.filter(Boolean) : [],
    tags: Array.isArray(f.tags) ? f.tags.filter(Boolean) : [],
    details: Array.isArray(f.details) ? f.details.filter(Boolean) : [],
    badge: f.badge?.trim() || null,
    sortOrder: Number(f.sortOrder) || 0,
  });

  const handleCreate = async () => {
    setActionError("");
    if (!formData.name.trim()) { setActionError("상품명을 입력해 주세요."); return; }
    setActionLoading(true);
    try {
      const result = await apiPost("/v1/admin/shop/products", buildPayload(formData));
      const mapped = mapProducts([result])[0];
      setRows((prev) => [mapped, ...prev]);
      setShowCreateModal(false);
      setFormData(EMPTY_FORM);
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
    setEditFormData({
      name: product.name || product.title || "",
      price: product.price ?? 0,
      stock: product.stock ?? 0,
      status: product.status || "active",
      category: product.category || "textbook",
      levelLabel: product.levelLabel || "",
      summary: product.summary || "",
      imageUrl: product.imageUrl || "",
      detailImages: product.detailImages || [],
      tags: product.tags || [],
      details: product.details || [],
      badge: product.badge || "",
      sortOrder: product.sortOrder ?? 0,
    });
    setActionError("");
    setShowEditModal(true);
  };

  const handleEdit = async () => {
    setActionError("");
    if (!editFormData.name.trim()) { setActionError("상품명을 입력해 주세요."); return; }
    setActionLoading(true);
    try {
      const result = await apiPatch(`/v1/admin/shop/products/${editTarget.id}`, buildPayload(editFormData));
      const mapped = mapProducts([result])[0];
      setRows((prev) => prev.map((r) => (r.id === editTarget.id ? mapped : r)));
      setShowEditModal(false);
      setEditTarget(null);
    } catch (err) { setActionError(err.message); }
    finally { setActionLoading(false); }
  };

  // 대표 이미지 업로드
  const handleMainImageUpload = async (e, isEdit) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageUploading(true);
    setActionError("");
    try {
      const url = await uploadShopImage(file);
      if (isEdit) setEditFormData((p) => ({ ...p, imageUrl: url }));
      else setFormData((p) => ({ ...p, imageUrl: url }));
    } catch (err) { setActionError(err.message); }
    finally { setImageUploading(false); e.target.value = ""; }
  };

  // 상세 설명 이미지 추가 업로드
  const handleDetailImagesUpload = async (e, isEdit) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setImageUploading(true);
    setActionError("");
    try {
      const urls = [];
      for (const f of files) urls.push(await uploadShopImage(f));
      if (isEdit) setEditFormData((p) => ({ ...p, detailImages: [...(p.detailImages || []), ...urls] }));
      else setFormData((p) => ({ ...p, detailImages: [...(p.detailImages || []), ...urls] }));
    } catch (err) { setActionError(err.message); }
    finally { setImageUploading(false); e.target.value = ""; }
  };

  const removeDetailImage = (idx, isEdit) => {
    if (isEdit) setEditFormData((p) => ({ ...p, detailImages: p.detailImages.filter((_, i) => i !== idx) }));
    else setFormData((p) => ({ ...p, detailImages: p.detailImages.filter((_, i) => i !== idx) }));
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
              {pagedProducts.map((product) => (
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
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
        <div className="admin-detail-card">
          <h3>재고 요약</h3>
          <p>전체 {rows.length}개</p>
          <p>판매중 {rows.filter((r) => r.status === "active").length}개</p>
        </div>
      </div>

      {showEditModal && editTarget ? (
        <ProductFormModal
          title="상품 수정"
          form={editFormData}
          setForm={setEditFormData}
          onSubmit={handleEdit}
          onClose={() => setShowEditModal(false)}
          actionError={actionError}
          actionLoading={actionLoading}
          imageUploading={imageUploading}
          onMainImageUpload={(e) => handleMainImageUpload(e, true)}
          onDetailImagesUpload={(e) => handleDetailImagesUpload(e, true)}
          onDetailImageRemove={(idx) => removeDetailImage(idx, true)}
          submitLabel="저장"
        />
      ) : null}

      {showCreateModal ? (
        <ProductFormModal
          title="상품 등록"
          form={formData}
          setForm={setFormData}
          onSubmit={handleCreate}
          onClose={() => setShowCreateModal(false)}
          actionError={actionError}
          actionLoading={actionLoading}
          imageUploading={imageUploading}
          onMainImageUpload={(e) => handleMainImageUpload(e, false)}
          onDetailImagesUpload={(e) => handleDetailImagesUpload(e, false)}
          onDetailImageRemove={(idx) => removeDetailImage(idx, false)}
          submitLabel="등록"
        />
      ) : null}
    </>
  );
}

/* ── 상품 등록·수정 공용 폼 모달 ── */

function ProductFormModal({
  title, form, setForm, onSubmit, onClose,
  actionError, actionLoading, imageUploading,
  onMainImageUpload, onDetailImagesUpload, onDetailImageRemove,
  submitLabel,
}) {
  const tagsText = (form.tags || []).join(", ");
  const detailsText = (form.details || []).join("\n");

  return (
    <div className="admin-modal-overlay" onClick={() => !actionLoading && onClose()}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 640, width: "92vw", maxHeight: "90vh", overflowY: "auto" }}>
        <h2>{title}</h2>
        {actionError ? <p className="admin-detail-note error">{actionError}</p> : null}

        <div className="admin-modal-field">
          <label>상품명 *</label>
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="예: 소쉬르 어휘 훈련 교재 세트" />
        </div>

        <div className="admin-grid-3col" style={{ gap: 10 }}>
          <div className="admin-modal-field">
            <label>카테고리</label>
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="textbook">교재</option>
              <option value="tool">교구</option>
            </select>
          </div>
          <div className="admin-modal-field">
            <label>레벨</label>
            <input value={form.levelLabel} onChange={(e) => setForm({ ...form, levelLabel: e.target.value })} placeholder="초1~3 / 중1~3 등" />
          </div>
          <div className="admin-modal-field">
            <label>배지</label>
            <input value={form.badge} onChange={(e) => setForm({ ...form, badge: e.target.value })} placeholder="신규 / 인기 / 추천 등" />
          </div>
        </div>

        <div className="admin-grid-3col" style={{ gap: 10 }}>
          <div className="admin-modal-field">
            <label>가격 (원) *</label>
            <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          </div>
          <div className="admin-modal-field">
            <label>재고</label>
            <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          </div>
          <div className="admin-modal-field">
            <label>상태</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="active">판매중</option>
              <option value="sold_out">품절</option>
              <option value="hidden">숨김</option>
            </select>
          </div>
        </div>

        <div className="admin-modal-field">
          <label>한 줄 요약</label>
          <input value={form.summary} onChange={(e) => setForm({ ...form, summary: e.target.value })} placeholder="상품 카드에 표시될 짧은 설명 (1줄)" />
        </div>

        <div className="admin-modal-field">
          <label>태그 (쉼표 구분)</label>
          <input
            value={tagsText}
            onChange={(e) => setForm({ ...form, tags: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
            placeholder="어휘, 기초, 세트"
          />
        </div>

        <div className="admin-modal-field">
          <label>상세 설명 (한 줄당 한 항목)</label>
          <textarea
            rows={4}
            value={detailsText}
            onChange={(e) => setForm({ ...form, details: e.target.value.split("\n").map((s) => s.trim()).filter(Boolean) })}
            placeholder={"워크북 3권 + 지도서 1권\n주간 진도표 포함\n학급 운영용 체크리스트 제공"}
            style={{ width: "100%", padding: 8, borderRadius: 8, border: "1px solid #d4c8b6", fontFamily: "inherit", fontSize: 13 }}
          />
        </div>

        <div className="admin-modal-field">
          <label>대표 이미지</label>
          {form.imageUrl ? (
            <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 8 }}>
              <img src={form.imageUrl} alt="대표" style={{ width: 88, height: 88, objectFit: "cover", borderRadius: 8, border: "1px solid #ddd" }} />
              <button type="button" className="admin-detail-btn secondary sm" onClick={() => setForm({ ...form, imageUrl: "" })}>제거</button>
            </div>
          ) : null}
          <input type="file" accept="image/*" onChange={onMainImageUpload} disabled={imageUploading} />
          <div style={{ marginTop: 6 }}>
            <input
              value={form.imageUrl}
              onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="또는 이미지 URL 직접 입력"
              style={{ width: "100%" }}
            />
          </div>
        </div>

        <div className="admin-modal-field">
          <label>상세 설명 이미지 (여러 장)</label>
          <input type="file" accept="image/*" multiple onChange={onDetailImagesUpload} disabled={imageUploading} />
          {form.detailImages?.length > 0 ? (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
              {form.detailImages.map((url, idx) => (
                <div key={idx} style={{ position: "relative" }}>
                  <img src={url} alt={`상세${idx + 1}`} style={{ width: 80, height: 80, objectFit: "cover", borderRadius: 6, border: "1px solid #ddd" }} />
                  <button
                    type="button"
                    onClick={() => onDetailImageRemove(idx)}
                    style={{ position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: "50%", border: 0, background: "#d33", color: "#fff", fontSize: 12, cursor: "pointer" }}
                    aria-label="제거"
                  >×</button>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="admin-modal-field">
          <label>정렬 순서 (작을수록 앞에)</label>
          <input type="number" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: e.target.value })} />
        </div>

        {imageUploading ? <p className="admin-detail-note">이미지 업로드 중...</p> : null}

        <div className="admin-modal-actions">
          <button className="admin-detail-btn" onClick={onSubmit} disabled={actionLoading || imageUploading}>{submitLabel}</button>
          <button className="admin-detail-btn secondary" onClick={onClose} disabled={actionLoading}>취소</button>
        </div>
      </div>
    </div>
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

  const { page, setPage, totalPages, paged: pagedOrders } = usePagination(filteredOrders, 15);
  useEffect(() => { setPage(1); }, [search, statusFilter, setPage]);

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
              {pagedOrders.map((order) => (
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
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
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
  useRequireRole("HQ_ADMIN");
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
