import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  COMMUNITY_BOARDS,
  COMMUNITY_POSTS,
  COMMUNITY_RANKING,
} from "../data/communityBoards";
import "../styles/community.css";

const DEFAULT_BOARD_ID = "community";

const boardActionLabel = (boardId) => {
  switch (boardId) {
    case "learning_request":
      return "학습 신청하기";
    case "qna":
      return "질문하기";
    case "materials":
      return "자료 공유하기";
    default:
      return "글쓰기";
  }
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

function CommunityPage() {
  const [params] = useSearchParams();
  const boardId = params.get("board") || DEFAULT_BOARD_ID;
  const board =
    COMMUNITY_BOARDS.find((item) => item.id === boardId) || COMMUNITY_BOARDS[0];
  const posts = COMMUNITY_POSTS.filter((post) => post.boardId === board.id);
  const [selectedId, setSelectedId] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [page, setPage] = useState(1);
  const postsPerPage = 20;
  const totalPages = Math.max(1, Math.ceil(posts.length / postsPerPage));
  const pagedPosts = useMemo(() => {
    const start = (page - 1) * postsPerPage;
    return posts.slice(start, start + postsPerPage);
  }, [page, posts]);

  useEffect(() => {
    setSelectedId("");
    setViewMode("list");
    setPage(1);
  }, [boardId]);

  const selectedPost = posts.find((post) => post.id === selectedId);

  return (
    <div className="community-page">
      <nav className="community-nav">
        <div className="community-wrap community-nav-inner">
          <Link to="/" aria-label="국어농장">
            <img className="community-logo" src="/korfarm-logo.png" alt="국어농장" />
          </Link>
          <div className="community-search">
            <span className="material-symbols-outlined">search</span>
            <input placeholder="게시글, 작성자 검색" />
          </div>
          <div className="community-nav-actions">
            <Link className="community-btn" to={`/community/new?board=${board.id}`}>
              {boardActionLabel(board.id)}
            </Link>
            <Link className="community-btn" to="/start">
              스타트
            </Link>
          </div>
        </div>
      </nav>

      <div className="community-wrap community-layout">
        <aside className="community-card community-sidebar-left">
          <h3>게시판 목록</h3>
          <div className="community-board-list">
            {COMMUNITY_BOARDS.map((item) => {
              const count = COMMUNITY_POSTS.filter(
                (post) => post.boardId === item.id
              ).length;
              return (
                <Link
                  key={item.id}
                  to={`/community?board=${item.id}`}
                  className={`community-board-item ${
                    board.id === item.id ? "active" : ""
                  }`}
                >
                  <div>
                    <strong>{item.name}</strong>
                    <p>{item.description}</p>
                  </div>
                  <div className="community-board-meta">
                    {item.requiresApproval && (
                      <span className="community-pill">승인형</span>
                    )}
                    {item.writeRole === "admin" && (
                      <span className="community-pill admin">관리자 전용</span>
                    )}
                    <span>{count}건</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </aside>

        <main className="community-list">
          <div className="community-board-header">
            <div>
              <h2>{board.name}</h2>
              <p>{board.description}</p>
            </div>
            {board.requiresApproval && (
              <span className="community-board-note">관리자 승인 후 공개됩니다.</span>
            )}
          </div>

          {posts.length === 0 ? (
            <div className="community-empty">아직 등록된 게시글이 없습니다.</div>
          ) : viewMode === "detail" && selectedPost ? (
            <div className="community-post-view">
              <div className="community-frame-header">
                <div>
                  <h3>{selectedPost.title}</h3>
                  <div className="community-meta">
                    <span>{board.name}</span>
                    <span>{selectedPost.author}</span>
                    <span>{selectedPost.time}</span>
                  </div>
                </div>
                {statusLabelForPost(selectedPost.status) && (
                  <span className="post-status">
                    {statusLabelForPost(selectedPost.status)}
                  </span>
                )}
              </div>
              <div className="community-frame-body">{selectedPost.excerpt}</div>

              {selectedPost.attachments && (
                <div className="community-frame-files">
                  <h4>첨부 자료</h4>
                  <ul className="community-file-list">
                    {selectedPost.attachments.map((file) => (
                      <li key={file.id}>
                        <div>
                          <strong>{file.name}</strong>
                          <span>{file.size}</span>
                        </div>
                        <a
                          className="community-btn ghost"
                          href={`/v1/files/${file.id}/download`}
                        >
                          다운로드
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="community-frame-actions">
                <button
                  type="button"
                  className="community-btn ghost"
                  onClick={() => setViewMode("list")}
                >
                  목록으로
                </button>
                <Link
                  className="community-btn ghost"
                  to={`/community/post/${selectedPost.id}?board=${board.id}`}
                >
                  전체 보기
                </Link>
              </div>
            </div>
          ) : (
            <div className="community-table">
              <div className="community-table-header">
                <span>제목</span>
                <span>작성자</span>
                <span>작성일</span>
              </div>
              {pagedPosts.map((post) => (
                <button
                  key={post.id}
                  type="button"
                  className="community-table-row"
                  onClick={() => {
                    setSelectedId(post.id);
                    setViewMode("detail");
                  }}
                >
                  <div className="community-table-title">
                    <span className="community-tag">{board.tag}</span>
                    <strong>{post.title}</strong>
                    {statusLabelForPost(post.status) && (
                      <span className="community-tag secondary">
                        {statusLabelForPost(post.status)}
                      </span>
                    )}
                  </div>
                  <span>{post.author}</span>
                  <span>{post.time}</span>
                </button>
              ))}
              <div className="community-pagination">
                <button
                  type="button"
                  className="community-page-btn"
                  onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  disabled={page === 1}
                >
                  이전
                </button>
                <span>
                  {page} / {totalPages}
                </span>
                <button
                  type="button"
                  className="community-page-btn"
                  onClick={() =>
                    setPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={page === totalPages}
                >
                  다음
                </button>
              </div>
            </div>
          )}
        </main>

        <aside className="community-side">
          <div className="community-card">
            <h3>시즌 랭킹</h3>
            <ul className="community-rank">
              {COMMUNITY_RANKING.map((item) => (
                <li key={item.name}>
                  <span>{item.name}</span>
                  <strong>{item.score}</strong>
                </li>
              ))}
            </ul>
          </div>
          <div className="community-card">
            <h3>운영 알림</h3>
            <p>자료 게시판은 관리자 승인 후 공개됩니다.</p>
            <Link className="community-btn" to="/start">
              확인하기
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

export default CommunityPage;
