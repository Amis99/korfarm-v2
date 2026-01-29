import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAdminList } from "../hooks/useAdminList";
import "../styles/admin-detail.css";

const STUDENTS = [
  { name: "김서연", level: "프레게1", org: "해든 국어학원", status: "active" },
  { name: "이준호", level: "러셀1", org: "서울 초등학교", status: "trial" },
  { name: "박예은", level: "프레게3", org: "바른 국어학원", status: "inactive" },
];

const mapStudents = (items) =>
  items.map((student) => ({
    name: student.name,
    level: student.level_id || student.levelId || "-",
    org: student.org_name || student.orgName || "-",
    status: student.status || "active",
  }));

function AdminStudentsPage() {
  const { data: students, loading, error } = useAdminList(
    "/v1/admin/students",
    STUDENTS,
    mapStudents
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredStudents = useMemo(() => {
    const term = search.trim().toLowerCase();
    return students.filter((student) => {
      if (statusFilter !== "all" && student.status !== statusFilter) {
        return false;
      }
      if (!term) {
        return true;
      }
      return [student.name, student.level, student.org, student.status]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term));
    });
  }, [students, search, statusFilter]);

  return (
    <div className="admin-detail-page">
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>학생 관리</h1>
          <div className="admin-detail-actions">
            <button className="admin-detail-btn" type="button">
              학생 등록
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
            <h2>학생 목록</h2>
            <div className="admin-detail-toolbar">
              <div className="admin-detail-search">
                <span className="material-symbols-outlined">search</span>
                <input
                  placeholder="학생 검색"
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
                  className={`admin-filter ${statusFilter === "active" ? "active" : ""}`}
                  type="button"
                  onClick={() => setStatusFilter("active")}
                >
                  활성
                </button>
                <button
                  className={`admin-filter ${statusFilter === "trial" ? "active" : ""}`}
                  type="button"
                  onClick={() => setStatusFilter("trial")}
                >
                  체험
                </button>
                <button
                  className={`admin-filter ${statusFilter === "inactive" ? "active" : ""}`}
                  type="button"
                  onClick={() => setStatusFilter("inactive")}
                >
                  비활성
                </button>
              </div>
            </div>
            {loading ? <p className="admin-detail-note">학생을 불러오는 중...</p> : null}
            {error ? <p className="admin-detail-note error">{error}</p> : null}
            <table className="admin-detail-table">
              <thead>
                <tr>
                  <th>학생</th>
                  <th>레벨</th>
                  <th>기관</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((student) => (
                  <tr key={student.name}>
                    <td>{student.name}</td>
                    <td>{student.level}</td>
                    <td>{student.org}</td>
                    <td>
                      <span className="status-pill" data-status={student.status}>
                        {student.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-detail-card">
            <h3>학생 요약</h3>
            <p>활성 120명 · 체험 24명</p>
            <div className="admin-detail-tag">비활성 5명</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminStudentsPage;
