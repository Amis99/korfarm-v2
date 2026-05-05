import { Link, useSearchParams } from "react-router-dom";
import SiteFooter from "../components/SiteFooter";
import "../styles/commerce.css";

function PaymentFailPage() {
  const [params] = useSearchParams();
  const code = params.get("code") || "";
  const message = params.get("message") || "결제가 취소되었거나 실패했습니다.";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div className="payment-page" style={{ flex: 1 }}>
        <div className="payment-card">
        <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "#e74c3c" }}>
          cancel
        </span>
        <h1>결제 실패</h1>
        <p>{message}</p>
        {code && <p style={{ fontSize: 13, color: "#999" }}>오류 코드: {code}</p>}
        <div style={{ display: "grid", gap: "10px", marginTop: "16px" }}>
          <Link className="commerce-btn" to="/subscription">
            구독 관리
          </Link>
          <Link className="commerce-btn" to="/shop">
            쇼핑몰
          </Link>
          <Link className="commerce-btn" to="/start">
            홈으로
          </Link>
        </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

export default PaymentFailPage;
