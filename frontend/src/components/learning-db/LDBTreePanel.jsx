import { useState } from "react";

function FileNode({ node, onSelectFile, selectedPath, depth }) {
  const indent = { paddingLeft: 12 + depth * 12 };
  const isSel = selectedPath === node.path;
  return (
    <button
      type="button"
      className={`ldb-tree-item ${isSel ? "selected" : ""}`}
      style={indent}
      onClick={() => onSelectFile(node.path, node.label)}
      title={node.path}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 14, color: "#888" }}>description</span>
      <span className="ldb-tree-label">{node.label}</span>
    </button>
  );
}

function FolderNode({ node, onSelectFile, selectedPath, depth, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const indent = { paddingLeft: 12 + depth * 12 };
  const childCount = (node.children || []).length;
  const icon = node.type === "kind" ? "topic"
    : node.type === "subArea" ? "folder"
    : "category";
  return (
    <>
      <button type="button" className="ldb-tree-folder" style={indent} onClick={() => setOpen(v => !v)}>
        <span className={`material-symbols-outlined ${open ? "rotated" : ""}`}>chevron_right</span>
        <span className="material-symbols-outlined" style={{ fontSize: 14, color: "#777" }}>{icon}</span>
        <span className="ldb-tree-label">{node.label}</span>
        {childCount > 0 && <span className="ldb-tree-count">{childCount}</span>}
      </button>
      {open && (node.children || []).map(child => (
        child.type === "file"
          ? <FileNode key={child.path} node={child} onSelectFile={onSelectFile} selectedPath={selectedPath} depth={depth + 1} />
          : <FolderNode key={child.path} node={child} onSelectFile={onSelectFile} selectedPath={selectedPath} depth={depth + 1} />
      ))}
    </>
  );
}

/**
 * 좌측 트리: 영역(7) → 세부영역(자유) → 자료종류(3) → 파일들
 *
 * props:
 *   tree: LearningDataNodeDto (root)
 *   onSelectFile(path, label)
 *   selectedPath: string | null
 */
function LDBTreePanel({ tree, onSelectFile, selectedPath, loading }) {
  return (
    <aside className="ldb-tree-panel">
      <div className="ldb-tree-header">학습 자료</div>
      {loading && <div className="ldb-tree-loading">불러오는 중...</div>}
      {!loading && tree && (tree.children || []).map(area => (
        <FolderNode
          key={area.path}
          node={area}
          onSelectFile={onSelectFile}
          selectedPath={selectedPath}
          depth={0}
          defaultOpen={false}
        />
      ))}
      {!loading && tree && (tree.children || []).length === 0 && (
        <div className="ldb-tree-loading">(비어있음)</div>
      )}
    </aside>
  );
}

export default LDBTreePanel;
