import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiGet } from "../utils/api";
import { apiGet as adminApiGet } from "../utils/adminApi";
import ReportSummaryCards from "../components/report/ReportSummaryCards";
import ReportRadarChart from "../components/report/ReportRadarChart";
import ReportTrendChart from "../components/report/ReportTrendChart";
import ReportSectionDetail from "../components/report/ReportSectionDetail";
import "../styles/unified-report.css";

function getDefaultDates() {
  const now = new Date();
  const end = now.toISOString().slice(0, 10);
  const start = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
  return { start: start.toISOString().slice(0, 10), end };
}

export default function UnifiedReportPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { user } = useAuth();

  const isParent = user?.roles?.includes("PARENT");
  const isAdmin = user?.roles?.some((r) => r === "HQ_ADMIN" || r === "ORG_ADMIN");
  const studentIdParam = params.get("studentId");

  const defaults = getDefaultDates();
  const [startDate, setStartDate] = useState(defaults.start);
  const [endDate, setEndDate] = useState(defaults.end);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchReport = (sd, ed) => {
    setLoading(true);
    setError("");
    const qs = `startDate=${sd}&endDate=${ed}`;
    let req;
    if (isParent && studentIdParam) {
      req = apiGet(`/v1/parents/children/${studentIdParam}/report/unified?${qs}`);
    } else if (isAdmin && studentIdParam) {
      req = adminApiGet(`/v1/admin/students/${studentIdParam}/report/unified?${qs}`);
    } else {
      req = apiGet(`/v1/report/unified?${qs}`);
    }
    req
      .then(setReport)
      .catch((e) => setError(e.message || "데이터를 불러올 수 없습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchReport(startDate, endDate);
  }, []);

  const handleSearch = () => fetchReport(startDate, endDate);

  return (
    <div className="ur-page">
      <div className="ur-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button className="ur-btn ur-btn-secondary" onClick={() => navigate(-1)}>
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>arrow_back</span>
            뒤로
          </button>
          <h1>통합 성적표</h1>
        </div>
        <div className="ur-header-actions">
          <button className="ur-btn" onClick={() => window.print()}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>print</span>
            인쇄
          </button>
        </div>
      </div>

      <div className="ur-date-bar">
        <label>기간</label>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        <span>~</span>
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        <button className="ur-btn" onClick={handleSearch}>조회</button>
      </div>

      {loading && <div className="ur-loading">불러오는 중...</div>}
      {error && <div className="ur-empty">{error}</div>}

      {!loading && report && (
        <>
          <ReportSummaryCards summary={report.summary} />
          <div className="ur-charts-row">
            <ReportRadarChart radarData={report.radarData} />
            <ReportTrendChart trend={report.trend} />
          </div>
          <ReportSectionDetail sections={report.sections} />
        </>
      )}
    </div>
  );
}
