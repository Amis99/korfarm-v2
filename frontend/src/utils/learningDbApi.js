import { apiGet, apiPost, apiPut, apiDelete } from "./api";

/** 학습 자료DB v2 — 통합 admin endpoint 래퍼 */

export const fetchCategories = () =>
  apiGet("/v1/admin/learning-db/categories");

export const fetchTree = (categoryKey) =>
  apiGet(`/v1/admin/learning-db/${encodeURIComponent(categoryKey)}/tree`);

export const fetchItem = (categoryKey, id) =>
  apiGet(`/v1/admin/learning-db/${encodeURIComponent(categoryKey)}/item?id=${encodeURIComponent(id)}`);

/** 단일 항목 저장 (id 가 없으면 신규 생성) */
export const saveItem = (categoryKey, id, data) => {
  const qs = id ? `?id=${encodeURIComponent(id)}` : "";
  return apiPut(`/v1/admin/learning-db/${encodeURIComponent(categoryKey)}/item${qs}`, data);
};

/** 단일 항목 삭제 */
export const deleteItem = (categoryKey, id) =>
  apiDelete(`/v1/admin/learning-db/${encodeURIComponent(categoryKey)}/item?id=${encodeURIComponent(id)}`);

/** 배치 import (JSON 파일 업로드) — items: [{ id?, data }], mode: "upsert" | "create" | "merge" */
export const importBatch = (categoryKey, items, mode = "upsert") =>
  apiPost(`/v1/admin/learning-db/${encodeURIComponent(categoryKey)}/import`, { items, mode });
