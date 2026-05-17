import { useEffect, useMemo, useState } from "react";
import { apiGet } from "../../../utils/adminApi";
import ParentLinkManageModal from "./ParentLinkManageModal";

/**
 * 학부모 탭 (2026-05-18). HQ_ADMIN 전용.
 * 학부모 목록 + 행 클릭 시 자녀 매칭 모달 (자동 매칭 누락 케이스 수동 보정).
 */
function ParentsTab() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [orgFilter, setOrgFilter] = useState("all");
  const [selected, setSelected] = useState(null);

  const reload = async () => {
    setLoading(true); setError("");
    try {
      const res = await apiGet("/v1/admin/members?role=PARENT");
      const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
      setRows(list.map(mapRow));
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); }, []);

  const orgs = useMemo(() => {
    const m = new Map();
    rows.forEach((r) => {
      if (r.orgId && !m.has(r.orgId)) m.set(r.orgId, r.orgName || r.orgId);
    });
    return [{ id: "all", name: "전체 기관" }, ...Array.from(m, ([id, name]) => ({ id, name }))];
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (orgFilter !== "all" && r.orgId !== orgFilter) return false;
      if (!q) return true;
      return [r.name, r.loginId, r.orgName, r.phone, r.linkedStudentNames?.join(",")]
        .filter(Boolean).some((v) => String(v).toLowerCase().includes(q));
    });
  }, [rows, search, orgFilter]);

  return (
    <>
      <div className="admin-detail-card">
        <div className="admin-detail-toolbar">
          <div className="admin-detail-search">
            <span className="material-symbols-outlined">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이름·아이디·전화·자녀 이름"
            />
          </div>
          <select value={orgFilter} onChange={(e) => setOrgFilter(e.target.value)}>
            {orgs.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </div>

        {error ? <p className="admin-detail-note error">오류: {error}</p> : null}

        {loading ? (
          <p className="admin-detail-note">로딩 중…</p>
        ) : filtered.length === 0 ? (
          <p className="admin-detail-note">{rows.length === 0 ? "등록된 학부모가 없습니다." : "조건에 맞는 학부모가 없습니다."}</p>
        ) : (
          <table className="admin-detail-table">
            <thead>
              <tr>
                <th>이름</th>
                <th>아이디</th>
                <th>기관</th>
                <th>연락처</th>
                <th>연결된 자녀</th>
                <th>가입일</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.userId} className="clickable-row" onClick={() => setSelected(r)}>
                  <td><strong>{r.name || "-"}</strong></td>
                  <td style={{ fontSize: 12 }}>{r.loginId}</td>
                  <td>{r.orgName || "-"}</td>
                  <td>{r.phone || "-"}</td>
                  <td>
                    {r.linkedStudentNames?.length
                      ? r.linkedStudentNames.join(", ")
                      : <span style={{ color: "#aaa" }}>미연결</span>}
                  </td>
                  <td style={{ fontSize: 12 }}>{(r.createdAt || "").slice(0, 10)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {selected ? (
        <ParentLinkManageModal
          parent={selected}
          onClose={() => setSelected(null)}
          onChanged={reload}
        />
      ) : null}
    </>
  );
}

function mapRow(m) {
  return {
    userId: m.userId || m.user_id,
    loginId: m.loginId || m.login_id,
    name: m.name,
    orgId: m.orgId || m.org_id,
    orgName: m.orgName || m.org_name,
    phone: m.phone,
    email: m.email,
    linkedStudentNames: m.linkedStudentNames || m.linked_student_names || [],
    createdAt: m.createdAt || m.created_at,
  };
}

export default ParentsTab;
