import { useEffect, useState } from "react";
import { apiGet, apiPost } from "../utils/api";
import AdminLayout from "../components/AdminLayout";

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
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "20px 20px" }}>
        <div className="admin-topbar" style={{ marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0 }}>문의 관리</h1>
            <p style={{ margin: "4px 0 0", fontSize: 14, color: "var(--admin-muted)" }}>
              사용자 문의글을 확인하고 답변합니다.
            </p>
          </div>
        </div>

        {selected && detail ? (
          <div>
            <button
              type="button"
              className="admin-action"
              style={{ marginBottom: 16, cursor: "pointer" }}
              onClick={() => { setSelected(null); setDetail(null); }}
            >
              ← 목록으로
            </button>

            <div className="admin-card" style={{ padding: 24, marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 8px" }}>{detail.title}</h2>
              <div style={{ fontSize: 13, color: "#888", marginBottom: 16 }}>
                <span>작성자: {detail.authorId}</span>
                <span style={{ marginLeft: 16 }}>작성일: {formatDate(detail.createdAt)}</span>
              </div>
              <div style={{ lineHeight: 1.8, fontSize: 15, whiteSpace: "pre-wrap" }}>
                {detail.content}
              </div>
            </div>

            <div className="admin-card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px" }}>
                답변 ({comments.filter((c) => c.status !== "deleted").length})
              </h3>

              {comments.filter((c) => c.status !== "deleted").length === 0 && (
                <p style={{ color: "#888", fontSize: 14, marginBottom: 16 }}>아직 답변이 없습니다.</p>
              )}

              {comments
                .filter((c) => c.status !== "deleted")
                .map((c) => (
                  <div
                    key={c.commentId || c.id}
                    style={{
                      padding: "12px 16px",
                      background: "#f7faf6",
                      borderRadius: 12,
                      marginBottom: 10,
                      border: "1px solid #e2eadf",
                    }}
                  >
                    <div style={{ fontSize: 13, color: "#888", marginBottom: 6 }}>
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
                    border: "1px solid #dde6d8",
                    borderRadius: 12,
                    fontSize: 15,
                    resize: "vertical",
                    fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
                <button
                  type="button"
                  onClick={submitReply}
                  disabled={submitting || !reply.trim()}
                  style={{
                    marginTop: 8,
                    padding: "10px 24px",
                    background: "#ff8f2b",
                    border: "none",
                    borderRadius: 12,
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: submitting ? "not-allowed" : "pointer",
                    opacity: submitting || !reply.trim() ? 0.5 : 1,
                  }}
                >
                  {submitting ? "등록 중..." : "답변 등록"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="admin-card" style={{ padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#f7faf6", borderBottom: "2px solid #e2eadf" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 700 }}>번호</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 700 }}>제목</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 700 }}>작성자</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 13, fontWeight: 700 }}>작성일</th>
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
                  posts.map((post, idx) => (
                    <tr
                      key={post.postId || post.id}
                      style={{ borderBottom: "1px solid #eee", cursor: "pointer" }}
                      onClick={() => selectPost(post.postId || post.id)}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#f7faf6")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                    >
                      <td style={{ padding: "12px 16px", fontSize: 14 }}>{posts.length - idx}</td>
                      <td style={{ padding: "12px 16px", fontSize: 14, fontWeight: 600 }}>{post.title}</td>
                      <td style={{ padding: "12px 16px", fontSize: 14, color: "#666" }}>{post.authorId}</td>
                      <td style={{ padding: "12px 16px", fontSize: 14, color: "#888" }}>{formatDate(post.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminInquiryPage;
