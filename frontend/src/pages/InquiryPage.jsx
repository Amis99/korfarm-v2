import { useState } from "react";
import { Link } from "react-router-dom";
import { apiPost, API_BASE, snakeize, camelize } from "../utils/api";
import "../styles/inquiry.css";

const formatDate = (dt) => {
  if (!dt) return "";
  const d = new Date(dt);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/* 인증 없이 호출하는 POST 헬퍼 */
const publicPost = async (path, body) => {
  const base = API_BASE.replace(/\/$/, "");
  const response = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(snakeize(body)),
  });
  const ct = response.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    throw new Error("서버 오류가 발생했습니다.");
  }
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || payload?.message || "요청 실패");
  }
  return camelize(payload?.data ?? payload);
};

function InquiryPage() {
  const [tab, setTab] = useState("write"); // write | check
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  // 조회 탭 상태
  const [vName, setVName] = useState("");
  const [vContact, setVContact] = useState("");
  const [posts, setPosts] = useState([]);
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [vError, setVError] = useState("");

  // 상세 보기
  const [detail, setDetail] = useState(null);
  const [comments, setComments] = useState([]);

  const handleSubmit = async () => {
    if (!name.trim()) { setError("이름을 입력하세요."); return; }
    if (!contact.trim()) { setError("연락처를 입력하세요."); return; }
    if (!title.trim()) { setError("제목을 입력하세요."); return; }
    if (!content.trim()) { setError("내용을 입력하세요."); return; }
    setSubmitting(true);
    setError("");
    try {
      await publicPost("/v1/public/inquiry", {
        guestName: name.trim(),
        guestContact: contact.trim(),
        title: title.trim(),
        content: content.trim(),
      });
      setSuccess(true);
    } catch (e) {
      setError(e.message || "등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerify = async () => {
    if (!vName.trim() || !vContact.trim()) {
      setVError("이름과 연락처를 모두 입력하세요.");
      return;
    }
    setVerifying(true);
    setVError("");
    try {
      const data = await publicPost("/v1/public/inquiry/verify", {
        guestName: vName.trim(),
        guestContact: vContact.trim(),
      });
      setPosts(Array.isArray(data) ? data : []);
      setVerified(true);
      setDetail(null);
    } catch (e) {
      setVError(e.message || "조회에 실패했습니다.");
    } finally {
      setVerifying(false);
    }
  };

  const openDetail = async (postId) => {
    try {
      const data = await publicPost(`/v1/public/inquiry/${postId}/verify`, {
        guestName: vName.trim(),
        guestContact: vContact.trim(),
      });
      setDetail(data.post || data);
      setComments(data.comments || []);
    } catch (e) {
      setVError(e.message || "상세 조회에 실패했습니다.");
    }
  };

  const resetWrite = () => {
    setSuccess(false);
    setTitle("");
    setContent("");
  };

  return (
    <div className="inquiry-page">
      <div className="inquiry-wrap">
        <div className="inquiry-header">
          <Link to="/" className="inquiry-back">
            <span className="material-symbols-outlined">arrow_back</span>
            홈으로
          </Link>
          <h1>문의/상담</h1>
          <p>궁금한 점이나 상담이 필요하시면 문의를 남겨주세요.</p>
        </div>

        <div className="inquiry-tabs">
          <button
            className={`inquiry-tab ${tab === "write" ? "active" : ""}`}
            onClick={() => setTab("write")}
          >
            <span className="material-symbols-outlined">edit_note</span>
            문의 작성
          </button>
          <button
            className={`inquiry-tab ${tab === "check" ? "active" : ""}`}
            onClick={() => setTab("check")}
          >
            <span className="material-symbols-outlined">search</span>
            내 문의 확인
          </button>
        </div>

        {tab === "write" && (
          <div className="inquiry-card">
            {success ? (
              <div className="inquiry-success">
                <span className="material-symbols-outlined">check_circle</span>
                <h2>문의가 등록되었습니다</h2>
                <p>관리자 확인 후 답변을 드리겠습니다.<br />
                  '내 문의 확인' 탭에서 이름과 연락처로 답변을 확인하실 수 있습니다.</p>
                <div className="inquiry-success-actions">
                  <button className="inquiry-btn" onClick={resetWrite}>
                    새 문의 작성
                  </button>
                  <button className="inquiry-btn ghost" onClick={() => { setTab("check"); setVName(name); setVContact(contact); }}>
                    내 문의 확인하기
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={(e) => e.preventDefault()}>
                <div className="inquiry-row">
                  <div className="inquiry-field">
                    <label>이름 <span className="required">*</span></label>
                    <input
                      type="text"
                      placeholder="이름을 입력하세요"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                  <div className="inquiry-field">
                    <label>연락처 <span className="required">*</span></label>
                    <input
                      type="text"
                      placeholder="전화번호 또는 이메일"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                    />
                  </div>
                </div>
                <div className="inquiry-field">
                  <label>제목 <span className="required">*</span></label>
                  <input
                    type="text"
                    placeholder="문의 제목을 입력하세요"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
                <div className="inquiry-field">
                  <label>내용 <span className="required">*</span></label>
                  <textarea
                    placeholder="문의 내용을 자세히 작성해주세요"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                </div>
                {error && <p className="inquiry-error">{error}</p>}
                <button
                  className="inquiry-btn"
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting}
                >
                  {submitting ? "등록 중..." : "문의 등록"}
                </button>
              </form>
            )}
          </div>
        )}

        {tab === "check" && (
          <div className="inquiry-card">
            {detail ? (
              <div className="inquiry-detail">
                <button className="inquiry-back-btn" onClick={() => setDetail(null)}>
                  <span className="material-symbols-outlined">arrow_back</span>
                  목록으로
                </button>
                <h2>{detail.title}</h2>
                <div className="inquiry-detail-meta">
                  <span>{formatDate(detail.createdAt)}</span>
                </div>
                <div className="inquiry-detail-body">{detail.content}</div>

                <div className="inquiry-comments">
                  <h3>답변 ({comments.filter((c) => c.status !== "deleted").length})</h3>
                  {comments.filter((c) => c.status !== "deleted").length === 0 ? (
                    <p className="inquiry-no-reply">아직 답변이 등록되지 않았습니다.</p>
                  ) : (
                    comments
                      .filter((c) => c.status !== "deleted")
                      .map((c) => (
                        <div key={c.commentId || c.id} className="inquiry-comment">
                          <div className="inquiry-comment-head">
                            <span className="inquiry-comment-badge">관리자</span>
                            <span>{formatDate(c.createdAt)}</span>
                          </div>
                          <div className="inquiry-comment-body">{c.content}</div>
                        </div>
                      ))
                  )}
                </div>
              </div>
            ) : !verified ? (
              <div className="inquiry-verify">
                <p className="inquiry-verify-desc">
                  문의 작성 시 입력한 이름과 연락처로 본인 확인 후 조회합니다.
                </p>
                <div className="inquiry-row">
                  <div className="inquiry-field">
                    <label>이름</label>
                    <input
                      type="text"
                      placeholder="이름"
                      value={vName}
                      onChange={(e) => setVName(e.target.value)}
                    />
                  </div>
                  <div className="inquiry-field">
                    <label>연락처</label>
                    <input
                      type="text"
                      placeholder="전화번호 또는 이메일"
                      value={vContact}
                      onChange={(e) => setVContact(e.target.value)}
                    />
                  </div>
                </div>
                {vError && <p className="inquiry-error">{vError}</p>}
                <button
                  className="inquiry-btn"
                  onClick={handleVerify}
                  disabled={verifying}
                >
                  {verifying ? "조회 중..." : "내 문의 조회"}
                </button>
              </div>
            ) : (
              <div className="inquiry-list">
                <div className="inquiry-list-head">
                  <p>총 {posts.length}건의 문의가 있습니다.</p>
                  <button className="inquiry-btn ghost small" onClick={() => { setVerified(false); setPosts([]); }}>
                    다시 조회
                  </button>
                </div>
                {posts.length === 0 ? (
                  <p className="inquiry-empty">등록된 문의가 없습니다.</p>
                ) : (
                  <table className="inquiry-table">
                    <thead>
                      <tr>
                        <th>번호</th>
                        <th>제목</th>
                        <th>작성일</th>
                      </tr>
                    </thead>
                    <tbody>
                      {posts.map((post, idx) => (
                        <tr
                          key={post.postId || post.id}
                          onClick={() => openDetail(post.postId || post.id)}
                        >
                          <td className="inquiry-td-num">{posts.length - idx}</td>
                          <td className="inquiry-td-title">{post.title}</td>
                          <td className="inquiry-td-date">{formatDate(post.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default InquiryPage;
