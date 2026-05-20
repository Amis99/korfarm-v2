import { useState, useRef, useEffect, useMemo } from "react";
import CellStatusBadge from "./CellStatusBadge";
import "../styles/study-plan.css";

const ASSET_TYPE_LABELS = {
  korfarm: "국어농장",
  activity: "학습활동",
  test: "테스트",
  writing: "글쓰기",
};

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "전체 상태" },
  { value: "unassigned", label: "배정 전" },
  { value: "pending", label: "미수행" },
  { value: "overdue", label: "미완료" },
  { value: "done", label: "수행완료" },
  { value: "reviewed", label: "점검완료" },
  { value: "disabled", label: "비활성" },
];

// N-1 (2026-05-21) — 행(scope) 단위 필터. 학생당 plan 1개 정책으로 누적되는 오래된 행 자동 숨김.
const ROW_FILTER_OPTIONS = [
  { value: "recent", label: "최근 활동 (90일)" },   // default — 오래된 완료 행 숨김
  { value: "active", label: "진행중만" },
  { value: "completed", label: "완료만" },
  { value: "all", label: "전체 (오래된 행 포함)" },
];
const STALE_DAYS = 90;

/** scope 의 모든 활성 셀 상태로 행 분류 — "active" / "completed-recent" / "completed-old" / "empty" */
function classifyScopeStatus(scope, cells) {
  const scopeCells = (cells || []).filter((c) =>
    c.scopeId === scope.id && !c.isDisabled && c.status !== "disabled"
  );
  if (scopeCells.length === 0) return "empty";  // 빈 행 — 신규 추가나 모든 셀 비활성
  const COMPLETED_SET = new Set(["completed", "passed", "reviewed"]);
  const hasActive = scopeCells.some((c) => !COMPLETED_SET.has(c.status));
  if (hasActive) return "active";
  // 모든 셀이 완료 — 가장 최근 활동 시점으로 stale 판정
  let lastActivity = 0;
  scopeCells.forEach((c) => {
    const ts = c.reviewedAt || c.assignedAt || c.dueAt;
    if (!ts) return;
    const t = new Date(ts).getTime();
    if (!isNaN(t) && t > lastActivity) lastActivity = t;
  });
  if (lastActivity === 0) return "completed-recent";  // 시점 정보 없으면 보존
  const daysSince = (Date.now() - lastActivity) / (1000 * 60 * 60 * 24);
  return daysSince <= STALE_DAYS ? "completed-recent" : "completed-old";
}

// 6단계 라벨 매핑 — DB status → STATUS_FILTER_OPTIONS.value 와 비교용
function classifyCellStatus(cell) {
  if (!cell) return "unassigned";
  if (cell.status === "disabled" || cell.isDisabled) return "disabled";
  if (cell.status === "unassigned") return "unassigned";
  if (cell.isOverdue) return "overdue";
  if (cell.status === "reviewed") return "reviewed";
  if (cell.status === "completed" || cell.status === "passed" || cell.status === "submitted") return "done";
  return "pending";
}

// 시각 라벨용 머터리얼 심볼 아이콘 (작업 6)
const ASSET_TYPE_ICONS = {
  korfarm: "menu_book",
  writing: "edit_note",
  test: "assignment",
  activity: "upload_file",
};

export default function StudyPlanMatrix({
  scopes, assets, cells, admin, onCellClick,
  onAddScope, onDeleteScope, onAddAsset, onDeleteAsset,
}) {
  // ── 필터·정렬 toolbar 상태 ──
  const [statusFilter, setStatusFilter] = useState("all");
  const [assetTypeFilter, setAssetTypeFilter] = useState("all");
  const [scopeSearch, setScopeSearch] = useState("");
  const [scopeSort, setScopeSort] = useState("created");   // 'created' | 'label'
  const [assetSort, setAssetSort] = useState("created");   // 'created' | 'label' | 'type'
  const [rowFilter, setRowFilter] = useState("recent");    // N-1: 행 필터 default — 오래된 완료 행 자동 숨김

  const cellMap = {};
  (cells || []).forEach((c) => {
    cellMap[`${c.scopeId}_${c.assetId}`] = c;
  });

  // 필터·정렬된 scopes / assets — useMemo 로 메모이즈
  const filteredScopes = useMemo(() => {
    let arr = (scopes || []);
    if (scopeSearch.trim()) {
      const q = scopeSearch.trim().toLowerCase();
      arr = arr.filter((s) => (s.label || "").toLowerCase().includes(q));
    }
    // N-1 (2026-05-21) — 행 필터 적용
    arr = arr.filter((s) => {
      const status = classifyScopeStatus(s, cells);
      if (status === "empty") return true; // 신규 추가 빈 행은 항상 표시
      switch (rowFilter) {
        case "active":     return status === "active";
        case "completed":  return status === "completed-recent" || status === "completed-old";
        case "all":        return true;
        case "recent":
        default:           return status !== "completed-old";  // 90일 이전 완료 행만 숨김
      }
    });
    if (scopeSort === "label") {
      arr = [...arr].sort((a, b) => (a.label || "").localeCompare(b.label || "", "ko"));
    }
    // 'created' 는 백엔드 sortOrder ASC 그대로
    return arr;
  }, [scopes, cells, scopeSearch, scopeSort, rowFilter]);

  // 숨겨진 오래된 행 개수 — 사용자에게 "N건 숨김" 안내용
  const hiddenOldRowCount = useMemo(() => {
    if (rowFilter !== "recent") return 0;
    return (scopes || []).filter((s) => classifyScopeStatus(s, cells) === "completed-old").length;
  }, [scopes, cells, rowFilter]);

  const filteredAssets = useMemo(() => {
    let arr = (assets || []);
    if (assetTypeFilter !== "all") {
      arr = arr.filter((a) => a.assetType === assetTypeFilter);
    }
    if (assetSort === "label") {
      arr = [...arr].sort((a, b) => (a.label || "").localeCompare(b.label || "", "ko"));
    } else if (assetSort === "type") {
      arr = [...arr].sort((a, b) => (a.assetType || "").localeCompare(b.assetType || ""));
    }
    return arr;
  }, [assets, assetTypeFilter, assetSort]);

  // 인라인 범위 추가
  const [newScopeLabel, setNewScopeLabel] = useState("");
  const [addingScope, setAddingScope] = useState(false);

  // 에셋 추가 팝오버 — 종류 + 이름만 받음. 실제 콘텐츠/주제/테스트 선택은 셀 배정 단계에서 진행.
  const [showAssetPopover, setShowAssetPopover] = useState(false);
  const [newAssetType, setNewAssetType] = useState("activity");
  const [newAssetLabel, setNewAssetLabel] = useState("");
  const popoverRef = useRef(null);

  useEffect(() => {
    if (!showAssetPopover) return;
    const handler = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setShowAssetPopover(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showAssetPopover]);

  const handleScopeAdd = () => {
    if (!newScopeLabel.trim() || !onAddScope) return;
    onAddScope(newScopeLabel.trim());
    setNewScopeLabel("");
    setAddingScope(false);
  };

  const handleAssetAdd = () => {
    if (!onAddAsset) return;
    const assetKind =
      newAssetType === "test" ? "test" :
      newAssetType === "writing" ? "write" : "study";
    // 이름 비어있으면 자동 생성: "국어농장 1", "학습활동 2", ...
    let label = newAssetLabel.trim();
    if (!label) {
      const typeLabel = ASSET_TYPE_LABELS[newAssetType] || newAssetType;
      const sameTypeCount = (assets || []).filter(a => a.assetType === newAssetType).length;
      label = `${typeLabel} ${sameTypeCount + 1}`;
    }
    onAddAsset({
      assetType: newAssetType,
      label,
      assetKind,
    });
    setNewAssetLabel("");
    setNewAssetType("activity");
    setShowAssetPopover(false);
  };

  const getCellClassName = (cell) => {
    if (!cell) return "";
    if (cell.status === "disabled" || cell.isDisabled) return "cell-disabled";
    if (cell.status === "unassigned") return "cell-unassigned";
    if (cell.status === "partial") return "cell-partial";
    return "";
  };

  return (
    <div className="sp-matrix-wrap">
      {/* ── 필터·정렬 toolbar ── */}
      <div className="sp-matrix-toolbar">
        <input
          type="text"
          className="sp-toolbar-input"
          placeholder="🔍 행 라벨 검색"
          value={scopeSearch}
          onChange={(e) => setScopeSearch(e.target.value)}
        />
        <select
          className="sp-toolbar-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          title="상태 필터 — 매칭 외 셀은 흐려짐"
        >
          {STATUS_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          className="sp-toolbar-select"
          value={assetTypeFilter}
          onChange={(e) => setAssetTypeFilter(e.target.value)}
          title="자산 종류 필터"
        >
          <option value="all">전체 자산</option>
          {Object.entries(ASSET_TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        {/* N-1 (2026-05-21) — 행 단위 필터 (오래된 완료 행 자동 숨김 default) */}
        <select
          className="sp-toolbar-select"
          value={rowFilter}
          onChange={(e) => setRowFilter(e.target.value)}
          title="행 표시 — 90일 이상 지난 완료 행은 default 로 숨김"
        >
          {ROW_FILTER_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          className="sp-toolbar-select"
          value={scopeSort}
          onChange={(e) => setScopeSort(e.target.value)}
          title="행 정렬"
        >
          <option value="created">행: 추가순</option>
          <option value="label">행: 가나다순</option>
        </select>
        <select
          className="sp-toolbar-select"
          value={assetSort}
          onChange={(e) => setAssetSort(e.target.value)}
          title="열 정렬"
        >
          <option value="created">열: 추가순</option>
          <option value="label">열: 가나다순</option>
          <option value="type">열: 자산종류</option>
        </select>
        {(statusFilter !== "all" || assetTypeFilter !== "all" || scopeSearch || scopeSort !== "created" || assetSort !== "created" || rowFilter !== "recent") && (
          <button
            className="sp-toolbar-reset"
            onClick={() => {
              setStatusFilter("all");
              setAssetTypeFilter("all");
              setScopeSearch("");
              setScopeSort("created");
              setAssetSort("created");
              setRowFilter("recent");
            }}
          >초기화</button>
        )}
        {/* N-1 — 숨겨진 오래된 행 안내 칩 */}
        {hiddenOldRowCount > 0 && rowFilter === "recent" && (
          <span
            className="sp-toolbar-hidden-rows"
            style={{
              fontSize: 12,
              color: "var(--admin-muted, #5a6b5f)",
              background: "rgba(120,120,120,0.08)",
              padding: "4px 10px",
              borderRadius: 12,
              cursor: "pointer",
            }}
            onClick={() => setRowFilter("all")}
            title="90일 이상 지난 완료 행을 숨겼습니다. 클릭하면 전체 표시."
          >
            오래된 행 {hiddenOldRowCount}건 숨김
          </span>
        )}
        {/* 일괄 PDF 인쇄 — 매트릭스의 모든 국어농장 배정 콘텐츠 ID 수집 후 새 탭으로 */}
        <button
          className="sp-toolbar-reset"
          style={{ marginLeft: "auto", background: "#2f7a3e", color: "#fff", borderColor: "#2f7a3e" }}
          onClick={() => {
            const ids = [];
            filteredAssets.forEach((asset) => {
              if (asset.assetType !== "korfarm") return;
              filteredScopes.forEach((scope) => {
                const cell = cellMap[`${scope.id}_${asset.id}`];
                if (!cell) return;
                if (Array.isArray(cell.assignments)) {
                  cell.assignments.forEach((a) => {
                    const cid = a.contentId || a.refId || a.cellRefId;
                    if (cid) ids.push(cid);
                  });
                } else {
                  const cid = cell.contentId || cell.cellRefId || cell.refId;
                  if (cid) ids.push(cid);
                }
              });
            });
            const uniq = [...new Set(ids)];
            if (uniq.length === 0) {
              alert("인쇄할 국어농장 배정 콘텐츠가 없습니다.");
              return;
            }
            window.open(`/admin/print-content?ids=${encodeURIComponent(uniq.join(","))}`, "_blank");
          }}
          title="배정된 국어농장 콘텐츠 모두 PDF 로 인쇄"
        >
          🖨 일괄 PDF 인쇄
        </button>
      </div>
      <table className={`sp-matrix${admin ? " admin-theme" : ""}`}>
        <thead>
          <tr>
            <th>범위</th>
            {filteredAssets.map((a) => (
              <th key={a.id} className="sp-asset-header">
                <div className="sp-asset-header-content">
                  <span className={`sp-asset-type-badge ${a.assetType || "activity"}`}>
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 12, verticalAlign: "middle", marginRight: 3 }}
                    >
                      {ASSET_TYPE_ICONS[a.assetType] || "label"}
                    </span>
                    {ASSET_TYPE_LABELS[a.assetType] || a.assetType}
                  </span>
                  <span className="sp-asset-label">{a.label}</span>
                  {admin && onDeleteAsset && (
                    <button
                      className="sp-delete-btn"
                      onClick={(e) => { e.stopPropagation(); onDeleteAsset(a.id); }}
                      title="열 삭제"
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                    </button>
                  )}
                </div>
              </th>
            ))}
            {admin && onAddAsset && (
              <th className="sp-add-col-th" style={{ position: "relative" }}>
                <button
                  className="sp-add-col-btn"
                  onClick={() => setShowAssetPopover(!showAssetPopover)}
                  title="열 추가"
                >+</button>
                {showAssetPopover && (
                  <div className="sp-asset-popover" ref={popoverRef}>
                    <div className="sp-asset-type-select">
                      {Object.entries(ASSET_TYPE_LABELS).map(([key, label]) => (
                        <button
                          key={key}
                          className={`sp-asset-type-option ${key} ${newAssetType === key ? "active" : ""}`}
                          onClick={() => setNewAssetType(key)}
                        >{label}</button>
                      ))}
                    </div>
                    <input
                      className="asp-input sp-popover-input"
                      value={newAssetLabel}
                      onChange={(e) => setNewAssetLabel(e.target.value)}
                      placeholder={`열 이름 (비우면 "${ASSET_TYPE_LABELS[newAssetType] || newAssetType} ${(assets || []).filter(a => a.assetType === newAssetType).length + 1}")`}
                      onKeyDown={(e) => e.key === "Enter" && handleAssetAdd()}
                      autoFocus
                    />
                    <div style={{ fontSize: 11, color: "#888", margin: "4px 0 8px" }}>
                      실제 학습/테스트/주제 선택은 셀의 "배정 전" 클릭 시 진행합니다.
                    </div>
                    <button className="asp-add-btn sp-popover-add" onClick={handleAssetAdd}>추가</button>
                  </div>
                )}
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {filteredScopes.map((scope) => (
            <tr key={scope.id}>
              <th className="sp-scope-header">
                <span>{scope.label}</span>
                {admin && onDeleteScope && (
                  <button
                    className="sp-delete-btn"
                    onClick={(e) => { e.stopPropagation(); onDeleteScope(scope.id); }}
                    title="행 삭제"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
                  </button>
                )}
              </th>
              {filteredAssets.map((asset) => {
                const cell = cellMap[`${scope.id}_${asset.id}`];
                const extraCls = getCellClassName(cell);
                // status 필터 매칭 안 되면 흐리게
                const stage = classifyCellStatus(cell);
                const dimmed = statusFilter !== "all" && stage !== statusFilter;
                const dimStyle = dimmed ? { opacity: 0.25 } : undefined;
                const studentUnassigned = !admin && cell?.status === "unassigned";
                const isDisabled = cell?.status === "disabled" || cell?.isDisabled;
                const studentDisabled = !admin && isDisabled;
                const handleClick = () => {
                  if (studentUnassigned || studentDisabled) return;
                  onCellClick?.(cell, scope, asset);
                };
                return (
                  <td
                    key={asset.id}
                    className={extraCls}
                    onClick={handleClick}
                    title={cell?.status === "partial" && cell?.adminNote ? `사유: ${cell.adminNote}` : undefined}
                    style={{
                      ...dimStyle,
                      ...(studentUnassigned ? { cursor: "default" } : null),
                    }}
                  >
                    {cell ? (
                      <>
                        <CellStatusBadge
                          status={cell.status}
                          isOverdue={cell.isOverdue}
                        />
                        {asset.assetType === "korfarm" && (cell.assignments?.length || 0) > 1 && (
                          <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>
                            {cell.assignments.filter((a) => a.status === "completed").length}
                            /
                            {cell.assignments.length}
                          </div>
                        )}
                        {/* 개별 PDF 인쇄는 셀 클릭 → 학습 결과 확인 모달 안의 'PDF 인쇄' 버튼으로 이동 */}
                      </>
                    ) : (
                      <span style={{ color: "#bbb", fontSize: "0.75rem" }}>-</span>
                    )}
                  </td>
                );
              })}
              {admin && onAddAsset && <td />}
            </tr>
          ))}
          {admin && onAddScope && (
            <tr className="sp-add-row">
              <th colSpan={filteredAssets.length + 1 + (admin && onAddAsset ? 1 : 0)}>
                {addingScope ? (
                  <div className="sp-add-scope-input-wrap">
                    <input
                      className="asp-input sp-add-scope-input"
                      value={newScopeLabel}
                      onChange={(e) => setNewScopeLabel(e.target.value)}
                      placeholder="범위 이름 입력 후 Enter"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleScopeAdd();
                        if (e.key === "Escape") { setAddingScope(false); setNewScopeLabel(""); }
                      }}
                      onBlur={() => { if (!newScopeLabel.trim()) setAddingScope(false); }}
                      autoFocus
                    />
                  </div>
                ) : (
                  <button className="sp-add-row-btn" onClick={() => setAddingScope(true)}>
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
                    범위 추가...
                  </button>
                )}
              </th>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
