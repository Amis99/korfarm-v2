import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { TOKEN_KEY } from "../utils/api";
import "../styles/auth.css";

function PendingApprovalPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY);
    navigate("/login");
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <section className="auth-hero">
          <span className="auth-highlight">ALMOST THERE</span>
          <h1>승인 대기 중입니다</h1>
          <p>조금만 기다려 주세요!</p>
        </section>

        <section className="auth-panel">
          <div className="auth-card pending-card">
            <div className="pending-icon">
              <span className="material-symbols-outlined">hourglass_top</span>
            </div>
            <h2>회원가입 승인 대기 중</h2>
            <p className="pending-message">
              회원가입 요청이 접수되었습니다.
            </p>
            <p className="pending-description">
              소속 기관 관리자의 승인 후 모든 기능을 이용하실 수 있습니다.
              승인이 완료되면 별도의 알림 없이 바로 이용 가능합니다.
            </p>
            {user?.name && (
              <p className="pending-user-info">
                <strong>{user.name}</strong>님의 가입 요청이 접수되었습니다.
              </p>
            )}
            <div className="pending-actions">
              <button className="auth-primary" type="button" onClick={handleRefresh}>
                <span className="material-symbols-outlined">refresh</span>
                승인 상태 확인
              </button>
              <button className="auth-secondary" type="button" onClick={handleLogout}>
                로그아웃
              </button>
            </div>
            <div className="pending-notice">
              문의사항이 있으시면 소속 기관에 연락해 주세요.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default PendingApprovalPage;
