import { useEffect, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { SHOP_CATEGORIES } from "../data/shopCatalog";
import { apiGet, apiPost } from "../utils/api";
import { requestTossPayment } from "../utils/tossPayment";
import { useAuth } from "../hooks/useAuth";
import SiteFooter from "../components/SiteFooter";
import "../styles/commerce.css";

function mapServerProduct(p) {
  return {
    id: p.productId || p.id || p.product_id,
    name: p.name,
    category: p.category || "textbook",
    level: p.levelLabel || p.level_label || "",
    price: p.price ?? 0,
    badge: p.badge || "",
    summary: p.summary || "",
    image: p.imageUrl || p.image_url || "",
    detailImages: p.detailImages || p.detail_images || [],
    tags: p.tags || [],
    details: p.details || [],
    stock: p.stock ?? 0,
    status: p.status || "active",
  };
}

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
  const [product, setProduct] = useState(null);
  const [productLoading, setProductLoading] = useState(true);

  const categoryLabel = SHOP_CATEGORIES.find(
    (item) => item.id === product?.category
  )?.label;

  // DB 에서 상품 fetch
  useEffect(() => {
    setProductLoading(true);
    apiGet(`/v1/shop/products/${productId}`)
      .then((d) => setProduct(d ? mapServerProduct(d) : null))
      .catch(() => setProduct(null))
      .finally(() => setProductLoading(false));
  }, [productId]);

  useEffect(() => {
    if (!isLoggedIn) return;
    setAddressLoading(true);
    apiGet("/v1/auth/me")
      .then((d) => {
        // 백엔드 UserEntity 의 평면 5개 컬럼: shippingName/shippingPhone/shippingZipCode/shippingAddress/shippingAddressDetail
        if (d?.shippingName && d?.shippingAddress) {
          setAddress({
            recipientName: d.shippingName,
            phone: d.shippingPhone || "",
            zipCode: d.shippingZipCode || "",
            address: d.shippingAddress,
            addressDetail: d.shippingAddressDetail || "",
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
    if (!address || !address.address || !address.recipientName) {
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
        customerKey: prepareResult.customerKey,
        method: "CARD",
        amount: prepareResult.amount,
        orderId: prepareResult.tossOrderId,
        orderName: prepareResult.orderName,
        customerName: prepareResult.customerName || address.recipientName,
        customerEmail: prepareResult.customerEmail,
        customerMobilePhone: (prepareResult.customerMobilePhone || address.phone || "").replace(/-/g, ""),
      });
    } catch (e) {
      if (e.code !== "USER_CANCEL") {
        setError(e.message || "주문에 실패했습니다.");
      }
    } finally {
      setOrdering(false);
    }
  };

  if (productLoading) {
    return (
      <div className="commerce-page">
        <div className="commerce-wrap commerce-detail">
          <div className="commerce-card"><p>상품 정보를 불러오는 중...</p></div>
        </div>
        <SiteFooter />
      </div>
    );
  }

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
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="commerce-page">
      <div className="commerce-wrap commerce-detail">
        {product.image ? <img src={product.image} alt={product.name} /> : <div style={{ width: "100%", aspectRatio: "1", background: "#f4eee0", borderRadius: 12 }} />}
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
          {product.summary && <p style={{ color: "#555", marginBottom: 8 }}>{product.summary}</p>}
          <p className="commerce-price">{formatPrice(product.price)}</p>
          {product.details && product.details.length > 0 && (
            <ul>
              {product.details.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          )}
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
          <p style={{ fontSize: 11, color: "#888", marginTop: 12, textAlign: "center" }}>
            <Link to="/refund-policy" style={{ color: "#888" }}>환불규정</Link>
            {" · "}
            <Link to="/terms" style={{ color: "#888" }}>이용약관</Link>
            {" · "}
            <Link to="/privacy" style={{ color: "#888" }}>개인정보처리방침</Link>
          </p>
        </div>
      </div>

      {product.detailImages && product.detailImages.length > 0 && (
        <div className="commerce-wrap" style={{ marginTop: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 12 }}>상세 설명</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {product.detailImages.map((url, i) => (
              <img key={i} src={url} alt={`상세${i + 1}`} style={{ width: "100%", borderRadius: 12 }} />
            ))}
          </div>
        </div>
      )}

      <SiteFooter />
    </div>
  );
}

export default ProductDetailPage;
