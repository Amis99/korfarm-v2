import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { SHOP_CATEGORIES, SHOP_PRODUCTS } from "../data/shopCatalog";
import { apiGet, apiPost } from "../utils/api";
import { requestTossPayment } from "../utils/tossPayment";
import { useAuth } from "../hooks/useAuth";
import "../styles/commerce.css";

const formatPrice = (value) =>
  `${new Intl.NumberFormat("ko-KR").format(value)}원`;

function ProductDetailPage() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [ordering, setOrdering] = useState(false);
  const [error, setError] = useState("");
  const [address, setAddress] = useState(null);
  const [addressLoading, setAddressLoading] = useState(false);

  const product = SHOP_PRODUCTS.find((item) => item.id === productId);
  const categoryLabel = SHOP_CATEGORIES.find(
    (item) => item.id === product?.category
  )?.label;

  useEffect(() => {
    if (!isLoggedIn) return;
    setAddressLoading(true);
    apiGet("/v1/auth/me")
      .then((data) => {
        if (data.shippingAddress || data.shipping_address) {
          setAddress(data.shippingAddress || data.shipping_address);
        } else if (data.recipientName || data.recipient_name) {
          setAddress({
            recipientName: data.recipientName || data.recipient_name,
            phone: data.phone,
            zipCode: data.zipCode || data.zip_code,
            address: data.address,
            addressDetail: data.addressDetail || data.address_detail,
          });
        }
      })
      .catch(() => {})
      .finally(() => setAddressLoading(false));
  }, [isLoggedIn]);

  const handleBuyNow = async () => {
    if (!isLoggedIn) {
      setError("로그인 후 이용해주세요.");
      return;
    }
    if (!address || !address.address) {
      setError("쇼핑몰에서 배송지를 먼저 등록해주세요.");
      return;
    }
    setOrdering(true);
    setError("");
    try {
      const orderData = await apiPost("/v1/shop/orders", {
        items: [{ productId: product.id, quantity: 1 }],
        address: {
          recipientName: address.recipientName,
          phone: address.phone,
          zipCode: address.zipCode,
          address: address.address,
          addressDetail: address.addressDetail,
        },
      });
      const orderId = orderData.orderId || orderData.id;
      const prepareResult = await apiPost("/v1/payments/prepare/shop", { orderId });
      await requestTossPayment({
        clientKey: prepareResult.clientKey,
        method: "CARD",
        amount: prepareResult.amount,
        orderId: prepareResult.tossOrderId,
        orderName: prepareResult.orderName,
      });
    } catch (e) {
      if (e.code !== "USER_CANCEL") {
        setError(e.message || "주문에 실패했습니다.");
      }
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
          {!isLoggedIn && (
            <p style={{ color: "#e74c3c", fontSize: 14 }}>
              <Link to="/login" style={{ color: "#e74c3c", fontWeight: 600 }}>
                로그인
              </Link>
              {" 후 이용해주세요."}
            </p>
          )}
          {isLoggedIn && !addressLoading && !address && (
            <p style={{ color: "#e74c3c", fontSize: 14 }}>
              <Link to="/shop" style={{ color: "#e74c3c", fontWeight: 600 }}>
                쇼핑몰
              </Link>
              {"에서 배송지를 먼저 등록해주세요."}
            </p>
          )}
          {error && <p style={{ color: "#e74c3c", fontSize: 14 }}>{error}</p>}
          <div className="commerce-summary-actions">
            <button
              className="commerce-btn"
              type="button"
              onClick={handleBuyNow}
              disabled={ordering || !isLoggedIn}
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
