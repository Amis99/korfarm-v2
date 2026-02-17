import { useState, useEffect } from "react";
import { apiGet, apiPost } from "../utils/api";

const SEED_TYPES = [
  { key: "seed_wheat", cropKey: "crop_wheat", label: "밀", emoji: "🌾" },
  { key: "seed_rice", cropKey: "crop_rice", label: "쌀", emoji: "🍚" },
  { key: "seed_corn", cropKey: "crop_corn", label: "옥수수", emoji: "🌽" },
  { key: "seed_grape", cropKey: "crop_grape", label: "포도", emoji: "🍇" },
  { key: "seed_apple", cropKey: "crop_apple", label: "사과", emoji: "🍎" },
];

const SEED_REQUIRED = 10;

function HarvestCraftModal({ open, onClose, onCrafted }) {
  const [inventory, setInventory] = useState(null);
  const [typeIndex, setTypeIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [useFertilizer, setUseFertilizer] = useState(false);
  const [crafting, setCrafting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setTypeIndex(0);
    setQuantity(1);
    setUseFertilizer(false);
    setResult(null);
    setError(null);
    apiGet("/v1/inventory")
      .then(setInventory)
      .catch(() => setInventory(null));
  }, [open]);

  if (!open) return null;

  const seeds = inventory?.seeds || {};
  const fertilizer = inventory?.fertilizer ?? 0;
  const current = SEED_TYPES[typeIndex];
  const currentCount = seeds[current.key] ?? 0;
  const maxSets = Math.floor(currentCount / SEED_REQUIRED);

  // 종류 변경 시 수량 리셋
  const changeType = (dir) => {
    const next = (typeIndex + dir + SEED_TYPES.length) % SEED_TYPES.length;
    setTypeIndex(next);
    const nextCount = seeds[SEED_TYPES[next].key] ?? 0;
    const nextMax = Math.floor(nextCount / SEED_REQUIRED);
    setQuantity(Math.min(1, nextMax));
  };

  const changeQuantity = (dir) => {
    const next = quantity + dir;
    if (next >= 1 && next <= maxSets) setQuantity(next);
  };

  const seedCost = quantity * SEED_REQUIRED;
  const cropGain = quantity * (useFertilizer ? 3 : 1);
  const canCraft = maxSets >= 1 && quantity >= 1 && !crafting;

  const handleCraft = async () => {
    if (!canCraft) return;
    setCrafting(true);
    setError(null);
    try {
      let lastData = null;
      for (let i = 0; i < quantity; i++) {
        lastData = await apiPost("/v1/harvest/craft", {
          seedType: current.key,
          useFertilizer,
        });
      }
      setResult({ seedSpent: seedCost, cropGain, label: current.label, emoji: current.emoji });
      if (lastData?.inventory) {
        setInventory(lastData.inventory);
        if (onCrafted) onCrafted(lastData);
      }
    } catch (e) {
      setError(e.message || "교환 실패");
    } finally {
      setCrafting(false);
    }
  };

  const arrowBtn = (direction, onClick, disabled) => (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: 36, height: 36,
        border: "none",
        borderRadius: 10,
        background: disabled ? "#eee" : "#fff5eb",
        color: disabled ? "#ccc" : "#f07f1a",
        fontSize: 18,
        fontWeight: 900,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "grid",
        placeItems: "center",
        transition: "background 0.15s",
      }}
    >
      {direction}
    </button>
  );

  const cardStyle = {
    maxWidth: 380,
    width: "92vw",
    background: "#fff",
    borderRadius: 24,
    padding: 24,
    aspectRatio: "auto",
    gridTemplateRows: "none",
    display: "grid",
    gap: 0,
    boxShadow: "0 12px 32px rgba(0,0,0,0.18)",
  };

  return (
    <div className="result-overlay" onClick={onClose}>
      <div className="result-card" style={cardStyle} onClick={(e) => e.stopPropagation()}>
        {result ? (
          <>
            <h2 style={{ margin: "0 0 16px", fontSize: 20, textAlign: "center" }}>교환 완료!</h2>
            <div style={{ textAlign: "center", fontSize: 48, marginBottom: 8 }}>{result.emoji}</div>
            <p style={{ fontSize: 15, lineHeight: 1.8, textAlign: "center" }}>
              {result.label} 씨앗 {result.seedSpent}개 사용<br />
              {result.label} 수확물 <strong style={{ color: "#f07f1a", fontSize: 18 }}>{result.cropGain}개</strong> 획득!
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 16 }}>
              <button type="button" style={btnStyle} onClick={() => { setResult(null); setQuantity(1); }}>
                계속 교환
              </button>
              <button type="button" style={{ ...btnStyle, background: "#aaa" }} onClick={onClose}>
                닫기
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 style={{ margin: "0 0 16px", fontSize: 20, textAlign: "center" }}>씨앗 교환</h2>

            {/* 씨앗 종류 선택: 좌우 화살표 */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 6, textAlign: "center" }}>씨앗 종류 (◀ ▶)</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                {arrowBtn("◀", () => changeType(-1), false)}
                <div style={{ textAlign: "center", minWidth: 120 }}>
                  <div style={{ fontSize: 40 }}>{current.emoji}</div>
                  <div style={{ fontWeight: 700, fontSize: 16, marginTop: 4 }}>{current.label}</div>
                  <div style={{ fontSize: 12, color: "#888" }}>보유 {currentCount}개</div>
                </div>
                {arrowBtn("▶", () => changeType(1), false)}
              </div>
            </div>

            {/* 수량 선택: 상하 화살표 */}
            {maxSets >= 1 ? (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: "#888", marginBottom: 6, textAlign: "center" }}>교환 수량 (▲ ▼)</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12 }}>
                  {arrowBtn("▼", () => changeQuantity(-1), quantity <= 1)}
                  <div style={{ textAlign: "center", minWidth: 100, padding: "8px 0", background: "#f9f5f0", borderRadius: 12 }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: "#f07f1a" }}>{quantity}</div>
                    <div style={{ fontSize: 11, color: "#888" }}>세트 ({quantity * SEED_REQUIRED}개)</div>
                  </div>
                  {arrowBtn("▲", () => changeQuantity(1), quantity >= maxSets)}
                </div>
                <div style={{ fontSize: 11, color: "#aaa", textAlign: "center", marginTop: 4 }}>
                  최대 {maxSets}세트 가능
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "12px 0", fontSize: 13, color: "#c0392b", marginBottom: 16 }}>
                {current.label} 씨앗이 {SEED_REQUIRED}개 미만입니다
              </div>
            )}

            {/* 비료 사용 */}
            {maxSets >= 1 && (
              <label style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 8, fontSize: 14, marginBottom: 16,
                cursor: fertilizer > 0 ? "pointer" : "not-allowed",
                color: fertilizer > 0 ? "#333" : "#bbb",
              }}>
                <input
                  type="checkbox"
                  checked={useFertilizer}
                  disabled={fertilizer <= 0}
                  onChange={(e) => setUseFertilizer(e.target.checked)}
                />
                🧪 비료 사용 (보유: {fertilizer}개) → 수확물 3배!
              </label>
            )}

            {/* 교환 미리보기 */}
            {maxSets >= 1 && (
              <div style={{
                padding: "12px 16px",
                background: "#f9f5f0",
                borderRadius: 14,
                marginBottom: 16,
                textAlign: "center",
                lineHeight: 1.8,
                fontSize: 14,
              }}>
                <div>{current.emoji} {current.label} 씨앗 <strong>{seedCost}개</strong></div>
                <div style={{ fontSize: 18 }}>↓</div>
                <div>{current.emoji} {current.label} 수확물 <strong style={{ color: "#f07f1a", fontSize: 18 }}>{cropGain}개</strong>
                  {useFertilizer && <span style={{ color: "#e67e22", fontSize: 12 }}> (비료 적용)</span>}
                </div>
              </div>
            )}

            {error && (
              <p style={{ color: "#c0392b", fontSize: 13, textAlign: "center", marginBottom: 12 }}>{error}</p>
            )}

            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button
                type="button"
                style={{ ...btnStyle, opacity: canCraft ? 1 : 0.5, cursor: canCraft ? "pointer" : "not-allowed" }}
                onClick={handleCraft}
                disabled={!canCraft}
              >
                {crafting ? "교환 중..." : "교환하기"}
              </button>
              <button type="button" style={{ ...btnStyle, background: "#aaa" }} onClick={onClose}>
                닫기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const btnStyle = {
  border: "none",
  background: "#ff8f2b",
  color: "#fff",
  padding: "10px 20px",
  borderRadius: 10,
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 14,
};

export default HarvestCraftModal;
