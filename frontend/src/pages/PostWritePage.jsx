import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import { COMMUNITY_BOARDS } from "../data/communityBoards";
import { apiPost } from "../utils/api";
import "../styles/community.css";

const DEFAULT_BOARD_ID = "community";

function PostWritePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
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
            {COMMUNITY_BOARDS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          {board.requiresApproval && (
            <p className="community-helper">
              자료 게시판은 관리자 승인 후 공개됩니다.
            </p>
          )}
          {board.writeRole === "admin" && (
            <p className="community-helper">
              관리자 전용 게시판입니다. 관리자 계정만 작성할 수 있습니다.
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
