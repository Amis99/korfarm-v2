import { useState, useEffect } from "react";
import { apiGet } from "../utils/api";

/**
 * 농장별 콘텐츠 목록을 DB API에서 조회하는 훅.
 * @param {string} area - 농장 area (예: "VOCAB", "READING")
 * @param {string} [levelId] - 레벨 필터 (선택)
 * @param {string} [contentType] - contentType 필터 (선택)
 */
export function useLearningCatalog(area, levelId, contentType) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!area) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (levelId) params.set("levelId", levelId);
    if (contentType) params.set("contentType", contentType);
    const qs = params.toString();
    const url = `/v1/learning/catalog/${area}${qs ? `?${qs}` : ""}`;

    apiGet(url)
      .then((data) => {
        setItems(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setItems([]);
        setLoading(false);
      });
  }, [area, levelId, contentType]);

  return { items, loading, error };
}

/**
 * 전체 카탈로그(농장별 그룹) 조회.
 */
export function useFullCatalog() {
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    apiGet("/v1/learning/catalog")
      .then((data) => {
        setCatalog(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  return { catalog, loading, error };
}
