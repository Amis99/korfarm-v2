import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { apiGetCamel, apiPatchDeep } from "../utils/adminApi";
import "../styles/admin.css";

// 본사 — AI 기능별 자몽 단가 관리 (HQ_ADMIN 전용)
export default function AdminGrapefruitPricingPage() {
  const [pricing, setPricing] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingKind, setSavingKind] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [edits, setEdits] = useState({}); // kind → {price, active}

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGetCamel("/v1/admin/grapefruit/pricing");
      const list = Array.isArray(data) ? data : [];
      setPricing(list);
      const initial = {};
      list.forEach((p) => { initial[p.kind] = { price: p.priceGrapefruits, active: p.active }; });
      setEdits(initial);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { reload(); }, []);

  const handleSave = async (kind) => {
    const e = edits[kind];
    if (!e) return;
    setSavingKind(kind);
    setError(null);
    setMessage("");
    try {
      await apiPatchDeep(`/v1/admin/grapefruit/pricing/${encodeURIComponent(kind)}`, {
        priceGrapefruits: parseInt(e.price, 10),
        active: e.active,
      });
      setMessage(`${kind} 단가 저장됨.`);
      await reload();
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingKind(null);
    }
  };

  const updateEdit = (kind, field, value) => {
    setEdits((prev) => ({ ...prev, [kind]: { ...prev[kind], [field]: value } }));
  };

  return (
    <AdminLayout>
      <div className="admin-detail-wrap" style={{ maxWidth: 960 }}>
        <h1 style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="material-symbols-outlined">savings</span>
          AI 자몽 단가 관리
        </h1>
        <p style={{ color: "#666", fontSize: 13, marginBottom: 16 }}>
          기관 관리자가 AI 기능을 사용할 때 차감되는 자몽 수를 기능별로 설정합니다.
          (1자몽 = 200원 — 기관 / 250원 — 개인)
        </p>

        {error && <div style={{ padding: 10, background: "#fee", color: "#c00", borderRadius: 4, marginBottom: 12 }}>{error}</div>}
        {message && <div style={{ padding: 10, background: "#efe", color: "#2f7a3e", borderRadius: 4, marginBottom: 12 }}>{message}</div>}

        {loading ? (
          <p>불러오는 중...</p>
        ) : (
          <table className="admin-detail-table" style={{ width: "100%" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 8 }}>기능</th>
                <th style={{ width: 80 }}>모델</th>
                <th style={{ width: 100 }}>자몽</th>
                <th style={{ width: 90 }}>가격(₩)</th>
                <th style={{ width: 80 }}>활성</th>
                <th style={{ width: 100 }}>저장</th>
              </tr>
            </thead>
            <tbody>
              {pricing.map((p) => {
                const e = edits[p.kind] || { price: p.priceGrapefruits, active: p.active };
                const won = (parseInt(e.price, 10) || 0) * 200;
                const isSaving = savingKind === p.kind;
                return (
                  <tr key={p.kind}>
                    <td style={{ padding: 8 }}>
                      <div style={{ fontWeight: 600 }}>{p.label}</div>
                      <div style={{ fontSize: 11, color: "#888" }}>{p.kind}{p.description ? ` — ${p.description}` : ""}</div>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <span style={{
                        display: "inline-block",
                        padding: "2px 8px",
                        background: p.model === "opus" ? "#fde7c4" : "#e1f0e3",
                        color: p.model === "opus" ? "#a85c00" : "#2f7a3e",
                        borderRadius: 4,
                        fontSize: 11,
                        fontWeight: 600,
                      }}>
                        {p.model.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <input
                        type="number"
                        min="0"
                        value={e.price}
                        onChange={(ev) => updateEdit(p.kind, "price", ev.target.value)}
                        style={{ width: 60, padding: 4, textAlign: "center", border: "1px solid #ccc", borderRadius: 4 }}
                      />
                    </td>
                    <td style={{ textAlign: "right", color: "#666" }}>{won.toLocaleString()}원</td>
                    <td style={{ textAlign: "center" }}>
                      <input
                        type="checkbox"
                        checked={e.active}
                        onChange={(ev) => updateEdit(p.kind, "active", ev.target.checked)}
                      />
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        type="button"
                        onClick={() => handleSave(p.kind)}
                        disabled={isSaving}
                        style={{
                          padding: "4px 12px",
                          background: "#2f7a3e",
                          color: "#fff",
                          border: "none",
                          borderRadius: 4,
                          cursor: isSaving ? "not-allowed" : "pointer",
                          fontSize: 12,
                        }}
                      >
                        {isSaving ? "..." : "저장"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
