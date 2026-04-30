import { useEffect, useMemo, useState } from "react";
import { apiDelete, apiPost } from "../utils/adminApi";
import { useAdminList } from "../hooks/useAdminList";
import AdminLayout from "../components/AdminLayout";
import "../styles/admin-detail.css";

/**
 * 학부모 연결 관리 (어드민)
 * 정책: 학부모 회원가입 시 학생 정보(이름·휴대폰)가 정확히 일치하면 즉시 자동 연결.
 *  - "승인 대기"·"승인"·"거절" 같은 잔재 흐름은 모두 제거.
 *  - 어드민은 (1) 직접 연결 생성, (2) 현황 확인, (3) 해제 만 가능.
 */
const SAMPLE_LINKS = [];

const mapLinks = (items) =>
  items.map((item) => ({
    linkId: item.link_id ?? item.linkId,
    parentLoginId: item.parent_login_id ?? item.parentLoginId,
    studentLoginId: item.student_login_id ?? item.studentLoginId,
    studentName: item.student_name ?? item.studentName,
    status: item.status,
    createdAt: item.created_at ?? item.createdAt,
  }));

const formatStatus = (status) => {
  switch (status) {
    case "active":
      return "연결됨";
    case "inactive":
      return "해제";
    default:
      return status;
  }
};

const PAGE_SIZE = 15;

function AdminParentLinksPage() {
  const { data, loading, error } = useAdminList(
    "/v1/admin/parents/links",
    SAMPLE_LINKS,
    mapLinks
  );
  const [rows, setRows] = useState(SAMPLE_LINKS);
  const [parentLoginId, setParentLoginId] = useState("");
  const [studentLoginId, setStudentLoginId] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    setRows(data);
    setCurrentPage(1);
  }, [data]);

  const stats = useMemo(() => {
    const summary = { active: 0, inactive: 0 };
    rows.forEach((row) => {
      summary[row.status] = (summary[row.status] || 0) + 1;
    });
    return summary;
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (statusFilter === "all") return rows;
    return rows.filter((r) => r.status === statusFilter);
  }, [rows, statusFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const pagedRows = filteredRows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleCreate = async () => {
    setActionError("");
    if (!parentLoginId.trim() || !studentLoginId.trim()) {
      setActionError("학부모/학생 아이디를 입력해 주세요.");
      return;
    }
    setActionLoading(true);
    try {
      const result = await apiPost("/v1/admin/parents/links", {
        parent_login_id: parentLoginId.trim(),
        student_login_id: studentLoginId.trim(),
      });
      const mapped = mapLinks([result])[0];
      setRows((prev) => [mapped, ...prev]);
      setParentLoginId("");
      setStudentLoginId("");
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async (linkId) => {
    setActionError("");
    if (!window.confirm("이 연결을 해제하시겠습니까?")) return;
    setActionLoading(true);
    try {
      await apiDelete(`/v1/admin/parents/links/${linkId}`);
      setRows((prev) =>
        prev.map((row) => (row.linkId === linkId ? { ...row, status: "inactive" } : row))
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
          <h1>학부모 연결 관리</h1>
        </div>

        <p className="admin-detail-note" style={{ marginTop: 0 }}>
          학부모가 회원가입 시 학생 이름·휴대폰을 정확히 입력하면 자동 연결됩니다.
          어드민은 직접 연결 생성과 해제만 합니다.
        </p>
        <div className="admin-detail-grid" style={{ gridTemplateColumns: "1fr 2fr" }}>
          <div className="admin-detail-card">
            <h2>연결 생성</h2>
            <div className="admin-detail-toolbar">
              <div className="admin-detail-search">
                <span className="material-symbols-outlined">person</span>
                <input
                  placeholder="학부모 아이디"
                  value={parentLoginId}
                  onChange={(event) => setParentLoginId(event.target.value)}
                />
              </div>
              <div className="admin-detail-search">
                <span className="material-symbols-outlined">school</span>
                <input
                  placeholder="학생 아이디"
                  value={studentLoginId}
                  onChange={(event) => setStudentLoginId(event.target.value)}
                />
              </div>
              <button
                className="admin-detail-btn"
                type="button"
                onClick={handleCreate}
                disabled={actionLoading}
              >
                생성
              </button>
            </div>
            {actionError ? <p className="admin-detail-note error">{actionError}</p> : null}
          </div>

          <div className="admin-detail-card">
            <div className="admin-detail-toolbar">
              <div className="admin-detail-filters">
                <button type="button" className={`admin-filter ${statusFilter === "all" ? "active" : ""}`} onClick={() => setStatusFilter("all")}>
                  전체 {rows.length}
                </button>
                <button type="button" className={`admin-filter ${statusFilter === "active" ? "active" : ""}`} onClick={() => setStatusFilter("active")}>
                  연결됨 {stats.active}
                </button>
                <button type="button" className={`admin-filter ${statusFilter === "inactive" ? "active" : ""}`} onClick={() => setStatusFilter("inactive")}>
                  해제 {stats.inactive || 0}
                </button>
              </div>
            </div>
            {loading ? <p className="admin-detail-note">연결을 불러오는 중...</p> : null}
            {error ? <p className="admin-detail-note error">{error}</p> : null}
            <table className="admin-detail-table">
              <thead>
                <tr>
                  <th>학부모</th>
                  <th>학생</th>
                  <th>학생 이름</th>
                  <th>상태</th>
                  <th>조치</th>
                </tr>
              </thead>
              <tbody>
                {pagedRows.map((row) => (
                  <tr key={row.linkId}>
                    <td>{row.parentLoginId}</td>
                    <td>{row.studentLoginId}</td>
                    <td>{row.studentName || "-"}</td>
                    <td>{formatStatus(row.status)}</td>
                    <td>
                      {row.status === "active" ? (
                        <button
                          className="admin-detail-btn secondary"
                          type="button"
                          onClick={() => handleDeactivate(row.linkId)}
                          disabled={actionLoading}
                        >
                          해제
                        </button>
                      ) : (
                        <span className="admin-detail-note" style={{ margin: 0, color: "var(--admin-muted)" }}>—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {totalPages > 1 && (
              <div className="admin-pagination">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                >
                  이전
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    className={p === currentPage ? "active" : ""}
                    onClick={() => setCurrentPage(p)}
                  >
                    {p}
                  </button>
                ))}
                <button
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => p + 1)}
                >
                  다음
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminParentLinksPage;
