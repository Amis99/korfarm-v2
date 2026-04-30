import { useState, useEffect } from "react";
import { apiGet } from "../../utils/adminApi";

function EditHistoryModal({ contentId, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contentId) return;
    setLoading(true);
    apiGet(`/v1/admin/content/${contentId}/edit-history`)
      .then(data => setLogs(data || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  }, [contentId]);

  const fmtDate = (d) => {
    if (!d) return "-";
    const dt = new Date(d);
    if (isNaN(dt)) return d;
    return dt.toLocaleString("ko-KR", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="ldb-modal-backdrop" onClick={onClose}>
      <div className="ldb-modal" onClick={e => e.stopPropagation()}>
        <div className="ldb-modal-header">
          <span className="ldb-modal-title">수정 이력</span>
          <button className="ldb-field-remove" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="ldb-modal-body">
          {loading ? (
            <div className="ldb-loading">불러오는 중...</div>
          ) : logs.length === 0 ? (
            <div style={{ color: "var(--muted)", textAlign: "center", padding: 20 }}>이력이 없습니다</div>
          ) : (
            <table className="ldb-log-table">
              <thead>
                <tr><th>일시</th><th>작업</th><th>작업자</th><th>요약</th></tr>
              </thead>
              <tbody>
                {logs.map((log, i) => (
                  <tr key={log.id || i}>
                    <td>{fmtDate(log.created_at ?? log.createdAt)}</td>
                    <td><span className={`ldb-log-action ${(log.action || "").toLowerCase()}`}>{log.action}</span></td>
                    <td>{log.editor_name ?? log.editorName ?? log.editor_id ?? log.editorId ?? "-"}</td>
                    <td>{log.summary || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default EditHistoryModal;
