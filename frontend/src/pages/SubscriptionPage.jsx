import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPost } from "../utils/api";
import "../styles/commerce.css";

function formatDate(dt) {
  if (!dt) return "-";
  const d = new Date(dt);
  if (isNaN(d.getTime())) return "-";
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

function SubscriptionPage() {
  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet("/v1/subscription")
      .then(setSub)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const status = sub?.status || "none";
  const isActive = status === "active" || status === "canceled";

  const handleCancel = () => {
    if (!confirm("정말 구독을 해지하시겠습니까?")) return;
    apiPost("/v1/subscription/cancel")
      .then(() => apiGet("/v1/subscription").then(setSub))
      .catch(() => alert("해지에 실패했습니다."));
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
          <p>
            현재 상태: {statusLabel}
            {isActive && sub?.nextBillingAt && (
              <> / 다음 결제일 {formatDate(sub.nextBillingAt)}</>
            )}
            {isActive && sub?.endAt && (
              <> / 만료일 {formatDate(sub.endAt)}</>
            )}
          </p>
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
    </div>
  );
}

export default SubscriptionPage;
