import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { apiGet, apiDelete } from "../utils/adminApi";
import Pagination from "../components/Pagination";
import usePagination from "../hooks/usePagination";
import "../styles/admin-detail.css";

const AREA_LABEL = {
  LIT: "문학", READ: "독서", GRAM: "문법", SPEAK: "화법", WRITE: "작문", MEDIA: "매체",
};

function AdminStudyContentPage() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await apiGet("/v1/admin/study/contents");
      setItems(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (item) => {
    if (!confirm(`"${item.title}" 을(를) 삭제합니다. 페이지·문제·학습 이력 모두 사라집니다. 계속하시겠습니까?`)) return;
    try {
      await apiDelete(`/v1/admin/study/contents/${item.id}`);
      setItems(items.filter(i => i.id !== item.id));
    } catch (err) {
      alert("삭제 실패: " + err.message);
    }
  };

  const filtered = items.filter(i => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (i.title || "").toLowerCase().includes(q)
      || (i.ownerOrgName || "").toLowerCase().includes(q)
      || (i.area || "").toLowerCase().includes(q);
  });

  const { page, setPage, totalPages, paged } = usePagination(filtered, 15);
  useEffect(() => { setPage(1); }, [search, setPage]);

  return (
    <AdminLayout>
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <div>
            <h1>내용 숙지 콘텐츠 관리</h1>
            <p className="admin-detail-subtitle">
              페이지 단위 본문 + 4유형 문제(객관식/OX/단답/서술) + 10대 역량 벡터
            </p>
          </div>
          <div className="admin-detail-header-actions">
            <button
              type="button"
              className="admin-detail-btn"
              onClick={() => navigate("/admin/study-content-v2/editor/new")}
            >
              + 신규 콘텐츠
            </button>
          </div>
        </div>

        {/* 안내 박스 */}
        <div
          className="admin-detail-card"
          style={{
            padding: 14,
            background: "var(--admin-panel-light, #f5f9f3)",
            borderLeft: "4px solid var(--admin-accent)",
          }}
        >
          <strong style={{ fontSize: 14, color: "var(--admin-accent-strong)" }}>
            📝 v2 비주얼 에디터 사용
          </strong>
          <p style={{ fontSize: 12, color: "var(--admin-muted)", margin: "4px 0 0" }}>
            PDF/이미지를 마크다운으로 자동 변환하거나, AI로 출제 포인트와 4유형 문제를 자동 생성할 수 있습니다 (추가 과금).
            본사 관리자: 전체 공개 또는 기관 한정. 기관 관리자: 자기 기관 학생에게만 노출.
          </p>
        </div>

        {error && <div className="admin-error">{error}</div>}

        <div className="admin-detail-card">
          <div className="admin-detail-toolbar">
            <div className="admin-detail-search">
              <span className="material-symbols-outlined">search</span>
              <input
                placeholder="제목·기관·영역 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <span style={{ color: "var(--admin-muted)", fontSize: 13 }}>
              {filtered.length} / {items.length}건
            </span>
          </div>

          {loading ? (
            <p style={{ color: "var(--admin-muted)" }}>불러오는 중...</p>
          ) : filtered.length === 0 ? (
            <p style={{ color: "var(--admin-muted)", padding: "20px 0" }}>
              {items.length === 0 ? "등록된 콘텐츠가 없습니다. + 신규 콘텐츠로 작성하세요." : "검색 결과가 없습니다."}
            </p>
          ) : (
            <>
            <table className="admin-detail-table">
              <thead>
                <tr>
                  <th>제목</th>
                  <th>영역</th>
                  <th>레벨</th>
                  <th>공개</th>
                  <th>기관</th>
                  <th>문제</th>
                  <th>생성일</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {paged.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Link
                        to={`/admin/study-content-v2/editor/${item.id}`}
                        className="admin-content-title-link"
                      >
                        {item.title}
                      </Link>
                    </td>
                    <td>
                      {item.area ? (
                        <span style={{ fontSize: 12, color: "var(--admin-accent-strong)" }}>
                          {AREA_LABEL[item.area] || item.area}
                          {item.subArea ? ` · ${item.subArea}` : ""}
                        </span>
                      ) : "-"}
                    </td>
                    <td>{item.levelId || "-"}</td>
                    <td>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 4,
                        background: item.visibility === "PUBLIC" ? "var(--admin-accent-soft)" : "rgba(212, 160, 76, 0.12)",
                        color: item.visibility === "PUBLIC" ? "var(--admin-accent-strong)" : "#8a5e1c",
                      }}>
                        {item.visibility === "PUBLIC" ? "전체" : "기관"}
                      </span>
                    </td>
                    <td>{item.ownerOrgName || item.ownerOrgId || "-"}</td>
                    <td>{item.questionCount || 0}</td>
                    <td style={{ fontSize: 12, color: "var(--admin-muted)" }}>{item.createdAt?.slice(0, 10) || "-"}</td>
                    <td>
                      <button
                        type="button"
                        className="admin-detail-btn danger xs"
                        onClick={() => handleDelete(item)}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} totalPages={totalPages} onChange={setPage} />
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}

export default AdminStudyContentPage;
