import { API_BASE, TOKEN_KEY } from "./api";

// 최상위 키만 snake_case로 변환 (content 등 내부 payload는 그대로 유지)
const camelToSnake = (s) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const snakeizeTop = (obj) => {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return obj;
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [camelToSnake(k), v])
  );
};

// 기본 타임아웃 (관리자 API — 큰 JSON 저장을 고려해 60초)
const DEFAULT_TIMEOUT_MS = 60_000;

const buildUrl = (path) => {
  const base = API_BASE.replace(/\/$/, "");
  return path.startsWith("http") ? path : `${base}${path}`;
};

const getToken = () => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (!token) throw new Error("관리자 토큰이 필요합니다.");
  return token;
};

/** AbortController 기반 타임아웃 fetch */
const fetchWithTimeout = async (url, options = {}, timeoutMs = DEFAULT_TIMEOUT_MS) => {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } catch (e) {
    if (e.name === "AbortError") {
      throw new Error(`요청 시간 초과 (${Math.round(timeoutMs / 1000)}초). 데이터가 너무 크거나 서버가 느립니다.`);
    }
    throw e;
  } finally {
    clearTimeout(timer);
  }
};

/** 401(미인증) 또는 403(권한/만료) 시 토큰 정리 + 로그인 페이지로 이동 */
const handleAuthFailure = (status) => {
  // 토큰 폐기
  try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
  // 로그인 페이지로 이동 (현재 admin 페이지가 아니면 무시)
  const current = window.location.pathname;
  if (current.startsWith("/admin")) {
    const base = import.meta.env.BASE_URL || "/";
    // 현재 경로를 redirect 파라미터로 전달
    const redirect = encodeURIComponent(current + window.location.search);
    window.location.href = `${base}login?redirect=${redirect}&reason=${status === 401 ? "expired" : "forbidden"}`;
  }
};

/**
 * 응답을 안전하게 JSON 파싱.
 * CloudFront가 403/404를 200 + index.html로 변환하는 경우를 방어.
 * 401/403 시 토큰 만료로 간주하고 자동 로그아웃 + 리다이렉트.
 */
const safeJson = async (response, method, path) => {
  const ct = response.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    throw new Error(
      `${method} ${path} 요청 실패: 서버가 JSON이 아닌 응답을 반환했습니다 (${response.status})`
    );
  }
  if (!response.ok) {
    // 401/403 → 토큰 만료 또는 권한 부족 → 자동 로그아웃 시도
    if (response.status === 401 || response.status === 403) {
      handleAuthFailure(response.status);
      throw new Error(
        response.status === 401
          ? "로그인이 만료되었습니다. 다시 로그인해 주세요."
          : "관리자 권한이 필요하거나 세션이 만료되었습니다. 다시 로그인해 주세요."
      );
    }
    let msg = `${method} ${path} 요청 실패: ${response.status}`;
    try {
      const payload = await response.json();
      msg = payload?.error?.message || payload?.message || msg;
    } catch { /* ignore */ }
    throw new Error(msg);
  }
  const payload = await response.json();
  return payload?.data ?? payload;
};

export const apiGet = async (path) => {
  const response = await fetchWithTimeout(buildUrl(path), {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return safeJson(response, "GET", path);
};

export const apiPost = async (path, body) => {
  const response = await fetchWithTimeout(buildUrl(path), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(snakeizeTop(body)) : "{}",
  });
  return safeJson(response, "POST", path);
};

export const apiPut = async (path, body) => {
  const response = await fetchWithTimeout(buildUrl(path), {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(snakeizeTop(body)) : "{}",
  });
  return safeJson(response, "PUT", path);
};

export const apiPatch = async (path, body) => {
  const response = await fetchWithTimeout(buildUrl(path), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(snakeizeTop(body)) : "{}",
  });
  return safeJson(response, "PATCH", path);
};

export const apiDelete = async (path) => {
  const response = await fetchWithTimeout(buildUrl(path), {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return safeJson(response, "DELETE", path);
};
