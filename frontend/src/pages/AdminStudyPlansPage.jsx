import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost, apiDelete } from "../utils/api";
import AdminLayout from "../components/AdminLayout";
import StudyPlanCreateForm from "../components/StudyPlanCreateForm";
import "../styles/admin-study-plan.css";

export default function AdminStudyPlansPage() {
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchText, setSearchText] = useState("");
  const [selectedIds, setSelectedIds] = useState(new Set());

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (searchText.trim()) params.set("search", searchText.trim());
    const qs = params.toString();
    apiGet(`/v1/admin/study-plans${qs ? `?${qs}` : ""}`)
      .then((data) => { setPlans(Array.isArray(data) ? data : []); setSelectedIds(new Set()); })
      .catch(() => setPlans([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [statusFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    load();
  };

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === plans.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(plans.map((p) => p.planId)));
    }
  };

  const handleBatchArchive = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`${selectedIds.size}개 계획표를 보관 처리하시겠습니까?`)) return;
    try {
      await Promise.all(
        [...selectedIds].map((id) => apiPost(`/v1/admin/study-plans/${id}/archive`))
      );
      load();
    } catch (e) {
      alert(e.message || "보관 처리 실패");
    }
  };

  const handleBatchUnarchive = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`${selectedIds.size}개 계획표를 진행중으로 복원하시겠습니까?`)) return;
    try {
      await Promise.all(
        [...selectedIds].map((id) => apiPost(`/v1/admin/study-plans/${id}/unarchive`))
      );
      load();
    } catch (e) {
      alert(e.message || "복원 실패");
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`${selectedIds.size}개 계획표를 완전히 삭제하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.`)) return;
    try {
      await Promise.all(
        [...selectedIds].map((id) => apiDelete(`/v1/admin/study-plans/${id}`))
      );
      load();
    } catch (e) {
      alert(e.message || "삭제 실패");
    }
  };

  // 선택된 항목 중 보관/진행중 상태 분류
  const selectedPlans = plans.filter((p) => selectedIds.has(p.planId));
  const hasArchived = selectedPlans.some((p) => p.status === "archived");
  const hasActive = selectedPlans.some((p) => p.status === "active");

  return (
    <AdminLayout>
      <div className="asp-header">
        <h1>
          <span className="material-symbols-outlined">event_note</span>
          학습 계획표
        </h1>
        <button className="asp-create-btn" onClick={() => setShowCreate(true)}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
          새 계획표
        </button>
      </div>

      {/* 필터/검색 바 */}
      <div className="asp-filter-bar">
        <select
          className="asp-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">전체 상태</option>
          <option value="active">진행중</option>
          <option value="archived">보관</option>
        </select>
        <form onSubmit={handleSearch} className="asp-search-form">
          <input
            className="asp-input"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="제목 검색..."
          />
          <button type="submit" className="asp-add-btn">검색</button>
        </form>
        {selectedIds.size > 0 && (
          <div style={{ display: "flex", gap: 6 }}>
            {hasActive && (
              <button className="asp-archive-btn" onClick={handleBatchArchive}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>archive</span>
                보관 ({selectedIds.size})
              </button>
            )}
            {hasArchived && (
              <button className="asp-add-btn" onClick={handleBatchUnarchive}>
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>unarchive</span>
                복원 ({selectedIds.size})
              </button>
            )}
            <button className="asp-archive-btn" onClick={handleBatchDelete} style={{ background: "#dc3545" }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>delete</span>
              삭제 ({selectedIds.size})
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="asp-loading">불러오는 중...</div>
      ) : plans.length === 0 ? (
        <div className="asp-empty">
          <span className="material-symbols-outlined">event_note</span>
          <p>등록된 학습 계획표가 없습니다.</p>
        </div>
      ) : (
        <table className="asp-table">
          <thead>
            <tr>
              <th style={{ width: 36 }}>
                <input
                  type="checkbox"
                  checked={plans.length > 0 && selectedIds.size === plans.length}
                  onChange={toggleAll}
                />
              </th>
              <th>제목</th>
              <th>기간</th>
              <th>대상</th>
              <th>상태</th>
              <th>생성일</th>
            </tr>
          </thead>
          <tbody>
            {plans.map((p) => (
              <tr key={p.planId}>
                <td onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(p.planId)}
                    onChange={() => toggleSelect(p.planId)}
                  />
                </td>
                <td onClick={() => navigate(`/admin/study-plans/${p.planId}`)} style={{ cursor: "pointer" }}>
                  {p.title}
                </td>
                <td>{p.startDate} ~ {p.endDate}</td>
                <td>{p.targetCount}건</td>
                <td>
                  <span className={`asp-status ${p.status}`}>
                    {p.status === "active" ? "진행중" : "보관"}
                  </span>
                </td>
                <td>{p.createdAt?.split("T")[0]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showCreate && (
        <StudyPlanCreateForm
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load(); }}
        />
      )}
    </AdminLayout>
  );
}
