import { useEffect, useState } from "react";
import { API_BASE, TOKEN_KEY } from "../../utils/api";

/**
 * 시험지 PDF 자동 생성 직후 미리보기 모달.
 * 백엔드가 X-Frame-Options: DENY 헤더를 보내 iframe 에 직접 src 못 박음 →
 * fetch 로 PDF 받아 blob URL 로 iframe 에 표시 (same-origin 보장).
 *
 * Props:
 *   open      열림 여부
 *   fileId    생성된 PDF 의 file_id
 *   title     시험명
 *   onClose   닫기 콜백
 */
export default function TestPdfPreviewModal({ open, fileId, title, onClose }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open || !fileId) return;
    let cancelled = false;
    let createdUrl = null;
    setLoading(true);
    setError("");
    const token = sessionStorage.getItem(TOKEN_KEY) || "";
    fetch(`${API_BASE}/v1/files/${fileId}/download`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((r) => {
        if (!r.ok) throw new Error(`다운로드 실패 (${r.status})`);
        return r.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        createdUrl = URL.createObjectURL(blob);
        setBlobUrl(createdUrl);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || "PDF 로드 실패");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
      if (createdUrl) URL.revokeObjectURL(createdUrl);
      setBlobUrl(null);
    };
  }, [open, fileId]);

  if (!open || !fileId) return null;

  const handleDownload = () => {
    if (!blobUrl) return;
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = `${title || "시험지"}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleNewTab = () => {
    if (blobUrl) window.open(blobUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(0,0,0,0.45)",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(960px, 92vw)",
          maxHeight: "92vh",
          background: "var(--admin-panel, #fff)",
          borderRadius: 10,
          boxShadow: "0 20px 60px rgba(0,0,0,0.35)",
          display: "flex", flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <div style={{
          padding: "12px 16px",
          borderBottom: "1px solid rgba(31,58,44,0.12)",
          display: "flex", alignItems: "center", gap: 12,
          background: "var(--admin-panel-light, #f5f9f3)",
        }}>
          <strong style={{ flex: 1, color: "var(--admin-ink, #1a2920)" }}>
            📄 {title || "시험지"} — PDF 미리보기
          </strong>
          <button onClick={handleNewTab} disabled={!blobUrl} style={btnStyle(false)}>새 탭</button>
          <button onClick={handleDownload} disabled={!blobUrl} style={btnStyle(true)}>다운로드</button>
          <button onClick={onClose} style={btnStyle(false)}>닫기</button>
        </div>
        {loading && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--admin-muted, #666)" }}>
            PDF 불러오는 중...
          </div>
        )}
        {error && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#c0392b", padding: 24 }}>
            {error}
          </div>
        )}
        {blobUrl && !loading && !error && (
          <iframe
            src={blobUrl}
            title="시험지 PDF 미리보기"
            style={{ flex: 1, border: "none", minHeight: 600, background: "#525659" }}
          />
        )}
      </div>
    </div>
  );
}

const btnStyle = (primary) => ({
  padding: "6px 14px",
  fontSize: 13,
  borderRadius: 6,
  border: primary ? "none" : "1px solid rgba(31,58,44,0.2)",
  background: primary ? "var(--admin-accent, #2d6a4f)" : "#fff",
  color: primary ? "#fff" : "var(--admin-ink, #1a2920)",
  cursor: "pointer",
  fontWeight: primary ? 600 : 500,
});
