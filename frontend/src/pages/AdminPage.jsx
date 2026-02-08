import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiGet } from "../utils/adminApi";
import AdminLayout from "../components/AdminLayout";

function AdminPage() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

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

  // 새 지표 카드 (클릭 이동 가능)
  const extraCards = summary
    ? [
        {
          label: "오늘 학습 참여",
          value: String(summary.todayLearners ?? 0),
          link: null,
        },
        {
          label: "승인 대기",
          value: String(summary.pendingApprovals ?? 0),
          link: "/admin/approvals",
        },
        {
          label: "학부모 연결 대기",
          value: String(summary.pendingParentLinks ?? 0),
          link: "/admin/parents",
        },
        {
          label: "최근 7일 시험 응시",
          value: String(summary.recentTestSubmissions ?? 0),
          link: "/admin/tests",
        },
      ]
    : [
        { label: "오늘 학습 참여", value: "-", link: null },
        { label: "승인 대기", value: "-", link: "/admin/approvals" },
        { label: "학부모 연결 대기", value: "-", link: "/admin/parents" },
        { label: "최근 7일 시험 응시", value: "-", link: "/admin/tests" },
      ];

  return (
    <AdminLayout>
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

      <section className="admin-summary" style={{ marginTop: 0 }}>
        {extraCards.map((item) => (
          <div
            className="admin-card"
            key={item.label}
            style={item.link ? { cursor: "pointer" } : undefined}
            onClick={item.link ? () => navigate(item.link) : undefined}
          >
            <span>{item.label}</span>
            <strong>{item.value}</strong>
            {item.link && (
              <span style={{ fontSize: "11px", color: "var(--admin-muted)" }}>
                클릭하여 이동
              </span>
            )}
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
            <Link className="admin-action" to="/admin/duel/questions">대결 문제 관리</Link>
          </div>
        </div>
      </section>
    </AdminLayout>
  );
}

export default AdminPage;
