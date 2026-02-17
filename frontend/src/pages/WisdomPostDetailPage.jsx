import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { apiGet, apiPost, apiDelete, API_BASE, TOKEN_KEY } from "../utils/api";
import ManuscriptGrid from "../components/ManuscriptGrid";
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

function WisdomPostDetailPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  // Like state
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  // Comment state
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  useEffect(() => {
    apiGet(`/v1/wisdom/posts/${postId}`)
      .then((data) => {
        setPost(data);
        setLikeCount(data.like_count || 0);
        setIsLiked(data.is_liked_by_me || false);
        setComments(data.comments || []);
      })
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [postId]);

  const handleDelete = async () => {
    if (!confirm("정말 삭제하시겠습니까?")) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      await fetch(`${API_BASE}/v1/wisdom/posts/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate(`/writing/${post.level_id}`);
    } catch {
      alert("삭제에 실패했습니다.");
    } finally {
      setDeleting(false);
    }
  };

  const handleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      const result = await apiPost(`/v1/wisdom/posts/${postId}/like`);
      const liked = result.liked;
      setIsLiked(liked);
      setLikeCount((prev) => liked ? prev + 1 : Math.max(0, prev - 1));
    } catch {
      // ignore
    } finally {
      setLikeLoading(false);
    }
  };

  const handleCommentSubmit = async () => {
    if (!commentText.trim() || commentSubmitting) return;
    setCommentSubmitting(true);
    try {
      const newComment = await apiPost(`/v1/wisdom/posts/${postId}/comments`, {
        content: commentText.trim(),
      });
      setComments((prev) => [...prev, newComment]);
      setCommentText("");
    } catch {
      alert("댓글 작성에 실패했습니다.");
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleCommentDelete = async (commentId) => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;
    try {
      await apiDelete(`/v1/wisdom/comments/${commentId}`);
      setComments((prev) => prev.filter((c) => c.comment_id !== commentId));
    } catch {
      alert("댓글 삭제에 실패했습니다.");
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
      <div className="wisdom">
        <div className="wis-detail"><div className="wis-empty">불러오는 중...</div></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="wisdom">
        <div className="wis-detail">
          <div className="wis-empty">글을 찾을 수 없습니다.</div>
          <Link to="/writing" className="wis-btn" style={{ margin: "20px auto", display: "inline-flex" }}>
            목록으로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="wisdom">
      <div className="wis-topbar">
        <div className="wis-topbar-inner">
          <Link to={`/writing/${post.level_id}`} className="wis-back">
            <span className="material-symbols-outlined">arrow_back</span>
            목록으로
          </Link>
          <h1 className="wis-topbar-title">글 상세</h1>
        </div>
      </div>

      <div className="wis-detail">
        <div className="wis-detail-header">
          <h2>{post.topic_label}</h2>
          <div className="wis-detail-meta">
            <span>작성자: {post.is_own ? (post.author_name || "나") : "익명"}</span>
            <span>작성일: {fmtDate(post.created_at)}</span>
            <span>유형: {post.submission_type === "manuscript" ? "원고지" : "파일 업로드"}</span>
          </div>
        </div>

        {post.submission_type === "manuscript" && post.content && (
          <div className="wis-detail-content">
            <ManuscriptGrid
              value={post.content}
              readOnly
              cols={GRID_CONFIG[post.level_id]?.cols || 20}
              rows={GRID_CONFIG[post.level_id]?.rows || 25}
            />
          </div>
        )}

        {post.attachments && post.attachments.length > 0 && (
          <div className="wis-detail-attachments">
            <h3>첨부파일</h3>
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
        )}

        {/* Like + Delete row */}
        <div className="wis-detail-actions">
          <button
            className={`wis-like-btn ${isLiked ? "liked" : ""}`}
            onClick={handleLike}
            disabled={likeLoading}
          >
            <span>{isLiked ? "\u2665" : "\u2661"}</span>
            <span>좋아요 {likeCount}</span>
          </button>

          {post.is_own && (
            <button
              className="wis-btn wis-btn-danger"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "삭제 중..." : "삭제"}
            </button>
          )}
        </div>

        {post.feedback && (
          <div className="wis-feedback-section">
            <h3>
              <span className="material-symbols-outlined">rate_review</span>
              선생님 피드백
            </h3>
            <div className="wis-feedback-comment">{post.feedback.comment}</div>
            {post.feedback.correction && (
              <>
                <div className="wis-feedback-correction-label">교정 내용</div>
                <div className="wis-feedback-correction">{post.feedback.correction}</div>
              </>
            )}
            <div className="wis-feedback-meta">
              {post.feedback.reviewer_name && <span>첨삭자: {post.feedback.reviewer_name}</span>}
              {" · "}
              {fmtDate(post.feedback.created_at)}
            </div>
          </div>
        )}

        {/* Comments section */}
        <div className="wis-comments-section">
          <h3>
            <span className="material-symbols-outlined">chat</span>
            댓글 ({comments.length})
          </h3>

          {comments.length === 0 ? (
            <div className="wis-comments-empty">아직 댓글이 없습니다.</div>
          ) : (
            <div className="wis-comments-list">
              {comments.map((c) => (
                <div key={c.comment_id} className="wis-comment-item">
                  <div className="wis-comment-header">
                    <span className="wis-comment-author">
                      {c.is_own ? (c.author_name || "나") : "익명"}
                    </span>
                    <span className="wis-comment-date">{fmtDateTime(c.created_at)}</span>
                    {c.is_own && (
                      <button
                        className="wis-comment-delete"
                        onClick={() => handleCommentDelete(c.comment_id)}
                      >
                        삭제
                      </button>
                    )}
                  </div>
                  <div className="wis-comment-content">{c.content}</div>
                </div>
              ))}
            </div>
          )}

          <div className="wis-comment-form">
            <textarea
              className="wis-comment-input"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="댓글을 작성하세요..."
              rows={3}
            />
            <button
              className="wis-btn"
              onClick={handleCommentSubmit}
              disabled={commentSubmitting || !commentText.trim()}
              style={{ marginLeft: "auto" }}
            >
              {commentSubmitting ? "등록 중..." : "댓글 등록"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WisdomPostDetailPage;
