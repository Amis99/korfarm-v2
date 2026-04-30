import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet, apiPost } from "../utils/adminApi";
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

  const totalPages = Math.max(1, Math.ceil(posts.length / PER_PAGE));
  const visible = posts.slice((page - 1) * PER_PAGE, page * PER_PAGE);

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

        <div className="admin-detail-card">
            <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
              <select
                className="wis-filter-select"
                value={levelId}
                onChange={(e) => { setLevelId(e.target.value); setPage(1); }}
                style={{
                  padding: "8px 12px",
                  border: "1px solid var(--admin-stroke)",
                  borderRadius: 8,
                  background: "var(--admin-panel)",
                  color: "var(--admin-ink)",
                  fontSize: 13,
                  fontFamily: "inherit",
                }}
              >
                {LEVEL_OPTIONS.map((l) => (
                  <option key={l.id} value={l.id}>{l.label}</option>
                ))}
              </select>
              <button
                className="admin-detail-btn"
                disabled={selected.size === 0 || batchRunning}
                onClick={handleBatch}
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
                          <td>{posts.length - ((page - 1) * PER_PAGE + idx)}</td>
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
