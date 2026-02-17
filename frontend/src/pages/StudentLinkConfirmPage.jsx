import { useState } from "react";
import { Link } from "react-router-dom";
import { API_BASE, TOKEN_KEY } from "../utils/api";
import "../styles/parent-links.css";

function StudentLinkConfirmPage() {
  const [parentLoginId, setParentLoginId] = useState("");
  const [requestCode, setRequestCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setError("로그인이 필요합니다.");
      return;
    }
    if (!parentLoginId.trim() || !requestCode.trim()) {
      setError("학부모 아이디와 요청 코드를 모두 입력해 주세요.");
      return;
    }
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/v1/students/links/confirm`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parent_login_id: parentLoginId.trim(),
          request_code: requestCode.trim(),
        }),
      });
      const payload = await response.json();
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error?.message || "요청에 실패했습니다.");
      }
      setMessage("연결이 승인되었습니다.");
      setParentLoginId("");
      setRequestCode("");
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
            <h1>학부모 연결 승인</h1>
            <p>학부모가 전달한 요청 코드를 입력해 주세요.</p>
          </div>
          <Link to="/start" className="parent-links-btn ghost">
            스타트로
          </Link>
        </header>

        <section className="parent-links-card">
          <form onSubmit={handleConfirm}>
            <input
              placeholder="학부모 아이디"
              value={parentLoginId}
              onChange={(event) => setParentLoginId(event.target.value)}
            />
            <input
              placeholder="요청 코드"
              value={requestCode}
              onChange={(event) => setRequestCode(event.target.value)}
            />
            <button type="submit" disabled={loading}>
              {loading ? "승인 중..." : "승인하기"}
            </button>
          </form>
          {message ? <p className="parent-links-success">{message}</p> : null}
          {error ? <p className="parent-links-error">{error}</p> : null}
        </section>
      </div>
    </div>
  );
}

export default StudentLinkConfirmPage;
