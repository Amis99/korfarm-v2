import { useState } from "react";

function TreeNode({ node, categoryKey, onSelectItem, selectedNodeId, depth }) {
  const [open, setOpen] = useState(false);
  const indent = { paddingLeft: 12 + depth * 12 };
  const isItem = node.type === "db-row" || node.type === "file";
  const isFolder = node.type === "folder";
  // node.id 형식: "{cat}/..." → 첫 segment 제거한 나머지가 실제 item id
  const realId = node.id.split("/").slice(1).join("/");

  if (isItem) {
    const isSel = selectedNodeId === node.id;
    return (
      <button
        type="button"
        className={`ldb-tree-item ${isSel ? "selected" : ""}`}
        style={indent}
        onClick={() => onSelectItem(categoryKey, realId, node.label, node.id)}
      >
        <span className="ldb-tree-storage">{node.storage}</span>
        <span className="ldb-tree-label" title={node.label}>{node.label}</span>
      </button>
    );
  }

  if (isFolder) {
    return (
      <>
        <button
          type="button"
          className="ldb-tree-folder"
          style={indent}
          onClick={() => setOpen(v => !v)}
        >
          <span className={`material-symbols-outlined ${open ? "rotated" : ""}`}>chevron_right</span>
          <span className="ldb-tree-label" title={node.label}>{node.label}</span>
        </button>
        {open && (node.children || []).map(child => (
          <TreeNode
            key={child.id}
            node={child}
            categoryKey={categoryKey}
            onSelectItem={onSelectItem}
            selectedNodeId={selectedNodeId}
            depth={depth + 1}
          />
        ))}
      </>
    );
  }

  return null;
}

function CategoryNode({ category, tree, loading, onExpand, onSelectItem, selectedNodeId }) {
  const [open, setOpen] = useState(false);
  const handleClick = async () => {
    if (!open && !tree) await onExpand(category.key);
    setOpen(v => !v);
  };

  return (
    <div className="ldb-tree-cat">
      <button type="button" className="ldb-tree-cat-header" onClick={handleClick}>
        <span className={`material-symbols-outlined ${open ? "rotated" : ""}`}>chevron_right</span>
        <span style={{ flex: 1, textAlign: "left" }}>{category.label}</span>
        <span className="ldb-storage-pill">{category.storage}</span>
      </button>
      {open && (
        <div className="ldb-tree-children">
          {loading && <div className="ldb-tree-loading">불러오는 중...</div>}
          {!loading && tree && (tree.children || []).map(node => (
            <TreeNode
              key={node.id}
              node={node}
              categoryKey={category.key}
              onSelectItem={onSelectItem}
              selectedNodeId={selectedNodeId}
              depth={0}
            />
          ))}
          {!loading && tree && (tree.children || []).length === 0 && (
            <div className="ldb-tree-loading">(비어있음)</div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * 좌측 카테고리 트리 패널.
 * props:
 *   categories: [{ key, label, storage }]
 *   trees: { [catKey]: TreeNodeDto }
 *   loadingCats: Set<string>
 *   onExpand(catKey)
 *   onSelectItem(catKey, itemId, label, fullNodeId)
 *   selectedNodeId: string | null
 */
function LDBTreePanel({ categories, trees, loadingCats, onExpand, onSelectItem, selectedNodeId }) {
  return (
    <aside className="ldb-tree-panel">
      <div className="ldb-tree-header">학습 자료DB</div>
      {categories.map(cat => (
        <CategoryNode
          key={cat.key}
          category={cat}
          tree={trees[cat.key]}
          loading={loadingCats?.has(cat.key)}
          onExpand={onExpand}
          onSelectItem={onSelectItem}
          selectedNodeId={selectedNodeId}
        />
      ))}
    </aside>
  );
}

export default LDBTreePanel;
