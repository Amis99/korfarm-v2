import { useCallback, useEffect, useState } from "react";
import { apiGetCamel, apiPost, apiDelete } from "../../../utils/adminApi";

/**
 * 학생-학부모 매칭 카드 (2026-05-18). HQ + ORG 공용.
 * - 현재 연결된 학부모 리스트
 * - "학부모 연결" 버튼 → 학부모 검색 모달 → 연결
 * - 각 연결 해제
 * 백엔드:
 *   GET    /v1/admin/parents/links?studentUserId=...
 *   POST   /v1/admin/parents/links { studentLoginId, parentLoginId }
 *   DELETE /v1/admin/parents/links/{linkId}
 */
function StudentParentLinkSection({ studentUserId, studentLoginId, studentName }) {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGetCamel(`/v1/admin/parents/links?studentUserId=${encodeURIComponent(studentUserId)}`);
      setLinks(Array.isArray(data) ? data : []);
    } catch {
      setLinks([]);
    } finally {
      setLoading(false);
    }
  }, [studentUserId]);

  useEffect(() => { reload(); }, [reload]);

  const handleUnlink = async (linkId) => {
    if (!window.confirm("이 학부모 연결을 해제할까요?")) return;
    try {
      await apiDelete(`/v1/admin/parents/links/${linkId}`);
      await reload();
    } catch (e) {
      alert(e?.message || "해제에 실패했습니다.");
    }
  };

  return (
    <>
      <div className="admin-detail-card">
        <h2>학부모 연결</h2>
        <p className="admin-detail-note">
          이름·휴대폰이 일치하면 가입 시 자동 매칭됩니다. 누락된 경우 수동 연결하세요.
        </p>
        {loading ? (
          <p className="admin-detail-note">불러오는 중…</p>
        ) : links.length === 0 ? (
          <p className="admin-detail-note">연결된 학부모가 없습니다.</p>
        ) : (
          <table className="admin-detail-table" style={{ maxWidth: 600 }}>
            <thead>
              <tr><th>학부모</th><th>아이디</th><th>연락처</th><th>상태</th><th></th></tr>
            </thead>
            <tbody>
              {links.map((l) => (
                <tr key={l.linkId}>
                  <td>{l.parentName || "-"}</td>
                  <td style={{ fontSize: 12 }}>{l.parentLoginId || "-"}</td>
                  <td style={{ fontSize: 12 }}>{l.parentPhone || "-"}</td>
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
        <div className="admin-modal-actions" style={{ marginTop: 12 }}>
          <button
            type="button"
            className="admin-detail-btn secondary"
            onClick={() => setShowSearch(true)}
          >
            + 학부모 연결
          </button>
        </div>
      </div>

      {showSearch ? (
        <ParentSearchModal
          studentLoginId={studentLoginId}
          studentName={studentName}
          onClose={() => setShowSearch(false)}
          onLinked={async () => { setShowSearch(false); await reload(); }}
        />
      ) : null}
    </>
  );
}

function ParentSearchModal({ studentLoginId, studentName, onClose, onLinked }) {
  const [q, setQ] = useState("");
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const search = useCallback(async () => {
    setLoading(true); setMessage(null);
    try {
      // 회원 관리 API 의 PARENT 필터 사용
      const data = await apiGetCamel(`/v1/admin/members?role=PARENT&q=${encodeURIComponent(q)}`);
      setParents(Array.isArray(data) ? data.slice(0, 30) : []);
    } catch (e) {
      setMessage({ ok: false, text: e?.message || "검색 실패" });
    } finally {
      setLoading(false);
    }
  }, [q]);

  const link = async (parent) => {
    try {
      await apiPost("/v1/admin/parents/links", {
        studentLoginId: studentLoginId,
        parentLoginId: parent.loginId || parent.email,
      });
      onLinked();
    } catch (e) {
      setMessage({ ok: false, text: e?.message || "연결 실패" });
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal admin-modal-xl" onClick={(e) => e.stopPropagation()}>
        <h2>학부모 검색</h2>
        <p className="admin-detail-note">학생: <strong>{studentName}</strong> ({studentLoginId})</p>

        <div className="admin-modal-field">
          <label>이름·아이디·전화 검색</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") search(); }}
              placeholder="학부모 이름·아이디·전화"
            />
            <button type="button" className="admin-detail-btn" onClick={search} disabled={loading}>
              {loading ? "검색 중…" : "검색"}
            </button>
          </div>
        </div>

        {message ? (
          <p className={`admin-detail-note ${message.ok ? "" : "error"}`}>{message.text}</p>
        ) : null}

        {parents.length > 0 ? (
          <table className="admin-detail-table">
            <thead><tr><th>이름</th><th>아이디</th><th>연락처</th><th></th></tr></thead>
            <tbody>
              {parents.map((p) => (
                <tr key={p.userId || p.loginId}>
                  <td>{p.name || "-"}</td>
                  <td style={{ fontSize: 12 }}>{p.loginId || p.email || "-"}</td>
                  <td style={{ fontSize: 12 }}>{p.phone || "-"}</td>
                  <td>
                    <button
                      type="button"
                      className="admin-detail-btn secondary"
                      onClick={() => link(p)}
                    >
                      연결
                    </button>
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

export default StudentParentLinkSection;
