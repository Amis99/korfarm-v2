import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost, apiDelete } from "../../utils/api";
import StudyPlanMatrix from "../StudyPlanMatrix";
import StudyPlanCalendar from "../StudyPlanCalendar";
import StudyPlanCellModal from "../StudyPlanCellModal";
import CellAssignModal from "../CellAssignModal";
import CalendarEventModal from "../CalendarEventModal";
import PropagateDeltaModal from "./PropagateDeltaModal";

/**
 * 학생 1명의 plan 매트릭스 + 사이드 학생 개인 캘린더.
 * Props:
 *   userId          학생 (없으면 안내 표시)
 *   focusCellId     셀 모달 자동 열기 (제출물 탭에서 점프)
 */
export default function StudentMatrixTab({ userId, focusCellId }) {
  const [plan, setPlan] = useState(null);
  const [planId, setPlanId] = useState(null);
  const [matrix, setMatrix] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [cellModal, setCellModal] = useState(null);
  const [assignModal, setAssignModal] = useState(null); // 배정 전·만료 셀 클릭 시 배정 모달
  const [eventModal, setEventModal] = useState(null);
  const [propagateModal, setPropagateModal] = useState(null);

  // 가장 최근 추가된 행/열 — propagate 모달 default
  const [lastAddedScopeId, setLastAddedScopeId] = useState(null);
  const [lastAddedAssetId, setLastAddedAssetId] = useState(null);
  const [showPropagatePill, setShowPropagatePill] = useState(false);

  // 학생의 plan 1개 가정 — 학생 plan 목록을 통해 조회
  const loadStudentPlan = useCallback(async () => {
    if (!userId) {
      setPlan(null); setPlanId(null); setMatrix(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const list = await apiGet(`/v1/admin/students/${userId}/study-plans`);
      const plans = Array.isArray(list) ? list : [];
      const target = plans[0]; // 학생당 plan 1개 가정
      if (!target) {
        setError("이 학생은 아직 학습 계획표가 없습니다. (가입 시 자동 생성 정책 확인 필요)");
        setPlan(null); setPlanId(null); setMatrix(null);
        return;
      }
      setPlanId(target.planId || target.id);
    } catch (e) {
      setError(e?.message || "학생 plan 조회 실패");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadPlanDetail = useCallback(() => {
    if (!planId) return;
    apiGet(`/v1/admin/study-plans/${planId}`).then(setPlan).catch(() => setPlan(null));
  }, [planId]);

  const loadMatrix = useCallback(() => {
    if (!planId || !userId) { setMatrix(null); return; }
    apiGet(`/v1/admin/study-plans/${planId}/matrix?userId=${userId}`)
      .then(setMatrix)
      .catch(() => setMatrix(null));
  }, [planId, userId]);

  const loadSchedules = useCallback(() => {
    if (!planId) return;
    apiGet(`/v1/admin/study-plans/${planId}/calendar`)
      .then((d) => setSchedules(Array.isArray(d) ? d : []))
      .catch(() => setSchedules([]));
  }, [planId]);

  const loadCalendarEvents = useCallback((month) => {
    if (!planId) return;
    const ym = month || (() => {
      const now = new Date();
      return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    })();
    const userParam = userId ? `&userId=${userId}` : "";
    apiGet(`/v1/admin/study-plans/${planId}/calendar/events?month=${ym}${userParam}`)
      .then((d) => setCalendarEvents(Array.isArray(d) ? d : []))
      .catch(() => setCalendarEvents([]));
  }, [planId, userId]);

  useEffect(() => { loadStudentPlan(); }, [loadStudentPlan]);
  useEffect(() => {
    if (planId) {
      loadPlanDetail();
      loadMatrix();
      loadSchedules();
      loadCalendarEvents();
    }
  }, [planId, loadPlanDetail, loadMatrix, loadSchedules, loadCalendarEvents]);

  // focusCellId 가 있으면 셀 모달 자동 열기
  useEffect(() => {
    if (!focusCellId || !matrix) return;
    const cell = (matrix.cells || []).find((c) => c.cellId === focusCellId || c.id === focusCellId);
    if (!cell) return;
    const scope = (matrix.scopes || []).find((s) => s.id === cell.scopeId);
    const asset = (matrix.assets || []).find((a) => a.id === cell.assetId);
    setCellModal({ cell, scope, asset });
  }, [focusCellId, matrix]);

  const handleCellClick = (cell, scope, asset) => {
    if (!cell) return;
    // 배정 전 또는 기한 지난 미완료 → 배정 모달 (재배정 가능)
    if (cell.status === "unassigned" || cell.isOverdue) {
      setAssignModal({ cell, scope, asset });
      return;
    }
    setCellModal({ cell, scope, asset });
  };

  const handleAddScope = async (label) => {
    const text = typeof label === "string" ? label.trim() : "";
    if (!text || !planId) return;
    try {
      const res = await apiPost(`/v1/admin/study-plans/${planId}/scopes`, { label: text });
      const newId = res?.id || res?.scopeId;
      if (newId) setLastAddedScopeId(newId);
      setShowPropagatePill(true);
      loadPlanDetail(); loadMatrix();
    } catch (e) {
      alert(e?.message || "범위 추가 실패");
    }
  };

  const handleDeleteScope = async (scopeId) => {
    if (!planId) return;
    try {
      await apiDelete(`/v1/admin/study-plans/${planId}/scopes/${scopeId}`);
      loadPlanDetail(); loadMatrix();
    } catch (e) {
      alert(e?.message || "범위 삭제 실패");
    }
  };

  const handleAddAsset = async (opts) => {
    if (!planId || !opts?.label) return;
    try {
      const body = {
        assetType: opts.assetType,
        label: opts.label,
        assetKind: opts.assetKind,
      };
      if (opts.refId) body.refId = opts.refId;
      if (opts.configJson) body.configJson = opts.configJson;
      const res = await apiPost(`/v1/admin/study-plans/${planId}/assets`, body);
      const newId = res?.id || res?.assetId;
      if (newId) setLastAddedAssetId(newId);
      setShowPropagatePill(true);
      loadPlanDetail(); loadMatrix();
    } catch (e) {
      alert(e?.message || "에셋 추가 실패");
    }
  };

  const handleDeleteAsset = async (assetId) => {
    if (!planId) return;
    try {
      await apiDelete(`/v1/admin/study-plans/${planId}/assets/${assetId}`);
      loadPlanDetail(); loadMatrix();
    } catch (e) {
      alert(e?.message || "에셋 삭제 실패");
    }
  };

  if (!userId) {
    return (
      <div className="admin-detail-card">
        <p style={{ color: "var(--admin-muted)", padding: 20, textAlign: "center" }}>
          상단에서 학생을 선택해 주세요.
        </p>
      </div>
    );
  }

  if (loading) return <div className="admin-detail-card"><p style={{ padding: 20 }}>불러오는 중...</p></div>;
  if (error) return <div className="admin-detail-card"><p style={{ padding: 20, color: "#c0392b" }}>{error}</p></div>;
  if (!planId || !matrix) return <div className="admin-detail-card"><p style={{ padding: 20 }}>학생 plan 을 불러올 수 없습니다.</p></div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div className="admin-detail-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 8, flexWrap: "wrap" }}>
          <h2 style={{ margin: 0, color: "var(--admin-ink)" }}>{plan?.title || "학습 계획표"}</h2>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {showPropagatePill && (lastAddedScopeId || lastAddedAssetId) && (
              <span style={{
                fontSize: 12,
                color: "var(--admin-accent-strong, #1f4a37)",
                background: "rgba(45,106,79,0.08)",
                padding: "4px 10px",
                borderRadius: 12,
              }}>
                ↳ 방금 추가한 항목 자동 선택
              </span>
            )}
            {/* Rev.2 — 학생간 복제 진입점 항상 노출. 행/열 다중 선택은 모달에서. */}
            <button
              className="admin-detail-btn"
              onClick={() => setPropagateModal({})}
              style={{ display: "inline-flex", alignItems: "center", gap: 4 }}
              title="이 학생의 행/열·셀의 학습 내용을 다른 학생에게 일괄 복제"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>group_add</span>
              학생간 복제
            </button>
          </div>
        </div>

        {/* 매트릭스 — 8행까지 보이는 세로 스크롤 컨테이너 */}
        <div style={{
          maxHeight: 420,
          overflowY: "auto",
          border: "1px solid var(--admin-stroke, rgba(31,58,44,0.12))",
          borderRadius: 6,
        }}>
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
        </div>
      </div>

      {/* 매트릭스 아래 — 학생 개인 캘린더 */}
      <div className="admin-detail-card">
        <h3 style={{ margin: "0 0 12px", color: "var(--admin-accent-strong)" }}>학생 캘린더</h3>
        <StudyPlanCalendar
          schedules={schedules}
          startDate={plan?.startDate}
          endDate={plan?.endDate}
          admin
          events={calendarEvents}
          cells={matrix.cells}
          assets={matrix.assets}
          onMonthChange={loadCalendarEvents}
          onDateClick={(date, evts) => setEventModal({ date, events: evts })}
        />
      </div>

      {cellModal && (
        <StudyPlanCellModal
          cell={cellModal.cell}
          scope={cellModal.scope}
          asset={cellModal.asset}
          onClose={() => setCellModal(null)}
          onUpdated={() => { setCellModal(null); loadMatrix(); }}
        />
      )}
      {assignModal && (
        <CellAssignModal
          cell={assignModal.cell}
          scope={assignModal.scope}
          asset={assignModal.asset}
          onClose={() => setAssignModal(null)}
          onAssigned={() => { setAssignModal(null); loadMatrix(); }}
        />
      )}
      {eventModal && (
        <CalendarEventModal
          date={eventModal.date}
          events={eventModal.events}
          onClose={() => setEventModal(null)}
        />
      )}
      {propagateModal && (
        <PropagateDeltaModal
          planId={planId}
          plan={plan}
          defaultScopeId={lastAddedScopeId}
          defaultAssetId={lastAddedAssetId}
          currentUserId={userId}
          onClose={() => setPropagateModal(null)}
          onApplied={() => {
            setShowPropagatePill(false);
            setLastAddedScopeId(null);
            setLastAddedAssetId(null);
          }}
        />
      )}
    </div>
  );
}
