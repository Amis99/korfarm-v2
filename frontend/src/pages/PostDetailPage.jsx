import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiGet, apiPost, API_BASE, TOKEN_KEY } from "../utils/api";
import { COMMUNITY_BOARDS } from "../data/communityBoards";
import "../styles/community.css";

const formatDate = (dt) => {
  if (!dt) return "";
  const d = new Date(dt);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const statusLabelForPost = (status) => {
  switch (status) {
    case "pending":
      return "승인 대기";
    case "rejected":
      return "반려";
    default:
      return null;
  }
};

function PostDetailPage() {
  const { postId } = useParams();
  const [params] = useSearchParams();
  const boardParam = params.get("board");
  const { isLoggedIn } = useAuth();

  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const board =
    COMMUNITY_BOARDS.find((b) => b.id === (post?.boardId || boardParam)) ||
    COMMUNITY_BOARDS[0];

  const loadPost = () => {
    if (!postId) return;
    setLoading(true);
    setFetchError(null);
    apiGet(`/v1/posts/${postId}`)
      .then((data) => {
        setPost(data);
        // 댓글은 별도 API로 로드 (PostDetail DTO에 comments 미포함)
        apiGet(`/v1/posts/${postId}/comments`)
          .then((c) => setComments(Array.isArray(c) ? c : c?.items || []))
          .catch(() => setComments([]));
      })
      .catch((e) => setFetchError(e.message || "게시글을 불러올 수 없습니다."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPost();
  }, [postId]);

  const handleSubmitComment = async () => {
    if (!newComment.trim() || submitting) return;
    setSubmitting(true);
    try {
      const created = await apiPost(`/v1/posts/${postId}/comments`, {
        content: newComment.trim(),
      });
      setComments((prev) => [...prev, created]);
      setNewComment("");
    } catch (e) {
      console.error(e);
      alert("댓글 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="community-page post-detail">
        <div className="community-wrap">
          <p style={{ padding: 40, textAlign: "center" }}>불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="community-page post-detail">
        <div className="community-wrap">
          <div className="post-header">
            <Link to="/community">커뮤니티로 돌아가기</Link>
            {fetchError ? (
              <>
                <h1>게시글을 불러올 수 없습니다</h1>
                <p style={{ color: "#e74c3c", margin: "12px 0" }}>{fetchError}</p>
                <button className="community-btn" type="button" onClick={loadPost}>
                  다시 시도
                </button>
              </>
            ) : (
              <h1>게시글을 찾을 수 없습니다.</h1>
            )}
          </div>
        </div>
      </div>
    );
  }

  const attachments = post.attachments || [];

  return (
    <div className="community-page post-detail">
      <div className="community-wrap">
        <div className="post-header">
          <Link to={`/community?board=${board.id}`}>게시판으로 돌아가기</Link>
          <div className="post-title-row">
            <h1>{post.title}</h1>
            {statusLabelForPost(post.status) && (
              <span className="post-status">{statusLabelForPost(post.status)}</span>
            )}
          </div>
          <div className="community-meta">
            <span>{board.name}</span>
            <span>{post.authorId}</span>
            <span>{formatDate(post.createdAt)}</span>
          </div>
        </div>
        <div className="post-body">{post.content}</div>

        {attachments.length > 0 && (
          <div className="post-attachments">
            <h3>첨부 자료</h3>
            <ul>
              {attachments.map((file) => {
                const fid = file.id || file.fileId || file.file_id;
                const displayName = file.original_name || file.originalName || file.name || file.fileName || fid;
                return (
                  <li key={fid}>
                    <div>
                      <strong>{displayName}</strong>
                    </div>
                    <button
                      type="button"
                      className="community-btn ghost"
                      onClick={async () => {
                        const token = sessionStorage.getItem(TOKEN_KEY);
                        const r = await fetch(`${API_BASE}/v1/files/${fid}/download`, {
                          headers: { Authorization: `Bearer ${token}` },
                        });
                        if (!r.ok) { alert("다운로드 실패"); return; }
                        const blob = await r.blob();
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = displayName;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      다운로드
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="post-comments">
          <h3>댓글 {comments.length > 0 && `(${comments.length})`}</h3>
          {comments.length === 0 ? (
            <p style={{ color: "#8a7468", fontSize: 14 }}>아직 댓글이 없습니다.</p>
          ) : (
            comments.map((c) => (
              <div className="post-comment" key={c.commentId || c.id}>
                <div style={{ fontSize: 12, color: "#8a7468", marginBottom: 4 }}>
                  {c.authorId} · {formatDate(c.createdAt)}
                </div>
                {c.content}
              </div>
            ))
          )}
          {isLoggedIn && (
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              <input
                className="commerce-input"
                style={{ flex: 1 }}
                placeholder="댓글을 입력하세요"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitComment();
                  }
                }}
              />
              <button
                type="button"
                className="comm-write-btn"
                onClick={handleSubmitComment}
                disabled={submitting || !newComment.trim()}
              >
                {submitting ? "등록 중..." : "등록"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PostDetailPage;
