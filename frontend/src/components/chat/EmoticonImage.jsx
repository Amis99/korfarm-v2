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

  if (!url) return <div className={`emoticon-placeholder ${className}`} />;
  return <img src={url} alt={alt} className={`emoticon-image ${className}`} />;
}

export default EmoticonImage;
