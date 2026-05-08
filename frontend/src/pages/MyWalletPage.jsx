import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiGet, apiPost, normalizeInventoryKeys } from "../utils/api";
import { requestTossPayment } from "../utils/tossPayment";
import HarvestCraftModal from "../components/HarvestCraftModal";
import SiteFooter from "../components/SiteFooter";
import "../styles/student-home.css";
import "../styles/wallet.css";

const CHARGE_PRESETS = [
  { won: 10000, grapefruits: 40 },
  { won: 30000, grapefruits: 120 },
  { won: 50000, grapefruits: 200 },
  { won: 100000, grapefruits: 400 },
];

const PRIORITY_KEY = "korfarm_wallet_priority_v1";

const WALLET_META = [
  { key: "grapefruit", color: "orange", name: "자몽", primary: true, unit: "AI 결제 통화 · 1자몽 = 250원" },
  { key: "crop_wheat", color: "cream",  name: "밀",    unit: "1작물 = 1자몽 환산" },
  { key: "crop_rice",  color: "yellow", name: "쌀",    unit: "1작물 = 1자몽 환산" },
  { key: "crop_corn",  color: "yellow", name: "옥수수", unit: "1작물 = 1자몽 환산" },
  { key: "crop_grape", color: "purple", name: "포도",   unit: "1작물 = 1자몽 환산" },
  { key: "crop_apple", color: "red",    name: "사과",   unit: "1작물 = 1자몽 환산" },
];

const ACTIVITY_LABEL = {
  charge: "자몽 충전",
  spend_tutor: "AI 튜터 채팅",
  spend_writing: "글쓰기 첨삭",
  spend_aigen: "AI 학습 만들기",
  spend_ocr: "사진 OCR",
  refund: "환불",
};

function formatTime(ts) {
  if (!ts) return "—";
  try {
    const d = new Date(ts);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = d.toDateString() === yesterday.toDateString();
    if (sameDay) return `오늘 ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    if (isYesterday) return `어제 ${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
    return `${d.getMonth() + 1}/${d.getDate()}`;
  } catch {
    return "—";
  }
}

function MyWalletPage() {
  const navigate = useNavigate();
  const [grapefruit, setGrapefruit] = useState(0);
  const [crops, setCrops] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showCraft, setShowCraft] = useState(false);
  const [showCharge, setShowCharge] = useState(false);
  const [chargeAmount, setChargeAmount] = useState(10000);
  const [chargeAgree, setChargeAgree] = useState(false);
  const [chargingPay, setChargingPay] = useState(false);
  const [chargeError, setChargeError] = useState("");
  const [priority, setPriority] = useState(() => {
    try {
      const saved = localStorage.getItem(PRIORITY_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return WALLET_META.map((w) => w.key);
  });
  const [draggingKey, setDraggingKey] = useState(null);

  // 잔액·작물 fetch
  useEffect(() => {
    apiGet("/v1/me/grapefruit/balance")
      .then((d) => {
        const b = d?.balance ?? d?.grapefruit ?? d ?? 0;
        setGrapefruit(typeof b === "number" ? b : 0);
      })
      .catch((e) => console.error("balance fetch failed", e));

    apiGet("/v1/inventory")
      .then((inv) => {
        const norm = normalizeInventoryKeys(inv);
        const cropsObj = {};
        const rawCrops = norm?.crops || {};
        if (Array.isArray(rawCrops)) {
          rawCrops.forEach((e) => {
            cropsObj[e.type || e.itemType] = e.count || 0;
          });
        } else {
          Object.assign(cropsObj, rawCrops);
        }
        setCrops(cropsObj);
      })
      .catch((e) => console.error("inventory fetch failed", e));

    apiGet("/v1/me/grapefruit/transactions")
      .then((rows) => {
        const arr = Array.isArray(rows) ? rows : (rows?.items || []);
        setTransactions(arr.slice(0, 30));
      })
      .catch((e) => console.error("transactions fetch failed", e));
  }, []);

  const balanceMap = useMemo(() => {
    const m = { grapefruit };
    WALLET_META.slice(1).forEach((w) => {
      m[w.key] = crops[w.key] || 0;
    });
    return m;
  }, [grapefruit, crops]);

  const totalCount = WALLET_META.reduce((s, w) => s + (balanceMap[w.key] || 0), 0);
  const totalKrw = totalCount * 250;

  function handleCharge() {
    setChargeAmount(10000);
    setChargeAgree(false);
    setChargeError("");
    setShowCharge(true);
  }

  async function submitCharge() {
    if (!chargeAgree) {
      setChargeError("결제 진행에 동의해 주세요.");
      return;
    }
    if (!chargeAmount || chargeAmount < 1000) {
      setChargeError("최소 충전 금액은 1,000원입니다.");
      return;
    }
    setChargingPay(true);
    setChargeError("");
    try {
      const prep = await apiPost("/v1/payments/prepare/grapefruit", {
        amountWon: chargeAmount,
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
  }

  function handleExchange() {
    setShowCraft(true);
  }

  function handleCrafted() {
    // 교환 후 잔액·작물 갱신
    apiGet("/v1/inventory")
      .then((inv) => {
        const norm = normalizeInventoryKeys(inv);
        const cropsObj = {};
        const rawCrops = norm?.crops || {};
        if (Array.isArray(rawCrops)) {
          rawCrops.forEach((e) => { cropsObj[e.type || e.itemType] = e.count || 0; });
        } else {
          Object.assign(cropsObj, rawCrops);
        }
        setCrops(cropsObj);
      })
      .catch(() => {});
    setShowCraft(false);
  }

  function savePriority() {
    try {
      localStorage.setItem(PRIORITY_KEY, JSON.stringify(priority));
      alert("결제 우선순위가 저장됐어요. (현재는 이 기기에만 저장 — 서버 동기화는 추후 추가)");
    } catch (e) {
      console.error("priority save failed", e);
    }
  }

  function resetPriority() {
    setPriority(WALLET_META.map((w) => w.key));
  }

  function dragStart(key) {
    setDraggingKey(key);
  }

  function dragOver(e, overKey) {
    e.preventDefault();
    if (!draggingKey || draggingKey === overKey) return;
    const oldIndex = priority.indexOf(draggingKey);
    const newIndex = priority.indexOf(overKey);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = [...priority];
    next.splice(oldIndex, 1);
    next.splice(newIndex, 0, draggingKey);
    setPriority(next);
  }

  const filteredTx = useMemo(() => {
    if (filter === "all") return transactions;
    return transactions.filter((t) => {
      const cur = (t.currency || t.currency_type || "grapefruit").toLowerCase();
      return cur === filter;
    });
  }, [filter, transactions]);

  return (
    <div className="student-home wallet-shell">
      <header className="top-bar" style={{ padding: "calc(env(safe-area-inset-top) + 14px) 18px 14px" }}>
        <button className="hamburger" aria-label="홈으로" onClick={() => navigate("/start-new")}>
          <span></span>
        </button>
        <a className="brand" href="/start" aria-label="국어농장 홈" onClick={(e) => { e.preventDefault(); navigate("/start"); }}>
          <img
            src={import.meta.env.BASE_URL + "korfarm-logo.png"}
            alt="국어농장"
            style={{ height: 36, width: "auto", display: "block" }}
          />
        </a>
        <div style={{ flex: 1 }}></div>
      </header>

      <div className="wallet-page-head">
        <h1>🌾 내 작물 지갑</h1>
        <p>AI 학습·글쓰기 첨삭에 자몽과 작물을 쓸 수 있어요. 어떤 작물을 먼저 쓸지 직접 정할 수 있어요.</p>
        <span className="total">
          합계 <strong>{totalCount}개</strong> · 약 <strong>{totalKrw.toLocaleString()}원</strong> 가치
        </span>
      </div>

      <section className="wallet-section">
        <h2>💰 잔액</h2>
        <div className="balance-grid">
          {WALLET_META.map((w) => (
            <div key={w.key} className={`balance-card ${w.primary ? "primary" : ""}`}>
              <span className={`clay clay-${w.color}`} aria-hidden="true">
                <span className="lbl">{w.name}</span>
              </span>
              <span className="name">{w.name}</span>
              <span className="count">{balanceMap[w.key] || 0}개</span>
              <span className="unit">{w.unit}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="wallet-section">
        <h2>💳 결제 우선순위</h2>
        <p className="subhead">위에서부터 먼저 사용해요. 드래그해서 순서를 바꿀 수 있어요.</p>
        <div className="priority-list">
          {priority.map((key, idx) => {
            const w = WALLET_META.find((m) => m.key === key);
            if (!w) return null;
            return (
              <div
                key={key}
                className={`priority-row ${draggingKey === key ? "dragging" : ""}`}
                draggable
                onDragStart={() => dragStart(key)}
                onDragOver={(e) => dragOver(e, key)}
                onDragEnd={() => setDraggingKey(null)}
              >
                <span className="handle" aria-hidden="true">⋮⋮</span>
                <span className={`clay clay-${w.color}`} aria-hidden="true">
                  <span className="lbl">{w.name}</span>
                </span>
                <div className="label-wrap">
                  <span>{w.name}</span>
                  <span className="rank-badge">{idx + 1}순위</span>
                </div>
                <span className="balance-tag">{balanceMap[w.key] || 0}개</span>
              </div>
            );
          })}
        </div>
        <div className="priority-actions">
          <button className="save-btn" onClick={savePriority}>이대로 저장</button>
          <button className="reset-btn" onClick={resetPriority}>기본값으로 되돌리기</button>
        </div>
        <p className="charge-note">결제 시마다 직접 선택할 수도 있어요. (현재는 이 기기에만 저장)</p>
      </section>

      <section className="wallet-section">
        <h2>🍊 충전 · 교환</h2>
        <div className="charge-row">
          <button className="charge-primary" onClick={handleCharge}>+ 자몽 충전하기</button>
          <button className="exchange-btn" onClick={handleExchange}>🔄 씨앗 → 작물 교환</button>
        </div>
        <p className="charge-note">현재 자몽 단가: 1개 250원 · 10개 묶음 2,500원 · 50개 묶음 12,000원</p>
      </section>

      <section className="wallet-section">
        <h2>📜 최근 사용 내역</h2>
        <div className="usage-filter">
          {[
            { id: "all", label: "모두" },
            { id: "grapefruit", label: "자몽" },
            { id: "crop_wheat", label: "밀" },
            { id: "crop_rice", label: "쌀" },
            { id: "crop_corn", label: "옥수수" },
            { id: "crop_grape", label: "포도" },
            { id: "crop_apple", label: "사과" },
          ].map((f) => (
            <button
              key={f.id}
              className={`filter-chip ${filter === f.id ? "active" : ""}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="usage-table">
          {filteredTx.length === 0 ? (
            <div className="empty-usage">
              아직 사용 내역이 없어요.<br />
              자몽을 충전하거나 AI 튜터·글쓰기 첨삭을 이용하면 여기에 표시돼요.
            </div>
          ) : (
            filteredTx.map((t, i) => {
              const amt = t.delta ?? t.amount ?? 0;
              const isGain = amt > 0;
              const cur = t.currency || t.currency_type || "grapefruit";
              const curLabel = WALLET_META.find((w) => w.key === cur)?.name || "자몽";
              const activity = ACTIVITY_LABEL[t.kind || t.type] || t.description || "활동";
              return (
                <div key={t.id || i} className="usage-row">
                  <span className="when">{formatTime(t.createdAt || t.created_at)}</span>
                  <span className="what">
                    {activity}
                    <span className="currency">· {curLabel}</span>
                  </span>
                  <span className={`delta ${isGain ? "gain" : ""}`}>
                    {isGain ? "+" : ""}{amt}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </section>

      <p style={{ fontSize: 11, color: "#888", marginTop: 16, textAlign: "center" }}>
        <Link to="/refund-policy" style={{ color: "#888" }}>환불규정</Link>
        {" · "}
        <Link to="/terms" style={{ color: "#888" }}>이용약관</Link>
        {" · "}
        <Link to="/privacy" style={{ color: "#888" }}>개인정보처리방침</Link>
      </p>

      <div style={{ height: "32px" }} />

      <HarvestCraftModal
        open={showCraft}
        onClose={() => setShowCraft(false)}
        onCrafted={handleCrafted}
      />

      {showCharge && (
        <div
          role="dialog"
          aria-label="자몽 충전"
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
            <h2 style={{ margin: "0 0 14px", fontSize: 18 }}>🍊 자몽 충전</h2>
            <p style={{ fontSize: 13, color: "#555", margin: "0 0 14px" }}>
              1자몽 = 250원 · AI 튜터·글쓰기 첨삭·OCR 등 AI 기능에 사용됩니다.
            </p>
            <div style={{ display: "grid", gap: 8 }}>
              {CHARGE_PRESETS.map((p) => (
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
                  <span>
                    <strong style={{ fontSize: 15 }}>{p.won.toLocaleString()}원</strong>
                  </span>
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
                <strong>자몽 {Math.floor(chargeAmount / 250)}개 충전</strong>
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

      <SiteFooter />
    </div>
  );
}

export default MyWalletPage;
