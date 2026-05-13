import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { apiGet, apiPost } from "../utils/api";
import { requestTossPayment } from "../utils/tossPayment";
import SiteFooter from "../components/SiteFooter";
import "../styles/commerce.css";

const AMOUNT_PRESETS = [
  { won: 5000, grapefruits: 20 },
  { won: 10000, grapefruits: 40 },
  { won: 20000, grapefruits: 80 },
  { won: 50000, grapefruits: 200 },
  { won: 100000, grapefruits: 400 },
];

/**
 * 학부모 → 자녀 자몽 충전 페이지.
 * studentId query 또는 첫 active link 의 자녀 자동 선택.
 * 1자몽 = 250원 (개인 단가). 자녀 잔액에 즉시 충전.
 */
export default function ChildGrapefruitPage() {
  const [params] = useSearchParams();
  const queryStudentId = params.get("studentId");

  const [children, setChildren] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [amountWon, setAmountWon] = useState(10000);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet("/v1/parents/links")
      .then((data) => {
        const active = (data || []).filter((l) => l.status === "active");
        setChildren(active);
        if (queryStudentId && active.some((c) => c.studentUserId === queryStudentId)) {
          setSelectedId(queryStudentId);
        } else if (active.length > 0) {
          setSelectedId(active[0].studentUserId);
        }
      })
      .catch(() => setChildren([]));
  }, [queryStudentId]);

  const selectedChild = children.find((c) => c.studentUserId === selectedId);
  const grapefruits = Math.floor(amountWon / 250);

  const handleCharge = async () => {
    if (!selectedId) {
      setError("자녀를 선택해 주세요.");
      return;
    }
    if (amountWon < 1000) {
      setError("최소 충전 금액은 1,000원입니다.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      const prepare = await apiPost("/v1/payments/prepare/grapefruit-child", {
        studentUserId: selectedId,
        amountWon,
      });
      await requestTossPayment({
        clientKey: prepare.clientKey,
        customerKey: prepare.customerKey,
        method: "CARD",
        amount: prepare.amount,
        orderId: prepare.tossOrderId,
        orderName: prepare.orderName,
        customerName: prepare.customerName,
        customerEmail: prepare.customerEmail,
        customerMobilePhone: prepare.customerMobilePhone,
      });
    } catch (e) {
      if (e?.code !== "USER_CANCEL") {
        setError(e?.message || "결제에 실패했습니다.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div className="payment-page" style={{ flex: 1 }}>
        <div className="payment-card" style={{ maxWidth: 640 }}>
          <h1>🍊 자녀 자몽 충전</h1>
          <p style={{ color: "#666", fontSize: 14, marginTop: -8 }}>
            1자몽 = 250원. 자녀의 자몽 지갑에 즉시 충전됩니다.
          </p>

          {children.length === 0 ? (
            <div style={emptyBoxStyle}>
              <p>연결된 자녀가 없습니다. 먼저 자녀를 연결해 주세요.</p>
              <Link to="/parents/links" className="commerce-btn" style={{ marginTop: 12 }}>
                자녀 연결 관리
              </Link>
            </div>
          ) : (
            <>
              <div style={{ marginTop: 16 }}>
                <label style={labelStyle}>자녀 선택</label>
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  style={selectStyle}
                  disabled={submitting}
                >
                  {children.map((c) => (
                    <option key={c.studentUserId} value={c.studentUserId}>
                      {c.studentName || c.studentLoginId} ({c.studentLoginId})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginTop: 20 }}>
                <label style={labelStyle}>충전 금액</label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 8, marginTop: 8 }}>
                  {AMOUNT_PRESETS.map((p) => (
                    <button
                      key={p.won}
                      type="button"
                      onClick={() => setAmountWon(p.won)}
                      disabled={submitting}
                      style={presetStyle(amountWon === p.won)}
                    >
                      <span style={{ fontSize: 15, fontWeight: 700 }}>{p.won.toLocaleString()}원</span>
                      <span style={{ fontSize: 12, color: "#666" }}>🍊 {p.grapefruits}개</span>
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  value={amountWon}
                  onChange={(e) => setAmountWon(Number(e.target.value) || 0)}
                  placeholder="직접 입력 (원)"
                  min={1000}
                  step={1000}
                  disabled={submitting}
                  style={{ ...selectStyle, marginTop: 8 }}
                />
                <p style={{ fontSize: 13, color: "#666", marginTop: 6 }}>
                  자녀가 받을 자몽: <strong style={{ color: "#f06c24" }}>{grapefruits}개</strong>
                </p>
              </div>

              {error && <p style={{ color: "#c0392b", fontSize: 13, marginTop: 12 }}>{error}</p>}

              <button
                type="button"
                className="commerce-btn"
                onClick={handleCharge}
                disabled={submitting || !selectedId}
                style={{ width: "100%", marginTop: 20 }}
              >
                {submitting ? "결제 진행 중..." : `${selectedChild?.studentName || "자녀"}에게 ${amountWon.toLocaleString()}원 충전하기`}
              </button>

              <div style={{ marginTop: 16, fontSize: 12, color: "#999" }}>
                <Link to="/parent-home" style={{ color: "#f06c24" }}>← 학부모 홈으로</Link>
              </div>
            </>
          )}
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}

const labelStyle = { display: "block", fontSize: 13, fontWeight: 600, color: "#555", marginBottom: 4 };
const selectStyle = {
  width: "100%", padding: "10px 12px", fontSize: 14,
  border: "1px solid #ddd", borderRadius: 8, background: "#fff",
};
const presetStyle = (selected) => ({
  display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
  padding: "12px 8px",
  border: selected ? "2px solid #f06c24" : "1px solid #ddd",
  borderRadius: 10,
  background: selected ? "#fff5ee" : "#fff",
  cursor: "pointer",
  transition: "all 120ms ease",
});
const emptyBoxStyle = {
  marginTop: 16, padding: 24,
  background: "#fafafa", border: "1px dashed #ddd",
  borderRadius: 10, textAlign: "center",
};
