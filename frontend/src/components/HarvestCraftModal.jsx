import { useState, useEffect } from "react";
import { apiGet, apiPost } from "../utils/api";

const SEED_TYPES = [
  { key: "seed_wheat", label: "밀" },
  { key: "seed_rice", label: "쌀" },
  { key: "seed_corn", label: "옥수수" },
  { key: "seed_grape", label: "포도" },
  { key: "seed_apple", label: "사과" },
];

const SEED_REQUIRED = 10;

function HarvestCraftModal({ open, onClose, onCrafted }) {
  const [inventory, setInventory] = useState(null);
  const [selectedSeed, setSelectedSeed] = useState(null);
  const [useFertilizer, setUseFertilizer] = useState(false);
  const [crafting, setCrafting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setSelectedSeed(null);
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

  const handleCraft = async () => {
    if (!selectedSeed) return;
    setCrafting(true);
    setError(null);
    try {
      const data = await apiPost("/v1/economy/harvest/craft", {
        seedType: selectedSeed,
        useFertilizer,
      });
      setResult(data);
      setInventory(data?.inventory || null);
      if (onCrafted) onCrafted(data);
    } catch (e) {
      setError(e.message || "교환 실패");
    } finally {
      setCrafting(false);
    }
  };

  const selectedCount = seeds[selectedSeed] ?? 0;
  const canCraft = selectedSeed && selectedCount >= SEED_REQUIRED && !crafting;
  const selectedLabel = SEED_TYPES.find((s) => s.key === selectedSeed)?.label || "";
  const cropAmount = useFertilizer ? 3 : 1;

  return (
    <div className="result-overlay" onClick={onClose}>
      <div
        className="result-card"
        style={{ padding: 24, background: "#fff", maxWidth: 400, width: "90%" }}
        onClick={(e) => e.stopPropagation()}
      >
        {result ? (
          <>
            <h2 style={{ marginBottom: 12 }}>교환 완료!</h2>
            <p style={{ fontSize: 15, lineHeight: 1.6 }}>
              {SEED_TYPES.find((s) => s.key === selectedSeed)?.label || ""} 씨앗 {result.seedSpent}개 사용
              <br />
              {SEED_TYPES.find((s) => "crop_" + s.key.replace("seed_", "") === result.cropType)?.label || result.cropType} 수확물 <strong>{result.cropDelta}개</strong> 획득!
              {result.fertilizerSpent > 0 && (
                <><br />비료 {result.fertilizerSpent}개 사용</>
              )}
            </p>
            <button
              type="button"
              style={btnStyle}
              onClick={() => setResult(null)}
            >
              계속 교환
            </button>
            <button
              type="button"
              style={{ ...btnStyle, background: "#aaa", marginLeft: 8 }}
              onClick={onClose}
            >
              닫기
            </button>
          </>
        ) : (
          <>
            <h2 style={{ marginBottom: 16 }}>씨앗 교환</h2>
            <p style={{ fontSize: 13, color: "#666", marginBottom: 16 }}>
              같은 종류 씨앗 10개 → 같은 종류 수확물 1개
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {SEED_TYPES.map((s) => {
                const count = seeds[s.key] ?? 0;
                const enough = count >= SEED_REQUIRED;
                const isSelected = selectedSeed === s.key;
                return (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => enough && setSelectedSeed(s.key)}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 10,
                      border: isSelected ? "2px solid #ff8f2b" : "1px solid #ddd",
                      background: isSelected ? "#fff5eb" : enough ? "#fff" : "#f5f5f5",
                      color: enough ? "#333" : "#bbb",
                      cursor: enough ? "pointer" : "not-allowed",
                      fontWeight: isSelected ? 700 : 400,
                      fontSize: 13,
                    }}
                  >
                    {s.label} {count}개
                  </button>
                );
              })}
            </div>

            {selectedSeed && (
              <div style={{ marginBottom: 16 }}>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 14,
                    cursor: fertilizer > 0 ? "pointer" : "not-allowed",
                    color: fertilizer > 0 ? "#333" : "#bbb",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={useFertilizer}
                    disabled={fertilizer <= 0}
                    onChange={(e) => setUseFertilizer(e.target.checked)}
                  />
                  비료 사용 (보유: {fertilizer}개) → 수확물 3배!
                </label>
              </div>
            )}

            {selectedSeed && (
              <div style={{
                padding: 12,
                background: "#f9f5f0",
                borderRadius: 10,
                fontSize: 14,
                marginBottom: 16,
                lineHeight: 1.6,
              }}>
                <div>필요: {selectedLabel} 씨앗 {SEED_REQUIRED}개</div>
                <div>
                  획득: {selectedLabel} 수확물 <strong>{cropAmount}개</strong>
                  {useFertilizer && <span style={{ color: "#e67e22" }}> (비료 적용)</span>}
                </div>
              </div>
            )}

            {error && (
              <p style={{ color: "#c0392b", fontSize: 13, marginBottom: 12 }}>{error}</p>
            )}

            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button
                type="button"
                style={{
                  ...btnStyle,
                  opacity: canCraft ? 1 : 0.5,
                  cursor: canCraft ? "pointer" : "not-allowed",
                }}
                onClick={handleCraft}
                disabled={!canCraft}
              >
                {crafting ? "교환 중..." : "교환하기"}
              </button>
              <button
                type="button"
                style={{ ...btnStyle, background: "#aaa" }}
                onClick={onClose}
              >
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
