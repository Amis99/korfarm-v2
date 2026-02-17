import { useState } from "react";
import { Link } from "react-router-dom";
import { apiPost } from "../utils/api";
import "../styles/auth.css";

function ResetPage() {
  const [loginId, setLoginId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!loginId.trim()) { setError("아이디를 입력하세요."); return; }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const data = await apiPost("/v1/auth/request-password-reset", {
        loginId: loginId.trim(),
      });
      setMessage(data.message || "비밀번호 초기화 요청이 접수되었습니다. 선생님 또는 관리자에게 문의하세요.");
    } catch (e) {
      setError(e.message || "요청에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <section className="auth-hero">
          <span className="auth-highlight">PASSWORD RESET</span>
          <h1>비밀번호를 재설정할까요?</h1>
          <p>
            아이디를 입력하면 본인 확인 후 재설정 안내를 받을 수 있어요.
          </p>
          <div className="auth-links">
            <span>이미 비밀번호가 기억났나요?</span>
            <Link to="/login">로그인</Link>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-card">
            <h2>비밀번호 찾기</h2>
            <p>가입한 아이디를 입력해 주세요.</p>
            <form onSubmit={handleSubmit}>
              <label>
                아이디
                <input
                  type="text"
                  value={loginId}
                  onChange={(event) => setLoginId(event.target.value)}
                  placeholder="아이디를 입력하세요"
                  required
                />
              </label>
              {message && <div className="auth-error" style={{ color: "#2ecc71" }}>{message}</div>}
              {error && <div className="auth-error">{error}</div>}
              <div className="auth-actions">
                <button className="auth-primary" type="submit" disabled={loading}>
                  {loading ? "요청 중..." : "안내 받기"}
                </button>
                <Link className="auth-secondary" to="/login">
                  로그인으로
                </Link>
              </div>
            </form>
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
