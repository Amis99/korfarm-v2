import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { apiGet, API_BASE } from "../utils/api";
import { COMMUNITY_BOARDS } from "../data/communityBoards";
import CommunityChatPage from "./CommunityChatPage";
import "../styles/community.css";

// 게시판 카드 아이콘 매핑
const BOARD_ICON = {
  learning_request: "school",
  community: "forum",
  qna: "help",
  materials: "folder_open",
  inquiry: "support_agent",
};

const statusLabel = (status) => {
  switch (status) {
    case "pending":
      return "대기";
    case "rejected":
      return "반려";
    default:
      return null;
  }
};

const formatDate = (dt) => {
  if (!dt) return "";
  const d = new Date(dt);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

function CommunityPage() {
  const [params] = useSearchParams();
  const { user, isPremium, isLoggedIn } = useAuth();
  const isAdmin = user?.roles?.includes("ADMIN") || user?.roles?.includes("HQ_ADMIN") || user?.roles?.includes("ORG_ADMIN");

  // ?board= 파라미터가 없으면 게시판 카드 목록 화면 (boardId = null)
  const rawBoardId = params.get("board");
  const boardId = rawBoardId || null;
  const board = boardId
    ? COMMUNITY_BOARDS.find((b) => b.id === boardId) || COMMUNITY_BOARDS[0]
    : null;

  const [posts, setPosts] = useState([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [subActive, setSubActive] = useState(false);
  const postsPerPage = 20;

  // 구독 상태 확인
  useEffect(() => {
    if (!isLoggedIn) return;
    apiGet("/v1/subscription")
      .then((sub) => {
        const st = sub?.status;
        if (st === "active" || st === "canceled") setSubActive(true);
      })
      .catch((e) => console.error(e));
  }, [isLoggedIn]);

  // 게시글 API 로드 (board가 선택된 경우만)
  useEffect(() => {
    if (!boardId) {
      setPosts([]);
      setPostsLoading(false);
      return;
    }
    setPostsLoading(true);
    setPosts([]);
    setSelectedId(null);
    setPage(1);
    setSearch("");
    apiGet(`/v1/boards/${boardId}/posts`)
      .then((data) => {
        const items = Array.isArray(data) ? data : data?.items || [];
        setPosts(items);
      })
      .catch((e) => {
        console.error(e);
        setPosts([]);
      })
      .finally(() => setPostsLoading(false));
  }, [boardId]);

  // 유료 회원 여부 (토큰 roles 또는 구독 상태)
  const hasPremium = isPremium || subActive || isAdmin;

  const filtered = useMemo(() => {
    if (!search.trim()) return posts;
    const q = search.trim().toLowerCase();
    return posts.filter(
      (p) =>
        (p.title || "").toLowerCase().includes(q) ||
        (p.authorId || "").toLowerCase().includes(q)
    );
  }, [posts, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / postsPerPage));
  const paged = useMemo(() => {
    const s = (page - 1) * postsPerPage;
    return filtered.slice(s, s + postsPerPage);
  }, [page, filtered]);

  const [postDetail, setPostDetail] = useState(null);

  // 게시글 선택 시 상세 조회 (content + attachments)
  useEffect(() => {
    if (!selectedId) { setPostDetail(null); return; }
    apiGet(`/v1/posts/${selectedId}`)
      .then((d) => setPostDetail(d))
      .catch(() => setPostDetail(null));
  }, [selectedId]);

  const selectedPost = postDetail || (selectedId
    ? posts.find((p) => (p.postId || p.id) === selectedId)
    : null);

  /* 자료실은 관리자만 글쓰기 가능 */
  const canWrite = board?.writeRole === "admin" ? isAdmin : true;

  // 채팅 모드 게시판은 채팅 페이지로 분기 (모든 hooks 호출 후)
  if (board?.chatMode) {
    return <CommunityChatPage />;
  }

  // ── board 미선택 → 게시판 카드 목록 화면 ──
  if (!board) {
    return (
      <div className="comm">
        <header className="comm-topbar">
          <div className="comm-topbar-inner">
            <Link to="/start" className="comm-home">
              <span className="material-symbols-outlined">arrow_back</span>
              홈으로
            </Link>
            <h1 className="comm-title">커뮤니티</h1>
            <div className="comm-topbar-right" />
          </div>
        </header>

        <div className="comm-board-grid-wrap">
          <h2 className="comm-board-grid-title">게시판 목록</h2>
          <p className="comm-board-grid-desc">
            이용하실 게시판을 선택하세요. 채팅방으로 바로 이동하려면 <strong>커뮤니티 채팅</strong>을 누르세요.
          </p>
          <div className="comm-board-grid">
            {COMMUNITY_BOARDS.map((b) => {
              const locked = b.requiresPaid && !hasPremium;
              return (
                <Link
                  key={b.id}
                  to={`/community?board=${b.id}`}
                  className={`comm-board-card ${locked ? "locked" : ""} ${b.chatMode ? "chat" : ""}`}
                >
                  <div className="comm-board-card-icon">
                    <span className="material-symbols-outlined">
                      {BOARD_ICON[b.id] || "forum"}
                    </span>
                  </div>
                  <div className="comm-board-card-body">
                    <h3>
                      {b.name}
                      {b.chatMode && <span className="comm-board-card-pill chat">실시간</span>}
                      {b.writeRole === "admin" && (
                        <span className="comm-board-card-pill admin">관리자만 글쓰기</span>
                      )}
                      {locked && (
                        <span className="material-symbols-outlined comm-board-card-lock">lock</span>
                      )}
                    </h3>
                    <p>{b.description}</p>
                  </div>
                  <div className="comm-board-card-arrow">
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="comm">
      {/* 상단 내비게이션 */}
      <header className="comm-topbar">
        <div className="comm-topbar-inner">
          <Link to="/start" className="comm-home">
            <span className="material-symbols-outlined">arrow_back</span>
            홈으로
          </Link>
          <h1 className="comm-title">커뮤니티</h1>
          <div className="comm-topbar-right">
            {canWrite && (
              <Link className="comm-write-btn" to={`/community/new?board=${board.id}`}>
                <span className="material-symbols-outlined">edit</span>
                글쓰기
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 게시판 탭 */}
      <nav className="comm-tabs">
        <div className="comm-tabs-inner">
          <Link to="/community" className="comm-tab comm-tab-back">
            <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: "middle" }}>list</span>
            전체 목록
          </Link>
          {COMMUNITY_BOARDS.map((b) => (
            <Link
              key={b.id}
              to={`/community?board=${b.id}`}
              className={`comm-tab ${board.id === b.id ? "active" : ""}`}
            >
              {b.name}
              {b.requiresPaid && !hasPremium && (
                <span className="material-symbols-outlined comm-tab-lock">lock</span>
              )}
              {b.writeRole === "admin" && (
                <span className="comm-tab-badge">관리자</span>
              )}
            </Link>
          ))}
        </div>
      </nav>

      <div className="comm-body">
        {/* 유료 회원 전용 게시판 접근 제한 */}
        {board.requiresPaid && !hasPremium ? (
          <div className="comm-upgrade-prompt">
            <div className="comm-upgrade-icon">
              <span className="material-symbols-outlined">lock</span>
            </div>
            <h3>유료 회원 전용 게시판입니다</h3>
            <p>
              <strong>{board.name}</strong>은 유료 회원만 이용할 수 있습니다.<br />
              프리미엄 회원이 되시면 모든 게시판과 학습 콘텐츠를 이용하실 수 있습니다.
            </p>
            <div className="comm-upgrade-actions">
              <Link to="/subscription" className="comm-upgrade-btn">
                <span className="material-symbols-outlined">workspace_premium</span>
                프리미엄 가입하기
              </Link>
              <Link to="/community?board=community" className="comm-upgrade-link">
                무료 커뮤니티 게시판 이용하기
              </Link>
            </div>
          </div>
        ) : (
        <>
        {/* 게시판 헤더 */}
        <div className="comm-board-head">
          <div>
            <h2>{board.name}</h2>
            <p className="comm-board-desc">{board.description}</p>
          </div>
          <div className="comm-search">
            <span className="material-symbols-outlined">search</span>
            <input
              placeholder="제목, 작성자 검색"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        {board.requiresApproval && (
          <p className="comm-notice">관리자 승인 후 게시글이 공개됩니다.</p>
        )}

        {board.isSecret && (
          <p className="comm-notice">
            <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: "middle", marginRight: 4 }}>lock</span>
            비밀글 게시판입니다. 본인이 작성한 글만 볼 수 있으며, 관리자가 답변을 달아드립니다.
          </p>
        )}

        {/* 상세 보기 */}
        {selectedPost ? (
          <div className="comm-detail">
            <div className="comm-detail-head">
              <h3>{selectedPost.title}</h3>
              <div className="comm-detail-meta">
                <span>{selectedPost.author_name || selectedPost.authorName || selectedPost.authorId}</span>
                <span>{formatDate(selectedPost.createdAt || selectedPost.created_at)}</span>
                {statusLabel(selectedPost.status) && (
                  <span className="comm-status">{statusLabel(selectedPost.status)}</span>
                )}
              </div>
            </div>
            <div className="comm-detail-body" style={{ whiteSpace: "pre-wrap" }}>
              {selectedPost.content || selectedPost.excerpt || ""}
            </div>
            {(selectedPost.attachments || []).length > 0 && (
              <div className="comm-detail-attachments" style={{ marginTop: 12 }}>
                <strong>첨부파일</strong>
                <ul style={{ margin: "6px 0", paddingLeft: 20 }}>
                  {(selectedPost.attachments || []).map((att) => (
                    <li key={att.file_id || att.fileId}>
                      <a
                        href={`${API_BASE}/v1/files/${att.file_id || att.fileId}/download`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ color: "#b06e30" }}
                      >
                        {att.name || att.file_id || att.fileId} ({Math.round((att.size || 0) / 1024)}KB)
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="comm-detail-actions">
              <button
                type="button"
                className="comm-btn-text"
                onClick={() => setSelectedId(null)}
              >
                목록으로
              </button>
              <Link
                className="comm-btn-text"
                to={`/community/post/${selectedPost.postId || selectedPost.id}?board=${board.id}`}
              >
                전체 보기
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* 게시글 테이블 */}
            <table className="comm-table">
              <thead>
                <tr>
                  <th className="comm-th-num">번호</th>
                  <th className="comm-th-title">제목</th>
                  <th className="comm-th-author">작성자</th>
                  <th className="comm-th-date">작성일</th>
                </tr>
              </thead>
              <tbody>
                {postsLoading ? (
                  <tr>
                    <td colSpan={4} className="comm-empty">불러오는 중...</td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="comm-empty">
                      {search ? "검색 결과가 없습니다." : "등록된 게시글이 없습니다."}
                    </td>
                  </tr>
                ) : (
                  paged.map((post, idx) => (
                    <tr
                      key={post.postId || post.id}
                      className="comm-row"
                      onClick={() => setSelectedId(post.postId || post.id)}
                    >
                      <td className="comm-td-num">
                        {filtered.length - ((page - 1) * postsPerPage + idx)}
                      </td>
                      <td className="comm-td-title">
                        <span className="comm-tag">{board.tag}</span>
                        {post.title}
                        {statusLabel(post.status) && (
                          <span className="comm-status">{statusLabel(post.status)}</span>
                        )}
                      </td>
                      <td className="comm-td-author">{post.author_name || post.authorName || post.authorId}</td>
                      <td className="comm-td-date">{formatDate(post.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* 페이지네이션 */}
            {totalPages > 1 && (
              <div className="comm-paging">
                <button
                  type="button"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  이전
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    type="button"
                    className={page === n ? "active" : ""}
                    onClick={() => setPage(n)}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  다음
                </button>
              </div>
            )}
          </>
        )}
        </>
        )}
      </div>
    </div>
  );
}

export default CommunityPage;
