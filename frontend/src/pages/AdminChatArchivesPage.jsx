import { useEffect, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { apiGet } from "../utils/adminApi";
import { camelize, API_BASE, TOKEN_KEY } from "../utils/api";
import "../styles/admin-detail.css";

const ROOM_ID = "community";

function AdminChatArchivesPage() {
  const [archives, setArchives] = useState([]);
  const [mutes, setMutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [arcRaw, muteRaw] = await Promise.all([
        apiGet(`/v1/admin/chat/rooms/${ROOM_ID}/archives`),
        apiGet(`/v1/admin/chat/rooms/${ROOM_ID}/mutes`),
      ]);
      setArchives(camelize(arcRaw || []));
      setMutes(camelize(muteRaw || []));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleDownload = async (archive) => {
    try {
      const token = sessionStorage.getItem(TOKEN_KEY);
      const r = await fetch(
        `${API_BASE}/v1/admin/chat/archives/${archive.archiveId}/download`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!r.ok) throw new Error(`다운로드 실패 (${r.status})`);
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chat-${archive.roomId}-${archive.periodStart}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(e.message);
    }
  };

  const handleUnmute = async (userId) => {
    if (!window.confirm(`사용자 ${userId} 차단을 해제하시겠습니까?`)) return;
    try {
      const token = sessionStorage.getItem(TOKEN_KEY);
      const r = await fetch(
        `${API_BASE}/v1/admin/chat/rooms/${ROOM_ID}/mutes/${userId}`,
        { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }
      );
      if (!r.ok) throw new Error(`해제 실패 (${r.status})`);
      await load();
    } catch (e) {
      alert(e.message);
    }
  };

  const formatBytes = (n) => {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <AdminLayout>
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>커뮤니티 채팅 — 첨부 보관함 / 사용자 관리</h1>
        </div>

        <div className="admin-card" style={{ padding: 16, marginBottom: 20 }}>
          <p style={{ fontSize: 13, color: "#5a4030", margin: 0 }}>
            ⓘ 채팅방의 첨부 파일은 업로드 7일 후 주차별 ZIP으로 자동 보관됩니다.
            보관 후 한 달(30일)이 지나면 ZIP은 자동 삭제됩니다.
          </p>
        </div>

        {error && (
          <div className="admin-error" style={{ color: "#a00", marginBottom: 16 }}>
            {error}
          </div>
        )}

        <h2 style={{ marginTop: 24 }}>첨부 ZIP 보관함</h2>
        {loading ? (
          <p>불러오는 중...</p>
        ) : archives.length === 0 ? (
          <p style={{ color: "#888" }}>보관된 첨부 파일이 없습니다.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>주차</th>
                <th>파일 수</th>
                <th>크기</th>
                <th>생성일</th>
                <th>만료일</th>
                <th>상태</th>
                <th>다운로드</th>
              </tr>
            </thead>
            <tbody>
              {archives.map((a) => (
                <tr key={a.archiveId}>
                  <td>
                    {a.periodStart} ~ {a.periodEnd}
                  </td>
                  <td>{a.fileCount}</td>
                  <td>{formatBytes(a.zipSize)}</td>
                  <td>{a.createdAt?.slice(0, 10)}</td>
                  <td>{a.expiresAt?.slice(0, 10)}</td>
                  <td>{a.status === "available" ? "다운로드 가능" : "만료됨"}</td>
                  <td>
                    {a.status === "available" ? (
                      <button
                        type="button"
                        className="ldb-btn ldb-btn-primary"
                        onClick={() => handleDownload(a)}
                      >
                        ZIP 다운로드
                      </button>
                    ) : (
                      <span style={{ color: "#888" }}>—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h2 style={{ marginTop: 32 }}>차단/뮤트된 사용자</h2>
        {loading ? (
          <p>불러오는 중...</p>
        ) : mutes.length === 0 ? (
          <p style={{ color: "#888" }}>차단된 사용자가 없습니다.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>사용자 ID</th>
                <th>해제 시각</th>
                <th>사유</th>
                <th>처리 관리자</th>
                <th>차단일</th>
                <th>관리</th>
              </tr>
            </thead>
            <tbody>
              {mutes.map((m) => (
                <tr key={m.userId}>
                  <td>{m.userId}</td>
                  <td>{m.mutedUntil ? m.mutedUntil.slice(0, 16).replace("T", " ") : "영구"}</td>
                  <td>{m.reason || "-"}</td>
                  <td>{m.mutedBy}</td>
                  <td>{m.createdAt?.slice(0, 10)}</td>
                  <td>
                    <button
                      type="button"
                      className="ldb-btn ldb-btn-ghost"
                      onClick={() => handleUnmute(m.userId)}
                    >
                      차단 해제
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

export default AdminChatArchivesPage;
