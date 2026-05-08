import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet, apiPost } from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import SiteFooter from "../components/SiteFooter";
import "../styles/admin.css";

const PRESET = [
  { won: 5000, grapefruits: 20, label: "5천원 — 20자몽" },
  { won: 10000, grapefruits: 40, label: "1만원 — 40자몽" },
  { won: 30000, grapefruits: 120, label: "3만원 — 120자몽" },
  { won: 50000, grapefruits: 200, label: "5만원 — 200자몽" },
];

const CROP_LABELS = {
  crop_wheat: "🌾 밀",
  crop_rice: "🍙 쌀",
  crop_corn: "🌽 옥수수",
  crop_grape: "🍇 포도",
  crop_apple: "🍎 사과",
};

// 학생(개인) 자몽 충전 + 작물 지갑 + 거래 이력
export default function MyGrapefruitPage() {
  const { user } = useAuth();
  const wisdomHref = user?.levelId ? `/writing/${user.levelId}` : null;
  const [balance, setBalance] = useState({ grapefruits: 0, crops: {} });
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [charging, setCharging] = useState(null);
  const [custom, setCustom] = useState("");
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const [b, tx] = await Promise.all([
        apiGet("/v1/me/grapefruit/balance"),
        apiGet("/v1/me/grapefruit/transactions").catch(() => []),
      ]);
      setBalance(b || { grapefruits: 0, crops: {} });
      setTransactions(Array.isArray(tx) ? tx : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { reload(); }, []);

  const handleCharge = async (amountWon) => {
    if (!amountWon || amountWon < 250) { setError("최소 250원 이상."); return; }
    if (!confirm(`${amountWon.toLocaleString()}원 충전하시겠습니까?\n(테스트 환경 — 실결제는 추후 토스페이 연동 예정)`)) return;
    setCharging(amountWon);
    setError(null); setMessage("");
    try {
      const res = await apiPost("/v1/me/grapefruit/charge", { amountWon });
      setMessage(`${amountWon.toLocaleString()}원 충전 완료! 잔액: ${res?.balance ?? "?"} 자몽`);
      setCustom("");
      await reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setCharging(null);
    }
  };

  const totalCrop = Object.values(balance.crops || {}).reduce((a, b) => a + (b || 0), 0);
  const aiTotal = balance.grapefruits + totalCrop;  // 모두 1:1 환산

  return (
    <div style={{ maxWidth: 760, margin: "0 auto", padding: 16 }}>
      <h1 style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 24 }}>🍊</span> 내 자몽 지갑
      </h1>
      <p style={{ color: "#666", fontSize: 13 }}>
        AI 첨삭·학습 생성에 사용할 수 있는 자몽을 충전하거나 학습으로 모은 작물을 사용할 수 있어요.
        작물은 사용해도 랭킹 점수에서 차감되지 않아요.
      </p>

      {error && <div style={{ padding: 10, background: "#fee", color: "#c00", borderRadius: 4, marginBottom: 12 }}>{error}</div>}
      {message && <div style={{ padding: 10, background: "#efe", color: "#2f7a3e", borderRadius: 4, marginBottom: 12 }}>{message}</div>}

      {/* 잔액 카드 */}
      <div style={{ padding: 24, background: "linear-gradient(135deg, #fff5e6, #ffe9c2)", borderRadius: 12, marginBottom: 16, textAlign: "center" }}>
        <div style={{ fontSize: 14, color: "#888" }}>AI 사용 가능 합계 (자몽 환산)</div>
        <div style={{ fontSize: 42, fontWeight: 700, color: "#a85c00" }}>{aiTotal.toLocaleString()}</div>
        <div style={{ display: "flex", justifyContent: "center", gap: 16, fontSize: 13, color: "#555", marginTop: 8 }}>
          <div>🍊 자몽 <strong>{balance.grapefruits}</strong></div>
          {Object.entries(balance.crops || {}).filter(([, v]) => v > 0).map(([k, v]) => (
            <div key={k}>{CROP_LABELS[k] || k} <strong>{v}</strong></div>
          ))}
        </div>
      </div>

      {/* 충전 옵션 */}
      <h2 style={{ fontSize: 16 }}>자몽 충전</h2>
      <p style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>1자몽 = 250원 (1만원 = 40자몽)</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 8, marginBottom: 12 }}>
        {PRESET.map((p) => (
          <button key={p.won} onClick={() => handleCharge(p.won)} disabled={charging !== null}
            style={{ padding: 14, background: "#fff", border: "1px solid #ddd", borderRadius: 8, cursor: "pointer", fontWeight: 600 }}>
            {charging === p.won ? "처리 중..." : p.label}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        <input type="number" min="250" step="250" placeholder="원하는 금액 (250원 단위)" value={custom} onChange={(e) => setCustom(e.target.value)}
          style={{ flex: 1, padding: 10, border: "1px solid #ccc", borderRadius: 4 }} />
        <button onClick={() => handleCharge(parseInt(custom, 10))} disabled={charging !== null || !custom}
          style={{ padding: "10px 20px", background: "#2f7a3e", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: 600 }}>
          충전
        </button>
      </div>

      <p style={{ fontSize: 11, color: "#999", marginBottom: 16 }}>
        ※ 테스트 환경 — 토스페이 연동은 추후 적용.
        {wisdomHref ? (
          <> <Link to={wisdomHref}>지식과 지혜</Link> 본인 글에서 AI 첨삭 가능.</>
        ) : (
          <> 지식과 지혜 본인 글에서 AI 첨삭 가능.</>
        )}
      </p>

      {/* 거래 이력 */}
      <h2 style={{ fontSize: 16, marginBottom: 8 }}>거래 이력</h2>
      {loading ? <p>불러오는 중...</p> : transactions.length === 0 ? (
        <p style={{ color: "#888", fontSize: 13 }}>거래 이력 없음</p>
      ) : (
        <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f5f5f5" }}>
              <th style={{ padding: 6, textAlign: "left" }}>날짜</th>
              <th style={{ padding: 6 }}>구분</th>
              <th style={{ padding: 6, textAlign: "left" }}>내용</th>
              <th style={{ padding: 6, textAlign: "right" }}>변동</th>
              <th style={{ padding: 6, textAlign: "right" }}>잔액</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t.id} style={{ borderBottom: "1px solid #eee" }}>
                <td style={{ padding: 6, fontSize: 11 }}>{t.createdAt?.slice(0, 16).replace("T", " ")}</td>
                <td style={{ padding: 6, textAlign: "center" }}>
                  <span style={{ padding: "1px 6px", background: t.direction === "charge" ? "#e1f0e3" : "#fde7e7", color: t.direction === "charge" ? "#2f7a3e" : "#c00", borderRadius: 3, fontSize: 11 }}>
                    {t.direction === "charge" ? "충전" : "사용"}
                  </span>
                </td>
                <td style={{ padding: 6 }}>{t.memo || t.kind || "-"}</td>
                <td style={{ padding: 6, textAlign: "right", fontWeight: 600, color: t.direction === "charge" ? "#2f7a3e" : "#c00" }}>
                  {t.direction === "charge" ? "+" : "-"}{t.amount}
                </td>
                <td style={{ padding: 6, textAlign: "right" }}>{t.balanceAfter}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <SiteFooter />
    </div>
  );
}
