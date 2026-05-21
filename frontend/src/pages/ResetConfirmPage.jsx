import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { apiPost } from "../utils/api";
import "../styles/auth.css";

/**
 * N-34 (2026-05-22) — 이메일 링크 클릭 후 새 비번 입력 페이지.
 * 경로: /reset/:token → POST /v1/auth/reset-password { token, newPassword }
 */
function ResetConfirmPage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!token) { setError("토큰이 누락되었습니다. 메일의 링크를 다시 확인해 주세요."); return; }
    if (newPassword.length < 8) { setError("새 비밀번호는 8자 이상이어야 합니다."); return; }
    if (newPassword !== confirmPassword) { setError("새 비밀번호 확인이 일치하지 않습니다."); return; }
    setLoading(true);
    try {
      const data = await apiPost("/v1/auth/reset-password", { token, newPassword });
      setMessage(data?.message || "비밀번호가 재설정되었습니다. 새 비밀번호로 로그인해 주세요.");
      setTimeout(() => navigate("/login", { replace: true }), 1800);
    } catch (e2) {
      setError(e2?.message || "재설정에 실패했습니다. 토큰이 만료됐을 수 있어요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <section className="auth-hero">
          <span className="auth-highlight">NEW PASSWORD</span>
          <h1>새 비밀번호를 설정해 주세요</h1>
          <p>토큰은 30분 후 만료되며, 한 번 사용하면 다시 사용할 수 없어요.</p>
        </section>
        <section className="auth-panel">
          <div className="auth-card">
            <h2>새 비밀번호 입력</h2>
            <form onSubmit={handleSubmit}>
              <label>
                새 비밀번호
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="8자 이상"
                  required
                  autoComplete="new-password"
                />
              </label>
              <label>
                새 비밀번호 확인
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="다시 입력"
                  required
                  autoComplete="new-password"
                />
              </label>
              {message && <div className="auth-error" style={{ color: "#2ecc71" }}>{message}</div>}
              {error && <div className="auth-error">{error}</div>}
              <div className="auth-actions">
                <button className="auth-primary" type="submit" disabled={loading || !!message}>
                  {loading ? "처리 중..." : "비밀번호 재설정"}
                </button>
                <Link className="auth-secondary" to="/login">로그인으로</Link>
              </div>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ResetConfirmPage;
