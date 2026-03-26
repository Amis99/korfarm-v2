import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiGet, apiPost, API_BASE, TOKEN_KEY } from "../utils/api";
import "../styles/study-plan.css";

export default function StudyPlanSubmitPage() {
  const { cellId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [cell, setCellInfo] = useState(null);
  const [existingFiles, setExistingFiles] = useState([]);
  const [pendingFiles, setPendingFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 셀 기본 정보는 매트릭스에서 전달받기 어려우므로 파일 목록만 로드
    apiGet(`/v1/study-plans/cells/${cellId}/files`)
      .then(setExistingFiles)
      .catch(() => setExistingFiles([]));
  }, [cellId]);

  const fileUrl = (fileId) => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    return `${API_BASE}/v1/files/${fileId}/download?token=${token}`;
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    setPendingFiles((prev) => [...prev, ...files]);
  };

  const removePending = (idx) => {
    setPendingFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    if (pendingFiles.length === 0) {
      setError("파일을 첨부해 주세요.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      // 1. 파일 업로드 (presign)
      const fileIds = [];
      for (const file of pendingFiles) {
        const presign = await apiPost("/v1/files/presign", {
          purpose: "study_plan",
          filename: file.name,
          mime: file.type || "image/jpeg",
          size: file.size,
        });
        const fileId = presign?.fileId || presign?.data?.fileId;
        const uploadUrl = presign?.uploadUrl || presign?.data?.uploadUrl;

        if (uploadUrl && !uploadUrl.startsWith("local://")) {
          await fetch(uploadUrl, {
            method: "PUT",
            headers: { "Content-Type": file.type || "image/jpeg" },
            body: file,
          });
        }
        if (fileId) fileIds.push(fileId);
      }

      // 2. 셀 제출
      await apiPost(`/v1/study-plans/cells/${cellId}/submit`, { fileIds });
      navigate("/study-plan");
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="sp-submit-page">
      <h1 style={{ fontSize: "1.2rem", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
        <span className="material-symbols-outlined">upload_file</span>
        학습활동 제출
      </h1>

      {/* 이전 제출 파일 */}
      {existingFiles.length > 0 && (
        <>
          <div style={{ fontSize: "0.82rem", color: "#8a7468", marginBottom: 8 }}>
            이전 제출 ({existingFiles.length}건)
          </div>
          <div className="sp-file-preview">
            {existingFiles.map((f) => (
              <img key={f.id} className="sp-file-thumb" src={fileUrl(f.fileId)} alt="이전 제출" />
            ))}
          </div>
        </>
      )}

      {error && <div className="sp-reject-reason">{error}</div>}

      {/* 새 파일 첨부 */}
      <div
        className="sp-upload-area"
        onClick={() => fileInputRef.current?.click()}
      >
        <span className="material-symbols-outlined">add_a_photo</span>
        <p>사진 촬영 또는 파일 선택</p>
        <p style={{ fontSize: "0.75rem" }}>여러 장 첨부 가능</p>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        style={{ display: "none" }}
        onChange={handleFileSelect}
      />

      {/* 첨부 미리보기 */}
      {pendingFiles.length > 0 && (
        <div className="sp-file-preview">
          {pendingFiles.map((f, i) => (
            <div key={i} style={{ position: "relative" }}>
              <img className="sp-file-thumb" src={URL.createObjectURL(f)} alt={f.name} />
              <button
                type="button"
                onClick={() => removePending(i)}
                style={{
                  position: "absolute", top: 2, right: 2, background: "rgba(0,0,0,0.6)",
                  color: "#fff", border: "none", borderRadius: "50%", width: 22, height: 22,
                  fontSize: 14, cursor: "pointer", lineHeight: "22px", textAlign: "center",
                }}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      )}

      <button
        className="sp-submit-btn"
        onClick={handleSubmit}
        disabled={submitting || pendingFiles.length === 0}
      >
        {submitting ? "제출 중..." : `제출하기 (${pendingFiles.length}건)`}
      </button>
    </div>
  );
}
