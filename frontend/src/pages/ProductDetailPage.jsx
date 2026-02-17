import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { SHOP_CATEGORIES, SHOP_PRODUCTS } from "../data/shopCatalog";
import { apiPost } from "../utils/api";
import "../styles/commerce.css";

const formatPrice = (value) =>
  `${new Intl.NumberFormat("ko-KR").format(value)}원`;

function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [ordering, setOrdering] = useState(false);
  const [error, setError] = useState("");

  const product = SHOP_PRODUCTS.find((item) => item.id === productId);
  const categoryLabel = SHOP_CATEGORIES.find(
    (item) => item.id === product?.category
  )?.label;

  const handleBuyNow = async () => {
    setOrdering(true);
    setError("");
    try {
      const data = await apiPost("/v1/shop/orders", {
        items: [{ productId: product.id, quantity: 1 }],
        address: {},
      });
      const orderId = data.orderId || data.id;
      navigate(`/payment/result?orderId=${orderId}`);
    } catch (e) {
      setError(e.message || "주문에 실패했습니다.");
    } finally {
      setOrdering(false);
    }
  };

  if (!product) {
    return (
      <div className="commerce-page">
        <div className="commerce-wrap commerce-detail">
          <div className="commerce-card">
            <h1>상품을 찾을 수 없습니다.</h1>
            <p>선택하신 상품이 존재하지 않습니다.</p>
            <Link className="commerce-btn" to="/shop">
              쇼핑몰로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="commerce-page">
      <div className="commerce-wrap commerce-detail">
        <img src={product.image} alt={product.name} />
        <div className="commerce-card commerce-summary">
          <div className="commerce-meta">
            {categoryLabel && (
              <span className="commerce-tag">{categoryLabel}</span>
            )}
            {product.badge && (
              <span className="commerce-tag accent">{product.badge}</span>
            )}
          </div>
          <h1>{product.name}</h1>
          <p>상품 코드: {product.id}</p>
          <p className="commerce-price">{formatPrice(product.price)}</p>
          <ul>
            {product.details.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {error && <p style={{ color: "#e74c3c", fontSize: 14 }}>{error}</p>}
          <div className="commerce-summary-actions">
            <button
              className="commerce-btn"
              type="button"
              onClick={handleBuyNow}
              disabled={ordering}
            >
              {ordering ? "주문 중..." : "바로 구매"}
            </button>
            <Link className="commerce-btn ghost" to="/shop">
              목록으로
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailPage;
