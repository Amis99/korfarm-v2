import { useCallback, useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "../utils/adminApi";
import { useAdminList } from "../hooks/useAdminList";
import AdminLayout from "../components/AdminLayout";
import "../styles/admin-detail.css";

/* ──────── 신고 관리 탭 ──────── */

const REPORTS_FALLBACK = [
  { id: "r1", type: "게시글", title: "학습 자료 승인 요청", status: "pending" },
];

const mapReports = (items) =>
  items.map((item) => ({
    id: item.id || item.report_id || item.reportId || `${item.type}-${item.title}`,
    type: item.type || item.report_type || item.targetType || "-",
    title: item.title || item.reason || "-",
    targetId: item.target_id || item.targetId || "-",
    status: item.status || "pending",
  }));

function ReportsTab() {
  const { data: reports, loading, error } = useAdminList("/v1/admin/reports", REPORTS_FALLBACK, mapReports);
  const [rows, setRows] = useState(REPORTS_FALLBACK);
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
    <div className="admin-detail-grid">
      <div className="admin-detail-card">
        <h2>신고 목록</h2>
        <div className="admin-detail-toolbar">
          <div className="admin-detail-search">
            <span className="material-symbols-outlined">search</span>
            <input
              placeholder="신고 검색"
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
        {loading ? <p className="admin-detail-note">신고를 불러오는 중...</p> : null}
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
        <h3>신고 요약</h3>
        <p>전체 {rows.length}건</p>
        <p>대기 {rows.filter((r) => r.status === "pending").length}건</p>
      </div>
    </div>
  );
}

/* ──────── 학습 자료 승인 탭 ──────── */

const STATUS_LABELS = {
  all: "전체",
  pending: "대기",
  active: "승인됨",
  rejected: "거절됨",
};

const mapMaterials = (items) =>
  Array.isArray(items)
    ? items.map((item) => ({
        postId: item.postId || item.post_id || item.id,
        boardId: item.boardId || item.board_id || "",
        title: item.title || "-",
        status: item.status || "pending",
        createdAt: item.createdAt || item.created_at || "",
        authorId: item.authorId || item.author_id || "-",
      }))
    : [];

function MaterialsTab() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // 학습 자료 목록 불러오기
  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const result = await apiGet("/v1/admin/boards/materials");
      setMaterials(mapMaterials(result));
    } catch (err) {
      setError(err.message || "학습 자료 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  const filteredMaterials = useMemo(() => {
    const term = search.trim().toLowerCase();
    return materials.filter((m) => {
      if (statusFilter !== "all" && m.status !== statusFilter) return false;
      if (!term) return true;
      return [m.title, m.authorId, m.status]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(term));
    });
  }, [materials, search, statusFilter]);

  const handleApprove = async (postId) => {
    setActionError("");
    setActionLoading(true);
    try {
      await apiPost(`/v1/admin/boards/materials/${postId}/approve`);
      // 목록에서 상태 업데이트
      setMaterials((prev) =>
        prev.map((m) => (m.postId === postId ? { ...m, status: "active" } : m))
      );
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (postId) => {
    setActionError("");
    setActionLoading(true);
    try {
      await apiPost(`/v1/admin/boards/materials/${postId}/reject`);
      setMaterials((prev) =>
        prev.map((m) => (m.postId === postId ? { ...m, status: "rejected" } : m))
      );
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // 날짜 포맷
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="admin-detail-grid">
      <div className="admin-detail-card">
        <h2>학습 자료 승인 관리</h2>
        <div className="admin-detail-toolbar">
          <div className="admin-detail-search">
            <span className="material-symbols-outlined">search</span>
            <input
              placeholder="학습 자료 검색"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="admin-detail-filters">
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <button
                key={key}
                className={`admin-filter ${statusFilter === key ? "active" : ""}`}
                type="button"
                onClick={() => setStatusFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
        {loading ? <p className="admin-detail-note">학습 자료를 불러오는 중...</p> : null}
        {error ? <p className="admin-detail-note error">{error}</p> : null}
        {actionError ? <p className="admin-detail-note error">{actionError}</p> : null}
        <table className="admin-detail-table">
          <thead>
            <tr>
              <th>제목</th>
              <th>작성자</th>
              <th>등록일</th>
              <th>상태</th>
              <th>조치</th>
            </tr>
          </thead>
          <tbody>
            {filteredMaterials.length === 0 && !loading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: "center", color: "#a6b6a9", padding: "24px 0" }}>
                  {statusFilter === "pending"
                    ? "승인 대기 중인 학습 자료가 없습니다."
                    : "학습 자료가 없습니다."}
                </td>
              </tr>
            ) : (
              filteredMaterials.map((m) => (
                <tr key={m.postId}>
                  <td>{m.title}</td>
                  <td>{m.authorId}</td>
                  <td>{formatDate(m.createdAt)}</td>
                  <td>
                    <span className="status-pill" data-status={m.status}>
                      {STATUS_LABELS[m.status] || m.status}
                    </span>
                  </td>
                  <td>
                    <div className="admin-detail-actions">
                      <button
                        className="admin-detail-btn"
                        type="button"
                        onClick={() => handleApprove(m.postId)}
                        disabled={actionLoading || m.status === "active"}
                        style={{ fontSize: "12px", padding: "4px 8px" }}
                      >
                        승인
                      </button>
                      <button
                        className="admin-detail-btn secondary"
                        type="button"
                        onClick={() => handleReject(m.postId)}
                        disabled={actionLoading || m.status === "rejected"}
                        style={{ fontSize: "12px", padding: "4px 8px" }}
                      >
                        거절
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <div className="admin-detail-card">
        <h3>학습 자료 요약</h3>
        <p>전체 {materials.length}건</p>
        <p>승인 대기 {materials.filter((m) => m.status === "pending").length}건</p>
        <p>승인됨 {materials.filter((m) => m.status === "active").length}건</p>
        <p>거절됨 {materials.filter((m) => m.status === "rejected").length}건</p>
      </div>
    </div>
  );
}

/* ──────── 메인 페이지 ──────── */

function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState("reports");

  return (
    <AdminLayout>
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>보고 관리</h1>
        </div>
        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === "reports" ? "active" : ""}`}
            type="button"
            onClick={() => setActiveTab("reports")}
          >
            신고 관리
          </button>
          <button
            className={`admin-tab ${activeTab === "materials" ? "active" : ""}`}
            type="button"
            onClick={() => setActiveTab("materials")}
          >
            학습 자료
          </button>
        </div>
        {activeTab === "reports" ? <ReportsTab /> : <MaterialsTab />}
      </div>
    </AdminLayout>
  );
}

export default AdminReportsPage;
