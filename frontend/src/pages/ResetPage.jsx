import { useState } from "react";
import { Link } from "react-router-dom";
import "../styles/auth.css";

function ResetPage() {
  const [loginId, setLoginId] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    setMessage(
      "입력한 아이디로 비밀번호 재설정 안내를 전송했습니다. 문자 메시지를 확인해 주세요."
    );
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
              {message ? <div className="auth-error">{message}</div> : null}
              <div className="auth-actions">
                <button className="auth-primary" type="submit">
                  안내 받기
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
