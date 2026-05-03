import { apiGet } from "./api";

/** 학습 자료DB v2 — 통합 admin endpoint 래퍼 */
export const fetchCategories = () =>
  apiGet("/v1/admin/learning-db/categories");

export const fetchTree = (categoryKey) =>
  apiGet(`/v1/admin/learning-db/${encodeURIComponent(categoryKey)}/tree`);

export const fetchItem = (categoryKey, id) =>
  apiGet(`/v1/admin/learning-db/${encodeURIComponent(categoryKey)}/item?id=${encodeURIComponent(id)}`);
