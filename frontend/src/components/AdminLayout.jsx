import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "../styles/admin.css";

// roles 미지정 = HQ_ADMIN + ORG_ADMIN 둘 다 (자기 기관 한정으로 운영)
// roles: ["HQ_ADMIN"] = 본사 관리자 전용 (전사 데이터 / 결제 / 기관 등록 / 시스템 설정)
// roles: ["ORG_ADMIN"] = 기관 관리자 전용 (현재 없음)
const NAV_ITEMS = [
  { to: "/admin", icon: "dashboard", label: "대시보드" },
  { to: "/admin/approvals", icon: "how_to_reg", label: "가입 승인" },
  { to: "/admin/orgs", icon: "business", label: "기관 관리", roles: ["HQ_ADMIN"] },
  { to: "/admin/classes", icon: "school", label: "반 관리" },
  { to: "/admin/students", icon: "group", label: "학생 관리" },
  { to: "/admin/parents", icon: "family_restroom", label: "학부모 관리" },
  { to: "/admin/content", icon: "menu_book", label: "콘텐츠" },
  { to: "/admin/study-content", icon: "auto_stories", label: "내용 숙지" },
  { to: "/admin/boards", icon: "forum", label: "게시판 관리", roles: ["HQ_ADMIN"] },
  { to: "/admin/boards/chat-archives", icon: "shield", label: "채팅 관리", roles: ["HQ_ADMIN"] },
  { to: "/admin/study-plans", icon: "event_note", label: "학습 계획표" },
  { to: "/admin/wisdom", icon: "auto_stories", label: "지식과 지혜", roles: ["HQ_ADMIN"] },
  { to: "/admin/tests", icon: "assignment", label: "테스트 관리" },
  { to: "/admin/pro", icon: "workspace_premium", label: "프로 모드", roles: ["HQ_ADMIN"] },
  { to: "/admin/learning-db", icon: "database", label: "학습자료 DB", roles: ["HQ_ADMIN"] },
  { to: "/admin/duel", icon: "swords", label: "대결 관리" },
  { to: "/admin/shop", icon: "storefront", label: "상점 관리", roles: ["HQ_ADMIN"] },
  { to: "/admin/inquiry", icon: "contact_support", label: "문의 관리", roles: ["HQ_ADMIN"] },
  { to: "/admin/edit-history", icon: "history", label: "수정 이력", roles: ["HQ_ADMIN"] },
  { to: "/admin/ai-usage", icon: "smart_toy", label: "AI 사용 내역", roles: ["HQ_ADMIN"] },
  { to: "/admin/reports", icon: "flag", label: "보고", roles: ["HQ_ADMIN"] },
  { to: "/admin/org-settings", icon: "settings", label: "기관 설정", roles: ["ORG_ADMIN"] },
  { to: "/", icon: "home", label: "랜딩" },
  { to: "/start", icon: "play_arrow", label: "스타트" },
];

function AdminLayout({ children }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const userRoles = user?.roles || [];

  // 메뉴별 권한 분기 — roles 미지정은 HQ + ORG 공통, roles 명시는 그 역할만
  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (!item.roles) return true;
    return item.roles.some((r) => userRoles.includes(r));
  });

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
            <Link to="/" className="admin-brand" aria-label="국어농장 Admin">
              <img
                className="admin-logo"
                src={import.meta.env.BASE_URL + "korfarm-logo.png"}
                alt="국어농장"
              />
              <span>Admin</span>
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
            {visibleNavItems.map((item) => {
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
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
