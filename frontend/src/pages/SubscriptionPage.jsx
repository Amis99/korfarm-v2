import { Link } from "react-router-dom";
import "../styles/commerce.css";

function SubscriptionPage() {
  return (
    <div className="subscription-page">
      <div className="subscription-card">
        <h1>구독 관리</h1>
        <p>현재 구독: Pro / 다음 결제일 2026.02.01</p>
        <div style={{ display: "grid", gap: "10px", marginTop: "16px" }}>
          <button className="commerce-btn" type="button">
            구독 변경
          </button>
          <button className="commerce-btn" type="button">
            구독 해지
          </button>
          <Link className="commerce-btn" to="/shop">
            쇼핑몰 이동
          </Link>
          <Link className="commerce-btn" to="/start">
            스타트로 이동
          </Link>
        </div>
      </div>
    </div>
  );
}

export default SubscriptionPage;
