import { useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { apiGet, apiPost, apiPatch, apiDelete } from "../utils/api";
import AdminLayout from "../components/AdminLayout";
import StudyPlanMatrix from "../components/StudyPlanMatrix";
import StudyPlanCalendar from "../components/StudyPlanCalendar";
import StudyPlanCellModal from "../components/StudyPlanCellModal";
import "../styles/admin-study-plan.css";

const TABS = [
  { key: "matrix", label: "매트릭스", icon: "grid_on" },
  { key: "calendar", label: "캘린더", icon: "calendar_month" },
  { key: "settings", label: "설정", icon: "settings" },
];

export default function AdminStudyPlanDetailPage() {
  const { planId } = useParams();
  const [plan, setPlan] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [matrix, setMatrix] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [tab, setTab] = useState("matrix");
  const [loading, setLoading] = useState(true);
  const [cellModal, setCellModal] = useState(null);

  // 설정 탭 상태
  const [newScopeLabel, setNewScopeLabel] = useState("");
  const [newAssetLabel, setNewAssetLabel] = useState("");
  const [newAssetType, setNewAssetType] = useState("activity");
  const [newAssetKind, setNewAssetKind] = useState("study");

  const loadPlan = useCallback(() => {
    apiGet(`/v1/admin/study-plans/${planId}`).then(setPlan).catch(() => {});
  }, [planId]);

  const loadStudents = useCallback(() => {
    apiGet(`/v1/admin/study-plans/${planId}/students`).then((data) => {
      const list = Array.isArray(data) ? data : [];
      setStudents(list);
      if (list.length > 0 && !selectedUserId) {
        setSelectedUserId(list[0].userId);
      }
    }).catch(() => {});
  }, [planId]);

  const loadMatrix = useCallback(() => {
    if (!selectedUserId) return;
    apiGet(`/v1/admin/study-plans/${planId}/matrix?userId=${selectedUserId}`)
      .then(setMatrix)
      .catch(() => setMatrix(null));
  }, [planId, selectedUserId]);

  const loadSchedules = useCallback(() => {
    apiGet(`/v1/admin/study-plans/${planId}/calendar`)
      .then((data) => setSchedules(Array.isArray(data) ? data : []))
      .catch(() => setSchedules([]));
  }, [planId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadPlan(), loadStudents(), loadSchedules()])
      .finally(() => setLoading(false));
  }, [planId]);

  useEffect(() => { loadMatrix(); }, [selectedUserId]);

  const handleCellClick = (cell, scope, asset) => {
    if (!cell) return;
    setCellModal({ cell, scope, asset });
  };

  const handleCellUpdated = () => {
    setCellModal(null);
    loadMatrix();
    loadStudents();
  };

  // 설정: 범위 추가
  const handleAddScope = async () => {
    if (!newScopeLabel.trim()) return;
    try {
      await apiPost(`/v1/admin/study-plans/${planId}/scopes`, { label: newScopeLabel.trim() });
      setNewScopeLabel("");
      loadPlan();
      loadMatrix();
    } catch (e) {
      alert(e.message || "범위 추가 실패");
    }
  };

  const handleDeleteScope = async (scopeId) => {
    try {
      await apiDelete(`/v1/admin/study-plans/${planId}/scopes/${scopeId}`);
      loadPlan();
      loadMatrix();
    } catch (e) {
      alert(e.message || "범위 삭제 실패");
    }
  };

  // 설정: 에셋 추가
  const handleAddAsset = async () => {
    if (!newAssetLabel.trim()) return;
    try {
      await apiPost(`/v1/admin/study-plans/${planId}/assets`, {
        assetType: newAssetType, label: newAssetLabel.trim(), assetKind: newAssetKind,
      });
      setNewAssetLabel("");
      loadPlan();
      loadMatrix();
    } catch (e) {
      alert(e.message || "에셋 추가 실패");
    }
  };

  const handleDeleteAsset = async (assetId) => {
    try {
      await apiDelete(`/v1/admin/study-plans/${planId}/assets/${assetId}`);
      loadPlan();
      loadMatrix();
    } catch (e) {
      alert(e.message || "에셋 삭제 실패");
    }
  };

  // 설정: 보관
  const handleArchive = async () => {
    try {
      await apiPost(`/v1/admin/study-plans/${planId}/archive`);
      loadPlan();
    } catch (e) {
      alert(e.message || "보관 처리 실패");
    }
  };

  if (loading) return <AdminLayout><div className="asp-loading">불러오는 중...</div></AdminLayout>;
  if (!plan) return <AdminLayout><div className="asp-empty">계획표를 찾을 수 없습니다.</div></AdminLayout>;

  return (
    <AdminLayout>
      <div className="asp-header">
        <h1>
          <span className="material-symbols-outlined">event_note</span>
          {plan.title}
        </h1>
        <span className={`asp-status ${plan.status}`}>
          {plan.status === "active" ? "진행중" : "보관"}
        </span>
      </div>

      {plan.examScope && (
        <div style={{ padding: "10px 14px", background: "rgba(255,127,42,0.08)", borderRadius: 8, marginBottom: 16, fontSize: "0.82rem", color: "#ff9f5a", borderLeft: "3px solid #ff7f2a" }}>
          {plan.examScope}
        </div>
      )}

      <div className="aspd-layout">
        {/* 좌측: 학생 목록 */}
        <div className="aspd-sidebar">
          <h3>학생 ({students.length})</h3>
          <ul className="aspd-student-list">
            {students.map((s) => {
              const pct = s.totalCells > 0 ? Math.round((s.completedCells / s.totalCells) * 100) : 0;
              return (
                <li
                  key={s.userId}
                  className={`aspd-student-item ${s.userId === selectedUserId ? "selected" : ""}`}
                  onClick={() => setSelectedUserId(s.userId)}
                >
                  <span>{s.userName || s.userId}</span>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <span style={{ fontSize: "0.72rem" }}>{pct}%</span>
                    <div className="aspd-progress-bar">
                      <div className="aspd-progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>

        {/* 우측: 탭 영역 */}
        <div className="aspd-main">
          <div className="aspd-tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                className={`aspd-tab ${tab === t.key ? "active" : ""}`}
                onClick={() => setTab(t.key)}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{t.icon}</span>
                {t.label}
              </button>
            ))}
          </div>

          {/* 매트릭스 탭 */}
          {tab === "matrix" && (
            matrix ? (
              <StudyPlanMatrix
                scopes={matrix.scopes}
                assets={matrix.assets}
                cells={matrix.cells}
                admin
                onCellClick={handleCellClick}
              />
            ) : (
              <div className="asp-empty">학생을 선택해 주세요.</div>
            )
          )}

          {/* 캘린더 탭 */}
          {tab === "calendar" && (
            <StudyPlanCalendar
              schedules={schedules}
              startDate={plan.startDate}
              endDate={plan.endDate}
              admin
            />
          )}

          {/* 설정 탭 */}
          {tab === "settings" && (
            <>
              {/* 기본 정보 */}
              <div className="aspd-settings-section">
                <h3>기본 정보</h3>
                <div style={{ fontSize: "0.82rem", color: "#ccc" }}>
                  <p>기간: {plan.startDate} ~ {plan.endDate}</p>
                  <p>대상: {(plan.targets || []).map((t) => t.targetName || t.targetId).join(", ")}</p>
                </div>
                {plan.status === "active" && (
                  <button className="asp-add-btn" style={{ marginTop: 12 }} onClick={handleArchive}>보관 처리</button>
                )}
              </div>

              {/* 범위 관리 */}
              <div className="aspd-settings-section">
                <h3>범위 (행)</h3>
                <div className="aspd-edit-list">
                  {(plan.scopes || []).map((s) => (
                    <div key={s.id} className="aspd-edit-item">
                      <span>{s.label}</span>
                      <button onClick={() => handleDeleteScope(s.id)} title="삭제">
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                      </button>
                    </div>
                  ))}
                </div>
                <div className="asp-add-row">
                  <input className="asp-input" value={newScopeLabel} onChange={(e) => setNewScopeLabel(e.target.value)} placeholder="새 범위 추가" onKeyDown={(e) => e.key === "Enter" && handleAddScope()} />
                  <button className="asp-add-btn" onClick={handleAddScope}>추가</button>
                </div>
              </div>

              {/* 에셋 관리 */}
              <div className="aspd-settings-section">
                <h3>에셋 (열)</h3>
                <div className="aspd-edit-list">
                  {(plan.assets || []).map((a) => (
                    <div key={a.id} className="aspd-edit-item">
                      <span>[{a.assetKind === "test" ? "테스트" : "학습"}] {a.label}</span>
                      <button onClick={() => handleDeleteAsset(a.id)} title="삭제">
                        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                      </button>
                    </div>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <select className="asp-select" style={{ flex: 1 }} value={newAssetType} onChange={(e) => setNewAssetType(e.target.value)}>
                    <option value="korfarm">국어농장</option>
                    <option value="activity">학습활동</option>
                    <option value="test">테스트</option>
                  </select>
                  <select className="asp-select" style={{ flex: 1 }} value={newAssetKind} onChange={(e) => setNewAssetKind(e.target.value)}>
                    <option value="study">학습활동</option>
                    <option value="test">테스트</option>
                  </select>
                </div>
                <div className="asp-add-row">
                  <input className="asp-input" value={newAssetLabel} onChange={(e) => setNewAssetLabel(e.target.value)} placeholder="새 에셋 추가" onKeyDown={(e) => e.key === "Enter" && handleAddAsset()} />
                  <button className="asp-add-btn" onClick={handleAddAsset}>추가</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 셀 모달 */}
      {cellModal && (
        <StudyPlanCellModal
          cell={cellModal.cell}
          scope={cellModal.scope}
          asset={cellModal.asset}
          onClose={() => setCellModal(null)}
          onUpdated={handleCellUpdated}
        />
      )}
    </AdminLayout>
  );
}
