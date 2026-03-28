import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../../utils/adminApi";
import { AREA_LABELS, SUB_AREA_LABELS, SOURCE_LABELS } from "../../constants/questionBankCodes";
import VSCodeTree from "./VSCodeTree";

const PER_PAGE = 20;

function LDBQuestionBankTab() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [reviewFilter, setReviewFilter] = useState("");
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => { loadRecords(); }, []);

  const loadRecords = async () => {
    setLoading(true);
    try {
      const data = await apiGet("/v1/admin/question-bank/records");
      setRecords(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error("레코드 로드 실패:", e);
    } finally {
      setLoading(false);
    }
  };

  // VS Code 트리 노드 구성 (영역 → 세부영역)
  const treeNodes = useMemo(() => {
    const map = {};
    records.forEach((r) => {
      const area = r.area || "미분류";
      if (!map[area]) map[area] = {};
      const sub = r.sub_area || "미분류";
      if (!map[area][sub]) map[area][sub] = 0;
      map[area][sub]++;
    });

    const totalCount = records.length;
    const rootChildren = Object.entries(map).map(([area, subs]) => {
      const areaCount = Object.values(subs).reduce((s, c) => s + c, 0);
      return {
        id: `area-${area}`,
        label: AREA_LABELS[area] || area,
        type: "folder",
        icon: "folder",
        badge: areaCount,
        _filter: { area },
        children: Object.entries(subs).map(([sub, count]) => ({
          id: `sub-${area}-${sub}`,
          label: SUB_AREA_LABELS[sub] || sub,
          type: "file",
          icon: "description",
          badge: count,
          _filter: { area, sub },
        }))
      };
    });

    return [{
      id: "qb-all",
      label: "전체",
      type: "folder",
      icon: "folder",
      badge: totalCount,
      _filter: null,
      children: rootChildren,
    }];
  }, [records]);

  const handleTreeSelect = (node) => {
    setSelectedFolder(node._filter || null);
    setPage(1);
  };

  // 필터 적용
  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return records.filter((r) => {
      if (areaFilter && r.area !== areaFilter) return false;
      if (sourceFilter && r.source_type !== sourceFilter) return false;
      if (statusFilter && r.status !== statusFilter) return false;
      if (reviewFilter && r.review_status !== reviewFilter) return false;
      if (selectedFolder) {
        if (selectedFolder.sub) {
          if (r.area !== selectedFolder.area || r.sub_area !== selectedFolder.sub) return false;
        } else if (selectedFolder.area) {
          if (r.area !== selectedFolder.area) return false;
        }
      }
      if (term) {
        const haystack = [r.record_code, r.title, r.area, r.sub_area, r.author]
          .filter(Boolean).join(" ").toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });
  }, [records, search, areaFilter, sourceFilter, statusFilter, reviewFilter, selectedFolder]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paged.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(paged.map((r) => r.id)));
  };

  const handleExport = async () => {
    if (selectedIds.size === 0) return alert("내보낼 레코드를 선택하세요.");
    try {
      const data = await apiPost("/v1/admin/question-bank/export", { record_ids: Array.from(selectedIds) });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `question-bank-export-${Date.now()}.json`; a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert("내보내기 실패: " + e.message);
    }
  };

  // 현재 선택된 트리 노드 ID
  const selectedTreeId = selectedFolder
    ? (selectedFolder.sub ? `sub-${selectedFolder.area}-${selectedFolder.sub}` : `area-${selectedFolder.area}`)
    : "qb-all";

  return (
    <>
      {/* 툴바 */}
      <div className="ldb-toolbar">
        <span className="ldb-toolbar-title">문제은행</span>
        <button className="ldb-btn ldb-btn-primary" onClick={() => navigate("/admin/learning-db/qb-import")}>
          <span className="material-symbols-outlined">upload</span>임포트
        </button>
        <button className="ldb-btn ldb-btn-secondary" onClick={() => navigate("/admin/learning-db/qb-codes")}>
          <span className="material-symbols-outlined">data_table</span>코드표
        </button>
        <button className="ldb-btn ldb-btn-secondary" onClick={handleExport} disabled={selectedIds.size === 0}>
          <span className="material-symbols-outlined">download</span>JSON 다운로드
        </button>
      </div>

      {/* 필터바 */}
      <div className="ldb-filters">
        <input className="ldb-search" placeholder="레코드 코드, 제목, 작가 검색..."
          value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        <select className="ldb-select" value={areaFilter} onChange={(e) => { setAreaFilter(e.target.value); setPage(1); }}>
          <option value="">전체 영역</option>
          {Object.entries(AREA_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="ldb-select" value={sourceFilter} onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}>
          <option value="">전체 소스</option>
          {Object.entries(SOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <select className="ldb-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">전체 상태</option>
          <option value="draft">초안</option>
          <option value="published">게시됨</option>
        </select>
        <select className="ldb-select" value={reviewFilter} onChange={(e) => { setReviewFilter(e.target.value); setPage(1); }}>
          <option value="">전체 점검</option>
          <option value="none">점검 전</option>
          <option value="in_progress">점검 중</option>
          <option value="done">점검 완료</option>
        </select>
      </div>

      {/* 본문 */}
      <div className="ldb-body">
        <VSCodeTree
          title="영역 탐색"
          nodes={treeNodes}
          selected={selectedTreeId}
          onSelect={handleTreeSelect}
        />
        <div className="ldb-editor" style={{ padding: 0, overflow: "auto" }}>
          {loading ? (
            <div className="qb-loading">불러오는 중...</div>
          ) : filtered.length === 0 ? (
            <div className="qb-empty">
              <span className="material-symbols-outlined">quiz</span>
              <p>레코드가 없습니다</p>
            </div>
          ) : (
            <>
              <div className="qb-table-card">
                <table className="qb-table">
                  <thead>
                    <tr>
                      <th style={{ width: 36 }}>
                        <input type="checkbox" checked={selectedIds.size === paged.length && paged.length > 0} onChange={toggleSelectAll} />
                      </th>
                      <th>코드</th>
                      <th>제목</th>
                      <th>영역</th>
                      <th>소스</th>
                      <th>난이도</th>
                      <th>문제수</th>
                      <th style={{ width: 44, textAlign: "center" }}>점검</th>
                      <th>상태</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paged.map((r) => (
                      <tr key={r.id}>
                        <td><input type="checkbox" checked={selectedIds.has(r.id)} onChange={() => toggleSelect(r.id)} /></td>
                        <td className="clickable" onClick={() => navigate(`/admin/learning-db/qb-records/${r.id}`)}>{r.record_code}</td>
                        <td className="clickable" onClick={() => navigate(`/admin/learning-db/qb-records/${r.id}`)}>{r.title || "-"}</td>
                        <td><span className="qb-tag">{AREA_LABELS[r.area] || r.area || "-"}</span></td>
                        <td>{SOURCE_LABELS[r.source_type] || r.source_type || "-"}</td>
                        <td>{r.difficulty ?? "-"}</td>
                        <td>{r.question_count ?? 0}</td>
                        <td style={{ textAlign: "center" }}>
                          <span className={`qb-review-dot ${r.review_status || "none"}`}
                            title={(r.review_status === "done" ? "점검 완료" : r.review_status === "in_progress" ? "점검 중" : "점검 전") +
                              (r.reviewer ? ` (${r.reviewer})` : "")} />
                        </td>
                        <td>
                          <span className={`qb-status ${r.status}`}>
                            {r.status === "draft" ? "초안" : r.status === "published" ? "게시됨" : r.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="qb-pagination">
                  <button disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>&laquo;</button>
                  {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                    const p = i + 1;
                    return <button key={p} className={safePage === p ? "active" : ""} onClick={() => setPage(p)}>{p}</button>;
                  })}
                  <button disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>&raquo;</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

export default LDBQuestionBankTab;
