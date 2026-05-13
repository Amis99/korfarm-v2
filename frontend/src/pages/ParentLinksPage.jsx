import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE, TOKEN_KEY, apiPost } from "../utils/api";
import Pagination from "../components/Pagination";
import usePagination from "../hooks/usePagination";
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

  // 자녀 추가 폼
  const [formLoginId, setFormLoginId] = useState("");
  const [formName, setFormName] = useState("");
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState("");

  const { page, setPage, totalPages, paged } = usePagination(links, 15);

  const fetchLinks = async () => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) {
      setError("로그인이 필요합니다.");
      setLoading(false);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLinks(); }, []);

  const handleAddChild = async (e) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess("");
    const loginId = formLoginId.trim();
    const name = formName.trim();
    if (!loginId || !name) {
      setFormError("학생 아이디와 이름을 모두 입력해 주세요.");
      return;
    }
    setFormSubmitting(true);
    try {
      await apiPost("/v1/parents/links/self-link", {
        studentLoginId: loginId,
        studentName: name,
      });
      setFormSuccess(`'${name}' 학생과 연결됐습니다.`);
      setFormLoginId("");
      setFormName("");
      await fetchLinks();
    } catch (err) {
      setFormError(err.message || "자녀 연결에 실패했습니다.");
    } finally {
      setFormSubmitting(false);
    }
  };

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

        <section className="parent-links-card" style={{ marginBottom: 16 }}>
          <h2>자녀 추가</h2>
          <p style={{ fontSize: 13, color: "#666", marginTop: 4 }}>
            학생의 <strong>아이디</strong>와 <strong>이름</strong>이 모두 일치하면 즉시 연결됩니다.
          </p>
          <form onSubmit={handleAddChild} style={{ display: "grid", gap: 8, marginTop: 12 }}>
            <input
              type="text"
              placeholder="학생 아이디 (예: hong123)"
              value={formLoginId}
              onChange={(e) => setFormLoginId(e.target.value)}
              disabled={formSubmitting}
              style={inputStyle}
            />
            <input
              type="text"
              placeholder="학생 이름"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              disabled={formSubmitting}
              style={inputStyle}
            />
            <button
              type="submit"
              disabled={formSubmitting}
              className="parent-links-btn"
              style={{ marginTop: 4 }}
            >
              {formSubmitting ? "확인 중..." : "자녀 연결하기"}
            </button>
          </form>
          {formError && <p className="parent-links-error" style={{ marginTop: 8 }}>{formError}</p>}
          {formSuccess && (
            <p style={{ marginTop: 8, color: "#2f7a3e", fontSize: 13, fontWeight: 600 }}>
              {formSuccess}
            </p>
          )}
        </section>

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
            <>
              <ul className="parent-links-list">
                {paged.map((link) => (
                  <li key={link.link_id}>
                    <div>
                      <strong>{link.student_name || link.student_login_id}</strong>
                      <span>{link.student_login_id}</span>
                    </div>
                    <span>{formatStatus(link.status)}</span>
                  </li>
                ))}
              </ul>
              <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </>
          )}
          {error ? <p className="parent-links-error">{error}</p> : null}
        </section>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: "10px 12px",
  fontSize: 14,
  border: "1px solid #ddd",
  borderRadius: 8,
  outline: "none",
  background: "#fff",
};

export default ParentLinksPage;
