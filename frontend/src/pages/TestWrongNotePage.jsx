import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiGet } from "../utils/api";
import { apiGet as adminApiGet } from "../utils/adminApi";
import TestWrongNoteView from "../components/test-report/TestWrongNoteView";
import "../styles/test-storage.css";

function TestWrongNotePage() {
  const { testId } = useParams();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("studentId");
  const fromDiagnostic = searchParams.get("from") === "diagnostic";
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const isParent = user?.roles?.includes("PARENT");

  useEffect(() => {
    if (!isLoggedIn) return;
    let fetchFn;
    if (isParent && studentId) {
      fetchFn = () => apiGet(`/v1/parents/children/${studentId}/test-storage/${testId}/wrong-note`);
    } else if (studentId) {
      fetchFn = () => adminApiGet(`/v1/admin/test-papers/${testId}/submissions/${studentId}/wrong-note`);
    } else {
      fetchFn = () => apiGet(`/v1/test-storage/${testId}/wrong-note`);
    }
    fetchFn()
      .then(setData)
      .catch(() => navigate(studentId ? `/admin/tests/${testId}/statistics` : fromDiagnostic ? "/diagnostic/print" : `/tests/${testId}`))
      .finally(() => setLoading(false));
  }, [isLoggedIn, testId, studentId, navigate, isParent]);

  if (loading) return <div className="ts-page ts-center"><p>불러오는 중...</p></div>;
  if (!data) return null;

  const backTo = studentId ? `/admin/tests/${testId}/statistics` : fromDiagnostic ? "/diagnostic/print" : `/tests/${testId}`;
  const backLabel = studentId ? "시험 관리" : fromDiagnostic ? "진단 테스트" : "시험 상세";
  const listTo = studentId ? `/admin/tests/${testId}/statistics` : fromDiagnostic ? "/diagnostic/print" : "/tests";
  const listLabel = studentId ? "시험 관리로" : fromDiagnostic ? "진단 테스트로" : "목록으로";

  return (
    <div className="ts-page">
      <div className="ts-back-row ts-no-print">
        <Link to={backTo} className="ts-back-link">
          <span className="material-symbols-outlined">arrow_back</span> {backLabel}
        </Link>
      </div>

      <TestWrongNoteView data={data} userName={user?.name} />

      <div className="ts-report-actions ts-no-print" style={{ marginTop: 12 }}>
        <button
          className="ts-btn ts-btn-outline"
          onClick={() => navigate(`/tests/${testId}/report${studentId ? `?studentId=${studentId}` : fromDiagnostic ? "?from=diagnostic" : ""}`)}
        >
          <span className="material-symbols-outlined">assessment</span>
          성적표
        </button>
        <Link to={listTo} className="ts-btn ts-btn-outline">{listLabel}</Link>
      </div>
    </div>
  );
}

export default TestWrongNotePage;
