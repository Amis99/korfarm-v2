import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { apiGetCamel, apiPostDeep } from "../utils/adminApi";
import "../styles/admin.css";

const PRESET_AMOUNTS = [
  { won: 10000, grapefruits: 50, label: "1만원 — 50자몽" },
  { won: 30000, grapefruits: 150, label: "3만원 — 150자몽" },
  { won: 50000, grapefruits: 250, label: "5만원 — 250자몽" },
  { won: 100000, grapefruits: 500, label: "10만원 — 500자몽" },
  { won: 300000, grapefruits: 1500, label: "30만원 — 1500자몽" },
];

const KIND_LABELS = {}; // 단가 페이지에서 가져와 채움

export default function AdminGrapefruitWalletPage() {
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chargingAmount, setChargingAmount] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [customAmount, setCustomAmount] = useState("");

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

  const handleCharge = async (amountWon) => {
    if (!amountWon || amountWon < 200) {
      setError("최소 200원 이상 충전 가능합니다.");
      return;
    }
    if (!confirm(`${amountWon.toLocaleString()}원을 충전하시겠습니까?\n(테스트 환경 — 실결제는 추후 토스페이 연동 예정)`)) return;
    setChargingAmount(amountWon);
    setError(null);
    setMessage("");
    try {
      await apiPostDeep("/v1/admin/grapefruit/wallet/me/charge", {
        amountWon,
        memo: "기관 충전",
      });
      setMessage(`${amountWon.toLocaleString()}원 충전 완료!`);
      setCustomAmount("");
      await reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setChargingAmount(null);
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
        <h2 style={{ fontSize: 16, marginBottom: 12 }}>자몽 충전</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, marginBottom: 16 }}>
          {PRESET_AMOUNTS.map((p) => (
            <button
              key={p.won}
              type="button"
              onClick={() => handleCharge(p.won)}
              disabled={chargingAmount !== null}
              style={{
                padding: 16,
                background: "#fff",
                border: "1px solid #ddd",
                borderRadius: 8,
                cursor: chargingAmount === p.won ? "wait" : "pointer",
                textAlign: "center",
                fontWeight: 600,
              }}
            >
              {chargingAmount === p.won ? "처리 중..." : p.label}
            </button>
          ))}
        </div>

        {/* 직접 입력 */}
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 32 }}>
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
            onClick={() => handleCharge(parseInt(customAmount, 10))}
            disabled={chargingAmount !== null || !customAmount}
            style={{
              padding: "10px 20px",
              background: "#2f7a3e",
              color: "#fff",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            충전
          </button>
        </div>

        <p style={{ fontSize: 11, color: "#999", marginBottom: 16 }}>
          ※ 현재는 테스트 환경입니다. 충전 시 실제 결제는 일어나지 않으며, 정식 토스페이 연동은 추후 적용됩니다.
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
    </AdminLayout>
  );
}
