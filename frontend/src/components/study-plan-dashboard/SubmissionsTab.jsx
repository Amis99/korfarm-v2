import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../../utils/api";
import Pagination from "../Pagination";
import usePagination from "../../hooks/usePagination";

const ASSET_TYPE_LABEL = {
  korfarm: "국어농장", activity: "학습활동", test: "테스트", writing: "글쓰기",
};
const STATUS_LABEL = {
  submitted: "제출", partial: "일부 완료", completed: "완료",
  scored: "채점됨", passed: "통과", retry: "재시험",
  pending: "미수행", in_progress: "진행중", unassigned: "미배정",
};

/**
 * 권한 범위 안 모든 학생의 제출물 통합 리스트.
 * Props:
 *   classId
 *   onPickStudent({ userId, planId, cellId })  행 클릭 시 호출 — 학생별 탭으로 이동
 */
export default function SubmissionsTab({ classId, onPickStudent }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  // 정책: 제출물 탭은 학습 활동(activity) 만 노출.
  // 다른 자산은 각자 결과 화면(학습 히스토리/성적표/첨삭)으로 점프.
  const assetType = "activity";
  const [status, setStatus] = useState("");
  const [sortBy, setSortBy] = useState("updatedAt");
  const [sortDir, setSortDir] = useState("desc");

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("assetType", assetType);
    if (status) params.set("status", status);
    if (classId) params.set("classId", classId);
    if (sortBy) params.set("sortBy", sortBy);
    if (sortDir) params.set("sortDir", sortDir);
    apiGet(`/v1/admin/submissions${params.toString() ? `?${params.toString()}` : ""}`)
      .then((data) => {
        const list = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
        setItems(list);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [status, classId, sortBy, sortDir]);

  const { page, setPage, totalPages, paged } = usePagination(items, 15);
  useEffect(() => { setPage(1); }, [status, classId, sortBy, sortDir, setPage]);

  const sortIcon = (key) => sortBy === key ? (sortDir === "asc" ? " ▲" : " ▼") : "";
  const toggleSort = (key) => {
    if (sortBy === key) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else { setSortBy(key); setSortDir("desc"); }
  };

  return (
    <div className="admin-detail-card">
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 12, color: "var(--admin-muted)", padding: "8px 12px", background: "rgba(45,106,79,0.08)", borderRadius: 6 }}>
          학습 활동 제출물만 표시 (다른 자산은 각자 결과 화면 사용)
        </span>
        <select value={status} onChange={(e) => setStatus(e.target.value)} style={selectStyle}>
          <option value="">전체 상태</option>
          <option value="submitted">제출</option>
          <option value="partial">일부 완료</option>
          <option value="completed">완료</option>
          <option value="scored">채점됨</option>
          <option value="passed">통과</option>
          <option value="pending">미수행</option>
        </select>
        <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--admin-muted)" }}>
          {items.length}건
        </span>
      </div>

      {loading ? (
        <p style={{ color: "var(--admin-muted)", padding: 12 }}>불러오는 중...</p>
      ) : items.length === 0 ? (
        <p style={{ color: "var(--admin-muted)", padding: 12, textAlign: "center" }}>제출물이 없습니다.</p>
      ) : (
        <>
          <table className="admin-detail-table">
            <thead>
              <tr>
                <th onClick={() => toggleSort("updatedAt")} style={{ cursor: "pointer" }}>제출일{sortIcon("updatedAt")}</th>
                <th onClick={() => toggleSort("userName")} style={{ cursor: "pointer" }}>학생{sortIcon("userName")}</th>
                <th onClick={() => toggleSort("scopeLabel")} style={{ cursor: "pointer" }}>범위{sortIcon("scopeLabel")}</th>
                <th onClick={() => toggleSort("assetLabel")} style={{ cursor: "pointer" }}>활동{sortIcon("assetLabel")}</th>
                <th>유형</th>
                <th>상태</th>
                <th>점수</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((s) => (
                <tr key={s.cellId} className="clickable-row"
                  onClick={() => onPickStudent?.({
                    userId: s.userId,
                    planId: s.planId,
                    cellId: s.cellId,
                  })}>
                  <td>{(s.updatedAt || "").split("T")[0] || "-"}</td>
                  <td>{s.userName}</td>
                  <td>{s.scopeLabel}</td>
                  <td>{s.assetLabel}</td>
                  <td>{ASSET_TYPE_LABEL[s.assetType] || s.assetType}</td>
                  <td>
                    <span className="status-pill" data-status={s.status}>
                      {STATUS_LABEL[s.status] || s.status}
                    </span>
                  </td>
                  <td>{s.score ?? "-"}</td>
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
