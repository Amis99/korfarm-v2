import { useEffect, useRef, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { apiGet, apiPost } from "../utils/adminApi";
import { camelize, API_BASE, TOKEN_KEY } from "../utils/api";
import EmoticonImage from "../components/chat/EmoticonImage";
import { invalidateEmoticonCache } from "../hooks/useEmoticons";
import "../styles/admin-detail.css";

const ROOM_ID = "community";

function AdminChatArchivesPage() {
  const [archives, setArchives] = useState([]);
  const [mutes, setMutes] = useState([]);
  const [emoticons, setEmoticons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newEmoName, setNewEmoName] = useState("");
  const [uploading, setUploading] = useState(false);
  const emoFileInputRef = useRef(null);

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [arcRaw, muteRaw, emoRaw] = await Promise.all([
        apiGet(`/v1/admin/chat/rooms/${ROOM_ID}/archives`),
        apiGet(`/v1/admin/chat/rooms/${ROOM_ID}/mutes`),
        apiGet(`/v1/admin/chat/emoticons`),
      ]);
      setArchives(camelize(arcRaw || []));
      setMutes(camelize(muteRaw || []));
      setEmoticons(camelize(emoRaw || []));
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

  const handleEmoticonUpload = async (e) => {
    const file = e.target.files?.[0];
    if (emoFileInputRef.current) emoFileInputRef.current.value = "";
    if (!file) return;
    if (!newEmoName.trim()) {
      alert("이모티콘 이름을 먼저 입력해 주세요.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      alert("이미지 파일만 업로드 가능합니다.");
      return;
    }
    setUploading(true);
    try {
      // 1) presign
      const presignRaw = await apiPost("/v1/files/presign", {
        purpose: "chat-emoticon",
        mime: file.type,
        size: file.size,
      });
      const presign = camelize(presignRaw);
      // 2) upload binary
      const fd = new FormData();
      fd.append("file", file);
      const token = sessionStorage.getItem(TOKEN_KEY);
      const uploadResp = await fetch(`${API_BASE}/v1/files/${presign.fileId}/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!uploadResp.ok) throw new Error(`업로드 실패 (${uploadResp.status})`);
      // 3) register emoticon
      await apiPost("/v1/admin/chat/emoticons", {
        name: newEmoName.trim(),
        fileId: presign.fileId,
      });
      setNewEmoName("");
      invalidateEmoticonCache();
      await load();
    } catch (err) {
      alert("이모티콘 등록 실패: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleEmoticonDelete = async (emo) => {
    if (!window.confirm(`"${emo.name}" 이모티콘을 삭제하시겠습니까?`)) return;
    try {
      const token = sessionStorage.getItem(TOKEN_KEY);
      const r = await fetch(`${API_BASE}/v1/admin/chat/emoticons/${emo.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error(`삭제 실패 (${r.status})`);
      invalidateEmoticonCache();
      await load();
    } catch (err) {
      alert(err.message);
    }
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

        <h2 style={{ marginTop: 32 }}>이모티콘 관리</h2>
        <div className="admin-card" style={{ padding: 16, marginBottom: 16 }}>
          <p style={{ fontSize: 13, color: "#5a4030", marginTop: 0 }}>
            이모티콘 이미지를 등록하면 사용자들이 채팅 입력창의 우측 원형 버튼에서 사용할 수 있습니다.
            PNG/JPG/GIF/WEBP 모두 지원합니다.
          </p>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="text"
              value={newEmoName}
              onChange={(e) => setNewEmoName(e.target.value)}
              placeholder="이모티콘 이름 (예: 웃음)"
              style={{ padding: 8, minWidth: 200 }}
              disabled={uploading}
            />
            <input
              ref={emoFileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleEmoticonUpload}
            />
            <button
              type="button"
              className="ldb-btn ldb-btn-primary"
              onClick={() => emoFileInputRef.current?.click()}
              disabled={uploading || !newEmoName.trim()}
            >
              {uploading ? "업로드 중..." : "📤 이미지 선택 + 등록"}
            </button>
          </div>
        </div>

        {loading ? (
          <p>불러오는 중...</p>
        ) : emoticons.length === 0 ? (
          <p style={{ color: "#888" }}>등록된 이모티콘이 없습니다.</p>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
              gap: 12,
            }}
          >
            {emoticons.map((emo) => (
              <div
                key={emo.id}
                className="admin-card"
                style={{
                  padding: 8,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 6,
                }}
              >
                <div
                  style={{
                    width: 80,
                    height: 80,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "#fffdf7",
                    border: "1px solid #e8d8c0",
                    borderRadius: 6,
                  }}
                >
                  <EmoticonImage fileId={emo.fileId} alt={emo.name} />
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "#5a4030",
                    textAlign: "center",
                    wordBreak: "break-all",
                  }}
                >
                  {emo.name}
                </div>
                <button
                  type="button"
                  className="ldb-btn ldb-btn-ghost"
                  style={{ fontSize: 11, padding: "4px 8px" }}
                  onClick={() => handleEmoticonDelete(emo)}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

export default AdminChatArchivesPage;
