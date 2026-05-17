/**
 * 회원 관리 (HQ_ADMIN 전용).
 * 탭으로 학생/학부모/기관 관리자 분리 조회.
 * ORG_ADMIN 은 기존 학생 관리/학부모 관리 메뉴 그대로 사용.
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiGet } from "../utils/adminApi";
import AdminLayout from "../components/AdminLayout";
import "../styles/admin-detail.css";

const TABS = [
  { key: "STUDENT",   label: "학생 회원",     icon: "school" },
  { key: "PARENT",    label: "학부모 회원",   icon: "family_restroom" },
  { key: "ORG_ADMIN", label: "기관 관리자",   icon: "manage_accounts" },
];

const mapRows = (items) =>
  (items || []).map((m) => ({
    userId: m.userId || m.user_id,
    loginId: m.loginId || m.login_id,
    name: m.name,
    role: m.role,
    orgId: m.orgId || m.org_id,
    orgName: m.orgName || m.org_name,
    phone: m.phone,
    email: m.email,
    levelId: m.levelId || m.level_id,
    gradeLabel: m.gradeLabel || m.grade_label,
    school: m.school,
    region: m.region,
    linkedStudentNames: m.linkedStudentNames || m.linked_student_names || [],
    createdAt: m.createdAt || m.created_at,
  }));

export default function AdminMembersPage() {
  const [activeTab, setActiveTab] = useState("STUDENT");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [orgFilter, setOrgFilter] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true); setError("");
      try {
        const res = await apiGet(`/v1/admin/members?role=${activeTab}`);
        const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
        if (!cancelled) setRows(mapRows(list));
      } catch (e) {
        if (!cancelled) setError(e.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [activeTab]);

  const orgs = useMemo(() => {
    const seen = new Map();
    rows.forEach((r) => {
      if (r.orgId && !seen.has(r.orgId)) seen.set(r.orgId, r.orgName || r.orgId);
    });
    return [{ id: "all", name: "전체 기관" }, ...Array.from(seen, ([id, name]) => ({ id, name }))];
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (orgFilter !== "all" && r.orgId !== orgFilter) return false;
      if (!q) return true;
      return [r.name, r.loginId, r.orgName, r.phone, r.school, r.linkedStudentNames?.join(",")]
        .filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
    });
  }, [rows, search, orgFilter]);

  return (
    <AdminLayout>
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>회원 관리</h1>
          <div className="admin-detail-actions">
            <button className="admin-detail-btn secondary" onClick={() => navigate("/admin/students")}>
              학생 상세 화면 (옛)
            </button>
          </div>
        </div>

        {/* 탭 */}
        <div style={{ display: "flex", gap: 4, marginBottom: 12, borderBottom: "2px solid #eee" }}>
          {TABS.map((t) => (
            <button key={t.key} type="button" onClick={() => setActiveTab(t.key)}
                    style={{
                      padding: "10px 16px",
                      border: "none",
                      borderBottom: activeTab === t.key ? "2px solid #2d6a4f" : "2px solid transparent",
                      marginBottom: -2,
                      background: "transparent",
                      color: activeTab === t.key ? "#2d6a4f" : "#666",
                      fontWeight: activeTab === t.key ? 700 : 400,
                      cursor: "pointer",
                      display: "flex", alignItems: "center", gap: 6,
                      fontSize: 14,
                    }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{t.icon}</span>
              {t.label}
              {activeTab === t.key && (
                <span style={{ marginLeft: 4, color: "#888", fontSize: 12 }}>({filtered.length}/{rows.length})</span>
              )}
            </button>
          ))}
        </div>

        <div className="admin-detail-grid">
          <div className="admin-detail-card">
            <div className="admin-detail-toolbar">
              <div className="admin-detail-search">
                <span className="material-symbols-outlined">search</span>
                <input value={search} onChange={(e) => setSearch(e.target.value)}
                       placeholder="이름·아이디·기관·전화·학교 검색" />
              </div>
              <select value={orgFilter} onChange={(e) => setOrgFilter(e.target.value)}
                      style={{ padding: "5px 8px", border: "1px solid #ddd", borderRadius: 4, marginLeft: "auto" }}>
                {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            </div>

            {error && <p className="admin-detail-note error">오류: {error}</p>}
            {loading ? <p style={{ padding: 20, textAlign: "center", color: "#888" }}>로딩 중...</p>
              : filtered.length === 0 ? (
                <p style={{ padding: 20, textAlign: "center", color: "#888" }}>
                  {rows.length === 0 ? "등록된 회원이 없습니다." : "조건에 맞는 회원이 없습니다."}
                </p>
              ) : (
                <table className="admin-detail-table">
                  <thead><MemberHead tab={activeTab} /></thead>
                  <tbody>
                    {filtered.map((r) => <MemberRow key={r.userId} row={r} tab={activeTab} navigate={navigate} />)}
                  </tbody>
                </table>
              )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

function MemberHead({ tab }) {
  if (tab === "STUDENT") {
    return (
      <tr>
        <th>이름</th><th>아이디</th><th>기관</th><th>학년/레벨</th><th>학교/지역</th><th>학생전화</th><th>가입일</th>
      </tr>
    );
  }
  if (tab === "PARENT") {
    return (
      <tr>
        <th>이름</th><th>아이디</th><th>기관</th><th>학부모전화</th><th>연결된 자녀</th><th>가입일</th>
      </tr>
    );
  }
  // ORG_ADMIN
  return (
    <tr>
      <th>이름</th><th>아이디</th><th>기관</th><th>연락처</th><th>이메일</th><th>가입일</th>
    </tr>
  );
}

function MemberRow({ row, tab, navigate }) {
  const dateStr = (row.createdAt || "").slice(0, 10);
  if (tab === "STUDENT") {
    return (
      <tr className="clickable-row" onClick={() => navigate(`/admin/students/${row.userId}`)}>
        <td><strong>{row.name || "-"}</strong></td>
        <td>{row.loginId}</td>
        <td>{row.orgName || "-"}</td>
        <td>{row.gradeLabel || row.levelId || "-"}</td>
        <td>{row.school || ""} {row.region ? `(${row.region})` : ""}</td>
        <td>{row.phone || "-"}</td>
        <td>{dateStr}</td>
      </tr>
    );
  }
  if (tab === "PARENT") {
    return (
      <tr>
        <td><strong>{row.name || "-"}</strong></td>
        <td>{row.loginId}</td>
        <td>{row.orgName || "-"}</td>
        <td>{row.phone || "-"}</td>
        <td>{row.linkedStudentNames?.length ? row.linkedStudentNames.join(", ") : <span style={{ color: "#aaa" }}>미연결</span>}</td>
        <td>{dateStr}</td>
      </tr>
    );
  }
  // ORG_ADMIN
  return (
    <tr>
      <td><strong>{row.name || "-"}</strong></td>
      <td>{row.loginId}</td>
      <td>{row.orgName || "-"}</td>
      <td>{row.phone || "-"}</td>
      <td>{row.email || "-"}</td>
      <td>{dateStr}</td>
    </tr>
  );
}
