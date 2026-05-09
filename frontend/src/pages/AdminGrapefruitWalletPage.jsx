import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { apiGetCamel } from "../utils/adminApi";
import { apiPost } from "../utils/api";
import { requestTossPayment } from "../utils/tossPayment";
import "../styles/admin.css";

const PRESET_AMOUNTS = [
  { won: 10000, grapefruits: 50, label: "1만원 — 50자몽" },
  { won: 30000, grapefruits: 150, label: "3만원 — 150자몽" },
  { won: 50000, grapefruits: 250, label: "5만원 — 250자몽" },
  { won: 100000, grapefruits: 500, label: "10만원 — 500자몽" },
  { won: 300000, grapefruits: 1500, label: "30만원 — 1500자몽" },
];

export default function AdminGrapefruitWalletPage() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");

  // 결제 모달
  const [showCharge, setShowCharge] = useState(false);
  const [chargeAmount, setChargeAmount] = useState(10000);
  const [customAmount, setCustomAmount] = useState("");
  const [chargeAgree, setChargeAgree] = useState(false);
  const [chargingPay, setChargingPay] = useState(false);
  const [chargeError, setChargeError] = useState("");

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const [w, tx, pr] = await Promise.all([
        apiGetCamel("/v1/admin/grapefruit/wallet/me").catch(() => null),
        apiGetCamel("/v1/admin/grapefruit/transactions/me").catch(() => []),
        apiGetCamel("/v1/admin/grapefruit/pricing").catch(() => []),
      ]);
      setWallet(w);
      setTransactions(Array.isArray(tx) ? tx : []);
      setPricing(Array.isArray(pr) ? pr : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { reload(); }, []);

  const openCharge = (won = 10000) => {
    setChargeAmount(won);
    setCustomAmount("");
    setChargeAgree(false);
    setChargeError("");
    setShowCharge(true);
  };

  const submitCharge = async () => {
    const amt = chargeAmount;
    if (!amt || amt < 200) {
      setChargeError("최소 200원 이상.");
      return;
    }
    if (amt % 200 !== 0) {
      setChargeError("200원 단위로 입력해주세요.");
      return;
    }
    if (!chargeAgree) {
      setChargeError("결제 진행에 동의해 주세요.");
      return;
    }
    setChargingPay(true);
    setChargeError("");
    try {
      const prep = await apiPost("/v1/payments/prepare/org-grapefruit", {
        amountWon: amt,
      });
      await requestTossPayment({
        clientKey: prep.clientKey,
        customerKey: prep.customerKey,
        method: "CARD",
        amount: prep.amount,
        orderId: prep.tossOrderId,
        orderName: prep.orderName,
        customerName: prep.customerName,
        customerEmail: prep.customerEmail,
        customerMobilePhone: prep.customerMobilePhone,
      });
    } catch (e) {
      if (e.code !== "USER_CANCEL") {
        setChargeError(e.message || "결제 요청에 실패했습니다.");
      }
    } finally {
      setChargingPay(false);
    }
  };

  const kindLabel = (kind) => {
    if (!kind) return "-";
    const p = pricing.find((x) => x.kind === kind);
    return p ? p.label : kind;
  };

  return (
    <AdminLayout>
      <div className="admin-detail-wrap" style={{ maxWidth: 960 }}>
        <h1 style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="material-symbols-outlined" style={{ color: "#f5b342" }}>nutrition</span>
          AI 자몽 지갑
        </h1>

        {error && <div style={{ padding: 10, background: "#fee", color: "#c00", borderRadius: 4, marginBottom: 12 }}>{error}</div>}
        {message && <div style={{ padding: 10, background: "#efe", color: "#2f7a3e", borderRadius: 4, marginBottom: 12 }}>{message}</div>}

        {/* 잔액 카드 */}
        <div style={{
          padding: 24,
          background: "linear-gradient(135deg, #fff5e6, #ffe9c2)",
          borderRadius: 12,
          marginBottom: 20,
          textAlign: "center",
        }}>
          <div style={{ fontSize: 14, color: "#888", marginBottom: 4 }}>현재 잔액</div>
          <div style={{ fontSize: 42, fontWeight: 700, color: "#a85c00" }}>
            {loading ? "..." : (wallet?.balance ?? 0).toLocaleString()} <span style={{ fontSize: 18 }}>자몽</span>
          </div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
            (약 {((wallet?.balance ?? 0) * 200).toLocaleString()}원 상당)
          </div>
        </div>

        {/* 충전 옵션 */}
        <h2 style={{ fontSize: 16, marginBottom: 4 }}>자몽 충전</h2>
        <p style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>1자몽 = 200원 (기관 단가) · 토스페이로 결제됩니다</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, marginBottom: 16 }}>
          {PRESET_AMOUNTS.map((p) => (
            <button
              key={p.won}
              type="button"
              onClick={() => openCharge(p.won)}
              style={{
                padding: 16,
                background: "#fff",
                border: "1px solid #ddd",
                borderRadius: 8,
                cursor: "pointer",
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* 직접 입력 */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
          <input
            type="number"
            min="200"
            step="200"
            placeholder="원하는 금액 (200원 단위)"
            value={customAmount}
            onChange={(e) => setCustomAmount(e.target.value)}
            style={{ flex: 1, padding: 10, border: "1px solid #ccc", borderRadius: 4 }}
          />
          <button
            type="button"
            onClick={() => {
              const amt = parseInt(customAmount, 10);
              if (!amt || amt < 200) { setError("최소 200원 이상."); return; }
              openCharge(amt);
            }}
            disabled={!customAmount}
            style={{
              padding: "10px 20px",
              background: customAmount ? "#2f7a3e" : "#ccc",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: customAmount ? "pointer" : "not-allowed",
              fontWeight: 600,
            }}
          >
            결제하기
          </button>
        </div>

        <p style={{ fontSize: 11, color: "#999", marginBottom: 16 }}>
          ※ 토스페이로 결제됩니다. 결제 완료 시 자동으로 잔액이 충전됩니다.
          {" · "}
          <Link to="/refund-policy" style={{ color: "#999" }}>환불규정</Link>
          {" · "}
          <Link to="/terms" style={{ color: "#999" }}>이용약관</Link>
        </p>

        {/* 거래 이력 */}
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>최근 거래 이력</h2>
        {transactions.length === 0 ? (
          <p style={{ color: "#888", fontSize: 13 }}>거래 이력 없음</p>
        ) : (
          <table className="admin-detail-table" style={{ width: "100%", fontSize: 13 }}>
            <thead>
              <tr>
                <th>날짜</th>
                <th>구분</th>
                <th>내용</th>
                <th style={{ textAlign: "right" }}>변동</th>
                <th style={{ textAlign: "right" }}>잔액</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td style={{ fontSize: 11 }}>{t.createdAt?.slice(0, 16).replace("T", " ")}</td>
                  <td>
                    <span style={{
                      display: "inline-block",
                      padding: "1px 6px",
                      background: t.direction === "charge" ? "#e1f0e3" : "#fde7e7",
                      color: t.direction === "charge" ? "#2f7a3e" : "#c00",
                      borderRadius: 3,
                      fontSize: 11,
                      fontWeight: 600,
                    }}>
                      {t.direction === "charge" ? "충전" : "사용"}
                    </span>
                  </td>
                  <td>
                    {t.direction === "charge"
                      ? `${t.amountWon ? t.amountWon.toLocaleString() + "원" : ""} ${t.memo || ""}`.trim()
                      : kindLabel(t.kind)}
                  </td>
                  <td style={{ textAlign: "right", fontWeight: 600, color: t.direction === "charge" ? "#2f7a3e" : "#c00" }}>
                    {t.direction === "charge" ? "+" : "-"}{t.amount}
                  </td>
                  <td style={{ textAlign: "right" }}>{t.balanceAfter}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* 결제 모달 */}
      {showCharge && (
        <div
          role="dialog"
          aria-label="기관 자몽 충전"
          onClick={() => !chargingPay && setShowCharge(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9000,
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: 14,
              padding: "20px 22px",
              width: "min(440px, 100%)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.18)",
            }}
          >
            <h2 style={{ margin: "0 0 14px", fontSize: 18 }}>🍊 기관 자몽 충전</h2>
            <p style={{ fontSize: 13, color: "#555", margin: "0 0 14px" }}>
              1자몽 = 200원 · AI 운영자 에이전트·문항 자동 생성·OCR 등 기관 AI 기능에 사용됩니다.
            </p>
            <div style={{ display: "grid", gap: 8 }}>
              {PRESET_AMOUNTS.map((p) => (
                <button
                  key={p.won}
                  type="button"
                  onClick={() => setChargeAmount(p.won)}
                  disabled={chargingPay}
                  style={{
                    padding: "12px 14px",
                    border: chargeAmount === p.won ? "2px solid #f06c24" : "1px solid #ddd",
                    background: chargeAmount === p.won ? "#fff5ee" : "#fff",
                    borderRadius: 10,
                    textAlign: "left",
                    cursor: chargingPay ? "not-allowed" : "pointer",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <span><strong style={{ fontSize: 15 }}>{p.won.toLocaleString()}원</strong></span>
                  <span style={{ color: "#f06c24", fontWeight: 700 }}>+{p.grapefruits}자몽</span>
                </button>
              ))}
            </div>

            <div style={{
              marginTop: 14,
              padding: 12,
              background: "#fafafa",
              borderRadius: 8,
              fontSize: 13,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span>상품명</span>
                <strong>기관 자몽 {Math.floor(chargeAmount / 200)}개 충전</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>결제 금액</span>
                <strong style={{ color: "#f06c24" }}>{chargeAmount.toLocaleString()}원</strong>
              </div>
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14, fontSize: 13 }}>
              <input
                type="checkbox"
                checked={chargeAgree}
                onChange={(e) => setChargeAgree(e.target.checked)}
                disabled={chargingPay}
                style={{ width: 18, height: 18, accentColor: "#f06c24", cursor: chargingPay ? "not-allowed" : "pointer", flexShrink: 0 }}
              />
              <span>
                <Link to="/refund-policy" target="_blank" style={{ color: "#f06c24" }}>환불규정</Link>
                {" 및 "}
                <Link to="/terms" target="_blank" style={{ color: "#f06c24" }}>이용약관</Link>
                {"에 동의하고 결제를 진행합니다."}
              </span>
            </label>

            {chargeError && (
              <p style={{ color: "#d33", fontSize: 12, marginTop: 10 }}>{chargeError}</p>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
              <button
                type="button"
                onClick={() => setShowCharge(false)}
                disabled={chargingPay}
                style={{
                  flex: 1,
                  padding: "12px 14px",
                  border: "1px solid #ddd",
                  background: "#fff",
                  borderRadius: 10,
                  cursor: chargingPay ? "not-allowed" : "pointer",
                }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={submitCharge}
                disabled={chargingPay || !chargeAgree}
                style={{
                  flex: 1.5,
                  padding: "12px 14px",
                  border: "none",
                  background: chargeAgree ? "#f06c24" : "#ccc",
                  color: "#fff",
                  fontWeight: 700,
                  borderRadius: 10,
                  cursor: chargingPay || !chargeAgree ? "not-allowed" : "pointer",
                }}
              >
                {chargingPay ? "처리 중..." : "결제하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
