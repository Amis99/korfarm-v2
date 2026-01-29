import { Link, useParams, useSearchParams } from "react-router-dom";
import { COMMUNITY_BOARDS, COMMUNITY_POSTS } from "../data/communityBoards";
import "../styles/community.css";

const formatSize = (size) => size;

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
  const post = COMMUNITY_POSTS.find((item) => item.id === postId);
  const board =
    COMMUNITY_BOARDS.find((item) => item.id === post?.boardId) ||
    COMMUNITY_BOARDS.find((item) => item.id === boardParam) ||
    COMMUNITY_BOARDS[0];

  if (!post) {
    return (
      <div className="community-page post-detail">
        <div className="community-wrap">
          <div className="post-header">
            <Link to="/community">커뮤니티로 돌아가기</Link>
            <h1>게시글을 찾을 수 없습니다.</h1>
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
            <span>{post.author}</span>
            <span>{post.time}</span>
          </div>
        </div>
        <div className="post-body">{post.excerpt}</div>

        {attachments.length > 0 && (
          <div className="post-attachments">
            <h3>첨부 자료</h3>
            <ul>
              {attachments.map((file) => (
                <li key={file.id}>
                  <div>
                    <strong>{file.name}</strong>
                    <span>{formatSize(file.size)}</span>
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

        <div className="post-comments">
          <h3>댓글</h3>
          <div className="post-comment">자료 감사합니다!</div>
          <div className="post-comment">정리 노트가 도움이 되었어요.</div>
        </div>
      </div>
    </div>
  );
}

export default PostDetailPage;
