import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { apiGet } from "../utils/adminApi";

const ACTION_LABELS = {
  CREATE: "생성",
  UPDATE: "수정",
  BATCH_CREATE: "배치 생성",
};

function formatDate(dt) {
  if (!dt) return "-";
  const d = new Date(dt);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminEditHistoryPage() {
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState(params.get("tab") || "editors");
  const [editors, setEditors] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedEditor, setSelectedEditor] = useState(params.get("editorId") || null);
  const [contentIdInput, setContentIdInput] = useState(params.get("contentId") || "");

  useEffect(() => {
    if (tab === "editors") {
      setLoading(true);
      apiGet("/v1/admin/editors")
        .then(setEditors)
        .catch(() => setEditors([]))
        .finally(() => setLoading(false));
    }
  }, [tab]);

  useEffect(() => {
    if (tab === "by-editor" && selectedEditor) {
      setLoading(true);
      apiGet(`/v1/admin/edit-history/by-editor?editorId=${encodeURIComponent(selectedEditor)}`)
        .then(setLogs)
        .catch(() => setLogs([]))
        .finally(() => setLoading(false));
    }
  }, [tab, selectedEditor]);

  const handleSearchByContent = () => {
    if (!contentIdInput.trim()) return;
    setTab("by-content");
    setLoading(true);
    apiGet(`/v1/admin/content/${encodeURIComponent(contentIdInput.trim())}/edit-history`)
      .then(setLogs)
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  };

  const handleClickEditor = (editorId) => {
    setSelectedEditor(editorId);
    setTab("by-editor");
    setParams({ tab: "by-editor", editorId });
  };

  return (
    <AdminLayout>
      <h2 style={{ marginBottom: 16 }}>수정 이력</h2>

      {/* 탭 */}
      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          className={`admin-tab-btn ${tab === "editors" ? "active" : ""}`}
          onClick={() => { setTab("editors"); setParams({ tab: "editors" }); }}
        >
          관리자별
        </button>
        <button
          className={`admin-tab-btn ${tab === "by-content" ? "active" : ""}`}
          onClick={() => setTab("by-content")}
        >
          학습별
        </button>
      </div>

      {/* 관리자 목록 */}
      {tab === "editors" && (
        <div>
          {loading ? (
            <p style={{ color: "#8a9a8e" }}>불러오는 중...</p>
          ) : editors.length === 0 ? (
            <p style={{ color: "#8a9a8e" }}>수정 이력이 있는 관리자가 없습니다.</p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>관리자</th>
                  <th>아이디</th>
                  <th>수정 횟수</th>
                  <th>최근 수정</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {editors.map((e) => (
                  <tr key={e.user_id || e.userId}>
                    <td>{e.name || "-"}</td>
                    <td style={{ fontSize: 12, color: "#8a9a8e" }}>{e.email}</td>
                    <td>{e.edit_count ?? e.editCount}</td>
                    <td style={{ fontSize: 12 }}>{formatDate(e.last_edit_at || e.lastEditAt)}</td>
                    <td>
                      <button
                        className="admin-btn-sm"
                        onClick={() => handleClickEditor(e.user_id || e.userId)}
                      >
                        이력 보기
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* 관리자별 이력 */}
      {tab === "by-editor" && (
        <div>
          <div style={{ marginBottom: 12 }}>
            <button className="admin-btn-sm" onClick={() => { setTab("editors"); setParams({ tab: "editors" }); }}>
              &larr; 관리자 목록
            </button>
            <span style={{ marginLeft: 12, color: "#a6b6a9" }}>
              관리자: {selectedEditor}
            </span>
          </div>
          {renderLogTable(logs, loading)}
        </div>
      )}

      {/* 학습별 이력 */}
      {tab === "by-content" && (
        <div>
          <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
            <input
              className="admin-input"
              placeholder="콘텐츠 ID 입력"
              value={contentIdInput}
              onChange={(e) => setContentIdInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchByContent()}
              style={{ width: 300 }}
            />
            <button className="admin-btn-sm" onClick={handleSearchByContent}>
              검색
            </button>
          </div>
          {renderLogTable(logs, loading)}
        </div>
      )}
    </AdminLayout>
  );
}

function renderLogTable(logs, loading) {
  if (loading) return <p style={{ color: "#8a9a8e" }}>불러오는 중...</p>;
  if (logs.length === 0) return <p style={{ color: "#8a9a8e" }}>이력이 없습니다.</p>;

  return (
    <table className="admin-table">
      <thead>
        <tr>
          <th>일시</th>
          <th>작업</th>
          <th>콘텐츠</th>
          <th>관리자</th>
          <th>요약</th>
        </tr>
      </thead>
      <tbody>
        {logs.map((log) => (
          <tr key={log.id}>
            <td style={{ fontSize: 12, whiteSpace: "nowrap" }}>
              {formatDate(log.created_at || log.createdAt)}
            </td>
            <td>
              <span className={`admin-badge admin-badge-${(log.action || "").toLowerCase()}`}>
                {ACTION_LABELS[log.action] || log.action}
              </span>
            </td>
            <td style={{ fontSize: 12 }}>
              <div>{log.content_title || log.contentTitle || "-"}</div>
              <div style={{ color: "#6a7a6e", fontSize: 11 }}>{log.content_id || log.contentId}</div>
            </td>
            <td style={{ fontSize: 12 }}>{log.editor_name || log.editorName || log.editor_id || log.editorId}</td>
            <td style={{ fontSize: 12, color: "#a6b6a9" }}>{log.summary || "-"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
