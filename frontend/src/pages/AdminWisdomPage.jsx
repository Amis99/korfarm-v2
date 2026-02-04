import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { apiGet } from "../utils/adminApi";
import "../styles/admin.css";
import "../styles/wisdom.css";

const LEVEL_OPTIONS = [
  { id: "", label: "전체 레벨" },
  { id: "saussure1", label: "소쉬르 1" }, { id: "saussure2", label: "소쉬르 2" }, { id: "saussure3", label: "소쉬르 3" },
  { id: "frege1", label: "프레게 1" }, { id: "frege2", label: "프레게 2" }, { id: "frege3", label: "프레게 3" },
  { id: "russell1", label: "러셀 1" }, { id: "russell2", label: "러셀 2" }, { id: "russell3", label: "러셀 3" },
  { id: "wittgenstein1", label: "비트겐슈타인 1" }, { id: "wittgenstein2", label: "비트겐슈타인 2" }, { id: "wittgenstein3", label: "비트겐슈타인 3" },
];

const PER_PAGE = 20;

function AdminWisdomPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [levelId, setLevelId] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (levelId) params.set("level_id", levelId);
    apiGet(`/v1/admin/wisdom/posts?${params}`)
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [levelId]);

  const totalPages = Math.max(1, Math.ceil(posts.length / PER_PAGE));
  const visible = posts.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const fmtDate = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  };

  return (
    <div className="admin-page">
      <div className="admin-shell">
        <aside className="admin-side">
          <div className="admin-brand" aria-label="국어농장 Admin">
            <img className="admin-logo" src={import.meta.env.BASE_URL + "korfarm-logo.png"} alt="국어농장" />
            <span>Admin</span>
          </div>
          <nav className="admin-nav">
            <Link to="/admin">
              <span className="material-symbols-outlined">dashboard</span>
              대시보드
            </Link>
            <Link to="/admin/wisdom" className="active">
              <span className="material-symbols-outlined">menu_book</span>
              지식과 지혜
            </Link>
            <Link to="/">랜딩</Link>
            <Link to="/start">스타트</Link>
          </nav>
        </aside>

        <main className="admin-main">
          <div className="admin-topbar">
            <div>
              <h1>지식과 지혜 관리</h1>
              <p>학생 글 목록과 첨삭 관리</p>
            </div>
          </div>

          <section style={{ padding: "0 24px" }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" }}>
              <select
                className="wis-filter-select"
                value={levelId}
                onChange={(e) => { setLevelId(e.target.value); setPage(1); }}
              >
                {LEVEL_OPTIONS.map((l) => (
                  <option key={l.id} value={l.id}>{l.label}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <p style={{ color: "#888" }}>불러오는 중...</p>
            ) : visible.length === 0 ? (
              <p style={{ color: "#888" }}>제출물이 없습니다.</p>
            ) : (
              <>
                <table className="admin-table" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>레벨</th>
                      <th>주제</th>
                      <th>작성자</th>
                      <th>유형</th>
                      <th>피드백</th>
                      <th>상태</th>
                      <th>작성일</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((post, idx) => (
                      <tr
                        key={post.post_id}
                        style={{ cursor: "pointer" }}
                        onClick={() => navigate(`/admin/wisdom/${post.post_id}`)}
                      >
                        <td>{posts.length - ((page - 1) * PER_PAGE + idx)}</td>
                        <td>{post.level_id}</td>
                        <td>{post.topic_label}</td>
                        <td>{post.author_name || post.author_id}</td>
                        <td>{post.submission_type === "manuscript" ? "원고지" : "업로드"}</td>
                        <td>
                          <span style={{
                            color: post.has_feedback ? "#6da475" : "#bbb",
                            fontWeight: 700,
                            fontSize: 13,
                          }}>
                            {post.has_feedback ? "완료" : "미완료"}
                          </span>
                        </td>
                        <td>{post.status}</td>
                        <td>{fmtDate(post.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {totalPages > 1 && (
                  <div className="wis-paging" style={{ marginBottom: 24 }}>
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
          </section>
        </main>
      </div>
    </div>
  );
}

export default AdminWisdomPage;
