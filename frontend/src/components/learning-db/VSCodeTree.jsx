import { useState } from "react";

/**
 * VS Code 스타일 범용 폴더 트리
 * props:
 *   title: string — 트리 제목
 *   nodes: [{id, label, type: 'folder'|'file', icon?, badge?, children?}]
 *   selected: string|null — 선택된 노드 id
 *   onSelect: (node) => void
 *   actions?: ReactNode — 트리 상단 액션 영역
 */
function VSCodeTree({ title, nodes, selected, onSelect, actions }) {
  return (
    <div className="ldb-tree">
      <div className="ldb-tree-header">
        <span className="ldb-tree-title">{title}</span>
        {actions && <div className="ldb-tree-actions">{actions}</div>}
      </div>
      <div className="ldb-tree-body">
        {nodes.map(node => (
          <TreeNode key={node.id} node={node} depth={0} selected={selected} onSelect={onSelect} />
        ))}
      </div>
    </div>
  );
}

function TreeNode({ node, depth, selected, onSelect }) {
  const [open, setOpen] = useState(false);
  const isFolder = node.type === "folder" || node.type === "group";
  const isActive = selected === node.id;

  const handleClick = () => {
    if (isFolder) {
      setOpen(v => !v);
      if (node.selectable !== false) onSelect(node);
    } else {
      onSelect(node);
    }
  };

  const indent = depth * 16;

  return (
    <>
      <div
        className={`ldb-tree-node ${isActive ? "active" : ""} ${isFolder ? "folder" : "file"}`}
        style={{ paddingLeft: 8 + indent }}
        onClick={handleClick}
      >
        {/* indent guide lines */}
        {depth > 0 && Array.from({ length: depth }, (_, i) => (
          <span key={i} className="ldb-tree-guide" style={{ left: 12 + i * 16 }} />
        ))}

        {isFolder && (
          <span className={`material-symbols-outlined ldb-tree-chevron ${open ? "open" : ""}`}>
            chevron_right
          </span>
        )}
        {!isFolder && <span className="ldb-tree-chevron-spacer" />}

        <span className="material-symbols-outlined ldb-tree-icon">
          {node.icon || (isFolder ? (open ? "folder_open" : "folder") : "description")}
        </span>
        <span className="ldb-tree-label">{node.label}</span>
        {node.badge != null && <span className="ldb-tree-badge">{node.badge}</span>}
      </div>

      {isFolder && open && node.children?.map(child => (
        <TreeNode key={child.id} node={child} depth={depth + 1} selected={selected} onSelect={onSelect} />
      ))}
    </>
  );
}

export default VSCodeTree;
