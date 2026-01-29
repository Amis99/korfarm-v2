import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAdminList } from "../hooks/useAdminList";
import "../styles/admin-detail.css";

const REPORTS = [
  { type: "게시글", title: "학습 자료 승인 요청", status: "pending" },
  { type: "커뮤니티", title: "공지사항 검토", status: "review" },
  { type: "과제", title: "중간 평가 채점", status: "done" },
];

const mapReports = (items) =>
  items.map((item) => ({
    type: item.type || item.report_type || "-",
    title: item.title || "-",
    status: item.status || "pending",
  }));

function AdminReportsPage() {
  const { data: reports, loading, error } = useAdminList(
    "/v1/admin/reports",
    REPORTS,
    mapReports
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredReports = useMemo(() => {
    const term = search.trim().toLowerCase();
    return reports.filter((report) => {
      if (statusFilter !== "all" && report.status !== statusFilter) {
        return false;
      }
      if (!term) {
        return true;
      }
      return [report.type, report.title, report.status]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term));
    });
  }, [reports, search, statusFilter]);

  return (
    <div className="admin-detail-page">
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>보고 관리</h1>
          <div className="admin-detail-actions">
            <button className="admin-detail-btn" type="button">
              보고서 다운로드
            </button>
            <Link className="admin-detail-btn secondary" to="/admin">
              대시보드
            </Link>
          </div>
        </div>
        <div className="admin-detail-nav">
          <Link to="/admin/orgs">기관</Link>
          <Link to="/admin/classes">반</Link>
          <Link to="/admin/students">학생</Link>
          <Link to="/admin/parents">학부모 관리</Link>
          <Link to="/admin/content">콘텐츠</Link>
          <Link to="/admin/assignments">과제</Link>
          <Link to="/admin/seasons">시즌</Link>
          <Link to="/admin/shop/products">상품</Link>
          <Link to="/admin/shop/orders">주문</Link>
          <Link to="/admin/payments">결제</Link>
          <Link to="/admin/reports">보고</Link>
          <Link to="/admin/flags">플래그</Link>
        </div>
        <div className="admin-detail-grid">
          <div className="admin-detail-card">
            <h2>보고 목록</h2>
            <div className="admin-detail-toolbar">
              <div className="admin-detail-search">
                <span className="material-symbols-outlined">search</span>
                <input
                  placeholder="보고 검색"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </div>
              <div className="admin-detail-filters">
                <button
                  className={`admin-filter ${statusFilter === "all" ? "active" : ""}`}
                  type="button"
                  onClick={() => setStatusFilter("all")}
                >
                  전체
                </button>
                <button
                  className={`admin-filter ${statusFilter === "pending" ? "active" : ""}`}
                  type="button"
                  onClick={() => setStatusFilter("pending")}
                >
                  대기
                </button>
                <button
                  className={`admin-filter ${statusFilter === "review" ? "active" : ""}`}
                  type="button"
                  onClick={() => setStatusFilter("review")}
                >
                  검토
                </button>
                <button
                  className={`admin-filter ${statusFilter === "done" ? "active" : ""}`}
                  type="button"
                  onClick={() => setStatusFilter("done")}
                >
                  완료
                </button>
              </div>
            </div>
            {loading ? <p className="admin-detail-note">보고를 불러오는 중...</p> : null}
            {error ? <p className="admin-detail-note error">{error}</p> : null}
            <table className="admin-detail-table">
              <thead>
                <tr>
                  <th>유형</th>
                  <th>내용</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => (
                  <tr key={`${report.type}-${report.title}`}>
                    <td>{report.type}</td>
                    <td>{report.title}</td>
                    <td>
                      <span className="status-pill" data-status={report.status}>
                        {report.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-detail-card">
            <h3>보고 요약</h3>
            <p>대기 7건 · 검토 3건</p>
            <div className="admin-detail-tag">완료 12건</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminReportsPage;
