/**
 * 학원장 온보딩 체크리스트 — ORG_ADMIN 첫 화면(AdminPage) 상단 카드.
 * 4단계 모두 완료(allCompleted=true) 면 자동으로 숨김.
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../utils/adminApi";

const STEPS = [
  { key: "orgInfo",           label: "기관 정보 입력",         to: "/admin/org-settings", icon: "business" },
  { key: "students",          label: "학생 등록",              to: "/admin/users?tab=STUDENT", icon: "group" },
  { key: "studyPlanTemplate", label: "학습 계획표 템플릿 생성", to: "/admin/study-plans",  icon: "event_note" },
  { key: "billing",           label: "월 사용료 결제",          to: "/admin/billing",      icon: "payments" },
];

const snakeOrCamel = (obj, key) => {
  if (!obj) return null;
  const snake = key.replace(/([A-Z])/g, "_$1").toLowerCase();
  return obj[key] ?? obj[snake];
};

export default function OnboardingChecklist() {
  const [status, setStatus] = useState(null);
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiGet("/v1/admin/onboarding/status");
        if (!cancelled) setStatus(res?.data ?? res);
      } catch {
        // 본사 ORG_ADMIN 또는 권한 없음 — 조용히 숨김
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (!status || status.allCompleted || status.all_completed || dismissed) return null;

  const orgName = status.orgName || status.org_name || "학원";

  const stepData = STEPS.map((s) => {
    const data = snakeOrCamel(status, s.key) || {};
    return {
      ...s,
      completed: data.completed === true,
      detail: data.detail || "",
    };
  });

  const completedCount = stepData.filter((s) => s.completed).length;

  return (
    <div style={{
      background: "linear-gradient(135deg, #fef9e7, #fef5d3)",
      border: "1px solid #f1c40f",
      borderRadius: 8,
      padding: 16,
      margin: "0 0 16px",
      position: "relative",
    }}>
      <button
        onClick={() => setDismissed(true)}
        style={{
          position: "absolute", top: 8, right: 8,
          background: "transparent", border: "none",
          fontSize: 18, cursor: "pointer", color: "#888",
        }}
        title="이번 세션에서 숨기기"
      >×</button>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 24, color: "#d68910" }}>checklist</span>
        <strong style={{ fontSize: 15 }}>{orgName} 도입 체크리스트 ({completedCount}/4)</strong>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
        {stepData.map((s, idx) => (
          <div key={s.key}
               onClick={() => navigate(s.to)}
               style={{
                 background: s.completed ? "rgba(46, 125, 50, 0.08)" : "#fff",
                 border: s.completed ? "1px solid #2e7d32" : "1px solid #e0e0e0",
                 borderRadius: 6, padding: "10px 12px", cursor: "pointer",
                 display: "flex", flexDirection: "column", gap: 4,
               }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span className="material-symbols-outlined"
                    style={{ fontSize: 18, color: s.completed ? "#2e7d32" : "#888" }}>
                {s.completed ? "check_circle" : s.icon}
              </span>
              <strong style={{ fontSize: 12, color: s.completed ? "#2e7d32" : "#333" }}>
                {idx + 1}. {s.label}
              </strong>
            </div>
            <div style={{ fontSize: 11, color: "#666", marginLeft: 24 }}>{s.detail}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
