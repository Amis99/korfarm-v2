import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { apiGet } from "../utils/adminApi";
import "../styles/admin.css";

function AdminPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet("/v1/admin/dashboard/summary")
      .then((data) => {
        setSummary(data);
        setError("");
      })
      .catch((err) => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const cards = summary
    ? [
        { label: "오늘 가입자", value: String(summary.todaySignups ?? 0) },
        { label: "활성 사용자", value: String(summary.activeUsers ?? 0) },
        { label: "전체 사용자", value: String(summary.totalUsers ?? 0) },
        { label: "활성 기관", value: String(summary.activeOrgs ?? 0) },
      ]
    : [
        { label: "오늘 가입자", value: "-" },
        { label: "활성 사용자", value: "-" },
        { label: "전체 사용자", value: "-" },
        { label: "활성 기관", value: "-" },
      ];

  return (
    <div className="admin-page">
      <div className="admin-shell">
        <aside className="admin-side">
          <div className="admin-brand" aria-label="국어농장 Admin">
            <img className="admin-logo" src={import.meta.env.BASE_URL + "korfarm-logo.png"} alt="국어농장" />
            <span>Admin</span>
          </div>
          <nav className="admin-nav">
            <Link className="active" to="/admin">
              <span className="material-symbols-outlined">dashboard</span>
              대시보드
            </Link>
            <Link to="/admin/orgs">
              <span className="material-symbols-outlined">business</span>
              기관 관리
            </Link>
            <Link to="/admin/classes">
              <span className="material-symbols-outlined">school</span>
              반 관리
            </Link>
            <Link to="/admin/students">
              <span className="material-symbols-outlined">group</span>
              학생 관리
            </Link>
            <Link to="/admin/parents">
              <span className="material-symbols-outlined">family_restroom</span>
              학부모 관리
            </Link>
            <Link to="/admin/content">
              <span className="material-symbols-outlined">menu_book</span>
              콘텐츠
            </Link>
            <Link to="/admin/assignments">
              <span className="material-symbols-outlined">task</span>
              과제/피드백
            </Link>
            <Link to="/admin/wisdom">
              <span className="material-symbols-outlined">menu_book</span>
              지식과 지혜
            </Link>
            <Link to="/admin/tests">
              <span className="material-symbols-outlined">assignment</span>
              테스트 관리
            </Link>
            <Link to="/admin/seasons">
              <span className="material-symbols-outlined">event</span>
              시즌
            </Link>
            <Link to="/admin/shop/products">
              <span className="material-symbols-outlined">storefront</span>
              상품
            </Link>
            <Link to="/admin/shop/orders">
              <span className="material-symbols-outlined">local_shipping</span>
              주문
            </Link>
            <Link to="/admin/payments">
              <span className="material-symbols-outlined">receipt_long</span>
              결제
            </Link>
            <Link to="/admin/reports">
              <span className="material-symbols-outlined">flag</span>
              보고
            </Link>
            <Link to="/admin/flags">
              <span className="material-symbols-outlined">tune</span>
              운영 플래그
            </Link>
            <Link to="/">
              <span className="material-symbols-outlined">home</span>
              랜딩
            </Link>
            <Link to="/start">
              <span className="material-symbols-outlined">play_arrow</span>
              스타트
            </Link>
          </nav>
        </aside>

        <main className="admin-main">
          <div className="admin-topbar">
            <div>
              <h1>운영 대시보드</h1>
              <p>오늘의 운영 지표와 처리 현황을 확인하세요.</p>
            </div>
          </div>

          {loading ? <p style={{ padding: "20px" }}>로딩 중...</p> : null}
          {error ? <p style={{ padding: "20px", color: "#e74c3c" }}>{error}</p> : null}

          <section className="admin-summary">
            {cards.map((item) => (
              <div className="admin-card" key={item.label}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </section>

          <section className="admin-grid">
            <div className="admin-card">
              <h2>빠른 이동</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <Link className="admin-action" to="/admin/orgs">기관 관리</Link>
                <Link className="admin-action" to="/admin/students">학생 관리</Link>
                <Link className="admin-action" to="/admin/content">콘텐츠 관리</Link>
                <Link className="admin-action" to="/admin/flags">운영 플래그</Link>
                <Link className="admin-action" to="/admin/payments">결제 관리</Link>
              </div>
            </div>
            <div className="admin-card">
              <h2>관리 메뉴</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <Link className="admin-action" to="/admin/assignments">과제/피드백</Link>
                <Link className="admin-action" to="/admin/seasons">시즌 관리</Link>
                <Link className="admin-action" to="/admin/shop/products">상품 관리</Link>
                <Link className="admin-action" to="/admin/shop/orders">주문 관리</Link>
                <Link className="admin-action" to="/admin/reports">보고 관리</Link>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default AdminPage;
