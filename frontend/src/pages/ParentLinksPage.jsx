import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE, TOKEN_KEY } from "../utils/api";
import "../styles/parent-links.css";

const formatStatus = (status) => {
  switch (status) {
    case "active":
      return "연결됨";
    case "inactive":
      return "해제됨";
    default:
      return status;
  }
};

/**
 * 학부모 연결 (학부모용 페이지)
 * 정책: 회원가입 시 학생 정보(이름·휴대폰)가 정확히 일치하면 자동 연결.
 *  추가 연결이 필요하면 본사로 문의 (요청 코드 발급/학생 승인 절차는 폐기됨).
 */
function ParentLinksPage() {
  const [links, setLinks] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = sessionStorage.getItem(TOKEN_KEY);
      if (!token) {
        if (!cancelled) {
          setError("로그인이 필요합니다.");
          setLoading(false);
        }
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
        if (!cancelled) {
          setLinks(payload?.data || []);
          setError("");
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="parent-links-page">
      <div className="parent-links-shell">
        <header className="parent-links-header">
          <div>
            <h1>학부모 연결</h1>
            <p>회원가입 시 학생 정보가 일치하면 자동으로 연결됩니다.</p>
          </div>
          <Link to="/start" className="parent-links-btn ghost">
            스타트로
          </Link>
        </header>

        <section className="parent-links-card">
          <h2>연결된 학생</h2>
          {loading ? (
            <p className="parent-links-empty">불러오는 중...</p>
          ) : links.length === 0 ? (
            <p className="parent-links-empty">
              연결된 학생이 없습니다. 회원가입 시 입력한 학생 이름·휴대폰이 학생 계정과 일치해야 자동 연결됩니다.
              연결이 필요하면 본사 또는 소속 기관으로 문의해 주세요.
            </p>
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
          {error ? <p className="parent-links-error">{error}</p> : null}
        </section>
      </div>
    </div>
  );
}

export default ParentLinksPage;
