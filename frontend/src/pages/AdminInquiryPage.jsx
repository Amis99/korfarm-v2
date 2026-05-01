import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../utils/api";
import AdminLayout from "../components/AdminLayout";
import Pagination from "../components/Pagination";
import usePagination from "../hooks/usePagination";

const formatDate = (dt) => {
  if (!dt) return "";
  const d = new Date(dt);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function AdminInquiryPage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [comments, setComments] = useState([]);
  const [reply, setReply] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { page, setPage, totalPages, paged: pagedPosts } = usePagination(posts, 15);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = () => {
    setLoading(true);
    apiGet("/v1/admin/boards/inquiry")
      .then((res) => {
        const items = res?.data || res?.items || (Array.isArray(res) ? res : []);
        setPosts(items);
      })
      .catch((e) => {
        console.error(e);
        setPosts([]);
      })
      .finally(() => setLoading(false));
  };

  const selectPost = (postId) => {
    setSelected(postId);
    setDetail(null);
    setComments([]);
    setReply("");
    apiGet(`/v1/posts/${postId}`)
      .then((res) => {
        const data = res?.data || res;
        setDetail(data);
      })
      .catch(console.error);
    apiGet(`/v1/posts/${postId}/comments`)
      .then((res) => {
        const items = res?.data || res?.items || (Array.isArray(res) ? res : []);
        setComments(items);
      })
      .catch(console.error);
  };

  const submitReply = () => {
    if (!reply.trim() || !selected) return;
    setSubmitting(true);
    apiPost(`/v1/posts/${selected}/comments`, { content: reply.trim() })
      .then(() => {
        setReply("");
        // 댓글 목록 새로고침
        apiGet(`/v1/posts/${selected}/comments`)
          .then((res) => {
            const items = res?.data || res?.items || (Array.isArray(res) ? res : []);
            setComments(items);
          })
          .catch(console.error);
      })
      .catch(console.error)
      .finally(() => setSubmitting(false));
  };

  return (
    <AdminLayout>
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <div>
            <h1>문의 관리</h1>
            <p className="admin-detail-subtitle">사용자 문의글을 확인하고 답변합니다.</p>
          </div>
        </div>

        {selected && detail ? (
          <div>
            <button
              type="button"
              className="admin-detail-btn secondary"
              style={{ marginBottom: 16 }}
              onClick={() => { setSelected(null); setDetail(null); }}
            >
              ← 목록으로
            </button>

            <div className="admin-detail-card" style={{ marginBottom: 16 }}>
              <h2>{detail.title}</h2>
              <div style={{ fontSize: 13, color: "var(--admin-muted)", marginBottom: 16, display: "flex", gap: 16, flexWrap: "wrap" }}>
                {detail.isGuest ? (
                  <>
                    <span>이름: <strong style={{ color: "var(--admin-ink)" }}>{detail.guestName}</strong></span>
                    <span>연락처: <strong style={{ color: "var(--admin-ink)" }}>{detail.guestContact}</strong></span>
                    <span style={{ background: "var(--admin-accent-soft)", padding: "1px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, color: "var(--admin-accent-strong)" }}>비회원</span>
                  </>
                ) : (
                  <span>작성자: {detail.authorId}</span>
                )}
                <span>작성일: {formatDate(detail.createdAt)}</span>
              </div>
              <div style={{ lineHeight: 1.8, fontSize: 15, whiteSpace: "pre-wrap" }}>
                {detail.content}
              </div>
            </div>

            <div className="admin-detail-card">
              <h3>답변 ({comments.filter((c) => c.status !== "deleted").length})</h3>

              {comments.filter((c) => c.status !== "deleted").length === 0 && (
                <p style={{ color: "var(--admin-muted)", fontSize: 14, marginBottom: 16 }}>아직 답변이 없습니다.</p>
              )}

              {comments
                .filter((c) => c.status !== "deleted")
                .map((c) => (
                  <div
                    key={c.commentId || c.id}
                    style={{
                      padding: "12px 16px",
                      background: "var(--admin-panel-light, #f5f9f3)",
                      borderRadius: 10,
                      marginBottom: 10,
                      border: "1px solid var(--admin-stroke)",
                    }}
                  >
                    <div style={{ fontSize: 13, color: "var(--admin-muted)", marginBottom: 6 }}>
                      {c.authorId} · {formatDate(c.createdAt)}
                    </div>
                    <div style={{ fontSize: 15, lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                      {c.content}
                    </div>
                  </div>
                ))}

              <div style={{ marginTop: 16 }}>
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="답변을 입력하세요..."
                  style={{
                    width: "100%",
                    minHeight: 100,
                    padding: 12,
                    border: "1px solid var(--admin-stroke)",
                    borderRadius: 10,
                    fontSize: 15,
                    resize: "vertical",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                    color: "var(--admin-ink)",
                    background: "var(--admin-panel)",
                  }}
                />
                <button
                  type="button"
                  className="admin-detail-btn"
                  onClick={submitReply}
                  disabled={submitting || !reply.trim()}
                  style={{ marginTop: 8 }}
                >
                  {submitting ? "등록 중..." : "답변 등록"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="admin-detail-card" style={{ padding: 0, overflow: "hidden" }}>
            <table className="admin-detail-table" style={{ width: "100%" }}>
              <thead>
                <tr>
                  <th style={{ padding: "12px 16px" }}>번호</th>
                  <th style={{ padding: "12px 16px" }}>제목</th>
                  <th style={{ padding: "12px 16px" }}>작성자 / 연락처</th>
                  <th style={{ padding: "12px 16px" }}>작성일</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={4} style={{ padding: 40, textAlign: "center", color: "#888" }}>
                      불러오는 중...
                    </td>
                  </tr>
                ) : posts.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: 40, textAlign: "center", color: "#888" }}>
                      등록된 문의가 없습니다.
                    </td>
                  </tr>
                ) : (
                  pagedPosts.map((post, idx) => (
                    <tr
                      key={post.postId || post.id}
                      style={{ borderBottom: "1px solid #eee", cursor: "pointer" }}
                      onClick={() => selectPost(post.postId || post.id)}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f7faf6")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                    >
                      <td style={{ padding: "12px 16px", fontSize: 14 }}>{posts.length - ((page - 1) * 15 + idx)}</td>
                      <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 600 }}>{post.title}</td>
                      <td style={{ padding: "12px 16px", fontSize: 14, color: "#666" }}>
                        {post.isGuest ? (
                          <span>
                            {post.guestName}
                            <span style={{ marginLeft: 6, fontSize: 12, color: "#999" }}>{post.guestContact}</span>
                            <span style={{ marginLeft: 6, background: "#fff3e0", padding: "1px 6px", borderRadius: 4, fontSize: 10, fontWeight: 700, color: "#e65100" }}>비회원</span>
                          </span>
                        ) : post.authorId}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 14, color: "#888" }}>{formatDate(post.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminInquiryPage;
