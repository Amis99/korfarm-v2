import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { apiGet, apiPost, apiDelete } from "../utils/adminApi";
import { camelize } from "../utils/api";
import { useAuth } from "../hooks/useAuth";
import "../styles/admin-detail.css";

function AdminStudyContentPage() {
  const { user } = useAuth();
  const isHq = user?.roles?.includes("HQ_ADMIN");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  // 신규 작성 폼 (마크다운 + 메타)
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newLevelId, setNewLevelId] = useState("RUSSELL_1");
  const [newVisibility, setNewVisibility] = useState(isHq ? "PUBLIC" : "ORG");
  const [newOwnerOrgId, setNewOwnerOrgId] = useState("");
  const [newMarkdown, setNewMarkdown] = useState("");
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const list = await apiGet("/v1/admin/study/contents");
      // adminApi는 응답을 변환하지 않으므로 명시적 camelize
      setItems(camelize(list || []));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!newTitle.trim() || !newMarkdown.trim()) {
      alert("제목과 본문은 필수입니다.");
      return;
    }
    if (newVisibility === "ORG" && isHq && !newOwnerOrgId.trim()) {
      alert("ORG 가시성으로 만들 때는 owner_org_id가 필요합니다.");
      return;
    }
    setCreating(true);
    try {
      const body = {
        title: newTitle,
        description: newDescription,
        levelId: newLevelId,
        visibility: newVisibility,
        ownerOrgId: newVisibility === "ORG" ? newOwnerOrgId || null : null,
        markdown: newMarkdown,
        evalPoints: [],
        errorPatterns: [],
      };
      const res = await apiPost("/v1/admin/study/contents", body);
      // 생성 후 에디터로 이동
      window.location.href = `/admin/study-content/editor/${res.id}`;
    } catch (e) {
      alert("생성 실패: " + e.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`"${item.title}" 콘텐츠를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;
    try {
      await apiDelete(`/v1/admin/study/contents/${item.id}`);
      await load();
    } catch (e) {
      alert("삭제 실패: " + e.message);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>내용 숙지 콘텐츠 관리</h1>
          <button
            type="button"
            className="ldb-btn ldb-btn-primary"
            onClick={() => setShowCreate(!showCreate)}
          >
            {showCreate ? "닫기" : "＋ 신규 콘텐츠"}
          </button>
        </div>

        {showCreate && (
          <div className="admin-card" style={{ padding: 20, marginBottom: 24 }}>
            <h3>신규 학습 콘텐츠 작성</h3>
            <p style={{ color: "#888", fontSize: 13, marginBottom: 16 }}>
              제목과 마크다운 본문만 먼저 등록하면, 다음 화면에서 체크리스트와 문제를 추가할 수 있습니다.
            </p>
            <div style={{ display: "grid", gap: 12 }}>
              <label>
                <div style={{ fontSize: 13, fontWeight: 600 }}>제목 *</div>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{ width: "100%", padding: 8 }}
                />
              </label>
              <label>
                <div style={{ fontSize: 13, fontWeight: 600 }}>설명</div>
                <input
                  type="text"
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  style={{ width: "100%", padding: 8 }}
                />
              </label>
              <label>
                <div style={{ fontSize: 13, fontWeight: 600 }}>대상 레벨</div>
                <select value={newLevelId} onChange={(e) => setNewLevelId(e.target.value)} style={{ padding: 8 }}>
                  <option value="SAUSSURE_1">소쉬르1</option>
                  <option value="SAUSSURE_2">소쉬르2</option>
                  <option value="SAUSSURE_3">소쉬르3</option>
                  <option value="FREGE_1">프레게1</option>
                  <option value="FREGE_2">프레게2</option>
                  <option value="FREGE_3">프레게3</option>
                  <option value="RUSSELL_1">러셀1</option>
                  <option value="RUSSELL_2">러셀2</option>
                  <option value="RUSSELL_3">러셀3</option>
                  <option value="WITTGENSTEIN_1">비트겐슈타인1</option>
                  <option value="WITTGENSTEIN_2">비트겐슈타인2</option>
                  <option value="WITTGENSTEIN_3">비트겐슈타인3</option>
                </select>
              </label>
              {isHq && (
                <label>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>가시 범위</div>
                  <select value={newVisibility} onChange={(e) => setNewVisibility(e.target.value)} style={{ padding: 8 }}>
                    <option value="PUBLIC">PUBLIC (모든 유료 회원)</option>
                    <option value="ORG">ORG (특정 기관)</option>
                  </select>
                </label>
              )}
              {newVisibility === "ORG" && isHq && (
                <label>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>대상 기관 ID</div>
                  <input
                    type="text"
                    value={newOwnerOrgId}
                    onChange={(e) => setNewOwnerOrgId(e.target.value)}
                    placeholder="org_xxxx"
                    style={{ width: "100%", padding: 8 }}
                  />
                </label>
              )}
              <label>
                <div style={{ fontSize: 13, fontWeight: 600 }}>마크다운 본문 *</div>
                <textarea
                  rows={12}
                  value={newMarkdown}
                  onChange={(e) => setNewMarkdown(e.target.value)}
                  placeholder="# 제목&#10;&#10;본문을 마크다운으로 작성합니다."
                  style={{ width: "100%", padding: 10, fontFamily: "monospace", fontSize: 13 }}
                />
              </label>
              <button
                type="button"
                className="ldb-btn ldb-btn-primary"
                onClick={handleCreate}
                disabled={creating}
              >
                {creating ? "생성 중..." : "생성하고 편집하기"}
              </button>
            </div>
          </div>
        )}

        {error && <div className="admin-error" style={{ color: "#a00", marginBottom: 16 }}>{error}</div>}

        {loading ? (
          <p>불러오는 중...</p>
        ) : items.length === 0 ? (
          <p style={{ color: "#888" }}>등록된 콘텐츠가 없습니다.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>제목</th>
                <th>레벨</th>
                <th>가시 범위</th>
                <th>기관</th>
                <th>문제 수</th>
                <th>상태</th>
                <th>생성일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <Link to={`/admin/study-content/editor/${item.id}`}>{item.title}</Link>
                  </td>
                  <td>{item.levelId || "-"}</td>
                  <td>{item.visibility}</td>
                  <td>{item.ownerOrgName || item.ownerOrgId || "-"}</td>
                  <td>{item.questionCount}</td>
                  <td>{item.status}</td>
                  <td>{item.createdAt?.slice(0, 10)}</td>
                  <td>
                    <button
                      type="button"
                      className="ldb-btn ldb-btn-ghost"
                      onClick={() => handleDelete(item)}
                    >
                      삭제
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

export default AdminStudyContentPage;
