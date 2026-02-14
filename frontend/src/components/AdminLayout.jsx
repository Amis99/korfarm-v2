import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import "../styles/admin.css";

const NAV_ITEMS = [
  { to: "/admin", icon: "dashboard", label: "대시보드" },
  { to: "/admin/approvals", icon: "how_to_reg", label: "가입 승인" },
  { to: "/admin/orgs", icon: "business", label: "기관 관리" },
  { to: "/admin/classes", icon: "school", label: "반 관리" },
  { to: "/admin/students", icon: "group", label: "학생 관리" },
  { to: "/admin/parents", icon: "family_restroom", label: "학부모 관리" },
  { to: "/admin/content", icon: "menu_book", label: "콘텐츠" },
  { to: "/admin/assignments", icon: "task", label: "과제/피드백" },
  { to: "/admin/wisdom", icon: "auto_stories", label: "지식과 지혜", roles: ["HQ_ADMIN"] },
  { to: "/admin/tests", icon: "assignment", label: "테스트 관리" },
  { to: "/admin/duel/questions", icon: "swords", label: "대결 문제" },
  { to: "/admin/seasons", icon: "event", label: "시즌" },
  { to: "/admin/shop/products", icon: "storefront", label: "상품" },
  { to: "/admin/shop/orders", icon: "local_shipping", label: "주문" },
  { to: "/admin/payments", icon: "receipt_long", label: "결제" },
  { to: "/admin/reports", icon: "flag", label: "보고" },
  { to: "/admin/flags", icon: "tune", label: "운영 플래그", roles: ["HQ_ADMIN"] },
  { to: "/", icon: "home", label: "랜딩" },
  { to: "/start", icon: "play_arrow", label: "스타트" },
];

function AdminLayout({ children }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const userRoles = user?.roles || [];

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
            {visibleNavItems.map((item) => (
              <Link
                key={item.to}
                className={location.pathname === item.to ? "active" : ""}
                to={item.to}
                onClick={() => setOpen(false)}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
                {item.label}
              </Link>
            ))}
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
