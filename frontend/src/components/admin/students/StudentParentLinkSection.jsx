import { useCallback, useEffect, useState } from "react";
import { apiGetCamel, apiPost, apiDelete } from "../../../utils/adminApi";

/**
 * 학생-학부모 매칭 카드 (2026-05-18).
 *
 * - 연결된 학부모만 노출 (이 학생의 학부모 row 만). 다른 학부모 검색 X.
 * - 연결되지 않았으면 "학부모 연결" 버튼 1개. 누르면 loginId 입력 모달 → 직접 연결.
 *
 * 백엔드:
 *   GET    /v1/admin/parents/links?studentUserId=...  (이 학생 row 만)
 *   POST   /v1/admin/parents/links { studentLoginId, parentLoginId }
 *   DELETE /v1/admin/parents/links/{linkId}
 */
function StudentParentLinkSection({ studentUserId, studentLoginId, studentName }) {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiGetCamel(`/v1/admin/parents/links?studentUserId=${encodeURIComponent(studentUserId)}`);
      // 클라이언트 안전 필터 — 백엔드가 옛 버전이라 모두 반환해도 이 학생 것만 표시
      const filtered = (Array.isArray(data) ? data : []).filter((l) => l.studentUserId === studentUserId);
      // 중복 link 제거 (같은 학부모-학생 페어가 여러 row 일 때)
      const seen = new Set();
      const dedup = [];
      for (const l of filtered) {
        const k = `${l.parentUserId}__${l.status}`;
        if (seen.has(k)) continue;
        seen.add(k); dedup.push(l);
      }
      setLinks(dedup);
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

  const activeLinks = links.filter((l) => l.status === "active");

  return (
    <>
      <div className="admin-detail-card">
        <h2>학부모 연결</h2>
        <p className="admin-detail-note">
          이름·휴대폰이 일치하면 가입 시 자동 매칭됩니다. 누락된 경우 학부모 아이디로 직접 연결하세요.
        </p>
        {loading ? (
          <p className="admin-detail-note">불러오는 중…</p>
        ) : activeLinks.length === 0 ? (
          <p className="admin-detail-note">연결된 학부모가 없습니다.</p>
        ) : (
          <table className="admin-detail-table" style={{ maxWidth: 600 }}>
            <thead>
              <tr><th>학부모</th><th>아이디</th><th>연락처</th><th></th></tr>
            </thead>
            <tbody>
              {activeLinks.map((l) => (
                <tr key={l.linkId}>
                  <td><strong>{l.parentName || "-"}</strong></td>
                  <td style={{ fontSize: 12 }}>{l.parentLoginId || "-"}</td>
                  <td style={{ fontSize: 12 }}>{l.parentPhone || "-"}</td>
                  <td>
                    <button
                      type="button"
                      className="admin-detail-btn ghost"
                      onClick={() => handleUnlink(l.linkId)}
                    >
                      해제
                    </button>
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
            onClick={() => setShowAdd(true)}
          >
            + 학부모 연결
          </button>
        </div>
      </div>

      {showAdd ? (
        <ParentLinkAddModal
          studentLoginId={studentLoginId}
          studentName={studentName}
          onClose={() => setShowAdd(false)}
          onLinked={async () => { setShowAdd(false); await reload(); }}
        />
      ) : null}
    </>
  );
}

function ParentLinkAddModal({ studentLoginId, studentName, onClose, onLinked }) {
  const [loginId, setLoginId] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const link = async () => {
    if (!loginId.trim()) {
      setMessage({ ok: false, text: "학부모 아이디를 입력해 주세요." });
      return;
    }
    setBusy(true); setMessage(null);
    try {
      await apiPost("/v1/admin/parents/links", {
        studentLoginId: studentLoginId,
        parentLoginId: loginId.trim(),
      });
      onLinked();
    } catch (e) {
      setMessage({ ok: false, text: e?.message || "연결 실패" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        <h2>학부모 연결</h2>
        <p className="admin-detail-note">학생: <strong>{studentName}</strong> ({studentLoginId})</p>
        <div className="admin-modal-field">
          <label>학부모 아이디</label>
          <input
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") link(); }}
            placeholder="학부모 가입 시 사용한 아이디"
          />
        </div>
        {message ? <p className={`admin-detail-note ${message.ok ? "" : "error"}`}>{message.text}</p> : null}
        <div className="admin-modal-actions">
          <button type="button" className="admin-detail-btn" onClick={link} disabled={busy}>
            {busy ? "연결 중…" : "연결"}
          </button>
          <button type="button" className="admin-detail-btn secondary" onClick={onClose}>취소</button>
        </div>
      </div>
    </div>
  );
}

export default StudentParentLinkSection;
