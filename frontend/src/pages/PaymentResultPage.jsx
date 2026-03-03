import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiGet } from "../utils/api";
import "../styles/commerce.css";

function PaymentResultPage() {
  const [params] = useSearchParams();
  const orderId = params.get("orderId");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchOrder = () => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    apiGet(`/v1/shop/orders/${orderId}`)
      .then(setOrder)
      .catch(() => setError("주문 정보를 불러올 수 없습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchOrder(); }, [orderId]);

  if (!orderId) {
    return (
      <div className="payment-page">
        <div className="payment-card">
          <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "#e74c3c" }}>
            error
          </span>
          <h1>잘못된 접근입니다</h1>
          <p>주문 정보가 없습니다.</p>
          <div style={{ display: "grid", gap: "10px", marginTop: "16px" }}>
            <Link className="commerce-btn" to="/shop">
              쇼핑몰로 이동
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="payment-page">
        <div className="payment-card">
          <p>주문 정보를 확인하는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-page">
        <div className="payment-card">
          <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "#e74c3c" }}>
            warning
          </span>
          <h1>오류 발생</h1>
          <p>{error}</p>
          <div style={{ display: "grid", gap: "10px", marginTop: "16px" }}>
            <button className="commerce-btn" type="button" onClick={fetchOrder}>
              다시 시도
            </button>
            <Link className="commerce-btn" to="/shop">
              쇼핑몰로 이동
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-page">
      <div className="payment-card">
        <span className="material-symbols-outlined" style={{ fontSize: "48px" }}>
          check_circle
        </span>
        <h1>주문이 완료되었습니다</h1>
        <p>주문 번호: {order?.orderId || orderId || "-"}</p>
        {order?.totalAmount != null && (
          <p>결제 금액: {new Intl.NumberFormat("ko-KR").format(order.totalAmount)}원</p>
        )}
        <p>배송은 주문 확인 후 2~3일 내 시작됩니다.</p>
        <div style={{ display: "grid", gap: "10px", marginTop: "16px" }}>
          <Link className="commerce-btn" to="/shop">
            쇼핑몰 계속하기
          </Link>
          <Link className="commerce-btn" to="/subscription">
            구독 관리
          </Link>
          <Link className="commerce-btn" to="/start">
            스타트로 이동
          </Link>
        </div>
      </div>
    </div>
  );
}

export default PaymentResultPage;
