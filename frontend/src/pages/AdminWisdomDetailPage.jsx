import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { apiGet, apiPost, apiDelete } from "../utils/adminApi";
import { API_BASE } from "../utils/api";
import ManuscriptGrid from "../components/ManuscriptGrid";
import ManuscriptReview from "../components/ManuscriptReview";
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
  const [annotations, setAnnotations] = useState([]);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    apiGet(`/v1/admin/wisdom/posts/${postId}`)
      .then((data) => {
        setPost(data);
        if (data.feedback) {
          setComment(data.feedback.comment || "");
          // correction 파싱
          if (data.feedback.correction) {
            try {
              const parsed = JSON.parse(data.feedback.correction);
              if (Array.isArray(parsed)) setAnnotations(parsed);
            } catch {
              // 레거시 텍스트 — 무시
            }
          }
        }
      })
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [postId]);

  const handleSave = async () => {
    if (!comment.trim() && annotations.length === 0) {
      setMsg("코멘트 또는 첨삭 어노테이션을 입력해주세요.");
      return;
    }
    // 빈 코멘트 어노테이션 확인
    const emptyAnn = annotations.find((a) => !a.comment.trim());
    if (emptyAnn) {
      setMsg(`${emptyAnn.id}번 첨삭 코멘트를 입력해주세요.`);
      return;
    }
    setSaving(true);
    setMsg("");
    try {
      await apiPost(`/v1/admin/wisdom/posts/${postId}/feedback`, {
        comment: comment || "",
        correction:
          annotations.length > 0 ? JSON.stringify(annotations) : null,
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
  const gridCols = GRID_CONFIG[post.level_id]?.cols || 20;
  const gridRows = GRID_CONFIG[post.level_id]?.rows || 25;

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
                <h2>원고지 첨삭</h2>
                <p style={{ padding: "0 16px", fontSize: 13, color: "#7b6a62" }}>
                  셀을 드래그하여 첨삭 영역을 선택하세요. 선택 후 아래 줄에 코멘트를 입력합니다.
                </p>
                <div style={{ padding: 16 }}>
                  <ManuscriptReview
                    value={post.content}
                    cols={gridCols}
                    rows={gridRows}
                    annotations={annotations}
                    onAnnotationsChange={setAnnotations}
                    readOnly={false}
                  />
                </div>
              </div>
            )}

            {/* 원고지가 아닌 경우 기존 ManuscriptGrid 표시 */}
            {post.submission_type !== "manuscript" && post.content && (
              <div className="admin-card" style={{ marginBottom: 24 }}>
                <h2>내용</h2>
                <div style={{ padding: 16 }}>
                  <ManuscriptGrid
                    value={post.content}
                    readOnly
                    cols={gridCols}
                    rows={gridRows}
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
              <h2>코멘트</h2>
              <div className="wis-admin-feedback-form" style={{ padding: "0 16px 16px" }}>
                <div className="wis-form-group">
                  <label>코멘트 (선택)</label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="전반적인 코멘트를 작성하세요..."
                  />
                </div>

                {msg && (
                  <p style={{
                    color: msg.includes("실패") || msg.includes("입력") ? "#e74c3c" : "#6da475",
                    fontSize: 14,
                    marginBottom: 12,
                  }}>
                    {msg}
                  </p>
                )}

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button className="admin-action" onClick={handleSave} disabled={saving}>
                    {saving ? "저장 중..." : post.feedback ? "수정 저장" : "피드백 저장"}
                  </button>
                  <button
                    className="admin-action"
                    style={{ background: "#8e44ad", opacity: 0.6, cursor: "not-allowed" }}
                    disabled
                  >
                    AI첨삭...
                  </button>
                </div>
              </div>
            </div>
      </section>
    </AdminLayout>
  );
}

export default AdminWisdomDetailPage;
