import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiPost } from "../utils/api";
import SiteFooter from "../components/SiteFooter";
import "../styles/commerce.css";

// paymentType 별 안내 분기 — 백엔드 PaymentConfirmResult.paymentType 에 맞춰서
function successHeading(t) {
  switch (t) {
    case "subscription": return "구독 결제가 완료되었습니다";
    case "shop": return "주문이 접수되었습니다";
    case "grapefruit": return "자몽 충전이 완료되었습니다";
    case "org_grapefruit": return "기관 자몽 충전이 완료되었습니다";
    case "org_billing": return "월 사용료 결제가 완료되었습니다";
    default: return "결제가 완료되었습니다";
  }
}
function successSubtext(t, amount) {
  const won = amount ? amount.toLocaleString() + "원" : "";
  switch (t) {
    case "subscription": return `${won} 결제 — 구독이 즉시 활성화됩니다.`;
    case "shop": return `${won} 결제 — 배송 시작 시 별도 안내드립니다.`;
    case "grapefruit": return `${won} 결제 — 1자몽=250원 환산되어 즉시 충전됩니다.`;
    case "org_grapefruit": return `${won} 결제 — 1자몽=200원 환산되어 본 기관 잔액에 반영됩니다.`;
    case "org_billing": return `${won} 결제 — 본 기관의 운영 정지가 즉시 해제됩니다.`;
    default: return won ? `${won} 결제가 정상 처리되었습니다.` : "결제가 정상 처리되었습니다.";
  }
}
function successButtons(t) {
  switch (t) {
    case "subscription":
      return [{ to: "/subscription", label: "구독 관리" }, { to: "/start", label: "학습 시작" }];
    case "shop":
      return [{ to: "/orders", label: "주문 내역" }, { to: "/shop", label: "쇼핑몰" }, { to: "/start", label: "홈으로" }];
    case "grapefruit":
      return [{ to: "/my/grapefruit", label: "자몽 지갑" }, { to: "/my/tutor", label: "AI 튜터로 사용" }, { to: "/start", label: "홈으로" }];
    case "org_grapefruit":
      return [{ to: "/admin/grapefruit-wallet", label: "자몽 지갑" }, { to: "/admin", label: "관리자 홈" }];
    case "org_billing":
      return [{ to: "/admin/billing", label: "청구 내역" }, { to: "/admin", label: "관리자 홈" }];
    default:
      return [{ to: "/start", label: "홈으로" }];
  }
}

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
              <h1>{successHeading(result?.paymentType)}</h1>
              <p>{successSubtext(result?.paymentType, result?.amount)}</p>
              <p style={{ fontSize: 12, color: "#888" }}>결제 번호: {result?.paymentId || "-"}</p>
              {result?.receiptUrl && (
                <p>
                  <a href={result.receiptUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#f06c24" }}>
                    영수증 보기
                  </a>
                </p>
              )}
              <div style={{ display: "grid", gap: "10px", marginTop: "16px" }}>
                {successButtons(result?.paymentType).map((b) => (
                  <Link key={b.to} className="commerce-btn" to={b.to}>{b.label}</Link>
                ))}
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
