import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import TestReportView from "../components/test-report/TestReportView";
import { apiGet } from "../utils/adminApi";

/**
 * 어드민이 특정 학생의 챕터·기타 테스트 성적표를 그대로 보는 페이지.
 * (진단 테스트는 학생용 페이지 `/diagnostic/v2/report/:sessionId?adminReturn=...` 그대로 사용)
 *
 * 2026-05-16 신설 — 시험 통계 페이지에서 학생명 클릭 시 진입.
 * 돌아가기 버튼은 통계 페이지로 복귀.
 */
export default function AdminStudentReportPage() {
  const { testId, userId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!testId || !userId) return;
    setLoading(true);
    apiGet(`/v1/admin/test-papers/${testId}/submissions/${userId}/report`)
      .then((res) => setReport(res?.data ?? res))
      .catch((e) => setError(e?.message || String(e)))
      .finally(() => setLoading(false));
  }, [testId, userId]);

  const returnUrl = `/admin/tests/${testId}/statistics`;

  return (
    <AdminLayout>
      <div style={{ padding: "16px 16px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <button
            type="button"
            onClick={() => navigate(returnUrl)}
            style={{
              background: "var(--panel)", color: "var(--text)", border: "1px solid var(--stroke)",
              padding: "6px 14px", borderRadius: 6, cursor: "pointer", fontSize: 13,
            }}
          >
            ← 시험 통계로 돌아가기
          </button>
          <h2 style={{ margin: 0, color: "var(--text)", fontSize: 18 }}>학생 성적표 (관리자 보기)</h2>
        </div>

        {loading && <p style={{ textAlign: "center", padding: 24, color: "var(--muted)" }}>불러오는 중...</p>}
        {error && <p style={{ textAlign: "center", padding: 24, color: "#fca5a5" }}>{error}</p>}
        {!loading && !error && report && (
          <TestReportView report={report} embedded />
        )}

        {!loading && !error && (
          <div style={{ marginTop: 24, textAlign: "center" }}>
            <button
              type="button"
              onClick={() => navigate(returnUrl)}
              style={{
                background: "var(--accent)", color: "#fff", border: "none",
                padding: "10px 24px", borderRadius: 6, cursor: "pointer", fontSize: 14, fontWeight: 600,
              }}
            >
              종료하고 시험 통계로 돌아가기
            </button>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
