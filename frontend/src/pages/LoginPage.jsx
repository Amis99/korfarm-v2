import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/auth.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";
const TOKEN_KEY = "korfarm_token";

function LoginPage() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/v1/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loginId: loginId.trim(), password }),
      });
      const payload = await response.json();
      if (!response.ok || payload?.success === false) {
        const message =
          payload?.error?.message || payload?.message || "로그인에 실패했습니다.";
        throw new Error(message);
      }
      const token = payload?.data?.access_token || payload?.data?.accessToken;
      if (token) {
        localStorage.setItem(TOKEN_KEY, token);
      }
      navigate("/start");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-shell">
        <section className="auth-hero">
          <span className="auth-highlight">KORFARM START</span>
          <h1>국어농장과 함께 시작해요</h1>
          <p>
            아이들이 주도적으로 학습하고 부모님은 진행 상황을 쉽게 확인할 수 있어요.
          </p>
          <div className="auth-links">
            <span>처음 방문하셨나요?</span>
            <Link to="/signup">회원가입</Link>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-card">
            <h2>로그인</h2>
            <p>아이디와 비밀번호를 입력해 주세요.</p>
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
              <label>
                비밀번호
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  required
                />
              </label>
              {error ? <div className="auth-error">{error}</div> : null}
              <div className="auth-actions">
                <button className="auth-primary" type="submit" disabled={loading}>
                  {loading ? "로그인 중..." : "로그인"}
                </button>
                <Link className="auth-secondary" to="/signup">
                  회원가입
                </Link>
              </div>
            </form>
            <div className="auth-links">
              <Link to="/reset">비밀번호 찾기</Link>
              <Link to="/">랜딩 페이지</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default LoginPage;
