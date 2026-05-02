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
];

// 5단계 라벨 매핑 — DB status → STATUS_FILTER_OPTIONS.value 와 비교용
function classifyCellStatus(cell) {
  if (!cell) return "unassigned";
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
    if (scopeSort === "label") {
      arr = [...arr].sort((a, b) => (a.label || "").localeCompare(b.label || "", "ko"));
    }
    // 'created' 는 백엔드 sortOrder ASC 그대로
    return arr;
  }, [scopes, scopeSearch, scopeSort]);

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
    if (!newAssetLabel.trim() || !onAddAsset) return;
    const assetKind =
      newAssetType === "test" ? "test" :
      newAssetType === "writing" ? "write" : "study";
    onAddAsset({
      assetType: newAssetType,
      label: newAssetLabel.trim(),
      assetKind,
    });
    setNewAssetLabel("");
    setNewAssetType("activity");
    setShowAssetPopover(false);
  };

  const getCellClassName = (cell) => {
    if (!cell) return "";
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
        {(statusFilter !== "all" || assetTypeFilter !== "all" || scopeSearch || scopeSort !== "created" || assetSort !== "created") && (
          <button
            className="sp-toolbar-reset"
            onClick={() => {
              setStatusFilter("all");
              setAssetTypeFilter("all");
              setScopeSearch("");
              setScopeSort("created");
              setAssetSort("created");
            }}
          >초기화</button>
        )}
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
                      placeholder="열 이름"
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
                const handleClick = () => {
                  if (studentUnassigned) return;
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
                      <CellStatusBadge
                        status={cell.status}
                        isOverdue={cell.isOverdue}
                      />
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
