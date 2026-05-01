import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../../utils/api";
import Pagination from "../Pagination";
import usePagination from "../../hooks/usePagination";

function fmtToday() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fmtPlus(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/**
 * 학습 계획표에 배정된 테스트 자산 통합 리스트.
 * Props:
 *   classId
 */
export default function TestTab({ classId }) {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState(fmtPlus(-30));
  const [to, setTo] = useState(fmtPlus(60));
  const [drilldown, setDrilldown] = useState(null); // { item, students, loading }

  const load = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (classId) params.set("classId", classId);
    apiGet(`/v1/admin/study-plans/test-assets${params.toString() ? `?${params.toString()}` : ""}`)
      .then((data) => {
        const list = Array.isArray(data?.items) ? data.items : (Array.isArray(data) ? data : []);
        setItems(list);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, [from, to, classId]);

  const { page, setPage, totalPages, paged } = usePagination(items, 15);
  useEffect(() => { setPage(1); }, [from, to, classId, setPage]);

  const handleRowClick = async (it) => {
    const assetId = it.assetId || it.id;
    if (!assetId) return;
    setDrilldown({ item: it, students: [], loading: true });
    try {
      const data = await apiGet(`/v1/admin/study-plans/test-assets/${assetId}/students`);
      const students = Array.isArray(data?.students) ? data.students : (Array.isArray(data) ? data : []);
      setDrilldown({ item: it, students, loading: false });
    } catch {
      setDrilldown({ item: it, students: [], loading: false });
    }
  };

  const handleStudentClick = (item, st) => {
    const userId = st.userId || st.user_id;
    if (!userId) return;
    const testId = item.testId || item.test_id;
    if (testId) {
      navigate(`/admin/tests/${testId}/statistics?studentId=${userId}`);
    } else {
      navigate(`/admin/students/${userId}?tab=tests`);
    }
  };

  return (
    <div className="admin-detail-card">
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center", marginBottom: 12 }}>
        <label style={{ fontSize: 12, color: "var(--admin-muted)" }}>기간</label>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={inputStyle} />
        <span style={{ color: "var(--admin-muted)" }}>~</span>
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={inputStyle} />
        <span style={{ marginLeft: "auto", fontSize: 12, color: "var(--admin-muted)" }}>
          {items.length}건
        </span>
      </div>

      {loading ? (
        <p style={{ color: "var(--admin-muted)", padding: 12 }}>불러오는 중...</p>
      ) : items.length === 0 ? (
        <p style={{ color: "var(--admin-muted)", padding: 12, textAlign: "center" }}>배정된 테스트가 없습니다.</p>
      ) : (
        <>
          <table className="admin-detail-table">
            <thead>
              <tr>
                <th>시험명</th>
                <th>학습 계획표</th>
                <th>마감일</th>
                <th>응시</th>
                <th>미응시</th>
                <th>평균</th>
              </tr>
            </thead>
            <tbody>
              {paged.map((it) => (
                <tr key={it.assetId || it.id} className="clickable-row" onClick={() => handleRowClick(it)}>
                  <td>{it.testTitle || it.title || it.label}</td>
                  <td>{it.planTitle || it.plan_title || "-"}</td>
                  <td>{(it.dueAt || it.due_at || "").split("T")[0] || "-"}</td>
                  <td>{it.completed ?? "-"}</td>
                  <td>{it.pending ?? "-"}</td>
                  <td>{it.avgScore != null ? Number(it.avgScore).toFixed(1) : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </>
      )}

      {drilldown && (
        <div className="admin-modal-overlay" onClick={() => setDrilldown(null)}>
          <div className="admin-modal admin-modal-wide" onClick={(e) => e.stopPropagation()}>
            <h2>{drilldown.item.testTitle || drilldown.item.title || drilldown.item.label} — 학생 명단</h2>
            {drilldown.loading ? (
              <p style={{ color: "var(--admin-muted)" }}>불러오는 중...</p>
            ) : drilldown.students.length === 0 ? (
              <p style={{ color: "var(--admin-muted)" }}>학생 정보가 없습니다.</p>
            ) : (
              <table className="admin-detail-table">
                <thead>
                  <tr>
                    <th>학생</th>
                    <th>수강반</th>
                    <th>상태</th>
                    <th>점수</th>
                    <th>응시일</th>
                  </tr>
                </thead>
                <tbody>
                  {drilldown.students.map((st, idx) => (
                    <tr key={st.userId || idx} className="clickable-row"
                      onClick={() => handleStudentClick(drilldown.item, st)}>
                      <td>{st.userName || st.user_name || st.userId}</td>
                      <td>{st.className || st.class_name || "-"}</td>
                      <td>
                        <span className="status-pill" data-status={st.status === "completed" || st.status === "passed" || st.status === "scored" ? "completed" : "pending"}>
                          {st.status || "-"}
                        </span>
                      </td>
                      <td>{st.score ?? "-"}</td>
                      <td>{(st.attemptedAt || st.attempted_at || "").split("T")[0] || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="admin-modal-actions">
              <button className="admin-detail-btn secondary" onClick={() => setDrilldown(null)}>닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  padding: "6px 10px",
  borderRadius: 6,
  border: "1px solid rgba(31,58,44,0.18)",
  background: "var(--admin-panel, #fff)",
  color: "var(--admin-ink)",
  fontSize: 13,
};
