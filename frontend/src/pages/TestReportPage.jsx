import { useEffect, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiGet, API_BASE, TOKEN_KEY } from "../utils/api";
import { apiGet as adminApiGet } from "../utils/adminApi";
import TestReportView from "../components/test-report/TestReportView";
import "../styles/test-storage.css";

function TestReportPage() {
  const { testId } = useParams();
  const [searchParams] = useSearchParams();
  const studentId = searchParams.get("studentId");
  const fromDiagnostic = searchParams.get("from") === "diagnostic";
  const { isLoggedIn, user } = useAuth();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [testHistory, setTestHistory] = useState([]);

  const isParent = user?.roles?.includes("PARENT");
  const isAdmin = (user?.roles || []).some((r) => r === "HQ_ADMIN" || r === "ORG_ADMIN");
  const [answerPdf, setAnswerPdf] = useState({ checked: false, available: false });
  const [answerDownloading, setAnswerDownloading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) return;
    let fetchFn;
    if (isParent && studentId) {
      fetchFn = () => apiGet(`/v1/parents/children/${studentId}/test-storage/${testId}/report`);
    } else if (studentId) {
      fetchFn = () => adminApiGet(`/v1/admin/test-papers/${testId}/submissions/${studentId}/report`);
    } else {
      fetchFn = () => apiGet(`/v1/test-storage/${testId}/report`);
    }
    fetchFn()
      .then(setReport)
      .catch(() => navigate(studentId ? `/admin/tests/${testId}/statistics` : `/tests/${testId}`))
      .finally(() => setLoading(false));
  }, [isLoggedIn, testId, studentId, navigate, isParent]);

  // 시험 이력 로드 (추이 차트용 — 학생 본인 화면에서만)
  useEffect(() => {
    if (!isLoggedIn || studentId) return;
    apiGet("/v1/test-storage/history")
      .then((data) => setTestHistory(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, [isLoggedIn, studentId]);

  // 정답·해설 PDF 다운로드 가능 여부 — 학부모 제외, 관리자/학생 본인 응시 OK
  useEffect(() => {
    if (!isLoggedIn || isParent || !testId) return;
    apiGet(`/v1/test-storage/${testId}/answer-pdf/meta`)
      .then((m) => setAnswerPdf({ checked: true, available: !!m?.available }))
      .catch(() => setAnswerPdf({ checked: true, available: false }));
  }, [isLoggedIn, isParent, testId]);

  const handleAnswerDownload = async () => {
    if (!testId || answerDownloading) return;
    setAnswerDownloading(true);
    try {
      const token = sessionStorage.getItem(TOKEN_KEY) || "";
      const resp = await fetch(`${API_BASE}/v1/test-storage/${testId}/answer-pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!resp.ok) throw new Error("정답·해설 PDF 를 받을 수 없습니다.");
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      alert(e?.message || "다운로드 실패");
    } finally {
      setAnswerDownloading(false);
    }
  };

  if (loading) return <div className="ts-page ts-center"><p>불러오는 중...</p></div>;
  if (!report) return null;

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

      <TestReportView
        report={report}
        userName={user?.name}
        testHistory={testHistory}
      />

      <div className="ts-report-actions ts-no-print" style={{ marginTop: 12 }}>
        <button
          className="ts-btn ts-btn-outline"
          onClick={() => navigate(`/tests/${testId}/wrong-note${studentId ? `?studentId=${studentId}` : fromDiagnostic ? "?from=diagnostic" : ""}`)}
        >
          <span className="material-symbols-outlined">error_outline</span>
          오답 노트
        </button>
        {!isParent && answerPdf.checked && answerPdf.available && (
          <button
            className="ts-btn ts-btn-outline"
            onClick={handleAnswerDownload}
            disabled={answerDownloading}
            title={isAdmin ? "정답·해설 PDF (관리자)" : "정답·해설 PDF (응시 완료 후 다운로드 가능)"}
          >
            <span className="material-symbols-outlined">picture_as_pdf</span>
            {answerDownloading ? "정답·해설 불러오는 중..." : "정답·해설 인쇄"}
          </button>
        )}
        <Link to={listTo} className="ts-btn ts-btn-outline">{listLabel}</Link>
        {fromDiagnostic && (
          <Link to="/start" className="ts-btn ts-btn-primary">학습 시작하기</Link>
        )}
      </div>
    </div>
  );
}

export default TestReportPage;
