import { Link, useSearchParams } from "react-router-dom";
import { useState } from "react";
import { COMMUNITY_BOARDS } from "../data/communityBoards";
import "../styles/community.css";

const DEFAULT_BOARD_ID = "community";

function PostWritePage() {
  const [params] = useSearchParams();
  const [boardId, setBoardId] = useState(
    params.get("board") || DEFAULT_BOARD_ID
  );
  const board =
    COMMUNITY_BOARDS.find((item) => item.id === boardId) || COMMUNITY_BOARDS[0];

  return (
    <div className="community-page post-editor">
      <div className="community-wrap">
        <div className="post-header">
          <Link to={`/community?board=${board.id}`}>게시판으로 돌아가기</Link>
          <h1>게시글 작성</h1>
        </div>
        <form>
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

          <input type="text" placeholder="제목을 입력하세요" />
          <textarea placeholder="내용을 입력하세요" />

          <div className="post-file">
            <label className="post-label" htmlFor="post-files">
              첨부 자료
            </label>
            <input id="post-files" type="file" multiple />
            <p className="community-helper">자료 공유와 다운로드를 위한 파일을 첨부하세요.</p>
          </div>

          <button className="community-btn" type="button">
            등록하기
          </button>
        </form>
      </div>
    </div>
  );
}

export default PostWritePage;
