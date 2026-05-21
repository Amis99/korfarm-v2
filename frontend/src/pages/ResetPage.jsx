import { useState } from "react";
import { Link } from "react-router-dom";
import { apiPost } from "../utils/api";
import "../styles/auth.css";

/**
 * N-34 (2026-05-22) — 이메일 토큰 기반 셀프 비번 재설정 요청.
 * 아이디 입력 → POST /v1/auth/request-password-reset.
 * 계정 존재 여부와 무관하게 동일 응답 (계정 열거 방지).
 */
function ResetPage() {
  const [loginId, setLoginId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!loginId.trim()) { setError("아이디를 입력해 주세요."); return; }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const data = await apiPost("/v1/auth/request-password-reset", { loginId: loginId.trim() });
      setMessage(data?.message || "가입된 계정이라면 비밀번호 재설정 안내 메일이 발송됩니다. 메일함을 확인해 주세요.");
    } catch (e) {
      setError(e?.message || "요청에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <section className="auth-hero">
          <span className="auth-highlight">PASSWORD RESET</span>
          <h1>비밀번호를 잊으셨나요?</h1>
          <p>
            가입한 아이디(이메일)를 입력하면 재설정 안내 메일을 보내드려요.
            메일이 도착하지 않으면 기관 관리자에게 문의해 주세요.
          </p>
          <div className="auth-links">
            <span>이미 비밀번호가 기억났나요?</span>
            <Link to="/login">로그인</Link>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-card">
            <h2>비밀번호 재설정 요청</h2>
            <p>가입한 아이디(이메일)를 입력해 주세요.</p>
            <form onSubmit={handleSubmit}>
              <label>
                아이디(이메일)
                <input
                  type="text"
                  value={loginId}
                  onChange={(e) => setLoginId(e.target.value)}
                  placeholder="가입한 아이디"
                  required
                  autoComplete="username"
                />
              </label>
              {message && <div className="auth-error" style={{ color: "#2ecc71" }}>{message}</div>}
              {error && <div className="auth-error">{error}</div>}
              <div className="auth-actions">
                <button className="auth-primary" type="submit" disabled={loading}>
                  {loading ? "요청 중..." : "재설정 메일 받기"}
                </button>
                <Link className="auth-secondary" to="/login">
                  로그인으로
                </Link>
              </div>
            </form>
            <p style={{ fontSize: "0.82rem", color: "#8a7468", marginTop: 16, lineHeight: 1.6 }}>
              · 메일이 안 보이면 스팸함도 확인해 주세요.<br />
              · 메일 발송이 안 되는 환경이라면 기관 관리자(또는 본사 관리자)에게 임시 비밀번호 발급을 요청할 수 있어요.
            </p>
            <div className="auth-links">
              <Link to="/signup">회원가입</Link>
              <Link to="/">랜딩 페이지</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ResetPage;
