import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost, apiDelete } from "../utils/adminApi";
import AdminLayout from "../components/AdminLayout";
import "../styles/wisdom.css";

const LEVEL_OPTIONS = [
  { id: "", label: "전체 레벨" },
  { id: "saussure1", label: "소쉬르 1" }, { id: "saussure2", label: "소쉬르 2" }, { id: "saussure3", label: "소쉬르 3" },
  { id: "frege1", label: "프레게 1" }, { id: "frege2", label: "프레게 2" }, { id: "frege3", label: "프레게 3" },
  { id: "russell1", label: "러셀 1" }, { id: "russell2", label: "러셀 2" }, { id: "russell3", label: "러셀 3" },
  { id: "wittgenstein1", label: "비���겐슈타인 1" }, { id: "wittgenstein2", label: "비트겐슈타인 2" }, { id: "wittgenstein3", label: "비트겐슈타인 3" },
];

const PER_PAGE = 20;

function AdminWisdomPage() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [levelId, setLevelId] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchMsg, setBatchMsg] = useState("");

  // 필터·정렬
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");        // all | manuscript | upload
  const [feedbackFilter, setFeedbackFilter] = useState("all"); // all | done | pending
  const [statusFilter, setStatusFilter] = useState("active");  // all | active | deleted
  const [sortKey, setSortKey] = useState("created");           // created | level | author | topic
  const [sortDir, setSortDir] = useState("desc");              // desc | asc

  useEffect(() => {
    setLoading(true);
    setSelected(new Set());
    setBatchMsg("");
    const params = new URLSearchParams();
    if (levelId) params.set("level_id", levelId);
    apiGet(`/v1/admin/wisdom/posts?${params}`)
      .then(setPosts)
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [levelId]);

  // 검색·필터·정렬 적용
  const filteredSorted = useMemo(() => {
    let arr = posts.slice();
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      arr = arr.filter((p) =>
        (p.author_name || "").toLowerCase().includes(q) ||
        (p.author_id || "").toLowerCase().includes(q) ||
        (p.topic_label || "").toLowerCase().includes(q)
      );
    }
    if (typeFilter !== "all") {
      arr = arr.filter((p) =>
        typeFilter === "manuscript" ? p.submission_type === "manuscript" : p.submission_type !== "manuscript"
      );
    }
    if (feedbackFilter !== "all") {
      arr = arr.filter((p) => (feedbackFilter === "done" ? p.has_feedback : !p.has_feedback));
    }
    if (statusFilter !== "all") {
      arr = arr.filter((p) => p.status === statusFilter);
    }
    arr.sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      switch (sortKey) {
        case "level":
          return ((a.level_id || "").localeCompare(b.level_id || "")) * dir;
        case "author":
          return ((a.author_name || a.author_id || "").localeCompare(b.author_name || b.author_id || "", "ko")) * dir;
        case "topic":
          return ((a.topic_label || "").localeCompare(b.topic_label || "", "ko")) * dir;
        case "created":
        default:
          return (new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) * dir;
      }
    });
    return arr;
  }, [posts, search, typeFilter, feedbackFilter, statusFilter, sortKey, sortDir]);

  // page 가 totalPages 초과되지 않게 보정
  useEffect(() => { setPage(1); }, [search, typeFilter, feedbackFilter, statusFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredSorted.length / PER_PAGE));
  const visible = filteredSorted.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // 체크박스: AI 일괄 첨삭 대상 = 원고지 타입 + 미첨삭 + active
  const isEligible = (post) =>
    post.submission_type === "manuscript" && !post.has_feedback && post.status === "active";

  const eligibleOnPage = visible.filter(isEligible);
  const allPageSelected = eligibleOnPage.length > 0 && eligibleOnPage.every((p) => selected.has(p.post_id));

  const toggleOne = (postId, e) => {
    e.stopPropagation();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(postId)) next.delete(postId);
      else next.add(postId);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        eligibleOnPage.forEach((p) => next.delete(p.post_id));
      } else {
        eligibleOnPage.forEach((p) => next.add(p.post_id));
      }
      return next;
    });
  };

  const handleDelete = async (post) => {
    if (!post?.post_id) return;
    if (!window.confirm(`"${post.topic_label}" (${post.author_name || post.author_id}) 글을 삭제할까요?\n삭제된 글은 학생 화면에서 사라집니다.`)) return;
    try {
      await apiDelete(`/v1/admin/wisdom/posts/${post.post_id}`);
      setPosts((prev) => prev.map((p) => p.post_id === post.post_id ? { ...p, status: "deleted" } : p));
    } catch (e) {
      alert("삭제 실패: " + (e?.message || ""));
    }
  };

  const handleBatch = async () => {
    if (selected.size === 0) return;
    if (!confirm(`선택한 ${selected.size}건에 AI 일괄 첨삭을 실행합니다. 진행하시겠습니까?`)) return;
    setBatchRunning(true);
    setBatchMsg(`AI 일괄 첨삭 진행 중... (0/${selected.size})`);
    try {
      const res = await apiPost("/v1/admin/wisdom/ai-feedback-batch", {
        post_ids: [...selected],
      });
      const results = res || [];
      const okCount = results.filter((r) => r.status === "ok").length;
      const skipCount = results.filter((r) => r.status === "skipped").length;
      const errCount = results.filter((r) => r.status === "error").length;
      setBatchMsg(`완료: 성공 ${okCount}건, 건너뜀 ${skipCount}건${errCount > 0 ? `, 실패 ${errCount}건` : ""}`);
      setSelected(new Set());
      // 목록 새로고침
      const params = new URLSearchParams();
      if (levelId) params.set("level_id", levelId);
      const refreshed = await apiGet(`/v1/admin/wisdom/posts?${params}`);
      setPosts(refreshed);
    } catch (err) {
      setBatchMsg(`오류: ${err.message || "일괄 첨삭 실패"}`);
    } finally {
      setBatchRunning(false);
    }
  };

  const fmtDate = (d) => {
    if (!d) return "";
    const dt = new Date(d);
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}-${String(dt.getDate()).padStart(2, "0")}`;
  };

  return (
    <AdminLayout>
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <div>
            <h1>지식과 지혜 관리</h1>
            <p className="admin-detail-subtitle">학생 글 목록과 첨삭 관리</p>
          </div>
        </div>

        <div className="admin-detail-card admin-single-card edit-mode">
          <div className="admin-detail-toolbar admin-content-toolbar">
            <div className="admin-detail-search">
              <span className="material-symbols-outlined">search</span>
              <input
                placeholder="작성자·주제 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="admin-detail-filters">
              {/* 상태 토글 — 활성/삭제됨/전체 */}
              {[
                { key: "active", label: "활성" },
                { key: "deleted", label: "삭제됨" },
                { key: "all", label: "전체" },
              ].map((f) => (
                <button
                  key={f.key}
                  type="button"
                  className={`admin-filter ${statusFilter === f.key ? "active" : ""}`}
                  onClick={() => setStatusFilter(f.key)}
                >{f.label}</button>
              ))}
              <select className="admin-type-filter-select" value={levelId} onChange={(e) => setLevelId(e.target.value)}>
                {LEVEL_OPTIONS.map((l) => (
                  <option key={l.id} value={l.id}>{l.label}</option>
                ))}
              </select>
              <select className="admin-type-filter-select" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="all">유형: 전체</option>
                <option value="manuscript">원고지</option>
                <option value="upload">업로드</option>
              </select>
              <select className="admin-type-filter-select" value={feedbackFilter} onChange={(e) => setFeedbackFilter(e.target.value)}>
                <option value="all">피드백: 전체</option>
                <option value="done">완료</option>
                <option value="pending">미완료</option>
              </select>
              <select className="admin-type-filter-select" value={sortKey} onChange={(e) => setSortKey(e.target.value)}>
                <option value="created">정렬: 작성일</option>
                <option value="level">정렬: 레벨</option>
                <option value="author">정렬: 작성자</option>
                <option value="topic">정렬: 주제</option>
              </select>
              <button
                type="button"
                className="admin-filter"
                onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                title="정렬 방향 토글"
              >
                {sortDir === "asc" ? "↑" : "↓"}
              </button>
              {(search || typeFilter !== "all" || feedbackFilter !== "all" || statusFilter !== "active" || sortKey !== "created" || sortDir !== "desc" || levelId) && (
                <button
                  type="button"
                  className="admin-filter"
                  onClick={() => {
                    setSearch(""); setTypeFilter("all"); setFeedbackFilter("all");
                    setStatusFilter("active"); setSortKey("created"); setSortDir("desc"); setLevelId("");
                  }}
                  style={{ borderStyle: "dashed" }}
                >초기화</button>
              )}
            </div>
          </div>
          <div className="admin-content-bulk-bar" style={{ background: "transparent", border: "none", padding: "0 0 8px" }}>
            <span className="admin-content-bulk-count" style={{ color: "var(--admin-muted)" }}>
              {filteredSorted.length}건 표시 (전체 {posts.length}건)
              {selected.size > 0 ? ` · ${selected.size}건 선택` : ""}
            </span>
            <button
              type="button"
              className="admin-detail-btn"
              disabled={selected.size === 0 || batchRunning}
              onClick={handleBatch}
              style={{ marginLeft: "auto" }}
            >
              {batchRunning ? "AI 첨삭 중..." : `AI 일괄 첨삭 (${selected.size}건)`}
            </button>
            {batchMsg && (
              <span style={{
                fontSize: 13,
                color: batchMsg.startsWith("오류") ? "#c0392b" : "var(--admin-accent-strong)",
              }}>
                {batchMsg}
              </span>
            )}
          </div>

            {loading ? (
              <p style={{ color: "var(--admin-muted)" }}>불러오는 중...</p>
            ) : visible.length === 0 ? (
              <p style={{ color: "var(--admin-muted)" }}>제출물이 없습니다.</p>
            ) : (
              <>
                <table className="admin-detail-table" style={{ width: "100%" }}>
                  <thead>
                    <tr>
                      <th style={{ width: 36 }}>
                        <input
                          type="checkbox"
                          checked={allPageSelected}
                          onChange={toggleAll}
                          disabled={eligibleOnPage.length === 0}
                          title="이 페이지의 미첨삭 원고지 전체 선택"
                        />
                      </th>
                      <th>#</th>
                      <th>레벨</th>
                      <th>주제</th>
                      <th>작성자</th>
                      <th>유형</th>
                      <th>피드백</th>
                      <th>상태</th>
                      <th>작성일</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {visible.map((post, idx) => {
                      const eligible = isEligible(post);
                      return (
                        <tr
                          key={post.post_id}
                          style={{ cursor: "pointer" }}
                          onClick={() => navigate(`/admin/wisdom/${post.post_id}`)}
                        >
                          <td onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={selected.has(post.post_id)}
                              onChange={(e) => toggleOne(post.post_id, e)}
                              disabled={!eligible}
                              title={eligible ? "AI 첨삭 대상 선택" : "이미 첨삭 완료 또는 업로드 타입"}
                            />
                          </td>
                          <td>{filteredSorted.length - ((page - 1) * PER_PAGE + idx)}</td>
                          <td>{post.level_id}</td>
                          <td>{post.topic_label}</td>
                          <td>{post.author_name || post.author_id}</td>
                          <td>{post.submission_type === "manuscript" ? "원고지" : "업로드"}</td>
                          <td>
                            <span style={{
                              color: post.has_feedback ? "var(--admin-accent-strong)" : "var(--admin-muted)",
                              fontWeight: 700,
                              fontSize: 13,
                            }}>
                              {post.has_feedback ? "완료" : "미완료"}
                            </span>
                          </td>
                          <td>{post.status}</td>
                          <td>{fmtDate(post.created_at)}</td>
                          <td onClick={(e) => e.stopPropagation()} style={{ textAlign: "right" }}>
                            {post.status !== "deleted" && (
                              <button
                                onClick={() => handleDelete(post)}
                                title="글 삭제 (soft delete)"
                                style={{
                                  padding: "4px 10px", fontSize: 11, fontWeight: 600,
                                  background: "#c0392b", color: "#fff",
                                  border: "1px solid #962f22", borderRadius: 4,
                                  cursor: "pointer",
                                }}
                              >🗑 삭제</button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {totalPages > 1 && (
                  <div className="admin-pagination" style={{ marginBottom: 24 }}>
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
    </AdminLayout>
  );
}

export default AdminWisdomPage;
