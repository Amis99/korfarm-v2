import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/parent-links.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";
const TOKEN_KEY = "korfarm_token";

const formatStatus = (status) => {
  switch (status) {
    case "active":
      return "연결됨";
    case "pending":
      return "승인 대기";
    case "rejected":
      return "거절됨";
    case "inactive":
      return "비활성";
    default:
      return status;
  }
};

function ParentLinksPage() {
  const [studentLoginId, setStudentLoginId] = useState("");
  const [links, setLinks] = useState([]);
  const [requestCode, setRequestCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadLinks = async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setError("로그인이 필요합니다.");
      return;
    }
    try {
      const response = await fetch(`${API_BASE}/v1/parents/links`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await response.json();
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error?.message || "요청에 실패했습니다.");
      }
      setLinks(payload?.data || []);
      setError("");
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadLinks();
  }, []);

  const handleRequest = async (event) => {
    event.preventDefault();
    setError("");
    setRequestCode("");
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setError("로그인이 필요합니다.");
      return;
    }
    if (!studentLoginId.trim()) {
      setError("학생 아이디를 입력해 주세요.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/v1/parents/links/request`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ student_login_id: studentLoginId.trim() }),
      });
      const payload = await response.json();
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error?.message || "요청에 실패했습니다.");
      }
      const link = payload?.data;
      setRequestCode(link?.request_code || "");
      setStudentLoginId("");
      await loadLinks();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="parent-links-page">
      <div className="parent-links-shell">
        <header className="parent-links-header">
          <div>
            <h1>학부모 연결</h1>
            <p>학생 계정을 연결하면 학습 리포트를 확인할 수 있어요.</p>
          </div>
          <Link to="/start" className="parent-links-btn ghost">
            스타트로
          </Link>
        </header>

        <section className="parent-links-card">
          <h2>연결 요청</h2>
          <form onSubmit={handleRequest}>
            <input
              placeholder="학생 아이디"
              value={studentLoginId}
              onChange={(event) => setStudentLoginId(event.target.value)}
            />
            <button type="submit" disabled={loading}>
              {loading ? "요청 중..." : "요청하기"}
            </button>
          </form>
          {requestCode ? (
            <p className="parent-links-code">
              요청 코드: <strong>{requestCode}</strong> (학생에게 전달하세요)
            </p>
          ) : null}
          {error ? <p className="parent-links-error">{error}</p> : null}
        </section>

        <section className="parent-links-card">
          <h2>연결 현황</h2>
          {links.length === 0 ? (
            <p className="parent-links-empty">연결된 학생이 없습니다.</p>
          ) : (
            <ul className="parent-links-list">
              {links.map((link) => (
                <li key={link.link_id}>
                  <div>
                    <strong>{link.student_name || link.student_login_id}</strong>
                    <span>{link.student_login_id}</span>
                  </div>
                  <span>{formatStatus(link.status)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="parent-links-card">
          <h2>학생 인증 안내</h2>
          <p>
            학생 계정에서는 <Link to="/students/links/confirm">연결 승인</Link> 메뉴에서
            요청 코드를 입력해야 합니다.
          </p>
        </section>
      </div>
    </div>
  );
}

export default ParentLinksPage;
