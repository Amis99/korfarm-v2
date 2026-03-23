import { useState, useEffect } from "react";
import { apiGet, apiPost, normalizeInventoryKeys } from "../utils/api";

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
      .then((d) => setInventory(normalizeInventoryKeys(d)))
      .catch(() => setInventory(null));
  }, [open]);

  if (!open) return null;

  const seeds = inventory?.seeds || {};
  const fertilizer = inventory?.fertilizer ?? 0;
  const current = SEED_TYPES[typeIndex];
  const currentCount = seeds[current.key] ?? 0;
  const maxSets = Math.floor(currentCount / SEED_REQUIRED);

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
      const data = await apiPost("/v1/harvest/craft-batch", {
        seedType: current.key,
        quantity,
        useFertilizer,
      });
      setResult({ seedSpent: seedCost, cropGain, label: current.label, emoji: current.emoji });
      if (data?.inventory) {
        setInventory(normalizeInventoryKeys(data.inventory));
        if (onCrafted) onCrafted(data);
      }
    } catch (e) {
      setError(e.message || "교환 실패");
    } finally {
      setCrafting(false);
    }
  };

  return (
    <div className="result-overlay" onClick={onClose}>
      <div className="hcm-card" onClick={(e) => e.stopPropagation()}>
        {result ? (
          <>
            <h2 className="hcm-title">교환 완료!</h2>
            <div className="hcm-result-emoji">{result.emoji}</div>
            <p className="hcm-result-text">
              {result.label} 씨앗 {result.seedSpent}개 사용<br />
              {result.label} 수확물 <strong className="hcm-highlight">{result.cropGain}개</strong> 획득!
            </p>
            <div className="hcm-btn-row">
              <button type="button" className="hcm-btn" onClick={() => { setResult(null); setQuantity(1); }}>
                계속 교환
              </button>
              <button type="button" className="hcm-btn hcm-btn-secondary" onClick={onClose}>
                닫기
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="hcm-title">씨앗 교환</h2>

            {/* 씨앗 종류 선택 */}
            <div className="hcm-section">
              <div className="hcm-section-label">씨앗 종류 (◀ ▶)</div>
              <div className="hcm-picker">
                <button type="button" className="hcm-arrow" onClick={() => changeType(-1)}>◀</button>
                <div className="hcm-seed-display">
                  <div className="hcm-seed-emoji">{current.emoji}</div>
                  <div className="hcm-seed-name">{current.label}</div>
                  <div className="hcm-seed-count">보유 {currentCount}개</div>
                </div>
                <button type="button" className="hcm-arrow" onClick={() => changeType(1)}>▶</button>
              </div>
            </div>

            {/* 수량 선택 */}
            {maxSets >= 1 ? (
              <div className="hcm-section">
                <div className="hcm-section-label">교환 수량 (▲ ▼)</div>
                <div className="hcm-picker">
                  <button type="button" className="hcm-arrow" onClick={() => changeQuantity(-1)} disabled={quantity <= 1}>▼</button>
                  <div className="hcm-qty-display">
                    <div className="hcm-qty-number">{quantity}</div>
                    <div className="hcm-qty-label">세트 ({quantity * SEED_REQUIRED}개)</div>
                  </div>
                  <button type="button" className="hcm-arrow" onClick={() => changeQuantity(1)} disabled={quantity >= maxSets}>▲</button>
                </div>
                <div className="hcm-max-info">최대 {maxSets}세트 가능</div>
              </div>
            ) : (
              <div className="hcm-insufficient">
                {current.label} 씨앗이 {SEED_REQUIRED}개 미만입니다
              </div>
            )}

            {/* 비료 사용 */}
            {maxSets >= 1 && (
              <label className={`hcm-fertilizer ${fertilizer > 0 ? "hcm-fertilizer-enabled" : "hcm-fertilizer-disabled"}`}>
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
              <div className="hcm-preview">
                <div>{current.emoji} {current.label} 씨앗 <strong>{seedCost}개</strong></div>
                <div className="hcm-preview-arrow">↓</div>
                <div>{current.emoji} {current.label} 수확물 <strong className="hcm-highlight">{cropGain}개</strong>
                  {useFertilizer && <span className="hcm-fertilizer-tag"> (비료 적용)</span>}
                </div>
              </div>
            )}

            {error && <p className="hcm-error">{error}</p>}

            <div className="hcm-btn-row">
              <button
                type="button"
                className="hcm-btn"
                onClick={handleCraft}
                disabled={!canCraft}
              >
                {crafting ? "교환 중..." : "교환하기"}
              </button>
              <button type="button" className="hcm-btn hcm-btn-secondary" onClick={onClose}>
                닫기
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default HarvestCraftModal;
