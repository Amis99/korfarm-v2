import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { apiGet } from "../../utils/api";
import Pagination from "../Pagination";
import usePagination from "../../hooks/usePagination";

const LEVEL_LABEL = {
  SAUSSURE_1: "소쉬르1", SAUSSURE_2: "소쉬르2", SAUSSURE_3: "소쉬르3",
  FREGE_1: "프레게1", FREGE_2: "프레게2", FREGE_3: "프레게3",
  RUSSELL_1: "러셀1", RUSSELL_2: "러셀2", RUSSELL_3: "러셀3",
  WITTGENSTEIN_1: "비트겐슈타인1", WITTGENSTEIN_2: "비트겐슈타인2", WITTGENSTEIN_3: "비트겐슈타인3",
};

/**
 * 권한 범위 안 모든 학생의 글쓰기(wisdom_posts) 통합 리스트.
 * Props:
 *   classId
 */
export default function WritingTab({ classId }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [levelId, setLevelId] = useState("");
  const [hasFeedback, setHasFeedback] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortDir, setSortDir] = useState("desc");

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (levelId) params.set("levelId", levelId);
    if (hasFeedback) params.set("hasFeedback", hasFeedback);
    if (classId) params.set("classId", classId);
    if (sortBy) params.set("sortBy", sortBy);
    if (sortDir) params.set("sortDir", sortDir);
    apiGet(`/v1/admin/wisdom/integrated-posts${params.toString() ? `?${params.toString()}` : ""}`)
      .then((data) => {
        const list = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
        setItems(list);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [levelId, hasFeedback, classId, sortBy, sortDir]);

  const { page, setPage, totalPages, paged } = usePagination(items, 15);
  useEffect(() => { setPage(1); }, [levelId, hasFeedback, classId, sortBy, sortDir, setPage]);

  const handleRowClick = (post) => {
    const postId = post.postId || post.id;
    if (!postId) return;
    const from = `${location.pathname}${location.search}`;
    navigate(`/admin/wisdom/posts/${postId}?from=${encodeURIComponent(from)}`);
  };

  const sortIcon = (key) => sortBy === key ? (sortDir === "asc" ? " ▲" : " ▼") : "";
  const toggleSort = (key) => {
    if (sortBy === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortBy(key); setSortDir("desc"); }
  };

  return (
    <div className="admin-detail-card">
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <select value={levelId} onChange={(e) => setLevelId(e.target.value)} style={selectStyle}>
          <option value="">전체 레벨</option>
          {Object.entries(LEVEL_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>
        <select value={hasFeedback} onChange={(e) => setHasFeedback(e.target.value)} style={selectStyle}>
          <option value="">첨삭 전체</option>
          <option value="true">첨삭 있음</option>
          <option value="false">첨삭 없음</option>
        </select>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--admin-muted)" }}>
          {items.length}건
        </span>
      </div>

      {loading ? (
        <p style={{ color: "var(--admin-muted)", padding: 12 }}>불러오는 중...</p>
      ) : items.length === 0 ? (
        <p style={{ color: "var(--admin-muted)", padding: 12, textAlign: "center" }}>글이 없습니다.</p>
      ) : (
        <>
          <table className="admin-detail-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort("createdAt")} style={{ cursor: "pointer" }}>작성일{sortIcon("createdAt")}</th>
                <th onClick={() => toggleSort("userName")} style={{ cursor: "pointer" }}>학생{sortIcon("userName")}</th>
                <th>레벨</th>
                <th>주제</th>
                <th>수강반</th>
                <th>첨삭</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((p) => (
                <tr key={p.postId || p.id} className="clickable-row" onClick={() => handleRowClick(p)}>
                  <td>{(p.createdAt || p.created_at || "").split("T")[0] || "-"}</td>
                  <td>{p.userName || p.authorName || p.author_name}</td>
                  <td>{LEVEL_LABEL[p.levelId || p.level_id] || p.levelId || p.level_id}</td>
                  <td>{p.topicLabel || p.topic_label || "-"}</td>
                  <td>{p.className || p.class_name || "-"}</td>
                  <td>
                    {p.hasFeedback || p.has_feedback ? (
                      <span className="status-pill" data-status="completed">완료</span>
                    ) : (
                      <span className="status-pill" data-status="pending">대기</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}
    </div>
  );
}

const selectStyle = {
  padding: "6px 10px",
  borderRadius: 6,
  border: "1px solid rgba(31,58,44,0.18)",
  background: "var(--admin-panel, #fff)",
  color: "var(--admin-ink)",
  fontSize: 13,
};
