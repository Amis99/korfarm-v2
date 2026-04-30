import { useRef, useState } from "react";
import { API_BASE, TOKEN_KEY } from "../../utils/api";
import { pollJob } from "../../utils/aiGenJob";

/**
 * PDF/이미지 → 마크다운 변환 모달.
 * 추가 과금 안내 + 파일 업로드 + 변환 결과를 부모로 전달.
 *
 * props:
 *  - onClose()
 *  - onConverted({markdown, sourceFileName, sourceHash, sourceSizeBytes, sourceMediaType})
 */
export default function AiPdfImageUploadModal({ onClose, onConverted }) {
  const fileRef = useRef(null);
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const onSelect = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 30 * 1024 * 1024) {
      setError("파일이 너무 큽니다 (최대 30MB)");
      return;
    }
    setFile(f);
    setError("");
  };

  const [progress, setProgress] = useState("");

  const submit = async () => {
    if (!file) {
      setError("파일을 선택하세요");
      return;
    }
    setSubmitting(true);
    setError("");
    setProgress("파일 업로드 중...");
    try {
      // 1) 파일 업로드 → jobId 즉시 반환 (CloudFront 60초 timeout 회피)
      const fd = new FormData();
      fd.append("file", file);
      const token = sessionStorage.getItem(TOKEN_KEY);
      const res = await fetch(`${API_BASE}/v1/admin/ai-gen/file-to-markdown`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) {
        let msg = `업로드 실패: ${res.status}`;
        try {
          const p = await res.json();
          msg = p?.error?.message || p?.message || msg;
        } catch { /* ignore */ }
        throw new Error(msg);
      }
      const payload = await res.json();
      const submission = payload?.data ?? payload;
      const jobId = submission?.jobId;
      if (!jobId) throw new Error("jobId 누락 — 서버 응답 이상");

      // 2) 폴링으로 변환 결과 대기 (최대 5분)
      setProgress("AI 변환 중... (PDF는 페이지 수에 따라 30초~2분 소요)");
      const result = await pollJob(jobId, 150, 2000);
      onConverted({
        pages: result.pages || [],         // [{pageNo, markdown}]
        markdown: result.markdown,         // 합본 (호환)
        sourceFileName: result.sourceFileName,
        sourceHash: result.sourceHash,
        sourceSizeBytes: result.sourceSizeBytes,
        sourceMediaType: result.sourceMediaType,
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
      setProgress("");
    }
  };

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal admin-modal-wide" onClick={(e) => e.stopPropagation()}>
        <h2>📄 PDF/이미지 → 마크다운 변환 (AI)</h2>
        <div style={{
          background: "rgba(212, 160, 76, 0.12)",
          border: "1px solid rgba(212, 160, 76, 0.4)",
          padding: "10px 14px",
          borderRadius: 8,
          marginBottom: 14,
          fontSize: 13,
          color: "#8a5e1c",
        }}>
          <strong>⚠️ 추가 과금 안내</strong>
          <p style={{ margin: "4px 0 0", fontSize: 12 }}>
            AI 변환 호출이므로 추가 과금이 발생할 수 있습니다.
          </p>
          <p style={{ margin: "4px 0 0", fontSize: 12, fontWeight: 700 }}>
            📄 PDF 는 최대 10장까지 — 더 큰 자료는 분할 후 업로드하세요. 페이지별로 자동 분리되어 비주얼 에디터에 추가됩니다.
          </p>
        </div>
        <div className="admin-modal-field">
          <label>파일 선택 (PDF / JPG / PNG / WEBP / GIF, 최대 30MB)</label>
          <input
            ref={fileRef} type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp,.gif,application/pdf,image/*"
            onChange={onSelect}
            disabled={submitting}
          />
          {file && (
            <p style={{ fontSize: 12, color: "var(--admin-muted)", margin: "4px 0 0" }}>
              {file.name} ({(file.size / 1024).toFixed(1)} KB)
            </p>
          )}
        </div>
        {progress && (
          <div style={{
            background: "var(--admin-accent-soft)",
            color: "var(--admin-accent-strong)",
            padding: "8px 14px",
            borderRadius: 8,
            marginBottom: 10,
            fontSize: 13,
          }}>
            {progress}
          </div>
        )}
        {error && (
          <div className="admin-error" style={{ marginBottom: 10 }}>{error}</div>
        )}
        <div className="admin-modal-actions">
          <button
            type="button"
            className="admin-detail-btn"
            onClick={submit}
            disabled={submitting || !file}
          >
            {submitting ? "처리 중..." : "마크다운으로 변환"}
          </button>
          <button
            type="button"
            className="admin-detail-btn secondary"
            onClick={onClose}
            disabled={submitting}
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
