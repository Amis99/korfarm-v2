import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost, apiPut, apiDelete } from "../utils/adminApi";
import AdminLayout from "../components/AdminLayout";
import CodeTableEditor from "../components/question-bank/CodeTableEditor";
import "../styles/question-bank.css";

function AdminQBCodesPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newGroupKey, setNewGroupKey] = useState("");
  const [newGroupLabel, setNewGroupLabel] = useState("");
  const [showAddGroup, setShowAddGroup] = useState(false);

  useEffect(() => {
    loadCodes();
  }, []);

  const loadCodes = async () => {
    setLoading(true);
    try {
      const data = await apiGet("/v1/admin/question-bank/codes");
      const list = Array.isArray(data) ? data : [];
      setGroups(list);
      if (!selectedGroupId && list.length > 0) setSelectedGroupId(list[0].id);
    } catch (e) {
      console.error("코드표 로드 실패:", e);
    } finally {
      setLoading(false);
    }
  };

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  const handleAddGroup = async () => {
    if (!newGroupKey.trim() || !newGroupLabel.trim()) return;
    try {
      await apiPost("/v1/admin/question-bank/codes/groups", {
        group_key: newGroupKey.trim(),
        label: newGroupLabel.trim(),
        sort_order: groups.length + 1,
      });
      setNewGroupKey("");
      setNewGroupLabel("");
      setShowAddGroup(false);
      await loadCodes();
    } catch (e) {
      alert("그룹 추가 실패: " + e.message);
    }
  };

  const handleUpdateGroup = async (id, updates) => {
    try {
      await apiPut(`/v1/admin/question-bank/codes/groups/${id}`, updates);
      await loadCodes();
    } catch (e) {
      alert("그룹 수정 실패: " + e.message);
    }
  };

  const handleAddValue = async (groupId, value, label) => {
    try {
      await apiPost("/v1/admin/question-bank/codes/values", {
        group_id: groupId,
        value,
        label,
        sort_order: (selectedGroup?.values?.length || 0) + 1,
      });
      await loadCodes();
    } catch (e) {
      alert("값 추가 실패: " + e.message);
    }
  };

  const handleUpdateValue = async (id, updates) => {
    try {
      await apiPut(`/v1/admin/question-bank/codes/values/${id}`, updates);
      await loadCodes();
    } catch (e) {
      alert("값 수정 실패: " + e.message);
    }
  };

  const handleDeactivateValue = async (id) => {
    if (!window.confirm("이 코드 값을 비활성화하시겠습니까?")) return;
    try {
      await apiDelete(`/v1/admin/question-bank/codes/values/${id}`);
      await loadCodes();
    } catch (e) {
      alert("비활성화 실패: " + e.message);
    }
  };

  return (
    <AdminLayout>
      <div className="qb-wrap">
        <div className="qb-header">
          <h1>코드표 관리</h1>
          <div className="qb-header-actions">
            <button className="qb-btn" onClick={() => navigate("/admin/question-bank")}>
              <span className="material-symbols-outlined">arrow_back</span>
              문제은행
            </button>
            <button className="qb-btn primary" onClick={() => setShowAddGroup(!showAddGroup)}>
              <span className="material-symbols-outlined">add</span>
              그룹 추가
            </button>
          </div>
        </div>

        {showAddGroup && (
          <div className="qb-card" style={{ marginBottom: 16, display: "flex", gap: 10, alignItems: "flex-end", flexWrap: "wrap" }}>
            <div className="qb-meta-field">
              <label>그룹 키</label>
              <input className="qb-inline-input" value={newGroupKey} onChange={(e) => setNewGroupKey(e.target.value)} placeholder="예: new_group" />
            </div>
            <div className="qb-meta-field">
              <label>표시 이름</label>
              <input className="qb-inline-input" value={newGroupLabel} onChange={(e) => setNewGroupLabel(e.target.value)} placeholder="예: 새 그룹" />
            </div>
            <button className="qb-btn primary" onClick={handleAddGroup}>추가</button>
            <button className="qb-btn" onClick={() => setShowAddGroup(false)}>취소</button>
          </div>
        )}

        {loading ? (
          <div className="qb-loading">불러오는 중...</div>
        ) : (
          <div className="qb-codes-layout">
            <div className="qb-codes-groups">
              <div className="qb-tree-title">코드 그룹</div>
              {groups.map((g) => (
                <div
                  key={g.id}
                  className={`qb-group-item ${selectedGroupId === g.id ? "active" : ""}`}
                  onClick={() => setSelectedGroupId(g.id)}
                >
                  <span>{g.label}</span>
                  <span className="qb-tree-count">{g.values?.length || 0}</span>
                </div>
              ))}
            </div>

            <div className="qb-codes-values">
              {selectedGroup ? (
                <CodeTableEditor
                  group={selectedGroup}
                  onUpdateGroup={handleUpdateGroup}
                  onAddValue={handleAddValue}
                  onUpdateValue={handleUpdateValue}
                  onDeactivateValue={handleDeactivateValue}
                />
              ) : (
                <div className="qb-empty">
                  <p>그룹을 선택하세요</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminQBCodesPage;
