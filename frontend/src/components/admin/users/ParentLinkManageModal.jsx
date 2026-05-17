import { useCallback, useEffect, useState } from "react";
import { apiGetCamel, apiPost, apiDelete } from "../../../utils/adminApi";

/**
 * 학부모 자녀 매칭 관리 모달 (2026-05-18).
 * - 현재 연결된 자녀 목록
 * - "자녀 연결" 버튼 → 학생 검색 → 연결
 * - 각 자녀 연결 해제
 * 백엔드:
 *   GET    /v1/admin/parents/links?parentUserId=...
 *   POST   /v1/admin/parents/links { studentLoginId, parentLoginId }
 *   DELETE /v1/admin/parents/links/{linkId}
 */
function ParentLinkManageModal({ parent, onClose, onChanged }) {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGetCamel(`/v1/admin/parents/links?parentUserId=${encodeURIComponent(parent.userId)}`);
      setLinks(Array.isArray(data) ? data : []);
    } catch {
      setLinks([]);
    } finally {
      setLoading(false);
    }
  }, [parent.userId]);

  useEffect(() => { reload(); }, [reload]);

  const handleUnlink = async (linkId) => {
    if (!window.confirm("이 자녀 연결을 해제할까요?")) return;
    try {
      await apiDelete(`/v1/admin/parents/links/${linkId}`);
      await reload();
      onChanged?.();
    } catch (e) {
      alert(e?.message || "해제에 실패했습니다.");
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal admin-modal-xl" onClick={(e) => e.stopPropagation()}>
        <h2>학부모 자녀 관리</h2>
        <p className="admin-detail-note">
          <strong>{parent.name}</strong> ({parent.loginId})
          {parent.phone ? ` · ${parent.phone}` : ""}
          {parent.orgName ? ` · ${parent.orgName}` : ""}
        </p>

        {loading ? (
          <p className="admin-detail-note">불러오는 중…</p>
        ) : links.length === 0 ? (
          <p className="admin-detail-note">연결된 자녀가 없습니다.</p>
        ) : (
          <table className="admin-detail-table">
            <thead><tr><th>자녀</th><th>아이디</th><th>상태</th><th></th></tr></thead>
            <tbody>
              {links.map((l) => (
                <tr key={l.linkId}>
                  <td>{l.studentName || "-"}</td>
                  <td style={{ fontSize: 12 }}>{l.studentLoginId || "-"}</td>
                  <td><span className="status-pill" data-status={l.status === "active" ? "active" : "inactive"}>{l.status}</span></td>
                  <td>
                    {l.status === "active" ? (
                      <button
                        type="button"
                        className="admin-detail-btn ghost"
                        onClick={() => handleUnlink(l.linkId)}
                      >
                        해제
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="admin-modal-actions">
          <button
            type="button"
            className="admin-detail-btn secondary"
            onClick={() => setShowSearch(true)}
          >
            + 자녀 연결
          </button>
          <button type="button" className="admin-detail-btn ghost" onClick={onClose}>닫기</button>
        </div>
      </div>

      {showSearch ? (
        <StudentSearchModal
          parentLoginId={parent.loginId}
          parentName={parent.name}
          onClose={() => setShowSearch(false)}
          onLinked={async () => { setShowSearch(false); await reload(); onChanged?.(); }}
        />
      ) : null}
    </div>
  );
}

function StudentSearchModal({ parentLoginId, parentName, onClose, onLinked }) {
  const [q, setQ] = useState("");
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const search = useCallback(async () => {
    setLoading(true); setMessage(null);
    try {
      const data = await apiGetCamel(`/v1/admin/members?role=STUDENT&q=${encodeURIComponent(q)}`);
      setStudents(Array.isArray(data) ? data.slice(0, 30) : []);
    } catch (e) {
      setMessage({ ok: false, text: e?.message || "검색 실패" });
    } finally {
      setLoading(false);
    }
  }, [q]);

  const link = async (student) => {
    try {
      await apiPost("/v1/admin/parents/links", {
        studentLoginId: student.loginId || student.email,
        parentLoginId: parentLoginId,
      });
      onLinked();
    } catch (e) {
      setMessage({ ok: false, text: e?.message || "연결 실패" });
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal admin-modal-xl" onClick={(e) => e.stopPropagation()}>
        <h2>학생 검색</h2>
        <p className="admin-detail-note">학부모: <strong>{parentName}</strong> ({parentLoginId})</p>
        <div className="admin-modal-field">
          <label>이름·아이디·전화 검색</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") search(); }}
              placeholder="학생 이름·아이디·전화"
            />
            <button type="button" className="admin-detail-btn" onClick={search} disabled={loading}>
              {loading ? "검색 중…" : "검색"}
            </button>
          </div>
        </div>
        {message ? <p className={`admin-detail-note ${message.ok ? "" : "error"}`}>{message.text}</p> : null}
        {students.length > 0 ? (
          <table className="admin-detail-table">
            <thead><tr><th>이름</th><th>아이디</th><th>기관</th><th>학년/레벨</th><th></th></tr></thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.userId || s.loginId}>
                  <td>{s.name || "-"}</td>
                  <td style={{ fontSize: 12 }}>{s.loginId || s.email || "-"}</td>
                  <td>{s.orgName || "-"}</td>
                  <td style={{ fontSize: 12 }}>{s.gradeLabel || s.levelId || "-"}</td>
                  <td>
                    <button type="button" className="admin-detail-btn secondary" onClick={() => link(s)}>연결</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          !loading && q ? <p className="admin-detail-note">결과 없음</p> : null
        )}
        <div className="admin-modal-actions">
          <button type="button" className="admin-detail-btn secondary" onClick={onClose}>닫기</button>
        </div>
      </div>
    </div>
  );
}

export default ParentLinkManageModal;
