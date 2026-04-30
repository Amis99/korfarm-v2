import { API_BASE, TOKEN_KEY } from "./api";
import { apiPost } from "./adminApi";

/**
 * 시험·콘텐츠용 이미지(또는 파일) 업로드 헬퍼.
 *
 * 두 단계:
 *   1) POST /v1/files/presign  → fileId 발급 + DB row 생성
 *   2) POST /v1/files/{fileId}/upload  (multipart) → 실제 파일 저장
 *
 * 반환: { fileId, downloadUrl, mime, size }
 *   downloadUrl 은 그대로 <img src> 에 사용 가능 (purpose:"content" → 공개 다운로드)
 *
 * 옵션:
 *   purpose: "content" (기본). 시험·콘텐츠 이미지는 공개 노출 필요.
 *   onProgress?: (loaded, total) => void
 *
 * 향후 S3 마이그레이션 시: 백엔드 presign 이 S3 presigned URL 을 반환하도록 변경되면
 * 이 헬퍼의 두 번째 단계만 수정 (직접 PUT to S3) — 호출자 변경 없이 동작.
 */
export async function uploadFile(file, opts = {}) {
  if (!file) throw new Error("파일이 없습니다.");
  const purpose = opts.purpose || "content";

  // 1) presign — fileId 발급 (PresignRequest: purpose/filename/mime/size 모두 필수)
  const presign = await apiPost("/v1/files/presign", {
    purpose,
    filename: file.name || "upload",
    mime: file.type || "application/octet-stream",
    size: file.size,
  });
  const fileId = presign.fileId ?? presign.file_id;
  const uploadUrl = presign.uploadUrl ?? presign.upload_url ?? `/v1/files/${fileId}/upload`;
  const downloadUrl = presign.downloadUrl ?? presign.download_url ?? `/v1/files/${fileId}/download`;

  // 2) multipart 업로드
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (!token) throw new Error("로그인이 필요합니다.");
  const fd = new FormData();
  fd.append("file", file);

  const fullUrl = uploadUrl.startsWith("http") ? uploadUrl : `${API_BASE.replace(/\/$/, "")}${uploadUrl}`;

  // XMLHttpRequest 로 진행률 콜백 지원
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", fullUrl);
    xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    if (opts.onProgress) {
      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) opts.onProgress(e.loaded, e.total);
      });
    }
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({
          fileId,
          downloadUrl,
          mime: file.type,
          size: file.size,
          originalName: file.name,
        });
      } else {
        let msg = `업로드 실패 (${xhr.status})`;
        try {
          const payload = JSON.parse(xhr.responseText);
          msg = payload?.error?.message || payload?.message || msg;
        } catch { /* ignore */ }
        reject(new Error(msg));
      }
    };
    xhr.onerror = () => reject(new Error("네트워크 오류"));
    xhr.send(fd);
  });
}

/**
 * fileId 로 다운로드 URL 생성 (downloadUrl 이 없을 때 fallback).
 */
export function fileDownloadUrl(fileId) {
  if (!fileId) return null;
  if (fileId.startsWith("http") || fileId.startsWith("/")) return fileId;
  return `${API_BASE.replace(/\/$/, "")}/v1/files/${fileId}/download`;
}
