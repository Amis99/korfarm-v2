import { apiGet, apiPost, apiPut, apiDelete } from "./api";

/** 학습 자료 DB — 영역·세부영역별 raw JSON 자료 admin endpoint */

export const fetchMeta = () =>
  apiGet("/v1/admin/learning-data/meta");

export const fetchTree = () =>
  apiGet("/v1/admin/learning-data/tree");

export const fetchFile = (path) =>
  apiGet(`/v1/admin/learning-data/file?path=${encodeURIComponent(path)}`);

export const saveFile = (path, data) =>
  apiPut(`/v1/admin/learning-data/file?path=${encodeURIComponent(path)}`, data);

export const deleteFile = (path) =>
  apiDelete(`/v1/admin/learning-data/file?path=${encodeURIComponent(path)}`);

export const importBatch = (items) =>
  apiPost("/v1/admin/learning-data/import", { items });
