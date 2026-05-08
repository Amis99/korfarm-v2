import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPost } from "../utils/api";
import { requestTossPayment } from "../utils/tossPayment";
import SiteFooter from "../components/SiteFooter";
import "../styles/commerce.css";

const PLANS = [
  { months: 1, price: 65000, discount: 0, label: "1개월" },
  { months: 3, price: 175500, discount: 10, label: "3개월" },
  { months: 6, price: 312000, discount: 20, label: "6개월" },
  { months: 12, price: 546000, discount: 30, label: "12개월" },
];

function formatDate(dt) {
  if (!dt) return "-";
  const d = new Date(dt);
  if (isNaN(d.getTime())) return "-";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function formatAmount(amount) {
  if (amount == null) return "-";
  return amount.toLocaleString() + "원";
}

function formatPaymentType(type) {
  if (type === "subscription") return "구독 결제";
  if (type === "shop") return "상품 구매";
  return type;
}

function formatPaymentStatus(status) {
  if (status === "paid") return "완료";
  if (status === "pending") return "대기중";
  if (status === "failed") return "실패";
  if (status === "refunded") return "환불";
  return status;
}

function SubscriptionPage() {
  const [sub, setSub] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState(1);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");
  const [showRefundPolicy, setShowRefundPolicy] = useState(false);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      apiGet("/v1/subscription").catch(() => null),
      apiGet("/v1/payments").catch(() => [])
    ])
      .then(([subData, paymentData]) => {
        setSub(subData);
        setPayments(paymentData || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const status = sub?.status || "none";
  const isActive = status === "active" || status === "canceled";
  const canSubscribe = !isActive;

  const handleCancel = () => {
    if (!confirm("정말 구독을 해지하시겠습니까?")) return;
    apiPost("/v1/subscription/cancel")
      .then(() => apiGet("/v1/subscription").then(setSub))
      .catch(() => alert("해지에 실패했습니다."));
  };

  const handleSubscribe = async () => {
    const plan = PLANS.find((p) => p.months === selectedPlan);
    if (!plan) return;
    setCheckoutLoading(true);
    setCheckoutError("");
    try {
      const prepareResult = await apiPost("/v1/payments/prepare/subscription", {
        months: plan.months,
      });
      await requestTossPayment({
        clientKey: prepareResult.clientKey,
        customerKey: prepareResult.customerKey,
        method: "CARD",
        amount: prepareResult.amount,
        orderId: prepareResult.tossOrderId,
        orderName: prepareResult.orderName,
        customerName: prepareResult.customerName,
        customerEmail: prepareResult.customerEmail,
        customerMobilePhone: prepareResult.customerMobilePhone,
      });
    } catch (e) {
      // 사용자가 결제창을 닫은 경우 등
      if (e.code !== "USER_CANCEL") {
        setCheckoutError(e.message || "결제에 실패했습니다.");
      }
    } finally {
      setCheckoutLoading(false);
    }
  };

  const statusLabel =
    status === "active" ? "구독 중" :
    status === "canceled" ? "해지 예정" :
    status === "expired" ? "만료됨" : "미구독";

  return (
    <div className="subscription-page">
      <div className="subscription-card">
        <h1>구독 관리</h1>
        {loading ? (
          <p>불러오는 중...</p>
        ) : (
          <>
            <div className="subscription-status">
              <span className={`subscription-badge ${status}`}>{statusLabel}</span>
            </div>

            {isActive && sub && (
              <div className="subscription-period">
                <h3>구독 기간</h3>
                <div className="subscription-period-grid">
                  <div className="subscription-period-item">
                    <span className="label">시작일</span>
                    <span className="value">{formatDate(sub.startAt)}</span>
                  </div>
                  <div className="subscription-period-item">
                    <span className="label">만료일</span>
                    <span className="value">{formatDate(sub.endAt)}</span>
                  </div>
                  {status === "active" && sub.nextBillingAt && (
                    <div className="subscription-period-item">
                      <span className="label">다음 결제일</span>
                      <span className="value">{formatDate(sub.nextBillingAt)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {canSubscribe && (
              <div className="subscription-plans">
                <h3>구독 플랜 선택</h3>
                <div className="subscription-plan-grid">
                  {PLANS.map((plan) => (
                    <button
                      key={plan.months}
                      type="button"
                      className={`subscription-plan-card${selectedPlan === plan.months ? " selected" : ""}`}
                      onClick={() => setSelectedPlan(plan.months)}
                    >
                      <span className="plan-label">{plan.label}</span>
                      <span className="plan-price">{plan.price.toLocaleString()}원</span>
                      {plan.discount > 0 && (
                        <span className="plan-discount">{plan.discount}% 할인</span>
                      )}
                      <span className="plan-monthly">
                        월 {Math.round(plan.price / plan.months).toLocaleString()}원
                      </span>
                    </button>
                  ))}
                </div>
                {checkoutError && (
                  <p style={{ color: "#e74c3c", fontSize: 14, marginTop: 12 }}>{checkoutError}</p>
                )}
                <button
                  className="commerce-btn"
                  type="button"
                  style={{ width: "100%", marginTop: 16 }}
                  onClick={handleSubscribe}
                  disabled={checkoutLoading}
                >
                  {checkoutLoading ? "결제 중..." : "구독하기"}
                </button>

                <div className="subscription-refund-policy">
                  <button
                    type="button"
                    className="refund-policy-toggle"
                    onClick={() => setShowRefundPolicy(!showRefundPolicy)}
                  >
                    환불 규정 {showRefundPolicy ? "▲" : "▼"}
                  </button>
                  {showRefundPolicy && (
                    <div className="refund-policy-content">
                      <p>해지 시 월 65,000원 기준으로 이용 기간만큼 차감 후 나머지 금액을 환불합니다.</p>
                      <p>예시: 3개월 플랜(175,500원) 구독 후 1개월 이용 시 → 175,500원 - 65,000원 = 110,500원 환불</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {payments.length > 0 && (
              <div className="payment-history">
                <h3>결제 내역</h3>
                <table className="payment-table">
                  <thead>
                    <tr>
                      <th>결제일</th>
                      <th>유형</th>
                      <th>금액</th>
                      <th>상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((p) => (
                      <tr key={p.paymentId}>
                        <td>{formatDate(p.createdAt)}</td>
                        <td>{formatPaymentType(p.paymentType)}</td>
                        <td>{formatAmount(p.amount)}</td>
                        <td>
                          <span className={`payment-status ${p.status}`}>
                            {formatPaymentStatus(p.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {payments.length === 0 && (
              <p className="no-payments">결제 내역이 없습니다.</p>
            )}
          </>
        )}
        <div style={{ display: "grid", gap: "10px", marginTop: "16px" }}>
          {isActive && status !== "canceled" && (
            <button className="commerce-btn" type="button" onClick={handleCancel}>
              구독 해지
            </button>
          )}
          <Link className="commerce-btn" to="/shop">
            쇼핑몰 이동
          </Link>
          <Link className="commerce-btn" to="/start">
            홈으로 이동
          </Link>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

export default SubscriptionPage;
