import { useEffect, useState } from "react";
import { API_BASE, TOKEN_KEY } from "../utils/api";

/**
 * 파일을 token 헤더와 함께 다운로드해 blob URL 로 반환.
 * `<img src=fileDownloadUrl(...)>` 처럼 직접 URL 박으면 토큰이 안 붙어 401 이 나는 문제를
 * fetch + URL.createObjectURL 패턴으로 우회.
 *
 * 모듈 레벨 캐시:
 *  - 같은 fileId 의 결과(URL · 진행 중 Promise) 를 공유. 비주얼 에디터에서 입력마다
 *    react-markdown 이 re-render → FileImage 가 매번 새 mount 되어도 즉시 cached URL 반환.
 *  - 캐시 없으면 한 번만 fetch. 진행 중이면 같은 Promise 를 기다림.
 *  - revoke 안 함 (탭 닫히면 자동 해제). 잠깐의 메모리는 사용자 경험상 layout shift 회피 우선.
 *
 * @param {string|null|undefined} fileId
 * @returns {string|null} blob URL (없거나 미준비면 null)
 */
const urlCache = new Map();     // fileId → blob URL
const pendingCache = new Map(); // fileId → Promise<blob URL>

export function useFileBlob(fileId) {
  const [url, setUrl] = useState(() => (fileId ? urlCache.get(fileId) || null : null));

  useEffect(() => {
    if (!fileId) { setUrl(null); return; }
    const cached = urlCache.get(fileId);
    if (cached) { setUrl(cached); return; }
    let cancelled = false;
    let pending = pendingCache.get(fileId);
    if (!pending) {
      const token = sessionStorage.getItem(TOKEN_KEY) || "";
      pending = fetch(`${API_BASE}/v1/files/${fileId}/download`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
        .then((r) => {
          if (!r.ok) throw new Error(`다운로드 실패 (${r.status})`);
          return r.blob();
        })
        .then((blob) => {
          const u = URL.createObjectURL(blob);
          urlCache.set(fileId, u);
          pendingCache.delete(fileId);
          return u;
        })
        .catch((e) => {
          pendingCache.delete(fileId);
          throw e;
        });
      pendingCache.set(fileId, pending);
    }
    pending
      .then((u) => { if (!cancelled) setUrl(u); })
      .catch(() => { if (!cancelled) setUrl(null); });
    return () => { cancelled = true; };
  }, [fileId]);

  return url;
}
