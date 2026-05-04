import { useEffect, useMemo, useRef, useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { useRequireRole } from "../hooks/useRequireRole";
import Pagination from "../components/Pagination";
import usePagination from "../hooks/usePagination";
import { apiGet, apiPost, apiPatch } from "../utils/adminApi";
import { camelize, API_BASE, TOKEN_KEY } from "../utils/api";
import EmoticonImage from "../components/chat/EmoticonImage";
import { invalidateEmoticonCache } from "../hooks/useEmoticons";
import "../styles/admin-detail.css";

const ROOM_ID = "community";

const TABS = [
  { id: "archives", label: "첨부 ZIP 보관함", icon: "archive" },
  { id: "mutes", label: "차단 사용자", icon: "block" },
  { id: "emoticons", label: "이모티콘 시리즈", icon: "mood" },
];

function AdminChatArchivesPage() {
  useRequireRole("HQ_ADMIN");
  const [activeTab, setActiveTab] = useState("archives");
  const [archives, setArchives] = useState([]);
  const [mutes, setMutes] = useState([]);
  const [emoticons, setEmoticons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 이모티콘 업로드 폼
  const [seriesInput, setSeriesInput] = useState("");
  const [filesQueue, setFilesQueue] = useState([]); // [{file, name}]
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const filesRef = useRef(null);

  // 시리즈 필터
  const [seriesFilter, setSeriesFilter] = useState("__ALL__");

  /* === 페이지네이션 (archives/mutes 각각 독립) === */
  const {
    page: archivePage,
    setPage: setArchivePage,
    totalPages: archiveTotalPages,
    paged: pagedArchives,
  } = usePagination(archives, 15);
  const {
    page: mutePage,
    setPage: setMutePage,
    totalPages: muteTotalPages,
    paged: pagedMutes,
  } = usePagination(mutes, 15);

  /* 탭 변경 시 1페이지로 리셋 */
  useEffect(() => { setArchivePage(1); setMutePage(1); }, [activeTab, setArchivePage, setMutePage]);

  const load = async () => {
    setLoading(true); setError("");
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
  useEffect(() => { load(); }, []);

  // 이모티콘을 시리즈별로 그룹화
  const grouped = useMemo(() => {
    const map = new Map();
    for (const e of emoticons) {
      const k = (e.series || "(미분류)");
      if (!map.has(k)) map.set(k, []);
      map.get(k).push(e);
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [emoticons]);

  const seriesOptions = useMemo(() => {
    const set = new Set(emoticons.map(e => e.series).filter(Boolean));
    return ["__ALL__", ...Array.from(set).sort(), "(미분류)"];
  }, [emoticons]);

  const visibleGroups = grouped.filter(([k]) =>
    seriesFilter === "__ALL__" || k === seriesFilter
  );

  // ─── 첨부 ZIP ───
  const handleDownload = async (archive) => {
    try {
      const token = sessionStorage.getItem(TOKEN_KEY);
      const r = await fetch(`${API_BASE}/v1/admin/chat/archives/${archive.archiveId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error(`다운로드 실패 (${r.status})`);
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `chat-${archive.roomId}-${archive.periodStart}.zip`;
      a.click(); URL.revokeObjectURL(url);
    } catch (e) { alert(e.message); }
  };

  const handleUnmute = async (userId) => {
    if (!window.confirm(`사용자 ${userId} 차단을 해제하시겠습니까?`)) return;
    try {
      const token = sessionStorage.getItem(TOKEN_KEY);
      const r = await fetch(`${API_BASE}/v1/admin/chat/rooms/${ROOM_ID}/mutes/${userId}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error(`해제 실패 (${r.status})`);
      await load();
    } catch (e) { alert(e.message); }
  };

  const formatBytes = (n) => {
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(1)} MB`;
  };

  // ─── 이모티콘 업로드 (다중) ───
  const onFilesSelected = (e) => {
    const files = Array.from(e.target.files || []);
    if (filesRef.current) filesRef.current.value = "";
    if (files.length === 0) return;
    // 파일명을 기본 이름으로 (확장자 제거)
    setFilesQueue([
      ...filesQueue,
      ...files.map(f => ({ file: f, name: f.name.replace(/\.[^.]+$/, "") })),
    ]);
  };

  const updateQueueName = (idx, value) => {
    const next = [...filesQueue];
    next[idx] = { ...next[idx], name: value };
    setFilesQueue(next);
  };

  const removeFromQueue = (idx) => {
    const next = [...filesQueue];
    next.splice(idx, 1);
    setFilesQueue(next);
  };

  const submitUploads = async () => {
    if (filesQueue.length === 0) {
      alert("업로드할 파일을 선택하세요");
      return;
    }
    if (!seriesInput.trim()) {
      if (!window.confirm("시리즈명이 비어있습니다. (미분류)로 등록할까요?")) return;
    }
    setUploading(true);
    setUploadProgress("");
    let success = 0, failed = 0;
    for (let i = 0; i < filesQueue.length; i++) {
      const item = filesQueue[i];
      setUploadProgress(`${i + 1}/${filesQueue.length} — ${item.file.name}`);
      try {
        const presignRaw = await apiPost("/v1/files/presign", {
          purpose: "chat-emoticon",
          mime: item.file.type || "image/png",
          size: item.file.size,
          filename: item.file.name,
        });
        const presign = camelize(presignRaw);
        const fd = new FormData();
        fd.append("file", item.file);
        const token = sessionStorage.getItem(TOKEN_KEY);
        const upRes = await fetch(`${API_BASE}/v1/files/${presign.fileId}/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: fd,
        });
        if (!upRes.ok) throw new Error(`업로드 실패 (${upRes.status})`);
        await apiPost("/v1/admin/chat/emoticons", {
          name: item.name.trim() || `이모티콘${i + 1}`,
          series: seriesInput.trim() || null,
          fileId: presign.fileId,
        });
        success++;
      } catch (err) {
        failed++;
        console.error(`업로드 실패 (${item.file.name}):`, err);
      }
    }
    setUploadProgress("");
    setUploading(false);
    setFilesQueue([]);
    invalidateEmoticonCache();
    await load();
    alert(`완료 — 성공: ${success}, 실패: ${failed}`);
  };

  const handleEmoticonDelete = async (emo) => {
    if (!window.confirm(`"${emo.name}" 이모티콘을 삭제하시겠습니까?`)) return;
    try {
      const token = sessionStorage.getItem(TOKEN_KEY);
      const r = await fetch(`${API_BASE}/v1/admin/chat/emoticons/${emo.id}`, {
        method: "DELETE", headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error(`삭제 실패 (${r.status})`);
      invalidateEmoticonCache();
      await load();
    } catch (err) { alert(err.message); }
  };

  // 인라인 시리즈/이름 편집
  const updateEmoticon = async (emo, patch) => {
    try {
      await apiPatch(`/v1/admin/chat/emoticons/${emo.id}`, patch);
      invalidateEmoticonCache();
      await load();
    } catch (err) {
      alert("수정 실패: " + err.message);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-detail-wrap">
        <div className="admin-detail-header">
          <h1>채팅 관리</h1>
          <p className="admin-detail-subtitle">
            첨부 보관함 · 차단 사용자 · 이모티콘 시리즈
          </p>
        </div>

        {/* 탭 */}
        <div className="admin-detail-tabs">
          {TABS.map(t => (
            <button
              key={t.id}
              className={`admin-detail-tab ${activeTab === t.id ? "active" : ""}`}
              onClick={() => setActiveTab(t.id)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16, verticalAlign: "middle", marginRight: 4 }}>
                {t.icon}
              </span>
              {t.label}
            </button>
          ))}
        </div>

        {error && <div className="admin-error">{error}</div>}

        {/* 탭 1: 첨부 ZIP */}
        {activeTab === "archives" && (
          <div className="admin-detail-card">
            <div style={{
              background: "var(--admin-panel-light, #f5f9f3)",
              borderLeft: "4px solid var(--admin-accent)",
              padding: 12, borderRadius: 6, marginBottom: 14,
              fontSize: 13, color: "var(--admin-ink)",
            }}>
              ⓘ 채팅방의 첨부 파일은 업로드 7일 후 주차별 ZIP으로 자동 보관됩니다.
              보관 후 한 달(30일)이 지나면 ZIP은 자동 삭제됩니다.
            </div>
            {loading ? <p>불러오는 중...</p> : archives.length === 0 ? (
              <p style={{ color: "var(--admin-muted)" }}>보관된 첨부 파일이 없습니다.</p>
            ) : (
              <table className="admin-detail-table">
                <thead>
                  <tr>
                    <th>주차</th><th>파일 수</th><th>크기</th>
                    <th>생성일</th><th>만료일</th><th>상태</th><th>다운로드</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedArchives.map((a) => (
                    <tr key={a.archiveId}>
                      <td>{a.periodStart} ~ {a.periodEnd}</td>
                      <td>{a.fileCount}</td>
                      <td>{formatBytes(a.zipSize)}</td>
                      <td>{a.createdAt?.slice(0, 10)}</td>
                      <td>{a.expiresAt?.slice(0, 10)}</td>
                      <td>{a.status === "available" ? "다운로드 가능" : "만료됨"}</td>
                      <td>
                        {a.status === "available" ? (
                          <button className="admin-detail-btn xs" onClick={() => handleDownload(a)}>
                            ZIP 다운로드
                          </button>
                        ) : <span style={{ color: "var(--admin-muted)" }}>—</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <Pagination
              page={archivePage}
              totalPages={archiveTotalPages}
              onChange={setArchivePage}
            />
          </div>
        )}

        {/* 탭 2: 차단 사용자 */}
        {activeTab === "mutes" && (
          <div className="admin-detail-card">
            {loading ? <p>불러오는 중...</p> : mutes.length === 0 ? (
              <p style={{ color: "var(--admin-muted)" }}>차단된 사용자가 없습니다.</p>
            ) : (
              <table className="admin-detail-table">
                <thead>
                  <tr>
                    <th>사용자 ID</th><th>해제 시각</th><th>사유</th>
                    <th>처리 관리자</th><th>차단일</th><th>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedMutes.map((m) => (
                    <tr key={m.userId}>
                      <td>{m.userId}</td>
                      <td>{m.mutedUntil ? m.mutedUntil.slice(0, 16).replace("T", " ") : "영구"}</td>
                      <td>{m.reason || "-"}</td>
                      <td>{m.mutedBy}</td>
                      <td>{m.createdAt?.slice(0, 10)}</td>
                      <td>
                        <button
                          className="admin-detail-btn secondary xs"
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
            <Pagination
              page={mutePage}
              totalPages={muteTotalPages}
              onChange={setMutePage}
            />
          </div>
        )}

        {/* 탭 3: 이모티콘 시리즈 */}
        {activeTab === "emoticons" && (
          <>
            {/* 업로드 카드 */}
            <div className="admin-detail-card">
              <h3>이모티콘 일괄 업로드</h3>
              <p style={{ fontSize: 12, color: "var(--admin-muted)", margin: "0 0 10px" }}>
                같은 시리즈의 이미지들을 한 번에 선택해서 업로드. 파일별 이름은 자동으로 파일명에서 가져옴 (편집 가능).
              </p>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
                <input
                  type="text"
                  value={seriesInput}
                  onChange={(e) => setSeriesInput(e.target.value)}
                  placeholder="시리즈명 (예: 중, 고양이 포도, 닥터 뵹)"
                  className="ssm-input-like"
                  style={{
                    padding: "8px 12px", border: "1px solid var(--admin-stroke)", borderRadius: 8,
                    background: "var(--admin-panel)", color: "var(--admin-ink)", fontSize: 13,
                    fontFamily: "inherit", minWidth: 240,
                  }}
                  disabled={uploading}
                />
                <input
                  ref={filesRef} type="file" multiple accept="image/*"
                  style={{ display: "none" }}
                  onChange={onFilesSelected}
                />
                <button
                  className="admin-detail-btn secondary"
                  onClick={() => filesRef.current?.click()}
                  disabled={uploading}
                >
                  📁 파일 선택 (다중)
                </button>
                <button
                  className="admin-detail-btn"
                  onClick={submitUploads}
                  disabled={uploading || filesQueue.length === 0}
                >
                  {uploading ? "업로드 중..." : `${filesQueue.length}개 등록`}
                </button>
              </div>

              {filesQueue.length > 0 && (
                <div style={{
                  background: "var(--admin-panel-light, #f5f9f3)",
                  border: "1px solid var(--admin-stroke)",
                  borderRadius: 8, padding: 10, marginBottom: 10,
                }}>
                  <strong style={{ fontSize: 12, color: "var(--admin-accent-strong)" }}>
                    업로드 대기 ({filesQueue.length})
                  </strong>
                  <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 4 }}>
                    {filesQueue.map((f, i) => (
                      <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "var(--admin-muted)", minWidth: 28 }}>{i + 1}.</span>
                        <input
                          value={f.name}
                          onChange={(e) => updateQueueName(i, e.target.value)}
                          placeholder="이름"
                          style={{
                            flex: 1, padding: "5px 8px",
                            border: "1px solid var(--admin-stroke)", borderRadius: 4,
                            fontSize: 12, fontFamily: "inherit",
                          }}
                          disabled={uploading}
                        />
                        <span style={{ fontSize: 11, color: "var(--admin-muted)", minWidth: 60 }}>
                          {(f.file.size / 1024).toFixed(0)} KB
                        </span>
                        <button
                          className="admin-detail-btn ghost xs"
                          onClick={() => removeFromQueue(i)}
                          disabled={uploading}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {uploadProgress && (
                <p style={{ fontSize: 12, color: "var(--admin-accent-strong)", margin: 0 }}>
                  {uploadProgress}
                </p>
              )}
            </div>

            {/* 시리즈 필터 */}
            <div className="admin-detail-card">
              <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap", marginBottom: 14 }}>
                <strong style={{ fontSize: 13, color: "var(--admin-accent-strong)" }}>시리즈 필터:</strong>
                {seriesOptions.map(s => (
                  <button
                    key={s}
                    className={`admin-filter ${seriesFilter === s ? "active" : ""}`}
                    onClick={() => setSeriesFilter(s)}
                  >
                    {s === "__ALL__" ? `전체 (${emoticons.length})`
                      : `${s} (${emoticons.filter(e => (e.series || "(미분류)") === s).length})`}
                  </button>
                ))}
              </div>

              {/* 시리즈별 그룹 */}
              {loading ? <p>불러오는 중...</p> :
                visibleGroups.length === 0 ? (
                  <p style={{ color: "var(--admin-muted)" }}>표시할 이모티콘이 없습니다.</p>
                ) : visibleGroups.map(([series, emos]) => (
                  <SeriesSection
                    key={series}
                    series={series}
                    emoticons={emos}
                    onDelete={handleEmoticonDelete}
                    onUpdate={updateEmoticon}
                  />
                ))
              }
            </div>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function SeriesSection({ series, emoticons, onDelete, onUpdate }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div style={{
      marginBottom: 18,
      border: "1px solid var(--admin-stroke)",
      borderRadius: 10,
      overflow: "hidden",
    }}>
      <div
        onClick={() => setCollapsed(!collapsed)}
        style={{
          background: "var(--admin-panel-light, #f5f9f3)",
          padding: "10px 14px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 10,
          borderBottom: collapsed ? "none" : "1px solid var(--admin-stroke)",
        }}
      >
        <span className="material-symbols-outlined" style={{
          fontSize: 18, color: "var(--admin-accent)",
          transform: collapsed ? "rotate(-90deg)" : "rotate(0)",
          transition: "transform 0.15s",
        }}>
          expand_more
        </span>
        <strong style={{ fontSize: 14, color: "var(--admin-accent-strong)" }}>
          {series} 시리즈
        </strong>
        <span style={{ fontSize: 12, color: "var(--admin-muted)" }}>
          {emoticons.length}개
        </span>
      </div>
      {!collapsed && (
        <div style={{
          padding: 14,
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 12,
          background: "var(--admin-panel)",
        }}>
          {emoticons.map(emo => (
            <EmoticonCard key={emo.id} emoticon={emo} onDelete={onDelete} onUpdate={onUpdate} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmoticonCard({ emoticon, onDelete, onUpdate }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(emoticon.name);
  const [series, setSeries] = useState(emoticon.series || "");

  const save = async () => {
    if (name.trim() === emoticon.name && (series.trim() || null) === (emoticon.series || null)) {
      setEditing(false);
      return;
    }
    await onUpdate(emoticon, { name: name.trim(), series: series.trim() || null });
    setEditing(false);
  };

  return (
    <div style={{
      border: "1px solid var(--admin-stroke)",
      borderRadius: 8,
      padding: 8,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 6,
      background: "var(--admin-panel)",
    }}>
      <div style={{
        width: 96, height: 96,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "#f5f9f3",
        border: "1px solid var(--admin-stroke)",
        borderRadius: 6,
        overflow: "hidden",
        flexShrink: 0,
      }}>
        <EmoticonImage fileId={emoticon.fileId} alt={emoticon.name} className="admin-emo-thumb" />
      </div>
      {editing ? (
        <>
          <input
            value={name} onChange={(e) => setName(e.target.value)}
            placeholder="이름" style={miniInputStyle}
          />
          <input
            value={series} onChange={(e) => setSeries(e.target.value)}
            placeholder="시리즈" style={miniInputStyle}
          />
          <div style={{ display: "flex", gap: 4 }}>
            <button className="admin-detail-btn xs" onClick={save}>저장</button>
            <button className="admin-detail-btn ghost xs" onClick={() => setEditing(false)}>취소</button>
          </div>
        </>
      ) : (
        <>
          <div style={{
            fontSize: 12, fontWeight: 700, color: "var(--admin-ink)",
            textAlign: "center", wordBreak: "break-all",
          }}>
            {emoticon.name}
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <button className="admin-detail-btn ghost xs" onClick={() => setEditing(true)}>편집</button>
            <button className="admin-detail-btn danger xs" onClick={() => onDelete(emoticon)}>삭제</button>
          </div>
        </>
      )}
    </div>
  );
}

const miniInputStyle = {
  width: "100%",
  padding: "4px 6px",
  border: "1px solid var(--admin-stroke)",
  borderRadius: 4,
  fontSize: 11,
  fontFamily: "inherit",
};

export default AdminChatArchivesPage;
