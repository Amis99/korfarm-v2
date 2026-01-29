import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiDelete, apiPost } from "../utils/adminApi";
import { useAdminList } from "../hooks/useAdminList";
import "../styles/admin-detail.css";

const SAMPLE_LINKS = [
  {
    linkId: "pl_001",
    parentLoginId: "parent01",
    studentLoginId: "student01",
    studentName: "김하린",
    status: "pending",
    requestCode: "482931",
    createdAt: "2026-01-24T10:12:00+09:00",
  },
  {
    linkId: "pl_002",
    parentLoginId: "parent02",
    studentLoginId: "student02",
    studentName: "박민준",
    status: "active",
    requestCode: null,
    createdAt: "2026-01-21T09:30:00+09:00",
  },
];

const mapLinks = (items) =>
  items.map((item) => ({
    linkId: item.link_id ?? item.linkId,
    parentLoginId: item.parent_login_id ?? item.parentLoginId,
    studentLoginId: item.student_login_id ?? item.studentLoginId,
    studentName: item.student_name ?? item.studentName,
    status: item.status,
    requestCode: item.request_code ?? item.requestCode,
    createdAt: item.created_at ?? item.createdAt,
  }));

const formatStatus = (status) => {
  switch (status) {
    case "active":
      return "연결됨";
    case "pending":
      return "승인 대기";
    case "rejected":
      return "거절";
    case "inactive":
      return "해제";
    default:
      return status;
  }
};

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

  useEffect(() => {
    setRows(data);
  }, [data]);

  const stats = useMemo(() => {
    const summary = { active: 0, pending: 0, rejected: 0, inactive: 0 };
    rows.forEach((row) => {
      summary[row.status] = (summary[row.status] || 0) + 1;
    });
    return summary;
  }, [rows]);

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

  const handleAction = async (linkId, action) => {
    setActionError("");
    setActionLoading(true);
    try {
      let result = null;
      if (action === "deactivate") {
        await apiDelete(`/v1/admin/parents/links/${linkId}`);
        result = { link_id: linkId, status: "inactive" };
      } else if (action === "approve") {
        result = await apiPost(`/v1/admin/parents/links/${linkId}/approve`);
      } else if (action === "reject") {
        result = await apiPost(`/v1/admin/parents/links/${linkId}/reject`);
      }
      if (result) {
        const mapped = mapLinks([result])[0];
        setRows((prev) =>
          prev.map((row) => (row.linkId === linkId ? { ...row, ...mapped } : row))
        );
      }
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="admin-detail-page">
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>학부모 연결 관리</h1>
          <div className="admin-detail-actions">
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
                <button type="button" className="admin-filter active">
                  전체 {rows.length}
                </button>
                <button type="button" className="admin-filter">
                  연결됨 {stats.active}
                </button>
                <button type="button" className="admin-filter">
                  승인 대기 {stats.pending}
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
                  <th>요청 코드</th>
                  <th>조치</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.linkId}>
                    <td>{row.parentLoginId}</td>
                    <td>{row.studentLoginId}</td>
                    <td>{row.studentName || "-"}</td>
                    <td>{formatStatus(row.status)}</td>
                    <td>{row.requestCode || "-"}</td>
                    <td>
                      <div className="admin-detail-actions">
                        <button
                          className="admin-detail-btn"
                          type="button"
                          onClick={() => handleAction(row.linkId, "approve")}
                          disabled={actionLoading}
                        >
                          승인
                        </button>
                        <button
                          className="admin-detail-btn secondary"
                          type="button"
                          onClick={() => handleAction(row.linkId, "reject")}
                          disabled={actionLoading}
                        >
                          거절
                        </button>
                        <button
                          className="admin-detail-btn secondary"
                          type="button"
                          onClick={() => handleAction(row.linkId, "deactivate")}
                          disabled={actionLoading}
                        >
                          해제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminParentLinksPage;
