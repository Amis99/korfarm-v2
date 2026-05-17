import { useEffect, useState } from "react";
import { Link, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useOrgBillingStatus, daysUntil } from "../hooks/useOrgBillingStatus";
import { apiGetCamel } from "../utils/adminApi";
import { useFileBlob } from "../hooks/useFileBlob";
import SiteFooter from "./SiteFooter";
import "../styles/admin.css";

// roles 미지정 = HQ_ADMIN + ORG_ADMIN 둘 다 (자기 기관 한정으로 운영)
// roles: ["HQ_ADMIN"] = 본사 관리자 전용 (전사 데이터 / 결제 / 기관 등록 / 시스템 설정)
// roles: ["ORG_ADMIN"] = 기관 관리자 전용
const NAV_GROUPS = [
  { title: "운영", items: [
    { to: "/admin", icon: "dashboard", label: "대시보드" },
    { to: "/admin/approvals", icon: "how_to_reg", label: "가입 승인" },
  ]},
  { title: "회원", items: [
    { to: "/admin/orgs", icon: "business", label: "기관 관리", roles: ["HQ_ADMIN"] },
    { to: "/admin/org-applications", icon: "mark_email_unread", label: "도입 신청", roles: ["HQ_ADMIN"] },
    { to: "/admin/members", icon: "groups", label: "회원 관리", roles: ["HQ_ADMIN"] },
    { to: "/admin/classes", icon: "school", label: "반 관리" },
    { to: "/admin/students", icon: "group", label: "학생 관리", roles: ["ORG_ADMIN"] },
    { to: "/admin/parents", icon: "family_restroom", label: "학부모 관리", roles: ["ORG_ADMIN"] },
  ]},
  { title: "콘텐츠·학습", items: [
    { to: "/admin/content", icon: "menu_book", label: "콘텐츠" },
    { to: "/admin/study-content", icon: "auto_stories", label: "내용 숙지" },
    { to: "/admin/own-study-contents", icon: "group", label: "학생 생성 학습", roles: ["HQ_ADMIN"] },
    { to: "/admin/study-plans", icon: "event_note", label: "학습 계획표" },
    { to: "/admin/tests", icon: "assignment", label: "테스트 관리" },
    { to: "/admin/textbooks", icon: "auto_stories", label: "교재 관리" },
    { to: "/admin/pro", icon: "workspace_premium", label: "프로 모드", roles: ["HQ_ADMIN"] },
    { to: "/admin/learning-db", icon: "database", label: "학습자료 DB", roles: ["HQ_ADMIN"] },
  ]},
  { title: "커뮤니티", items: [
    { to: "/admin/boards", icon: "forum", label: "게시판 관리", roles: ["HQ_ADMIN"] },
    { to: "/admin/boards/chat-archives", icon: "shield", label: "채팅 관리", roles: ["HQ_ADMIN"] },
    { to: "/admin/wisdom", icon: "auto_stories", label: "지식과 지혜" },
    { to: "/admin/inquiry", icon: "contact_support", label: "문의 관리", roles: ["HQ_ADMIN"] },
  ]},
  { title: "활동·상점", items: [
    { to: "/admin/duel", icon: "swords", label: "대결 관리" },
    { to: "/admin/shop", icon: "storefront", label: "상점 관리", roles: ["HQ_ADMIN"] },
  ]},
  { title: "결제·운영", items: [
    { to: "/admin/billing", icon: "receipt_long", label: "월 사용료", roles: ["ORG_ADMIN"] },
    { to: "/admin/grapefruit-wallet", icon: "nutrition", label: "AI 자몽 지갑", roles: ["ORG_ADMIN"] },
    { to: "/admin/all-billings", icon: "payments", label: "기관 청구 관리", roles: ["HQ_ADMIN"] },
    { to: "/admin/grapefruit-pricing", icon: "savings", label: "AI 자몽 단가", roles: ["HQ_ADMIN"] },
  ]},
  { title: "시스템", items: [
    { to: "/admin/edit-history", icon: "history", label: "수정 이력", roles: ["HQ_ADMIN"] },
    { to: "/admin/ai-usage", icon: "smart_toy", label: "AI 사용 내역", roles: ["HQ_ADMIN"] },
    { to: "/admin/reports", icon: "flag", label: "보고", roles: ["HQ_ADMIN"] },
    { to: "/admin/org-settings", icon: "settings", label: "기관 설정", roles: ["ORG_ADMIN"] },
    { to: "/admin/settings", icon: "manage_accounts", label: "내 설정" },
  ]},
  { title: "사용자 화면", items: [
    { to: "/", icon: "home", label: "랜딩" },
    { to: "/start", icon: "play_arrow", label: "스타트" },
  ]},
];
const NAV_ITEMS = NAV_GROUPS.flatMap(g => g.items);

function AdminLayout({ children }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const userRoles = user?.roles || [];

  // 어드민 권한 가드 — HQ_ADMIN/ORG_ADMIN 만 접근. PARENT/STUDENT 등은 적절한 홈으로 리다이렉트.
  // (백엔드도 차단하지만 사용자 경험상 직접 진입 시 빠르게 튕겨내기.)
  if (user && !userRoles.includes("HQ_ADMIN") && !userRoles.includes("ORG_ADMIN")) {
    if (userRoles.includes("PARENT")) return <Navigate to="/parent-home" replace />;
    return <Navigate to="/start" replace />;
  }
  const billingStatus = useOrgBillingStatus();
  const dueDays = billingStatus?.nextDueAt ? daysUntil(billingStatus.nextDueAt) : null;
  const showSuspendedBanner = !!billingStatus?.suspended;
  const showImminentBanner = !showSuspendedBanner && billingStatus?.pendingCount > 0 && dueDays != null && dueDays <= 7 && dueDays >= 0;

  // ORG_ADMIN 헤더: 기관 로고(없으면 국어농장 디폴트) + 기관명. HQ_ADMIN 은 기존 'Admin' 텍스트 유지.
  const isOnlyOrgAdmin = userRoles.includes("ORG_ADMIN") && !userRoles.includes("HQ_ADMIN");
  const [orgInfo, setOrgInfo] = useState(null);
  useEffect(() => {
    if (!isOnlyOrgAdmin) {
      setOrgInfo(null);
      return;
    }
    let alive = true;
    apiGetCamel("/v1/admin/orgs/me")
      .then((d) => { if (alive) setOrgInfo(d); })
      .catch(() => { if (alive) setOrgInfo(null); });
    return () => { alive = false; };
  }, [isOnlyOrgAdmin]);
  const orgLogoBlob = useFileBlob(isOnlyOrgAdmin ? orgInfo?.logoFileId : null);

  // 메뉴별 권한 분기 — roles 미지정은 HQ + ORG 공통, roles 명시는 그 역할만
  const canSeeItem = (item) => !item.roles || item.roles.some((r) => userRoles.includes(r));
  const visibleNavItems = NAV_ITEMS.filter(canSeeItem);

  // 모바일 툴바 — 현재 활성 메뉴 라벨 표시
  const activeItem = visibleNavItems.find((item) =>
    item.to === "/admin"
      ? location.pathname === "/admin"
      : location.pathname === item.to || location.pathname.startsWith(item.to + "/")
  );
  const activeLabel = activeItem?.label || "관리자";

  return (
    <div className="admin-page">
      <div className={`admin-shell ${open ? "sidebar-open" : ""}`}>
        {/* Backdrop for mobile */}
        {open && (
          <div
            className="admin-backdrop"
            onClick={() => setOpen(false)}
          />
        )}

        <aside className={`admin-side ${open ? "open" : ""}`}>
          <div className="admin-side-header">
            <Link
              to="/"
              className="admin-brand"
              aria-label={isOnlyOrgAdmin ? (orgInfo?.name || "기관") : "국어농장 Admin"}
            >
              <img
                className="admin-logo"
                src={
                  isOnlyOrgAdmin
                    ? (orgLogoBlob || (import.meta.env.BASE_URL + "korfarm-logo.png"))
                    : (import.meta.env.BASE_URL + "korfarm-logo.png")
                }
                alt={isOnlyOrgAdmin ? (orgInfo?.name || "기관") : "국어농장"}
              />
              <span>{isOnlyOrgAdmin ? (orgInfo?.name || "기관") : "Admin"}</span>
            </Link>
            <button
              className="admin-side-close"
              type="button"
              onClick={() => setOpen(false)}
              aria-label="메뉴 닫기"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <nav className="admin-nav">
            {NAV_GROUPS.map((group) => {
              const groupItems = group.items.filter(canSeeItem);
              if (groupItems.length === 0) return null;
              return (
                <div className="admin-nav-group" key={group.title}>
                  <div className="admin-nav-group-title">{group.title}</div>
                  {groupItems.map((item) => {
                    const isActive =
                      item.to === "/admin"
                        ? location.pathname === "/admin"
                        : location.pathname === item.to ||
                          location.pathname.startsWith(item.to + "/");
                    return (
                      <Link
                        key={item.to}
                        className={isActive ? "active" : ""}
                        to={item.to}
                        onClick={() => setOpen(false)}
                      >
                        <span className="material-symbols-outlined">{item.icon}</span>
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </nav>
        </aside>

        <main className="admin-main">
          <div className="admin-toolbar-row">
            <button
              className="admin-hamburger"
              type="button"
              onClick={() => setOpen(true)}
              aria-label="메뉴 열기"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <span className="admin-toolbar-title">{activeLabel}</span>
          </div>
          {showSuspendedBanner && (
            <div className="admin-billing-banner admin-billing-banner--suspended">
              <span>⛔ 월 사용료 미결제로 기관 관리 기능이 정지되었습니다.</span>{" "}
              <Link to="/admin/billing">월 사용료 결제</Link> 후 다시 이용해 주세요.
            </div>
          )}
          {showImminentBanner && (
            <div className="admin-billing-banner admin-billing-banner--imminent">
              <span>⏰ 결제 마감 {dueDays === 0 ? "당일" : `${dueDays}일 전`}입니다.</span>{" "}
              미결제 시 다음 날부터 기관 관리 기능이 정지됩니다.{" "}
              <Link to="/admin/billing">월 사용료 결제하기</Link>
            </div>
          )}
          {children}
          <SiteFooter compact />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
