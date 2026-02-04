import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { apiGet } from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import "../styles/wisdom.css";

const LEVEL_NAMES = {
  saussure1: "소쉬르 1", saussure2: "소쉬르 2", saussure3: "소쉬르 3",
  frege1: "프레게 1", frege2: "프레게 2", frege3: "프레게 3",
  russell1: "러셀 1", russell2: "러셀 2", russell3: "러셀 3",
  wittgenstein1: "비트겐슈타인 1", wittgenstein2: "비트겐슈타인 2", wittgenstein3: "비트겐슈타인 3",
};

const PER_PAGE = 15;

function WisdomBoardPage() {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAuth();
  const [posts, setPosts] = useState([]);
  const [hasMyPost, setHasMyPost] = useState(true);
  const [topics, setTopics] = useState([]);
  const [topicKey, setTopicKey] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}wisdom-topics/${levelId}.json`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setTopics)
      .catch(() => setTopics([]));
  }, [levelId]);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ level_id: levelId });
    if (topicKey) params.set("topic_key", topicKey);
    apiGet(`/v1/wisdom/posts?${params}`)
      .then((data) => {
        setPosts(data.posts || []);
        setHasMyPost(data.has_my_post !== false);
      })
      .catch(() => {
        setPosts([]);
        setHasMyPost(true);
      })
      .finally(() => setLoading(false));
  }, [levelId, topicKey]);

  const totalPages = Math.max(1, Math.ceil(posts.length / PER_PAGE));
  const visible = posts.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const fmtDate = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  };

  return (
    <div className="wisdom">
      <div className="wis-topbar">
        <div className="wis-topbar-inner">
          <Link to="/writing" className="wis-back">
            <span className="material-symbols-outlined">arrow_back</span>
            레벨 선택
          </Link>
          <h1 className="wis-topbar-title">{LEVEL_NAMES[levelId] || levelId}</h1>
        </div>
      </div>

      <div className="wis-action-bar">
        <select
          className="wis-filter-select"
          value={topicKey}
          onChange={(e) => { setTopicKey(e.target.value); setPage(1); }}
        >
          <option value="">전체 주제</option>
          {topics.map((t) => (
            <option key={t.key} value={t.key}>{t.label}</option>
          ))}
        </select>
        {isLoggedIn && (
          <Link to={`/writing/${levelId}/new`} className="wis-btn">
            <span className="material-symbols-outlined">edit</span>
            글쓰기
          </Link>
        )}
      </div>

      <div className="wis-body">
        {loading ? (
          <div className="wis-empty">불러오는 중...</div>
        ) : !hasMyPost && topicKey ? (
          <div className="wis-empty">
            <div className="wis-empty-icon">
              <span className="material-symbols-outlined" style={{ fontSize: 48, color: "var(--wis-orange)" }}>lock</span>
            </div>
            <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>
              이 주제에 대해 글을 작성하면<br />다른 친구들의 글을 읽을 수 있습니다.
            </p>
            <p style={{ fontSize: 13, color: "var(--wis-muted)" }}>
              먼저 자신의 글을 작성해보세요!
            </p>
          </div>
        ) : visible.length === 0 ? (
          <div className="wis-empty">
            <div className="wis-empty-icon">
              <span className="material-symbols-outlined" style={{ fontSize: 48 }}>edit_note</span>
            </div>
            아직 작성된 글이 없습니다
          </div>
        ) : (
          <>
            <table className="wis-table">
              <thead>
                <tr>
                  <th className="wis-th-num">#</th>
                  <th className="wis-th-topic">주제</th>
                  <th className="wis-th-author">작성자</th>
                  <th className="wis-th-like">좋아요</th>
                  <th className="wis-th-feedback">피드백</th>
                  <th className="wis-th-date">작성일</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((post, idx) => (
                  <tr
                    key={post.post_id}
                    className="wis-row"
                    onClick={() => navigate(`/writing/post/${post.post_id}`)}
                  >
                    <td className="wis-td-num">{posts.length - ((page - 1) * PER_PAGE + idx)}</td>
                    <td className="wis-td-topic">{post.topic_label}</td>
                    <td className={`wis-td-author ${post.is_own ? "own" : ""}`}>
                      {post.is_own ? "나의 글" : "익명"}
                    </td>
                    <td className="wis-td-like">
                      <span className="wis-like-count">
                        {post.is_liked_by_me ? "\u2665" : "\u2661"} {post.like_count || 0}
                      </span>
                    </td>
                    <td className="wis-td-feedback">
                      <span className={`wis-feedback-badge ${post.has_feedback ? "done" : "pending"}`}>
                        {post.has_feedback ? "완료" : "대기"}
                      </span>
                    </td>
                    <td className="wis-td-date">{fmtDate(post.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div className="wis-paging">
                <button disabled={page <= 1} onClick={() => setPage(page - 1)}>이전</button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button key={p} className={p === page ? "active" : ""} onClick={() => setPage(p)}>
                    {p}
                  </button>
                ))}
                <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>다음</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default WisdomBoardPage;
