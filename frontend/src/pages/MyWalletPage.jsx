import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, normalizeInventoryKeys } from "../utils/api";
import "../styles/student-home.css";
import "../styles/wallet.css";

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
    // 기존 자몽 충전 페이지로 위임 (토스 결제 흐름)
    navigate("/subscription");
  }

  function handleExchange() {
    alert("씨앗 → 작물 교환은 준비 중입니다.");
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
        <a className="brand" href="/start-new" onClick={(e) => { e.preventDefault(); navigate("/start-new"); }}>
          <span className="logo" aria-hidden="true">국</span>
          <span className="name">국어농장</span>
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

      <div style={{ height: "32px" }} />
    </div>
  );
}

export default MyWalletPage;
