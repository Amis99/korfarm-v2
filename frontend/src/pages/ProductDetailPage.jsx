import { Link, useParams } from "react-router-dom";
import { SHOP_CATEGORIES, SHOP_PRODUCTS } from "../data/shopCatalog";
import "../styles/commerce.css";

const formatPrice = (value) =>
  `${new Intl.NumberFormat("ko-KR").format(value)}원`;

function ProductDetailPage() {
  const { productId } = useParams();
  const product = SHOP_PRODUCTS.find((item) => item.id === productId);
  const categoryLabel = SHOP_CATEGORIES.find(
    (item) => item.id === product?.category
  )?.label;

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
          <div className="commerce-summary-actions">
            <button className="commerce-btn" type="button">
              장바구니 담기
            </button>
            <Link className="commerce-btn" to="/payment/result">
              바로 구매
            </Link>
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
