import { Link } from "react-router-dom";
import "../styles/auth.css";

// N-30 (2026-05-21) — 셀프 비밀번호 재설정은 아직 미지원 (이메일/SMS 토큰 인프라 부재).
// 안내문만 표시하고 어드민 문의를 권장. 이메일 토큰 흐름 도입 후 input·form 복원 예정.
function ResetPage() {
  return (
    <div className="auth-page">
      <div className="auth-shell">
        <section className="auth-hero">
          <span className="auth-highlight">PASSWORD RESET</span>
          <h1>비밀번호를 잊으셨나요?</h1>
          <p>
            현재 셀프 재설정 흐름은 준비 중이에요.
            가입한 기관(학원·학교) 관리자 또는 본사 관리자에게 임시 비밀번호 발급을 요청해 주세요.
          </p>
          <div className="auth-links">
            <span>이미 비밀번호가 기억났나요?</span>
            <Link to="/login">로그인</Link>
          </div>
        </section>

        <section className="auth-panel">
          <div className="auth-card">
            <h2>비밀번호 재설정 안내</h2>
            <ul style={{ margin: "0 0 16px", padding: "0 0 0 18px", lineHeight: 1.7, color: "#5a4030" }}>
              <li>학생·학부모: <strong>가입한 학원(또는 학교) 관리자</strong>에게 임시 비밀번호 재발급을 요청하세요.</li>
              <li>기관 관리자: <strong>본사(국어농장) 관리자</strong>에게 문의해 주세요.</li>
              <li>임시 비밀번호로 로그인한 뒤 <strong>내 정보 → 비밀번호 변경</strong>에서 바로 새 비밀번호로 바꾸세요.</li>
            </ul>
            <p style={{ fontSize: "0.85rem", color: "#8a7468", margin: "0 0 16px" }}>
              ※ 이메일·문자 인증을 통한 셀프 재설정 흐름은 추후 지원 예정입니다.
            </p>
            <div className="auth-actions">
              <Link className="auth-primary" to="/login">로그인으로 돌아가기</Link>
              <Link className="auth-secondary" to="/signup">회원가입</Link>
            </div>
            <div className="auth-links">
              <Link to="/">랜딩 페이지</Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

export default ResetPage;
