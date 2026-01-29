import { Link } from "react-router-dom";
import "../styles/commerce.css";

function PaymentResultPage() {
  return (
    <div className="payment-page">
      <div className="payment-card">
        <span className="material-symbols-outlined" style={{ fontSize: "48px" }}>
          check_circle
        </span>
        <h1>결제가 완료되었습니다</h1>
        <p>주문 번호: ORD-20260124-001</p>
        <p>배송은 결제 완료 후 2~3일 내 시작됩니다.</p>
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
