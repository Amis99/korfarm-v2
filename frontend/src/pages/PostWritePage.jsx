import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { COMMUNITY_BOARDS } from "../data/communityBoards";
import { apiPost } from "../utils/api";
import "../styles/community.css";

const DEFAULT_BOARD_ID = "community";

function PostWritePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { isLoggedIn, user, isPremium } = useAuth();
  const isAdmin = user?.roles?.includes("ADMIN") || user?.roles?.includes("HQ_ADMIN") || user?.roles?.includes("ORG_ADMIN");

  const [boardId, setBoardId] = useState(
    params.get("board") || DEFAULT_BOARD_ID
  );
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const board =
    COMMUNITY_BOARDS.find((item) => item.id === boardId) || COMMUNITY_BOARDS[0];

  const handleSubmit = async () => {
    if (board.writeRole === "admin" && !isAdmin) {
      setError("관리자만 작성할 수 있는 게시판입니다.");
      return;
    }
    if (board.requiresPaid && !isPremium && !isAdmin) {
      setError("유료 회원만 작성할 수 있는 게시판입니다.");
      return;
    }
    if (!title.trim()) { setError("제목을 입력하세요."); return; }
    if (!content.trim()) { setError("내용을 입력하세요."); return; }
    setSubmitting(true);
    setError("");
    try {
      const data = await apiPost(`/v1/boards/${boardId}/posts`, {
        title: title.trim(),
        content: content.trim(),
      });
      navigate(`/community/post/${data.postId || data.id}?board=${boardId}`);
    } catch (e) {
      setError(e.message || "게시글 등록에 실패했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="community-page post-editor">
        <div className="community-wrap">
          <div className="post-header">
            <Link to="/community">커뮤니티로 돌아가기</Link>
            <h1>로그인이 필요합니다</h1>
          </div>
          <p style={{ textAlign: "center", padding: "40px 0" }}>
            게시글을 작성하려면 로그인이 필요합니다.
          </p>
          <div style={{ textAlign: "center" }}>
            <Link to="/login" className="community-btn" style={{ display: "inline-block" }}>
              로그인하기
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="community-page post-editor">
      <div className="community-wrap">
        <div className="post-header">
          <Link to={`/community?board=${board.id}`}>게시판으로 돌아가기</Link>
          <h1>게시글 작성</h1>
        </div>
        <form onSubmit={(e) => e.preventDefault()}>
          <label className="post-label" htmlFor="board-select">
            게시판 선택
          </label>
          <select
            id="board-select"
            value={boardId}
            onChange={(event) => setBoardId(event.target.value)}
          >
            {COMMUNITY_BOARDS.map((item) => {
              const adminOnly = item.writeRole === "admin" && !isAdmin;
              const paidOnly = item.requiresPaid && !isPremium && !isAdmin;
              const suffix = adminOnly ? " (관리자 전용)" : paidOnly ? " (유료 전용)" : "";
              return (
                <option key={item.id} value={item.id} disabled={adminOnly}>
                  {item.name}{suffix}
                </option>
              );
            })}
          </select>

          {board.requiresApproval && (
            <p className="community-helper">
              자료 게시판은 관리자 승인 후 공개됩니다.
            </p>
          )}
          {board.writeRole === "admin" && !isAdmin && (
            <p className="community-helper" style={{ color: "#e74c3c" }}>
              관리자 전용 게시판입니다. 관리자 계정만 작성할 수 있습니다.
            </p>
          )}
          {board.requiresPaid && !isPremium && !isAdmin && (
            <p className="community-helper" style={{ color: "#e74c3c" }}>
              유료 회원 전용 게시판입니다.
            </p>
          )}

          <input
            type="text"
            placeholder="제목을 입력하세요"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            placeholder="내용을 입력하세요"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />

          {error && <p className="community-helper" style={{ color: "#e74c3c" }}>{error}</p>}

          <button
            className="community-btn"
            type="button"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? "등록 중..." : "등록하기"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default PostWritePage;
