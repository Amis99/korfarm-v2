import { useEffect, useMemo, useState, useCallback } from "react";
import { apiPost, apiGet } from "../utils/adminApi";
import { useAdminList } from "../hooks/useAdminList";
import AdminLayout from "../components/AdminLayout";
import Pagination from "../components/Pagination";
import usePagination from "../hooks/usePagination";
import "../styles/admin-detail.css";

const SEASONS = [
  { name: "2026년 1월 시즌", start: "2026-01-01", end: "2026-01-31", status: "active", levelId: "saussure1" },
];

const SERVERS = [
  { id: "saussure", label: "소쉬르" },
  { id: "frege", label: "프레게" },
  { id: "russell", label: "러셀" },
  { id: "wittgenstein", label: "비트겐슈타인" },
];

const mapSeasons = (items) =>
  items.map((item) => ({
    id: item.id || item.season_id || item.name,
    name: item.name,
    levelId: item.levelId || item.level_id || "",
    start: item.start_date || item.startDate || item.start_at || item.startAt || "-",
    end: item.end_date || item.endDate || item.end_at || item.endAt || "-",
    status: item.status || "active",
  }));

function AdminSeasonsPage({ wrap = true }) {
  const { data: seasons, loading, error } = useAdminList("/v1/admin/duel/seasons", SEASONS, mapSeasons);
  const [rows, setRows] = useState(SEASONS);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ levelId: "", name: "", startAt: "", endAt: "" });
  const [actionError, setActionError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // 선택된 시즌·서버 + 랭킹 표시
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [selectedServer, setSelectedServer] = useState("saussure");
  const [rankings, setRankings] = useState(null);
  const [rankingsLoading, setRankingsLoading] = useState(false);
  const [recalcLoading, setRecalcLoading] = useState(false);

  useEffect(() => { setRows(seasons); }, [seasons]);

  const filteredSeasons = useMemo(() => {
    const term = search.trim().toLowerCase();
    return rows.filter((season) => {
      if (statusFilter !== "all" && season.status !== statusFilter) return false;
      if (!term) return true;
      return [season.name, season.status, season.start, season.end]
        .filter(Boolean).some((v) => String(v).toLowerCase().includes(term));
    });
  }, [rows, search, statusFilter]);

  const { page, setPage, totalPages, paged: pagedSeasons } = usePagination(filteredSeasons, 10);
  useEffect(() => { setPage(1); }, [search, statusFilter, setPage]);

  const loadRankings = useCallback(async (seasonId, serverId) => {
    setRankingsLoading(true);
    setRankings(null);
    try {
      const res = await apiGet(`/v1/admin/duel/rankings?seasonId=${encodeURIComponent(seasonId)}&serverId=${encodeURIComponent(serverId)}`);
      setRankings(res);
    } catch (e) {
      setRankings({ error: e.message });
    } finally {
      setRankingsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedSeason) loadRankings(selectedSeason.id, selectedServer);
  }, [selectedSeason, selectedServer, loadRankings]);

  const handleRecalculate = async () => {
    if (!selectedSeason) return;
    setRecalcLoading(true);
    try {
      await apiPost("/v1/admin/duel/recalculate", { seasonId: selectedSeason.id, levelId: selectedServer });
      await loadRankings(selectedSeason.id, selectedServer);
    } catch (e) {
      alert("재계산 실패: " + e.message);
    } finally {
      setRecalcLoading(false);
    }
  };

  const handleCreate = async () => {
    setActionError("");
    if (!formData.name.trim() || !formData.startAt || !formData.endAt) {
      setActionError("시즌명, 시작일, 종료일을 모두 입력해 주세요.");
      return;
    }
    setActionLoading(true);
    try {
      await apiPost("/v1/admin/duel/seasons", {
        levelId: formData.levelId.trim() || "saussure",
        name: formData.name.trim(),
        startAt: formData.startAt,
        endAt: formData.endAt,
      });
      setShowCreateModal(false);
      setFormData({ levelId: "", name: "", startAt: "", endAt: "" });
      const refreshed = await apiGet("/v1/admin/duel/seasons");
      setRows(mapSeasons(refreshed));
    } catch (err) {
      setActionError(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // 랭킹 카드 렌더링
  const renderRankingTable = (title, items) => (
    <div style={{ marginBottom: 16 }}>
      <h4 style={{ margin: "0 0 6px", fontSize: 13, fontWeight: 700 }}>{title}</h4>
      {(!items || items.length === 0) ? (
        <p style={{ fontSize: 12, color: "#888" }}>(데이터 없음)</p>
      ) : (
        <table className="admin-detail-table" style={{ fontSize: 12 }}>
          <thead><tr><th style={{ width: 36 }}>#</th><th>userId</th><th style={{ width: 80 }}>값</th></tr></thead>
          <tbody>
            {items.slice(0, 10).map((it, i) => (
              <tr key={i}>
                <td>{it.rank}</td>
                <td>{it.userId}</td>
                <td style={{ fontWeight: 600 }}>{typeof it.value === "number" ? it.value.toFixed(2) : it.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const content = (
    <>
      <div className="admin-detail-header">
        {wrap && <h1>시즌·랭킹</h1>}
        <div className="admin-detail-actions">
          <button className="admin-detail-btn" type="button"
            onClick={() => {
              setFormData({ levelId: "", name: "", startAt: "", endAt: "" });
              setActionError("");
              setShowCreateModal(true);
            }}>
            시즌 생성
          </button>
        </div>
      </div>
      <div className="admin-detail-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: 16 }}>
        <div className="admin-detail-card">
          <h2>시즌 목록</h2>
          <div className="admin-detail-toolbar">
            <div className="admin-detail-search">
              <span className="material-symbols-outlined">search</span>
              <input placeholder="시즌 검색" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div className="admin-detail-filters">
              {["all", "active", "scheduled", "completed"].map((f) => (
                <button key={f} className={`admin-filter ${statusFilter === f ? "active" : ""}`} type="button"
                  onClick={() => setStatusFilter(f)}>
                  {f === "all" ? "전체" : f === "active" ? "진행중" : f === "scheduled" ? "예정" : "종료"}
                </button>
              ))}
            </div>
          </div>
          {loading && <p className="admin-detail-note">시즌을 불러오는 중...</p>}
          {error && <p className="admin-detail-note error">{error}</p>}
          <table className="admin-detail-table">
            <thead>
              <tr><th>시즌명</th><th>레벨/서버</th><th>시작</th><th>종료</th><th>상태</th></tr>
            </thead>
            <tbody>
              {pagedSeasons.map((season) => (
                <tr key={season.id}
                  className={selectedSeason?.id === season.id ? "selected" : ""}
                  style={{ cursor: "pointer", background: selectedSeason?.id === season.id ? "rgba(45,106,79,0.08)" : undefined }}
                  onClick={() => setSelectedSeason(season)}>
                  <td>{season.name}</td>
                  <td>{season.levelId || "-"}</td>
                  <td>{String(season.start).substring(0, 10)}</td>
                  <td>{String(season.end).substring(0, 10)}</td>
                  <td>
                    <span className="status-pill" data-status={season.status}>{season.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>

        <div className="admin-detail-card">
          {!selectedSeason && (
            <p style={{ color: "#888", textAlign: "center", padding: 32 }}>좌측에서 시즌을 선택하세요.</p>
          )}
          {selectedSeason && (
            <>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <h2 style={{ margin: 0 }}>랭킹 — {selectedSeason.name}</h2>
                <button type="button" className="admin-detail-btn sm" disabled={recalcLoading} onClick={handleRecalculate}>
                  {recalcLoading ? "재계산 중…" : "재계산"}
                </button>
              </div>
              <div className="admin-detail-filters" style={{ marginBottom: 12 }}>
                {SERVERS.map(s => (
                  <button key={s.id} type="button"
                    className={`admin-filter ${selectedServer === s.id ? "active" : ""}`}
                    onClick={() => setSelectedServer(s.id)}>{s.label}</button>
                ))}
              </div>
              {rankingsLoading && <p className="admin-detail-note">불러오는 중...</p>}
              {rankings?.error && <p className="admin-detail-note error">{rankings.error}</p>}
              {rankings && !rankings.error && (
                <>
                  <p style={{ fontSize: 11, color: "#888", marginBottom: 12 }}>
                    스냅샷 시각: {rankings.generatedAt ? rankings.generatedAt.substring(0, 19) : "(스냅샷 없음 — 실시간 계산)"}
                    {rankings.live && " · 실시간"}
                  </p>
                  {renderRankingTable("🏆 승수 Top 10", rankings.leaderboards?.wins)}
                  {renderRankingTable("📊 승률 Top 10", rankings.leaderboards?.winRate)}
                  {renderRankingTable("🔥 최고 연승 Top 10", rankings.leaderboards?.bestStreak)}
                </>
              )}
            </>
          )}
        </div>
      </div>

      {showCreateModal && (
        <div className="admin-modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <h2>시즌 생성</h2>
            {actionError && <p className="admin-detail-note error">{actionError}</p>}
            <div className="admin-modal-field">
              <label>시즌명</label>
              <input value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="2026년 2월 시즌" />
            </div>
            <div className="admin-modal-field">
              <label>레벨/서버 ID</label>
              <input value={formData.levelId}
                onChange={(e) => setFormData({ ...formData, levelId: e.target.value })}
                placeholder="saussure / frege / russell / wittgenstein" />
            </div>
            <div className="admin-modal-field">
              <label>시작일</label>
              <input type="date" value={formData.startAt}
                onChange={(e) => setFormData({ ...formData, startAt: e.target.value })} />
            </div>
            <div className="admin-modal-field">
              <label>종료일</label>
              <input type="date" value={formData.endAt}
                onChange={(e) => setFormData({ ...formData, endAt: e.target.value })} />
            </div>
            <div className="admin-modal-actions">
              <button className="admin-detail-btn" onClick={handleCreate} disabled={actionLoading}>생성</button>
              <button className="admin-detail-btn secondary" onClick={() => setShowCreateModal(false)}>취소</button>
            </div>
          </div>
        </div>
      )}
    </>
  );

  if (wrap) {
    return <AdminLayout><div className="admin-detail-wrap">{content}</div></AdminLayout>;
  }
  return content;
}

export default AdminSeasonsPage;
