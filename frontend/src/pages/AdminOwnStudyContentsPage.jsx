import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { apiGetCamel } from "../utils/adminApi";
import { useRequireRole } from "../hooks/useRequireRole";
import "../styles/admin.css";

// 본사 — 학생들이 만든 OWN 학습 검수 (Phase C-2)
export default function AdminOwnStudyContentsPage() {
  useRequireRole("HQ_ADMIN");
  const navigate = useNavigate();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiGetCamel("/v1/admin/study/contents/own");
      setList(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { reload(); }, []);

  return (
    <AdminLayout>
      <div className="admin-detail-wrap" style={{ maxWidth: 1100 }}>
        <h1 style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span className="material-symbols-outlined">group</span>
          학생 생성 학습 검수
        </h1>
        <p style={{ color: "#666", fontSize: 13, marginBottom: 16 }}>
          유료 회원 학생이 AI 로 직접 만든 학습 콘텐츠 목록입니다. 클릭하면 비주얼 에디터로 검수할 수 있어요.
        </p>

        {error && <div style={{ padding: 10, background: "#fee", color: "#c00", borderRadius: 4, marginBottom: 12 }}>{error}</div>}

        {loading ? (
          <p>불러오는 중...</p>
        ) : list.length === 0 ? (
          <p style={{ color: "#888" }}>학생이 만든 학습이 아직 없습니다.</p>
        ) : (
          <table className="admin-detail-table" style={{ width: "100%", fontSize: 13 }}>
            <thead>
              <tr>
                <th>제목</th>
                <th>레벨</th>
                <th>영역</th>
                <th>작성자(학생)</th>
                <th>문항</th>
                <th>생성일</th>
                <th>액션</th>
              </tr>
            </thead>
            <tbody>
              {list.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.title}</td>
                  <td>{c.levelId || "-"}</td>
                  <td>{c.area ? `${c.area}${c.subArea ? "·" + c.subArea : ""}` : "-"}</td>
                  <td style={{ fontSize: 11 }}>{c.creatorId}</td>
                  <td style={{ textAlign: "center" }}>{c.questionCount}</td>
                  <td style={{ fontSize: 11 }}>{c.createdAt?.slice(0, 16).replace("T", " ")}</td>
                  <td>
                    <button onClick={() => navigate(`/admin/study-content/${c.id}`)}
                      style={{ padding: "4px 10px", background: "#2f7a3e", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 12 }}>
                      검수
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </AdminLayout>
  );
}
