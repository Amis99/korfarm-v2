import { useEffect, useMemo, useState } from "react";
import { apiPost } from "../utils/adminApi";
import { useAdminList } from "../hooks/useAdminList";
import AdminLayout from "../components/AdminLayout";
import "../styles/admin-detail.css";

const REPORTS = [
  { id: "r1", type: "게시글", title: "학습 자료 승인 요청", status: "pending" },
];

const mapReports = (items) =>
  items.map((item) => ({
    id: item.id || item.report_id || `${item.type}-${item.title}`,
    type: item.type || item.report_type || "-",
    title: item.title || item.reason || "-",
    targetId: item.target_id || item.targetId || "-",
    status: item.status || "pending",
  }));

function AdminReportsPage() {
  const { data: reports, loading, error } = useAdminList("/v1/admin/reports", REPORTS, mapReports);
  const [rows, setRows] = useState(REPORTS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setRows(reports);
  }, [reports]);

  const filteredReports = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((report) => {
      if (statusFilter !== "all" && report.status !== statusFilter) return false;
      if (!term) return true;
      return [report.type, report.title, report.status]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(term));
    });
  }, [rows, search, statusFilter]);

  const handleApprove = async (reportId) => {
    setActionError("");
    setActionLoading(true);
    try {
      await apiPost(`/v1/admin/reports/${reportId}/approve`);
      setRows((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: "done" } : r))
      );
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (reportId) => {
    setActionError("");
    setActionLoading(true);
    try {
      await apiPost(`/v1/admin/reports/${reportId}/reject`);
      setRows((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: "rejected" } : r))
      );
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>보고 관리</h1>
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
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="admin-detail-filters">
                {["all", "pending", "review", "done"].map((f) => (
                  <button
                    key={f}
                    className={`admin-filter ${statusFilter === f ? "active" : ""}`}
                    type="button"
                    onClick={() => setStatusFilter(f)}
                  >
                    {f === "all" ? "전체" : f === "pending" ? "대기" : f === "review" ? "검토" : "완료"}
                  </button>
                ))}
              </div>
            </div>
            {loading ? <p className="admin-detail-note">보고를 불러오는 중...</p> : null}
            {error ? <p className="admin-detail-note error">{error}</p> : null}
            {actionError ? <p className="admin-detail-note error">{actionError}</p> : null}
            <table className="admin-detail-table">
              <thead>
                <tr>
                  <th>유형</th>
                  <th>내용</th>
                  <th>상태</th>
                  <th>조치</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report) => (
                  <tr key={report.id}>
                    <td>{report.type}</td>
                    <td>{report.title}</td>
                    <td>
                      <span className="status-pill" data-status={report.status}>
                        {report.status}
                      </span>
                    </td>
                    <td>
                      <div className="admin-detail-actions">
                        <button
                          className="admin-detail-btn"
                          type="button"
                          onClick={() => handleApprove(report.id)}
                          disabled={actionLoading || report.status === "done"}
                          style={{ fontSize: "12px", padding: "4px 8px" }}
                        >
                          승인
                        </button>
                        <button
                          className="admin-detail-btn secondary"
                          type="button"
                          onClick={() => handleReject(report.id)}
                          disabled={actionLoading || report.status === "done"}
                          style={{ fontSize: "12px", padding: "4px 8px" }}
                        >
                          거절
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-detail-card">
            <h3>보고 요약</h3>
            <p>전체 {rows.length}건</p>
            <p>대기 {rows.filter((r) => r.status === "pending").length}건</p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminReportsPage;
