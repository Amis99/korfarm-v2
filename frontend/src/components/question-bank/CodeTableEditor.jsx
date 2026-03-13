import { useState } from "react";

function CodeTableEditor({ group, onUpdateGroup, onAddValue, onUpdateValue, onDeactivateValue }) {
  const [editingLabel, setEditingLabel] = useState(false);
  const [groupLabel, setGroupLabel] = useState(group.label);
  const [newValue, setNewValue] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState("");

  const handleSaveGroupLabel = () => {
    if (groupLabel.trim() && groupLabel !== group.label) {
      onUpdateGroup(group.id, { label: groupLabel.trim() });
    }
    setEditingLabel(false);
  };

  const handleAddValue = () => {
    if (!newValue.trim() || !newLabel.trim()) return;
    onAddValue(group.id, newValue.trim(), newLabel.trim());
    setNewValue("");
    setNewLabel("");
  };

  const handleSaveValue = (id) => {
    if (editLabel.trim()) {
      onUpdateValue(id, { label: editLabel.trim() });
    }
    setEditingId(null);
  };

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
        {editingLabel ? (
          <>
            <input
              className="qb-inline-input"
              style={{ width: 200 }}
              value={groupLabel}
              onChange={(e) => setGroupLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSaveGroupLabel()}
            />
            <button className="qb-btn" onClick={handleSaveGroupLabel} style={{ padding: "4px 10px" }}>저장</button>
          </>
        ) : (
          <>
            <h3 style={{ margin: 0, color: "#e8dfd6", fontSize: "1rem" }}>{group.label}</h3>
            <span className="qb-tag">{group.group_key}</span>
            <button
              className="qb-btn"
              style={{ padding: "4px 10px", marginLeft: "auto" }}
              onClick={() => { setEditingLabel(true); setGroupLabel(group.label); }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
            </button>
          </>
        )}
      </div>

      <table className="qb-table">
        <thead>
          <tr>
            <th>값 (코드)</th>
            <th>라벨</th>
            <th>순서</th>
            <th>활성</th>
            <th style={{ width: 100 }}>관리</th>
          </tr>
        </thead>
        <tbody>
          {group.values?.map((v) => (
            <tr key={v.id} style={{ opacity: v.is_active ? 1 : 0.5 }}>
              <td><code style={{ color: "#80c090" }}>{v.value}</code></td>
              <td>
                {editingId === v.id ? (
                  <input
                    className="qb-inline-input"
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSaveValue(v.id)}
                    autoFocus
                  />
                ) : (
                  v.label
                )}
              </td>
              <td>{v.sort_order}</td>
              <td>{v.is_active ? "O" : "X"}</td>
              <td>
                {editingId === v.id ? (
                  <button className="qb-btn" style={{ padding: "3px 8px", fontSize: "0.78rem" }} onClick={() => handleSaveValue(v.id)}>
                    저장
                  </button>
                ) : (
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      className="qb-btn"
                      style={{ padding: "3px 8px", fontSize: "0.78rem" }}
                      onClick={() => { setEditingId(v.id); setEditLabel(v.label); }}
                    >
                      수정
                    </button>
                    {v.is_active && (
                      <button
                        className="qb-btn danger"
                        style={{ padding: "3px 8px", fontSize: "0.78rem" }}
                        onClick={() => onDeactivateValue(v.id)}
                      >
                        비활성
                      </button>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: "flex", gap: 8, marginTop: 12, alignItems: "flex-end" }}>
        <div className="qb-meta-field">
          <label>새 코드값</label>
          <input className="qb-inline-input" value={newValue} onChange={(e) => setNewValue(e.target.value)} placeholder="UPPER_CASE" />
        </div>
        <div className="qb-meta-field">
          <label>라벨</label>
          <input className="qb-inline-input" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="한국어 표시" />
        </div>
        <button className="qb-btn primary" onClick={handleAddValue} style={{ height: 34 }}>추가</button>
      </div>
    </div>
  );
}

export default CodeTableEditor;
