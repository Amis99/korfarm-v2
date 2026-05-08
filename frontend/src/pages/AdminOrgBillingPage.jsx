import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { apiGetCamel, apiPostDeep } from "../utils/adminApi";
import { apiPost } from "../utils/api";
import { requestTossPayment } from "../utils/tossPayment";
import "../styles/admin.css";

// 기관 — 월 사용료 청구·결제 (ORG_ADMIN)
export default function AdminOrgBillingPage() {
  const [billings, setBillings] = useState([]);
  const [status, setStatus] = useState(null);
  const [calc, setCalc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [paying, setPaying] = useState(null);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState("");

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const [list, st, cc] = await Promise.all([
        apiGetCamel("/v1/admin/billing/me"),
        apiGetCamel("/v1/admin/billing/me/status"),
        apiGetCamel("/v1/admin/billing/me/calculate").catch(() => null),
      ]);
      setBillings(Array.isArray(list) ? list : []);
      setStatus(st);
      setCalc(cc);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { reload(); }, []);

  const handlePay = async (billingId, fee) => {
    if (!confirm(`${fee.toLocaleString()}원을 토스페이먼츠로 결제하시겠습니까?\n환불규정과 이용약관에 동의한 것으로 간주됩니다.`)) return;
    setPaying(billingId);
    setError(null);
    setMessage("");
    try {
      const prep = await apiPost("/v1/payments/prepare/org-billing", { billingId });
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
      // requestTossPayment 가 결제창 열고 successUrl/failUrl 로 리디렉션
    } catch (e) {
      if (e.code !== "USER_CANCEL") {
        setError(e.message || "결제 요청에 실패했습니다.");
      }
    } finally {
      setPaying(null);
    }
  };

  const statusBadge = (s) => {
    const styles = {
      pending: { bg: "#fff3cd", color: "#856404", label: "결제 대기" },
      paid: { bg: "#d4edda", color: "#155724", label: "결제 완료" },
      overdue: { bg: "#f8d7da", color: "#721c24", label: "연체" },
      canceled: { bg: "#e0e0e0", color: "#666", label: "취소" },
    };
    const sty = styles[s] || styles.pending;
    return <span style={{ display: "inline-block", padding: "2px 8px", background: sty.bg, color: sty.color, borderRadius: 3, fontSize: 11, fontWeight: 600 }}>{sty.label}</span>;
  };

  return (
    <AdminLayout>
      <div className="admin-detail-wrap" style={{ maxWidth: 960 }}>
        <h1 style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="material-symbols-outlined">receipt_long</span>
          월 사용료
        </h1>

        {error && <div style={{ padding: 10, background: "#fee", color: "#c00", borderRadius: 4, marginBottom: 12 }}>{error}</div>}
        {message && <div style={{ padding: 10, background: "#efe", color: "#2f7a3e", borderRadius: 4, marginBottom: 12 }}>{message}</div>}

        {/* 정지 경고 */}
        {status?.suspended && (
          <div style={{ padding: 16, background: "#f8d7da", color: "#721c24", borderRadius: 8, marginBottom: 16, fontWeight: 600 }}>
            ⚠️ 미결제로 인해 기관 관리 기능이 정지되었습니다. 아래 미결제 청구를 결제하면 즉시 해제됩니다.
          </div>
        )}

        {/* 산정 미리보기 카드 */}
        {calc && (
          <div style={{ padding: 16, background: "#f7f9fc", borderRadius: 8, marginBottom: 20 }}>
            <h2 style={{ fontSize: 14, marginBottom: 8 }}>{calc.yearMonth} 예상 사용료 (실시간 산정)</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 13 }}>
              <div>활성 학생 수: <strong>{calc.activeStudentCount}명</strong></div>
              <div>기본료: <strong>{calc.baseFee.toLocaleString()}원</strong>{calc.baseFeeIsOverride && " (감면 적용)"}</div>
              <div>초과 학생: <strong>{calc.excessStudentCount}명</strong></div>
              <div>초과 등록일수: <strong>{calc.excessDays}일</strong> × 500원 = {calc.excessFee.toLocaleString()}원</div>
            </div>
            <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid #ddd", fontSize: 16, fontWeight: 700, color: "#2f7a3e" }}>
              합계: {calc.totalFee.toLocaleString()}원
            </div>
          </div>
        )}

        {/* 청구 이력 */}
        <h2 style={{ fontSize: 16, marginBottom: 8 }}>청구 이력</h2>
        {loading ? (
          <p>불러오는 중...</p>
        ) : billings.length === 0 ? (
          <p style={{ color: "#888", fontSize: 13 }}>아직 청구된 사용료가 없습니다.</p>
        ) : (
          <table className="admin-detail-table" style={{ width: "100%", fontSize: 13 }}>
            <thead>
              <tr>
                <th>월</th>
                <th>기본료</th>
                <th>초과 학생/일수</th>
                <th>초과 요금</th>
                <th>합계</th>
                <th>마감</th>
                <th>상태</th>
                <th>결제</th>
              </tr>
            </thead>
            <tbody>
              {billings.map((b) => (
                <tr key={b.id}>
                  <td><strong>{b.yearMonth}</strong></td>
                  <td>{b.baseFee.toLocaleString()}원</td>
                  <td>{b.excessStudentCount}명 / {b.excessDays}일</td>
                  <td>{b.excessFee.toLocaleString()}원</td>
                  <td style={{ fontWeight: 700 }}>{b.totalFee.toLocaleString()}원</td>
                  <td style={{ fontSize: 11 }}>{b.dueAt?.slice(0, 10)}</td>
                  <td>{statusBadge(b.status)}</td>
                  <td>
                    {b.status === "pending" || b.status === "overdue" ? (
                      <button
                        type="button"
                        onClick={() => handlePay(b.id, b.totalFee)}
                        disabled={paying === b.id}
                        style={{ padding: "4px 12px", background: "#2f7a3e", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12 }}
                      >
                        {paying === b.id ? "처리 중..." : "결제"}
                      </button>
                    ) : (
                      <span style={{ fontSize: 11, color: "#888" }}>-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <p style={{ fontSize: 11, color: "#888", marginTop: 16 }}>
          결제 시 <Link to="/refund-policy" target="_blank" style={{ color: "#888" }}>환불규정</Link>
          {" · "}
          <Link to="/terms" target="_blank" style={{ color: "#888" }}>이용약관</Link>
          {" · "}
          <Link to="/privacy" target="_blank" style={{ color: "#888" }}>개인정보처리방침</Link>
          에 동의한 것으로 간주됩니다.
        </p>
      </div>
    </AdminLayout>
  );
}
