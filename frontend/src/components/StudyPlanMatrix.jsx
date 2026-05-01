import { useState, useRef, useEffect } from "react";
import CellStatusBadge from "./CellStatusBadge";
import "../styles/study-plan.css";

const ASSET_TYPE_LABELS = {
  korfarm: "국어농장",
  activity: "학습활동",
  test: "테스트",
  writing: "글쓰기",
};

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
  const cellMap = {};
  (cells || []).forEach((c) => {
    cellMap[`${c.scopeId}_${c.assetId}`] = c;
  });

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
      <table className={`sp-matrix${admin ? " admin-theme" : ""}`}>
        <thead>
          <tr>
            <th>범위</th>
            {(assets || []).map((a) => (
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
          {(scopes || []).map((scope) => (
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
              {(assets || []).map((asset) => {
                const cell = cellMap[`${scope.id}_${asset.id}`];
                const extraCls = getCellClassName(cell);
                const handleClick = () => {
                  // 학생 뷰: unassigned 클릭 시 무반응
                  if (!admin && cell?.status === "unassigned") return;
                  onCellClick?.(cell, scope, asset);
                };
                return (
                  <td
                    key={asset.id}
                    className={extraCls}
                    onClick={handleClick}
                    title={cell?.status === "partial" && cell?.adminNote ? `사유: ${cell.adminNote}` : undefined}
                    style={!admin && cell?.status === "unassigned" ? { cursor: "default" } : undefined}
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
              <th colSpan={(assets || []).length + 1 + (admin && onAddAsset ? 1 : 0)}>
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
