import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams } from "react-router-dom";
import { apiGet, apiPost, apiPatch, apiDelete } from "../utils/api";
import AdminLayout from "../components/AdminLayout";
import StudyPlanMatrix from "../components/StudyPlanMatrix";
import StudyPlanCalendar from "../components/StudyPlanCalendar";
import StudyPlanCellModal from "../components/StudyPlanCellModal";
import CalendarEventModal from "../components/CalendarEventModal";
import "../styles/admin-study-plan.css";

const TABS = [
  { key: "matrix", label: "매트릭스", icon: "grid_on" },
  { key: "submissions", label: "제출물", icon: "assignment_turned_in" },
  { key: "calendar", label: "캘린더", icon: "calendar_month" },
  { key: "settings", label: "설정", icon: "settings" },
];

const STATUS_LABEL = {
  submitted: "제출", partial: "일부 완료", completed: "완료",
  scored: "채점됨", passed: "통과", retry: "재시험",
  pending: "미수행", in_progress: "진행중", unassigned: "미배정",
};
const ASSET_TYPE_KO = { korfarm: "국어농장", activity: "학습활동", test: "테스트" };

export default function AdminStudyPlanDetailPage() {
  const { planId } = useParams();
  const [plan, setPlan] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null); // null = 전체 현황
  const [matrix, setMatrix] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [tab, setTab] = useState("matrix");
  const [loading, setLoading] = useState(true);
  const [cellModal, setCellModal] = useState(null);
  const [classFilter, setClassFilter] = useState("all");
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [eventModal, setEventModal] = useState(null);

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
    }).catch(() => {});
  }, [planId]);

  const loadMatrix = useCallback(() => {
    if (!selectedUserId) { setMatrix(null); return; }
    apiGet(`/v1/admin/study-plans/${planId}/matrix?userId=${selectedUserId}`)
      .then(setMatrix)
      .catch(() => setMatrix(null));
  }, [planId, selectedUserId]);

  const loadSchedules = useCallback(() => {
    apiGet(`/v1/admin/study-plans/${planId}/calendar`)
      .then((data) => setSchedules(Array.isArray(data) ? data : []))
      .catch(() => setSchedules([]));
  }, [planId]);

  const loadCalendarEvents = useCallback((month) => {
    const ym = month || (() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    })();
    const userParam = selectedUserId ? `&userId=${selectedUserId}` : "";
    apiGet(`/v1/admin/study-plans/${planId}/calendar/events?month=${ym}${userParam}`)
      .then((data) => setCalendarEvents(Array.isArray(data) ? data : []))
      .catch(() => setCalendarEvents([]));
  }, [planId, selectedUserId]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadPlan(), loadStudents(), loadSchedules(), loadCalendarEvents()])
      .finally(() => setLoading(false));
  }, [planId]);

  useEffect(() => { loadMatrix(); }, [selectedUserId]);

  // 수강반 목록 추출
  const classTargets = useMemo(() => {
    if (!plan?.targets) return [];
    return plan.targets.filter((t) => t.targetType === "class");
  }, [plan]);

  // 학생 필터링
  const filteredStudents = useMemo(() => {
    if (classFilter === "all") return students;
    return students.filter((s) => {
      if (s.classId) return s.classId === classFilter;
      if (s.className) {
        const target = classTargets.find((t) => t.targetId === classFilter);
        return target && s.className === (target.targetName || target.targetId);
      }
      return false;
    });
  }, [students, classFilter, classTargets]);

  const handleCellClick = (cell, scope, asset) => {
    if (!cell) return;
    setCellModal({ cell, scope, asset });
  };

  const handleCellUpdated = () => {
    setCellModal(null);
    loadMatrix();
    loadStudents();
  };

  // 범위 추가 (인라인 + 설정 탭 공용)
  const handleAddScope = async (label) => {
    const text = typeof label === "string" ? label.trim() : newScopeLabel.trim();
    if (!text) return;
    try {
      await apiPost(`/v1/admin/study-plans/${planId}/scopes`, { label: text });
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

  // 에셋 추가 (인라인 + 설정 탭 공용)
  const handleAddAsset = async (opts) => {
    const isInline = opts && typeof opts === "object" && opts.label;
    const assetType = isInline ? opts.assetType : newAssetType;
    const label = isInline ? opts.label.trim() : newAssetLabel.trim();
    const assetKind = isInline ? opts.assetKind : newAssetKind;
    if (!label) return;
    const refId = isInline ? opts.refId : undefined;
    try {
      await apiPost(`/v1/admin/study-plans/${planId}/assets`, {
        assetType, label, assetKind, ...(refId ? { refId } : {}),
      });
      if (!isInline) setNewAssetLabel("");
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
      <div className="asp-wrap">
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
          <h3>학생 ({filteredStudents.length})</h3>

          {/* 수강반 필터 */}
          {classTargets.length > 0 && (
            <select
              className="asp-select aspd-class-filter"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
            >
              <option value="all">전체 수강반</option>
              {classTargets.map((ct) => (
                <option key={ct.targetId} value={ct.targetId}>
                  {ct.targetName || ct.targetId}
                </option>
              ))}
            </select>
          )}

          <ul className="aspd-student-list">
            {/* 전체 현황 */}
            <li
              className={`aspd-student-item overview ${selectedUserId === null ? "selected" : ""}`}
              onClick={() => setSelectedUserId(null)}
            >
              <span>
                <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: "middle", marginRight: 4 }}>groups</span>
                전체 현황
              </span>
            </li>

            {filteredStudents.map((s) => {
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
            selectedUserId === null ? (
              <div className="asp-empty" style={{ padding: "40px 20px" }}>
                <span className="material-symbols-outlined">groups</span>
                전체 현황 — 좌측에서 학생을 선택하면 개별 매트릭스를 확인할 수 있습니다.
              </div>
            ) : matrix ? (
              <StudyPlanMatrix
                scopes={matrix.scopes}
                assets={matrix.assets}
                cells={matrix.cells}
                admin
                onCellClick={handleCellClick}
                onAddScope={handleAddScope}
                onDeleteScope={handleDeleteScope}
                onAddAsset={handleAddAsset}
                onDeleteAsset={handleDeleteAsset}
              />
            ) : (
              <div className="asp-empty">학생을 선택해 주세요.</div>
            )
          )}

          {/* 제출물 탭 */}
          {tab === "submissions" && <SubmissionsTab planId={planId} onCellClick={(cell) => setCellModal({ cell, userId: cell.userId })} />}

          {/* 캘린더 탭 */}
          {tab === "calendar" && (
            <StudyPlanCalendar
              schedules={schedules}
              startDate={plan.startDate}
              endDate={plan.endDate}
              admin
              events={calendarEvents}
              onMonthChange={loadCalendarEvents}
              onDateClick={(date, evts) => setEventModal({ date, events: evts })}
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
                  <input className="asp-input" value={newScopeLabel} onChange={(e) => setNewScopeLabel(e.target.value)} placeholder="새 범위 추가" onKeyDown={(e) => e.key === "Enter" && handleAddScope(newScopeLabel)} />
                  <button className="asp-add-btn" onClick={() => handleAddScope(newScopeLabel)}>추가</button>
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
                  <button className="asp-add-btn" onClick={() => handleAddAsset()}>추가</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* 이벤트 모달 */}
      {eventModal && (
        <CalendarEventModal
          date={eventModal.date}
          events={eventModal.events}
          onClose={() => setEventModal(null)}
        />
      )}

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
      </div>
    </AdminLayout>
  );
}

// ── 제출물 모아보기 탭 컴포넌트 ──
function SubmissionsTab({ planId, onCellClick }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    setLoading(true);
    apiGet(`/v1/admin/study-plans/${planId}/submissions`)
      .then((data) => setSubmissions(Array.isArray(data) ? data : []))
      .catch(() => setSubmissions([]))
      .finally(() => setLoading(false));
  }, [planId]);

  const filtered = statusFilter === "all"
    ? submissions
    : submissions.filter((s) => s.status === statusFilter);

  if (loading) return <div style={{ padding: 20, color: "#999" }}>로딩 중...</div>;

  return (
    <div className="aspd-submissions">
      <div className="aspd-submissions-header">
        <h3>제출물 ({filtered.length}건)</h3>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="aspd-filter-select">
          <option value="all">전체 상태</option>
          <option value="submitted">제출</option>
          <option value="partial">일부 완료</option>
          <option value="completed">완료</option>
          <option value="scored">채점됨</option>
          <option value="passed">통과</option>
        </select>
      </div>
      {filtered.length === 0 ? (
        <div style={{ padding: 20, color: "#999", textAlign: "center" }}>제출물이 없습니다.</div>
      ) : (
        <table className="aspd-submissions-table">
          <thead>
            <tr>
              <th>학생</th>
              <th>범위</th>
              <th>활동</th>
              <th>유형</th>
              <th>상태</th>
              <th>제출수</th>
              <th>점수</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.cellId} className="aspd-submissions-row" onClick={() => onCellClick(s)}>
                <td>{s.userName}</td>
                <td>{s.scopeLabel}</td>
                <td>{s.assetLabel}</td>
                <td><span className="aspd-type-badge">{ASSET_TYPE_KO[s.assetType] || s.assetType}</span></td>
                <td><span className={`aspd-status-badge --${s.status}`}>{STATUS_LABEL[s.status] || s.status}</span></td>
                <td>{s.submissionCount}</td>
                <td>{s.score ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
