import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiPost } from "../utils/api";
import SiteFooter from "../components/SiteFooter";
import "../styles/commerce.css";

function PaymentSuccessPage() {
  const [params] = useSearchParams();
  const paymentKey = params.get("paymentKey");
  const orderId = params.get("orderId");
  const amount = Number(params.get("amount"));

  const [status, setStatus] = useState("loading");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!paymentKey || !orderId || !amount) {
      setStatus("error");
      setError("결제 정보가 올바르지 않습니다.");
      return;
    }
    apiPost("/v1/payments/confirm", { paymentKey, orderId, amount })
      .then((data) => {
        setResult(data);
        setStatus("success");
      })
      .catch((e) => {
        setError(e.message || "결제 승인에 실패했습니다.");
        setStatus("error");
      });
  }, [paymentKey, orderId, amount]);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div className="payment-page" style={{ flex: 1 }}>
        <div className="payment-card">
          {status === "loading" && (
            <p>결제를 확인하고 있습니다...</p>
          )}
          {status === "error" && (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "#e74c3c" }}>error</span>
              <h1>결제 승인 실패</h1>
              <p>{error}</p>
              <div style={{ display: "grid", gap: "10px", marginTop: "16px" }}>
                <Link className="commerce-btn" to="/subscription">구독 관리</Link>
                <Link className="commerce-btn" to="/shop">쇼핑몰</Link>
                <Link className="commerce-btn" to="/start">홈으로</Link>
              </div>
            </>
          )}
          {status === "success" && (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: "48px", color: "#4e8a60" }}>check_circle</span>
              <h1>결제가 완료되었습니다</h1>
              <p>결제 번호: {result?.paymentId || "-"}</p>
              {result?.receiptUrl && (
                <p>
                  <a href={result.receiptUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#f06c24" }}>
                    영수증 보기
                  </a>
                </p>
              )}
              <div style={{ display: "grid", gap: "10px", marginTop: "16px" }}>
                <Link className="commerce-btn" to="/subscription">구독 관리</Link>
                <Link className="commerce-btn" to="/shop">쇼핑몰</Link>
                <Link className="commerce-btn" to="/start">홈으로</Link>
              </div>
            </>
          )}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

export default PaymentSuccessPage;
