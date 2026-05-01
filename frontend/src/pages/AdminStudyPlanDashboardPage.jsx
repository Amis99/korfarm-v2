import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import StudentSelector from "../components/study-plan-dashboard/StudentSelector";
import AdminCalendarTab from "../components/study-plan-dashboard/AdminCalendarTab";
import StudentMatrixTab from "../components/study-plan-dashboard/StudentMatrixTab";
import SubmissionsTab from "../components/study-plan-dashboard/SubmissionsTab";
import WritingTab from "../components/study-plan-dashboard/WritingTab";
import TestTab from "../components/study-plan-dashboard/TestTab";
import "../styles/admin-detail.css";

const TABS = [
  { key: "calendar", label: "캘린더", icon: "calendar_month" },
  { key: "student", label: "학생별", icon: "person" },
  { key: "submissions", label: "제출물", icon: "assignment_turned_in" },
  { key: "writing", label: "글쓰기", icon: "edit_note" },
  { key: "test", label: "테스트", icon: "assignment" },
];

/**
 * 학습 계획표 통합 대시보드 (5탭).
 * URL 쿼리: ?tab=&org=&class=&user=
 */
export default function AdminStudyPlanDashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const params = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const tab = params.get("tab") || "calendar";
  const orgId = params.get("org") || "";
  const classId = params.get("class") || "";
  const userId = params.get("user") || "";
  const focusCellId = params.get("cellId") || ""; // 제출물 → 학생별 점프 시 셀 자동 열기

  // 학생 dropdown 은 student 탭에서만 활성
  const showStudent = tab === "student";

  const updateParams = useCallback((patch) => {
    const next = new URLSearchParams(location.search);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === "" || v == null) next.delete(k);
      else next.set(k, v);
    });
    navigate(`${location.pathname}?${next.toString()}`, { replace: false });
  }, [location.pathname, location.search, navigate]);

  const setTab = (k) => updateParams({ tab: k });
  const setSelector = ({ orgId: o, classId: c, userId: u }) => {
    updateParams({ org: o || "", class: c || "", user: u || "", cellId: "" });
  };

  // 제출물 탭 → 학생별 탭 점프
  const handlePickStudent = ({ userId: u, planId, cellId }) => {
    const next = new URLSearchParams(location.search);
    next.set("tab", "student");
    if (u) next.set("user", u);
    if (cellId) next.set("cellId", cellId);
    navigate(`${location.pathname}?${next.toString()}`);
  };

  return (
    <AdminLayout>
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>
            <span className="material-symbols-outlined" style={{ verticalAlign: "middle", marginRight: 8 }}>event_note</span>
            학습 계획표
          </h1>
          <div className="admin-detail-header-actions">
            <StudentSelector
              value={{ orgId, classId, userId }}
              onChange={setSelector}
              showStudent={showStudent}
              labelStudent={!showStudent ? "(학생별 탭에서 학생 선택)" : null}
            />
          </div>
        </div>

        {/* 탭 바 */}
        <div className="admin-detail-card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{
            display: "flex",
            gap: 0,
            borderBottom: "1px solid var(--admin-stroke, rgba(31,58,44,0.12))",
            background: "var(--admin-panel-light, #f5f9f3)",
          }}>
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  style={{
                    flex: "0 0 auto",
                    padding: "12px 18px",
                    background: active ? "var(--admin-panel, #fff)" : "transparent",
                    color: active ? "var(--admin-accent-strong, #1f4a37)" : "var(--admin-muted, #3a4a3e)",
                    border: "none",
                    borderRight: "1px solid var(--admin-stroke-soft, rgba(31,58,44,0.08))",
                    borderBottom: active ? "2px solid var(--admin-accent, #2d6a4f)" : "2px solid transparent",
                    fontSize: 14,
                    fontWeight: active ? 700 : 500,
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{t.icon}</span>
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* 탭 본문 */}
        {tab === "calendar" && <AdminCalendarTab classId={classId} />}
        {tab === "student" && (
          <StudentMatrixTab userId={userId} focusCellId={focusCellId} />
        )}
        {tab === "submissions" && (
          <SubmissionsTab classId={classId} onPickStudent={handlePickStudent} />
        )}
        {tab === "writing" && <WritingTab classId={classId} />}
        {tab === "test" && <TestTab classId={classId} />}
      </div>
    </AdminLayout>
  );
}
