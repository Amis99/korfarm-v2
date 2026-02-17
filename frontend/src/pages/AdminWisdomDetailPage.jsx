import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { apiGet, apiPost, apiDelete } from "../utils/adminApi";
import { API_BASE } from "../utils/api";
import ManuscriptGrid from "../components/ManuscriptGrid";
import AdminLayout from "../components/AdminLayout";
import "../styles/wisdom.css";

const GRID_CONFIG = {
  saussure1: { cols: 16, rows: 20 },
  saussure2: { cols: 16, rows: 20 },
  saussure3: { cols: 16, rows: 20 },
  frege1: { cols: 20, rows: 25 },
  frege2: { cols: 20, rows: 25 },
  frege3: { cols: 20, rows: 25 },
  russell1: { cols: 20, rows: 25 },
  russell2: { cols: 20, rows: 25 },
  russell3: { cols: 20, rows: 25 },
  wittgenstein1: { cols: 20, rows: 25 },
  wittgenstein2: { cols: 20, rows: 25 },
  wittgenstein3: { cols: 20, rows: 25 },
};

function AdminWisdomDetailPage() {
  const { postId } = useParams();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState("");
  const [correction, setCorrection] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    apiGet(`/v1/admin/wisdom/posts/${postId}`)
      .then((data) => {
        setPost(data);
        if (data.feedback) {
          setComment(data.feedback.comment || "");
          setCorrection(data.feedback.correction || "");
        }
      })
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [postId]);

  const handleSave = async () => {
    if (!comment.trim()) { setMsg("코멘트를 입력해주세요."); return; }
    setSaving(true);
    setMsg("");
    try {
      await apiPost(`/v1/admin/wisdom/posts/${postId}/feedback`, {
        comment,
        correction: correction || null,
      });
      setMsg("저장되었습니다.");
      const updated = await apiGet(`/v1/admin/wisdom/posts/${postId}`);
      setPost(updated);
    } catch (err) {
      setMsg(err.message || "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!confirm("이 댓글을 삭제하시겠습니까?")) return;
    try {
      await apiDelete(`/v1/admin/wisdom/comments/${commentId}`);
      setPost((prev) => ({
        ...prev,
        comments: (prev.comments || []).filter((c) => c.comment_id !== commentId),
      }));
    } catch (err) {
      alert(err.message || "댓글 삭제에 실패했습니다.");
    }
  };

  const fmtDate = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  };

  const fmtDateTime = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    return `${fmtDate(d)} ${String(dt.getHours()).padStart(2, "0")}:${String(dt.getMinutes()).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <AdminLayout>
        <p style={{ padding: 24, color: "#888" }}>불러오는 중...</p>
      </AdminLayout>
    );
  }

  if (!post) {
    return (
      <AdminLayout>
        <p style={{ padding: 24, color: "#888" }}>글을 찾을 수 없습니다.</p>
      </AdminLayout>
    );
  }

  const comments = post.comments || [];

  return (
    <AdminLayout>
      <div className="admin-topbar">
        <div>
          <h1>첨삭 작성</h1>
          <p>{post.topic_label} · {post.author_name || post.author_id}</p>
        </div>
      </div>

      <section style={{ padding: "0 24px 40px" }}>
            <div className="admin-card" style={{ marginBottom: 24 }}>
              <h2>글 정보</h2>
              <table className="admin-table">
                <tbody>
                  <tr><td style={{ fontWeight: 700, width: 100 }}>레벨</td><td>{post.level_id}</td></tr>
                  <tr><td style={{ fontWeight: 700 }}>주제</td><td>{post.topic_label}</td></tr>
                  <tr><td style={{ fontWeight: 700 }}>작성자</td><td>{post.author_name || post.author_id}</td></tr>
                  <tr><td style={{ fontWeight: 700 }}>유형</td><td>{post.submission_type === "manuscript" ? "원고지" : "파일 업로드"}</td></tr>
                  <tr><td style={{ fontWeight: 700 }}>상태</td><td>{post.status}</td></tr>
                  <tr><td style={{ fontWeight: 700 }}>작성일</td><td>{fmtDate(post.created_at)}</td></tr>
                </tbody>
              </table>
            </div>

            {post.submission_type === "manuscript" && post.content && (
              <div className="admin-card" style={{ marginBottom: 24 }}>
                <h2>원고지 내용</h2>
                <div style={{ padding: 16 }}>
                  <ManuscriptGrid
                    value={post.content}
                    readOnly
                    cols={GRID_CONFIG[post.level_id]?.cols || 20}
                    rows={GRID_CONFIG[post.level_id]?.rows || 25}
                  />
                </div>
              </div>
            )}

            {post.attachments && post.attachments.length > 0 && (
              <div className="admin-card" style={{ marginBottom: 24 }}>
                <h2>첨부파일</h2>
                <div style={{ padding: 16 }}>
                  {post.attachments.map((att) => (
                    <a
                      key={att.file_id}
                      href={`${API_BASE}/v1/files/${att.file_id}/download`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="wis-attachment-link"
                    >
                      <span className="material-symbols-outlined">
                        {att.mime === "application/pdf" ? "picture_as_pdf" : "image"}
                      </span>
                      {att.name}
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Comments section */}
            {comments.length > 0 && (
              <div className="admin-card" style={{ marginBottom: 24 }}>
                <h2>댓글 ({comments.length})</h2>
                <div style={{ padding: "0 16px 16px" }}>
                  {comments.map((c) => (
                    <div key={c.comment_id} className="wis-comment-item">
                      <div className="wis-comment-header">
                        <span className="wis-comment-author">{c.author_name || "알 수 없음"}</span>
                        <span className="wis-comment-date">{fmtDateTime(c.created_at)}</span>
                        <button
                          className="wis-comment-delete"
                          onClick={() => handleDeleteComment(c.comment_id)}
                        >
                          삭제
                        </button>
                      </div>
                      <div className="wis-comment-content">{c.content}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="admin-card">
              <h2>첨삭 / 코멘트</h2>
              <div className="wis-admin-feedback-form" style={{ padding: "0 16px 16px" }}>
                <div className="wis-form-group">
                  <label>코멘트 (필수)</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="첨삭 코멘트를 작성하세요..."
                  />
                </div>
                <div className="wis-form-group">
                  <label>교정 텍스트 (선택)</label>
                  <textarea
                    value={correction}
                    onChange={(e) => setCorrection(e.target.value)}
                    placeholder="교정이 필요한 경우 작성하세요..."
                    style={{ minHeight: 80 }}
                  />
                </div>

                {msg && (
                  <p style={{
                    color: msg.includes("실패") ? "#e74c3c" : "#6da475",
                    fontSize: 14,
                    marginBottom: 12,
                  }}>
                    {msg}
                  </p>
                )}

                <button className="admin-action" onClick={handleSave} disabled={saving}>
                  {saving ? "저장 중..." : post.feedback ? "수정 저장" : "피드백 저장"}
                </button>
              </div>
            </div>
      </section>
    </AdminLayout>
  );
}

export default AdminWisdomDetailPage;
