import { useEffect, useState } from "react";
import { apiGet } from "../utils/api";

/**
 * 채팅 이모티콘 라이브러리 캐시.
 * 첫 마운트 시 한 번 fetch, 메모리 캐시.
 */
let cache = null;
let cachePromise = null;

export function useEmoticons() {
  const [emoticons, setEmoticons] = useState(cache || []);
  const [loading, setLoading] = useState(cache == null);

  useEffect(() => {
    if (cache != null) {
      setEmoticons(cache);
      setLoading(false);
      return;
    }
    if (cachePromise == null) {
      cachePromise = apiGet("/v1/chat/emoticons")
        .then((data) => {
          cache = Array.isArray(data) ? data : [];
          return cache;
        })
        .catch(() => {
          cache = [];
          return cache;
        });
    }
    cachePromise.then((list) => {
      setEmoticons(list);
      setLoading(false);
    });
  }, []);

  return { emoticons, loading };
}

/** 캐시 무효화 (관리자 페이지에서 등록/삭제 후) */
export function invalidateEmoticonCache() {
  cache = null;
  cachePromise = null;
}

/** id로 이모티콘 객체 lookup */
export function findEmoticonById(emoticons, id) {
  if (!id || !Array.isArray(emoticons)) return null;
  return emoticons.find((e) => e.id === id) || null;
}
