import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAdminList } from "../hooks/useAdminList";
import "../styles/admin-detail.css";

const PRODUCTS = [
  { title: "국어농장 1단계 교재", category: "교재", stock: 120, status: "active" },
  { title: "국어농장 학습 카드", category: "교구", stock: 60, status: "active" },
  { title: "독해 심화 워크북", category: "교재", stock: 0, status: "sold_out" },
];

const mapProducts = (items) =>
  items.map((item) => ({
    title: item.title,
    category: item.category || "-",
    stock: item.stock ?? 0,
    status: item.status || "active",
  }));

function AdminShopProductsPage() {
  const { data: products, loading, error } = useAdminList(
    "/v1/admin/shop/products",
    PRODUCTS,
    mapProducts
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter((product) => {
      if (statusFilter !== "all" && product.status !== statusFilter) {
        return false;
      }
      if (!term) {
        return true;
      }
      return [product.title, product.category, product.status]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term));
    });
  }, [products, search, statusFilter]);

  return (
    <div className="admin-detail-page">
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>상품 관리</h1>
          <div className="admin-detail-actions">
            <button className="admin-detail-btn" type="button">
              상품 등록
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
            <h2>상품 목록</h2>
            <div className="admin-detail-toolbar">
              <div className="admin-detail-search">
                <span className="material-symbols-outlined">search</span>
                <input
                  placeholder="상품 검색"
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
                  className={`admin-filter ${statusFilter === "active" ? "active" : ""}`}
                  type="button"
                  onClick={() => setStatusFilter("active")}
                >
                  판매중
                </button>
                <button
                  className={`admin-filter ${statusFilter === "sold_out" ? "active" : ""}`}
                  type="button"
                  onClick={() => setStatusFilter("sold_out")}
                >
                  품절
                </button>
              </div>
            </div>
            {loading ? <p className="admin-detail-note">상품을 불러오는 중...</p> : null}
            {error ? <p className="admin-detail-note error">{error}</p> : null}
            <table className="admin-detail-table">
              <thead>
                <tr>
                  <th>상품명</th>
                  <th>카테고리</th>
                  <th>재고</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.title}>
                    <td>{product.title}</td>
                    <td>{product.category}</td>
                    <td>{product.stock}</td>
                    <td>
                      <span className="status-pill" data-status={product.status}>
                        {product.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-detail-card">
            <h3>재고 요약</h3>
            <p>판매중 2개 · 품절 1개</p>
            <div className="admin-detail-tag">재입고 요청 1건</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminShopProductsPage;
