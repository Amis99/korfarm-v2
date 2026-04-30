import { useEffect, useState } from "react";
import { API_BASE, TOKEN_KEY } from "../../utils/api";

/**
 * 이모티콘 이미지 — 인증 토큰으로 fetch 후 blob URL로 표시.
 * fileId 단위 LRU 캐시로 같은 이모티콘 재사용 시 재요청 방지.
 */
const blobCache = new Map(); // fileId → object URL
const inflight = new Map();   // fileId → Promise<string>

function fetchEmoticon(fileId) {
  if (blobCache.has(fileId)) return Promise.resolve(blobCache.get(fileId));
  if (inflight.has(fileId)) return inflight.get(fileId);
  const token = sessionStorage.getItem(TOKEN_KEY);
  const p = fetch(`${API_BASE}/v1/files/${fileId}/download`, {
    headers: { Authorization: `Bearer ${token}` },
  })
    .then((r) => {
      if (!r.ok) throw new Error("emoticon load failed");
      return r.blob();
    })
    .then((b) => {
      const url = URL.createObjectURL(b);
      blobCache.set(fileId, url);
      inflight.delete(fileId);
      return url;
    })
    .catch((e) => {
      inflight.delete(fileId);
      throw e;
    });
  inflight.set(fileId, p);
  return p;
}

function EmoticonImage({ fileId, alt = "", className = "" }) {
  const [url, setUrl] = useState(blobCache.get(fileId) || null);

  useEffect(() => {
    if (!fileId) return;
    if (blobCache.has(fileId)) {
      setUrl(blobCache.get(fileId));
      return;
    }
    let cancelled = false;
    fetchEmoticon(fileId)
      .then((u) => {
        if (!cancelled) setUrl(u);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [fileId]);

  // 부모 박스 안에 항상 fit 되도록 인라인 스타일을 강제 (community-chat.css 가
  // import 안 된 어드민·라이트 화면에서도 동작 보장).
  const fitStyle = {
    display: "block",
    maxWidth: "100%",
    maxHeight: "100%",
    width: "auto",
    height: "auto",
    objectFit: "contain",
  };
  if (!url) return <div className={`emoticon-placeholder ${className}`} style={fitStyle} />;
  return <img src={url} alt={alt} className={`emoticon-image ${className}`} style={fitStyle} />;
}

export default EmoticonImage;
