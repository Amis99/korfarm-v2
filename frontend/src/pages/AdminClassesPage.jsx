import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAdminList } from "../hooks/useAdminList";
import "../styles/admin-detail.css";

const CLASSES = [
  { name: "초4 A반", level: "프레게1", org: "해든 국어학원", seats: 28, status: "active" },
  { name: "초6 심화반", level: "프레게3", org: "바른 국어학원", seats: 18, status: "active" },
  { name: "중1 종합반", level: "러셀1", org: "서울 초등학교", seats: 32, status: "pending" },
];

const mapClassList = (items) =>
  items.map((classItem) => ({
    name: classItem.name,
    level: classItem.level_id || classItem.levelId || "-",
    org: classItem.org_name || classItem.orgName || classItem.org_id || "-",
    seats: classItem.seat_count ?? classItem.seatCount ?? 0,
    status: classItem.status || "active",
  }));

function AdminClassesPage() {
  const { data: classes, loading, error } = useAdminList(
    "/v1/admin/classes",
    CLASSES,
    mapClassList
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredClasses = useMemo(() => {
    const term = search.trim().toLowerCase();
    return classes.filter((classItem) => {
      if (statusFilter !== "all" && classItem.status !== statusFilter) {
        return false;
      }
      if (!term) {
        return true;
      }
      return [classItem.name, classItem.level, classItem.org, classItem.status]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term));
    });
  }, [classes, search, statusFilter]);

  return (
    <div className="admin-detail-page">
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>반 관리</h1>
          <div className="admin-detail-actions">
            <button className="admin-detail-btn" type="button">
              반 생성
            </button>
            <button className="admin-detail-btn secondary" type="button">
              학생 배정
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
            <h2>반 리스트</h2>
            <div className="admin-detail-toolbar">
              <div className="admin-detail-search">
                <span className="material-symbols-outlined">search</span>
                <input
                  placeholder="반/기관 검색"
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
                  className={`admin-filter ${statusFilter === "pending" ? "active" : ""}`}
                  type="button"
                  onClick={() => setStatusFilter("pending")}
                >
                  보류
                </button>
              </div>
            </div>
            {loading ? <p className="admin-detail-note">반 목록을 불러오는 중...</p> : null}
            {error ? <p className="admin-detail-note error">{error}</p> : null}
            <table className="admin-detail-table">
              <thead>
                <tr>
                  <th>반명</th>
                  <th>레벨</th>
                  <th>기관</th>
                  <th>학생 수</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {filteredClasses.map((classItem) => (
                  <tr key={classItem.name}>
                    <td>{classItem.name}</td>
                    <td>{classItem.level}</td>
                    <td>{classItem.org}</td>
                    <td>{classItem.seats}</td>
                    <td>
                      <span className="status-pill" data-status={classItem.status}>
                        {classItem.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-detail-card">
            <h3>반 운영 요약</h3>
            <p>활성 18개 · 보류 2개</p>
            <div className="admin-detail-tag">오늘 생성 3개</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminClassesPage;
