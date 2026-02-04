import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { apiPost } from "../utils/adminApi";
import { useAdminList } from "../hooks/useAdminList";
import "../styles/admin-detail.css";

const SEASONS = [
  { name: "2026년 1월 시즌", start: "2026-01-01", end: "2026-01-31", status: "active" },
];

const mapSeasons = (items) =>
  items.map((item) => ({
    id: item.id || item.season_id || item.name,
    name: item.name,
    start: item.start_date || item.startDate || item.start_at || item.startAt || "-",
    end: item.end_date || item.endDate || item.end_at || item.endAt || "-",
    status: item.status || "active",
  }));

function AdminSeasonsPage() {
  const { data: seasons, loading, error } = useAdminList("/v1/admin/seasons", SEASONS, mapSeasons);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ levelId: "", name: "", startAt: "", endAt: "" });
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const filteredSeasons = useMemo(() => {
    const term = search.trim().toLowerCase();
    return seasons.filter((season) => {
      if (statusFilter !== "all" && season.status !== statusFilter) return false;
      if (!term) return true;
      return [season.name, season.status, season.start, season.end]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(term));
    });
  }, [seasons, search, statusFilter]);

  const handleCreate = async () => {
    setActionError("");
    if (!formData.name.trim() || !formData.startAt || !formData.endAt) {
      setActionError("시즌명, 시작일, 종료일을 모두 입력해 주세요.");
      return;
    }
    setActionLoading(true);
    try {
      await apiPost("/v1/admin/duel/seasons", {
        levelId: formData.levelId.trim() || "saussure1",
        name: formData.name.trim(),
        startAt: formData.startAt,
        endAt: formData.endAt,
      });
      setShowCreateModal(false);
      setFormData({ levelId: "", name: "", startAt: "", endAt: "" });
      window.location.reload();
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
          <h1>시즌 관리</h1>
          <div className="admin-detail-actions">
            <button
              className="admin-detail-btn"
              type="button"
              onClick={() => {
                setFormData({ levelId: "", name: "", startAt: "", endAt: "" });
                setActionError("");
                setShowCreateModal(true);
              }}
            >
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
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="admin-detail-filters">
                {["all", "active", "closed"].map((f) => (
                  <button
                    key={f}
                    className={`admin-filter ${statusFilter === f ? "active" : ""}`}
                    type="button"
                    onClick={() => setStatusFilter(f)}
                  >
                    {f === "all" ? "전체" : f === "active" ? "진행중" : "종료"}
                  </button>
                ))}
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
                  <tr key={season.id}>
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
          </div>
        </div>
      </div>

      {showCreateModal ? (
        <div className="admin-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>시즌 생성</h2>
            {actionError ? <p className="admin-detail-note error">{actionError}</p> : null}
            <div className="admin-modal-field">
              <label>시즌명</label>
              <input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="2026년 2월 시즌"
              />
            </div>
            <div className="admin-modal-field">
              <label>레벨 ID</label>
              <input
                value={formData.levelId}
                onChange={(e) => setFormData({ ...formData, levelId: e.target.value })}
                placeholder="saussure1"
              />
            </div>
            <div className="admin-modal-field">
              <label>시작일</label>
              <input
                type="date"
                value={formData.startAt}
                onChange={(e) => setFormData({ ...formData, startAt: e.target.value })}
              />
            </div>
            <div className="admin-modal-field">
              <label>종료일</label>
              <input
                type="date"
                value={formData.endAt}
                onChange={(e) => setFormData({ ...formData, endAt: e.target.value })}
              />
            </div>
            <div className="admin-modal-actions">
              <button className="admin-detail-btn" onClick={handleCreate} disabled={actionLoading}>
                생성
              </button>
              <button className="admin-detail-btn secondary" onClick={() => setShowCreateModal(false)}>
                취소
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default AdminSeasonsPage;
