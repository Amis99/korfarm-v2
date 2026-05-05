import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { apiGetCamel, apiPatchDeep, apiPostDeep } from "../utils/adminApi";
import { useRequireRole } from "../hooks/useRequireRole";
import "../styles/admin.css";

// 본사 — 기관별 월 청구 관리 + 기본료 감면 (HQ_ADMIN)
export default function AdminAllOrgBillingPage() {
  useRequireRole("HQ_ADMIN");
  const [orgs, setOrgs] = useState([]);
  const [billingsByOrg, setBillingsByOrg] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");
  const [editingOrgId, setEditingOrgId] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [busy, setBusy] = useState(false);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await apiGetCamel("/v1/admin/orgs");
      const filtered = (list || []).filter((o) => o.orgId !== "org_hq");
      setOrgs(filtered);
      // 각 기관 청구 이력 첫 페이지 함께 가져오기
      const map = {};
      await Promise.all(filtered.map(async (o) => {
        try {
          const b = await apiGetCamel(`/v1/admin/billing/orgs/${encodeURIComponent(o.orgId)}`);
          map[o.orgId] = Array.isArray(b) ? b.slice(0, 3) : [];
        } catch { map[o.orgId] = []; }
      }));
      setBillingsByOrg(map);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { reload(); }, []);

  const startEdit = (org) => {
    setEditingOrgId(org.orgId);
    setEditValue(org.monthlyBaseFeeOverride != null ? String(org.monthlyBaseFeeOverride) : "");
  };

  const cancelEdit = () => { setEditingOrgId(null); setEditValue(""); };

  const saveOverride = async (orgId) => {
    setBusy(true);
    setError(null);
    setMessage("");
    try {
      const num = editValue.trim() === "" ? null : parseInt(editValue, 10);
      await apiPatchDeep(`/v1/admin/billing/orgs/${encodeURIComponent(orgId)}/base-fee`, { monthlyBaseFee: num });
      setMessage(num == null ? "기본료 감면 해제 (200,000원으로 복귀)" : `기본료 ${num.toLocaleString()}원 적용`);
      cancelEdit();
      await reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const issueThisMonth = async (orgId) => {
    if (!confirm("이번 달 청구서를 즉시 발행/재계산하시겠습니까?")) return;
    setBusy(true);
    try {
      await apiPostDeep(`/v1/admin/billing/orgs/${encodeURIComponent(orgId)}/issue`, {});
      setMessage("이번 달 청구서 발행 완료.");
      await reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  const unsuspend = async (orgId) => {
    if (!confirm("이 기관의 정지 상태를 해제하시겠습니까?\n(미결제 청구서는 그대로 유지됩니다)")) return;
    setBusy(true);
    try {
      await apiPostDeep(`/v1/admin/billing/orgs/${encodeURIComponent(orgId)}/unsuspend`, {});
      setMessage("정지 해제 완료.");
      await reload();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-detail-wrap" style={{ maxWidth: 1100 }}>
        <h1 style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="material-symbols-outlined">payments</span>
          기관 월 청구 관리
        </h1>
        <p style={{ color: "#666", fontSize: 13, marginBottom: 16 }}>
          매월 1일 새벽 2시에 모든 활성 기관의 청구서가 자동 발행됩니다 (그 달 1일~말일 사용료).
          기본료(20만 원)는 기관별로 감면·수정할 수 있습니다.
        </p>

        {error && <div style={{ padding: 10, background: "#fee", color: "#c00", borderRadius: 4, marginBottom: 12 }}>{error}</div>}
        {message && <div style={{ padding: 10, background: "#efe", color: "#2f7a3e", borderRadius: 4, marginBottom: 12 }}>{message}</div>}

        {loading ? (
          <p>불러오는 중...</p>
        ) : (
          <table className="admin-detail-table" style={{ width: "100%", fontSize: 13 }}>
            <thead>
              <tr>
                <th>기관</th>
                <th>월 기본료</th>
                <th>최근 청구</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {orgs.map((o) => {
                const recent = (billingsByOrg[o.orgId] || []).slice(0, 1)[0];
                return (
                  <tr key={o.orgId}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{o.name}</div>
                      <div style={{ fontSize: 11, color: "#888" }}>
                        {o.orgId} {o.billingSuspended && (
                          <span style={{ marginLeft: 6, padding: "1px 6px", background: "#f8d7da", color: "#721c24", borderRadius: 3, fontSize: 10, fontWeight: 600 }}>정지</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {editingOrgId === o.orgId ? (
                        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                          <input
                            type="number"
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            placeholder="200000 (빈칸=기본)"
                            style={{ width: 120, padding: 4, border: "1px solid #ccc", borderRadius: 3 }}
                          />
                          <button onClick={() => saveOverride(o.orgId)} disabled={busy} style={{ padding: "4px 8px", background: "#2f7a3e", color: "#fff", border: "none", borderRadius: 3, fontSize: 11 }}>저장</button>
                          <button onClick={cancelEdit} style={{ padding: "4px 8px", background: "none", border: "1px solid #ccc", borderRadius: 3, fontSize: 11 }}>취소</button>
                        </div>
                      ) : (
                        <div>
                          <strong>{(o.monthlyBaseFeeOverride ?? 200000).toLocaleString()}원</strong>
                          {o.monthlyBaseFeeOverride != null && <span style={{ marginLeft: 6, fontSize: 11, color: "#a85c00" }}>(감면)</span>}
                          <button onClick={() => startEdit(o)} style={{ marginLeft: 8, padding: "2px 8px", background: "none", border: "1px solid #ccc", borderRadius: 3, fontSize: 11, cursor: "pointer" }}>수정</button>
                        </div>
                      )}
                    </td>
                    <td>
                      {recent ? (
                        <div>
                          <div>{recent.yearMonth} — {recent.totalFee.toLocaleString()}원</div>
                          <div style={{ fontSize: 11, color: "#888" }}>
                            <span style={{
                              padding: "1px 6px",
                              background: recent.status === "paid" ? "#d4edda" : recent.status === "overdue" ? "#f8d7da" : "#fff3cd",
                              color: recent.status === "paid" ? "#155724" : recent.status === "overdue" ? "#721c24" : "#856404",
                              borderRadius: 3, marginRight: 4,
                            }}>{recent.status}</span>
                            마감 {recent.dueAt?.slice(0, 10)}
                          </div>
                        </div>
                      ) : <span style={{ color: "#999" }}>없음</span>}
                    </td>
                    <td>
                      <button onClick={() => issueThisMonth(o.orgId)} disabled={busy} style={{ marginRight: 4, padding: "2px 8px", background: "#fff", border: "1px solid #2f7a3e", color: "#2f7a3e", borderRadius: 3, fontSize: 11, cursor: "pointer" }}>이번 달 발행</button>
                      {o.billingSuspended && (
                        <button onClick={() => unsuspend(o.orgId)} disabled={busy} style={{ padding: "2px 8px", background: "#fff", border: "1px solid #c00", color: "#c00", borderRadius: 3, fontSize: 11, cursor: "pointer" }}>정지 해제</button>
                      )}
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
