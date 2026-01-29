import { Link } from "react-router-dom";
import "../styles/admin-detail.css";

const FLAGS = [
  {
    key: "feature.duel.mode",
    description: "대결하기 기능",
    status: "on",
  },
  {
    key: "feature.paid.pro_mode",
    description: "프리미엄 모드",
    status: "on",
  },
  {
    key: "feature.paid.writing",
    description: "서술형 과제",
    status: "off",
  },
  {
    key: "feature.season.ranking",
    description: "시즌 랭킹",
    status: "on",
  },
];

function AdminFlagsPage() {
  return (
    <div className="admin-detail-page">
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>운영 플래그</h1>
          <div className="admin-detail-actions">
            <button className="admin-detail-btn" type="button">
              플래그 추가
            </button>
            <Link className="admin-detail-btn secondary" to="/admin">
              대시보드
            </Link>
          </div>
        </div>
        <div className="admin-detail-nav">
          <Link to="/admin/orgs">기관</Link>
          <Link to="/admin/classes">반</Link>
          <Link to="/admin/students">학생</Link>
          <Link to="/admin/parents">학부모 관리</Link>
          <Link to="/admin/content">콘텐츠</Link>
          <Link to="/admin/assignments">과제</Link>
          <Link to="/admin/seasons">시즌</Link>
          <Link to="/admin/shop/products">상품</Link>
          <Link to="/admin/shop/orders">주문</Link>
          <Link to="/admin/payments">결제</Link>
          <Link to="/admin/reports">보고</Link>
          <Link to="/admin/flags">플래그</Link>
        </div>
        <div className="admin-detail-grid">
          <div className="admin-detail-card">
            <h2>플래그 목록</h2>
            {FLAGS.map((flag) => (
              <div className="admin-toggle" key={flag.key}>
                <div>
                  <strong>{flag.key}</strong>
                  <p>{flag.description}</p>
                </div>
                <button className="admin-detail-btn secondary" type="button">
                  {flag.status === "on" ? "끄기" : "켜기"}
                </button>
              </div>
            ))}
          </div>
          <div className="admin-detail-card">
            <h3>운영 메모</h3>
            <p>플래그 변경은 즉시 서비스에 반영됩니다.</p>
            <div className="admin-detail-tag">최근 변경 3건</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminFlagsPage;
