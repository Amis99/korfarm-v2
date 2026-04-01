import { Link } from "react-router-dom";

function NotFoundPage() {
  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(140deg, rgba(255,244,233,0.9) 0%, rgba(255,225,198,0.9) 70%, rgba(237,246,239,0.9) 100%)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--font-body)",
      textAlign: "center",
      padding: "40px 20px",
    }}>
      <Link to="/" style={{ marginBottom: 32 }}>
        <img src="/korfarm-logo.png" alt="국어농장" style={{ height: 40 }} />
      </Link>
      <h1 style={{ fontSize: 64, fontWeight: 800, color: "#f06c24", margin: "0 0 8px" }}>404</h1>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: "#2b221d", margin: "0 0 12px" }}>
        페이지를 찾을 수 없습니다
      </h2>
      <p style={{ color: "#6b5a53", fontSize: 15, margin: "0 0 32px", lineHeight: 1.6 }}>
        요청하신 페이지가 존재하지 않거나 이동되었습니다.<br />
        주소를 다시 확인해주세요.
      </p>
      <Link
        to="/"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "12px 28px",
          background: "#f06c24",
          color: "#fff",
          borderRadius: 999,
          fontWeight: 700,
          fontSize: 15,
          textDecoration: "none",
        }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 18 }}>home</span>
        홈으로 돌아가기
      </Link>
    </div>
  );
}

export default NotFoundPage;
