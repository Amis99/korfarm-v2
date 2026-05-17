import { useMemo, useState, useEffect, lazy, Suspense } from "react";
import { useSearchParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { useAuth } from "../hooks/useAuth";
import "../styles/admin.css";
import "../styles/admin-detail.css";

// 탭 본문 — 지연 로드 (각 탭이 무거워질 수 있음)
const StudentsTab = lazy(() => import("../components/admin/users/StudentsTab"));
const ParentsTab = lazy(() => import("../components/admin/users/ParentsTab"));
const OrgAdminsTab = lazy(() => import("../components/admin/users/OrgAdminsTab"));
const HqAdminsTab = lazy(() => import("../components/admin/users/HqAdminsTab"));

/**
 * 회원 관리 통합 페이지 (2026-05-18).
 *
 * 옛 분리 메뉴(회원 관리·학생 관리·학부모 관리) 3개를 하나로 통합.
 *   - HQ_ADMIN: 학생 / 학부모 / 기관관리자 / 본사관리자 4탭
 *   - ORG_ADMIN: 학생 1탭 (자기 기관 한정 — 백엔드가 자동 필터)
 *
 * 디자인: admin-detail.css 의 표준 클래스(admin-detail-wrap / admin-detail-header / admin-tabs / admin-tab) 사용.
 */
const TAB_LABELS = {
  STUDENT: "학생",
  PARENT: "학부모",
  ORG_ADMIN: "기관 관리자",
  HQ_ADMIN: "본사 관리자",
};

function AdminUsersPage() {
  const { user } = useAuth();
  const roles = user?.roles || [];
  const isHq = roles.includes("HQ_ADMIN");
  const [params, setParams] = useSearchParams();

  const visibleTabs = useMemo(() => {
    if (isHq) return ["STUDENT", "PARENT", "ORG_ADMIN", "HQ_ADMIN"];
    return ["STUDENT"];
  }, [isHq]);

  const initialTab = (() => {
    const q = params.get("tab");
    if (q && visibleTabs.includes(q)) return q;
    return visibleTabs[0];
  })();
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    if (!visibleTabs.includes(tab)) {
      setTab(visibleTabs[0]);
    }
  }, [visibleTabs, tab]);

  const handleTabChange = (next) => {
    setTab(next);
    setParams((prev) => {
      const p = new URLSearchParams(prev);
      p.set("tab", next);
      return p;
    }, { replace: true });
  };

  // 학생 1탭만 보이는 ORG_ADMIN 의 경우 탭 바를 숨겨 화면을 깔끔하게.
  const showTabBar = visibleTabs.length > 1;

  return (
    <AdminLayout>
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>회원 관리</h1>
          <p className="admin-detail-subtitle">
            {isHq ? "본사 통합 — 학생·학부모·기관 관리자·본사 관리자" : "기관 학생 관리"}
          </p>
        </div>

        {showTabBar && (
          <div className="admin-tabs" role="tablist">
            {visibleTabs.map((t) => (
              <button
                key={t}
                type="button"
                role="tab"
                aria-selected={t === tab}
                className={`admin-tab ${t === tab ? "active" : ""}`}
                onClick={() => handleTabChange(t)}
              >
                {TAB_LABELS[t]}
              </button>
            ))}
          </div>
        )}

        <Suspense fallback={<p className="admin-detail-note">불러오는 중…</p>}>
          {tab === "STUDENT" && <StudentsTab />}
          {tab === "PARENT" && isHq && <ParentsTab />}
          {tab === "ORG_ADMIN" && isHq && <OrgAdminsTab />}
          {tab === "HQ_ADMIN" && isHq && <HqAdminsTab />}
        </Suspense>
      </div>
    </AdminLayout>
  );
}

export default AdminUsersPage;
