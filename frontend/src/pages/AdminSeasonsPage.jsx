import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAdminList } from "../hooks/useAdminList";
import "../styles/admin-detail.css";

const SEASONS = [
  { name: "2026년 1월 시즌", start: "2026-01-01", end: "2026-01-31", status: "active" },
  { name: "2025년 12월 시즌", start: "2025-12-01", end: "2025-12-31", status: "closed" },
  { name: "2025년 11월 시즌", start: "2025-11-01", end: "2025-11-30", status: "closed" },
];

const mapSeasons = (items) =>
  items.map((item) => ({
    name: item.name,
    start: item.start_date || item.startDate || "-",
    end: item.end_date || item.endDate || "-",
    status: item.status || "active",
  }));

function AdminSeasonsPage() {
  const { data: seasons, loading, error } = useAdminList(
    "/v1/admin/seasons",
    SEASONS,
    mapSeasons
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredSeasons = useMemo(() => {
    const term = search.trim().toLowerCase();
    return seasons.filter((season) => {
      if (statusFilter !== "all" && season.status !== statusFilter) {
        return false;
      }
      if (!term) {
        return true;
      }
      return [season.name, season.status, season.start, season.end]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(term));
    });
  }, [seasons, search, statusFilter]);

  return (
    <div className="admin-detail-page">
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>시즌 관리</h1>
          <div className="admin-detail-actions">
            <button className="admin-detail-btn" type="button">
              시즌 생성
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
            <h2>시즌 목록</h2>
            <div className="admin-detail-toolbar">
              <div className="admin-detail-search">
                <span className="material-symbols-outlined">search</span>
                <input
                  placeholder="시즌 검색"
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
                  진행중
                </button>
                <button
                  className={`admin-filter ${statusFilter === "closed" ? "active" : ""}`}
                  type="button"
                  onClick={() => setStatusFilter("closed")}
                >
                  종료
                </button>
              </div>
            </div>
            {loading ? <p className="admin-detail-note">시즌을 불러오는 중...</p> : null}
            {error ? <p className="admin-detail-note error">{error}</p> : null}
            <table className="admin-detail-table">
              <thead>
                <tr>
                  <th>시즌명</th>
                  <th>시작</th>
                  <th>종료</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {filteredSeasons.map((season) => (
                  <tr key={season.name}>
                    <td>{season.name}</td>
                    <td>{season.start}</td>
                    <td>{season.end}</td>
                    <td>
                      <span className="status-pill" data-status={season.status}>
                        {season.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-detail-card">
            <h3>시즌 안내</h3>
            <p>한 시즌은 한 달로 설정됩니다.</p>
            <div className="admin-detail-tag">다음 시즌 준비 1건</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminSeasonsPage;
