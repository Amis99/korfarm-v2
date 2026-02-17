import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiGet } from "../utils/api";
import "../styles/commerce.css";

function PaymentResultPage() {
  const [params] = useSearchParams();
  const orderId = params.get("orderId");
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (orderId) {
      apiGet(`/v1/shop/orders/${orderId}`)
        .then(setOrder)
        .catch((e) => console.error(e));
    }
  }, [orderId]);

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
