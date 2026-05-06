import { apiGet, apiPost, apiPut, apiDelete } from "./api";

/** 학습 자료 v2 — 작품·지문 corpus + 누적 항목 + 임시 체크포인트 풀 */

const BASE = "/v1/admin/learning-corpus";

// ── 작품·지문 corpus ────────────────────────────────────

export const searchCorpus = (params = {}) => {
  const q = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null && v !== "")
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .join("&");
  return apiGet(`${BASE}/search${q ? "?" + q : ""}`);
};

export const fetchCorpus = (id) => apiGet(`${BASE}/${id}`);

export const createCorpus = (body) => apiPost(BASE, body);

export const updateCorpus = (id, body) => apiPut(`${BASE}/${id}`, body);

export const deleteCorpus = (id) => apiDelete(`${BASE}/${id}`);

// ── 누적 항목 ────────────────────────────────────

export const addItem = (corpusId, body) => apiPost(`${BASE}/${corpusId}/items`, body);

export const updateItem = (itemId, body) => apiPut(`${BASE}/items/${itemId}`, body);

export const deleteItem = (itemId) => apiDelete(`${BASE}/items/${itemId}`);

// ── 임시 체크포인트 풀 ────────────────────────────────────

export const fetchPending = (status = "pending") =>
  apiGet(`${BASE}/pending?status=${encodeURIComponent(status)}`);

export const fetchPendingStats = () => apiGet(`${BASE}/pending/stats`);

export const extractPending = (sourceContentId, sourceUserId, sourceOrgId) => {
  const q = [
    `sourceContentId=${encodeURIComponent(sourceContentId)}`,
    sourceUserId ? `sourceUserId=${encodeURIComponent(sourceUserId)}` : null,
    sourceOrgId ? `sourceOrgId=${encodeURIComponent(sourceOrgId)}` : null,
  ].filter(Boolean).join("&");
  return apiPost(`${BASE}/pending/extract?${q}`, {});
};

export const classifyOne = (pendingId) => apiPost(`${BASE}/pending/${pendingId}/classify`, {});

export const classifyAll = () => apiPost(`${BASE}/pending/classify-all`, {});

export const approvePending = (pendingId, corpusId, itemType) =>
  apiPost(`${BASE}/pending/${pendingId}/approve`, { corpusId, itemType });

export const rejectPending = (pendingId) => apiPost(`${BASE}/pending/${pendingId}/reject`, {});

// ── Legacy import ────────────────────────────────────

export const importLegacy = (dryRun = false) =>
  apiPost(`${BASE}/import?dryRun=${dryRun}`, {});
