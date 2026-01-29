import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAdminList } from "../hooks/useAdminList";
import "../styles/admin-detail.css";

const ORGS = [
  { name: "Korfarm Academy", plan: "Pro", seats: 120, status: "active" },
  { name: "해든 국어학원", plan: "Basic", seats: 48, status: "active" },
  { name: "서울 초등학교", plan: "Enterprise", seats: 300, status: "pending" },
];

const mapOrgList = (items) =>
  items.map((org) => ({
    name: org.name,
    plan: org.plan || "-",
    seats: org.seat_limit ?? 0,
    status: org.status || "active",
  }));

function AdminOrgsPage() {
  const { data: orgs, loading, error } = useAdminList("/v1/admin/orgs", ORGS, mapOrgList);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredOrgs = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orgs.filter((org) => {
      if (statusFilter !== "all" && org.status !== statusFilter) {
        return false;
      }
      if (!term) {
        return true;
      }
      return [org.name, org.plan, org.status]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term));
    });
  }, [orgs, search, statusFilter]);

  return (
    <div className="admin-detail-page">
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>기관 관리</h1>
          <div className="admin-detail-actions">
            <button className="admin-detail-btn" type="button">
              신규 기관 등록
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
            <h2>기관 목록</h2>
            <div className="admin-detail-toolbar">
              <div className="admin-detail-search">
                <span className="material-symbols-outlined">search</span>
                <input
                  placeholder="기관 검색"
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
            {loading ? <p className="admin-detail-note">기관 목록을 불러오는 중...</p> : null}
            {error ? <p className="admin-detail-note error">{error}</p> : null}
            <table className="admin-detail-table">
              <thead>
                <tr>
                  <th>기관명</th>
                  <th>플랜</th>
                  <th>좌석</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrgs.map((org) => (
                  <tr key={org.name}>
                    <td>{org.name}</td>
                    <td>{org.plan}</td>
                    <td>{org.seats}</td>
                    <td>
                      <span className="status-pill" data-status={org.status}>
                        {org.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-detail-card">
            <h3>기관 요약</h3>
            <p>활성 기관 42개 · 보류 3개</p>
            <div className="admin-detail-tag">플랜 업그레이드 6건</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminOrgsPage;
