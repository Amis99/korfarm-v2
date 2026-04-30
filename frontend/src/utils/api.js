export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";
export const TOKEN_KEY = "korfarm_token";
/** 관리자 전용 14일 refresh token. localStorage 에 저장 (탭/브라우저 닫아도 유지). */
export const REFRESH_KEY = "korfarm_refresh";

// snake_case ↔ camelCase 변환 (백엔드 SNAKE_CASE Jackson 설정 대응)
const snakeToCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
const camelToSnake = (s) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
function convertKeys(obj, fn) {
  if (Array.isArray(obj)) return obj.map((v) => convertKeys(v, fn));
  if (obj !== null && typeof obj === "object" && !(obj instanceof Date)) {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [fn(k), convertKeys(v, fn)])
    );
  }
  return obj;
}
export const camelize = (obj) => convertKeys(obj, snakeToCamel);
export const snakeize = (obj) => convertKeys(obj, camelToSnake);

// camelize가 변환한 인벤토리 맵 키를 snake_case로 복원
export function normalizeInventoryKeys(inv) {
  if (!inv) return inv;
  const toSnake = (k) => k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
  const fixMap = (m) => {
    if (!m || typeof m !== "object" || Array.isArray(m)) return m;
    return Object.fromEntries(Object.entries(m).map(([k, v]) => [toSnake(k), v]));
  };
  return { ...inv, seeds: fixMap(inv.seeds), crops: fixMap(inv.crops) };
}

// HTTP 상태 코드를 포함하는 커스텀 에러 클래스
export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// 402 에러 여부 확인 헬퍼
export const isPaymentRequired = (error) => error?.status === 402;

const buildUrl = (path) => {
  const base = API_BASE.replace(/\/$/, "");
  return path.startsWith("http") ? path : `${base}${path}`;
};

const authHeaders = () => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// 401 응답 시 토큰 삭제 + 로그인 페이지 리다이렉트
const handle401 = (path) => {
  // 로그인/회원가입/refresh 자체는 리다이렉트 X
  const authPaths = ["/v1/auth/login", "/v1/auth/signup",
    "/v1/auth/request-password-reset", "/v1/auth/refresh"];
  if (authPaths.some((p) => path.includes(p))) return;
  sessionStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  window.location.href = import.meta.env.BASE_URL + "login";
};

/**
 * 관리자 전용 — refresh token 으로 새 access token 받기.
 * 동시 다발 호출 시 한 번만 호출되도록 중복 방지.
 */
let refreshInflight = null;
const tryRefresh = async () => {
  const refresh = localStorage.getItem(REFRESH_KEY);
  if (!refresh) return false;
  if (refreshInflight) return refreshInflight;
  refreshInflight = (async () => {
    try {
      const res = await fetch(buildUrl("/v1/auth/refresh"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refresh }),
      });
      if (!res.ok) return false;
      const payload = await res.json();
      const newAccess = payload?.data?.access_token || payload?.data?.accessToken;
      const newRefresh = payload?.data?.refresh_token || payload?.data?.refreshToken;
      if (!newAccess) return false;
      sessionStorage.setItem(TOKEN_KEY, newAccess);
      if (newRefresh) localStorage.setItem(REFRESH_KEY, newRefresh);
      return true;
    } catch {
      return false;
    } finally {
      refreshInflight = null;
    }
  })();
  return refreshInflight;
};

/**
 * 응답을 안전하게 처리.
 * CloudFront가 403/404를 200 + index.html로 변환하는 경우를 방어.
 */
const safeJson = async (response, method, path) => {
  const ct = response.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    throw new ApiError(
      `${method} ${path} 요청 실패: 서버가 JSON이 아닌 응답을 반환했습니다 (${response.status})`,
      response.status
    );
  }
  if (!response.ok) {
    let msg = `${method} ${path} 요청 실패: ${response.status}`;
    try {
      const payload = await response.json();
      msg = payload?.error?.message || payload?.message || msg;
    } catch { /* ignore */ }
    throw new ApiError(msg, response.status);
  }
  const payload = await response.json();
  return camelize(payload?.data ?? payload);
};

/**
 * 401 시 refresh 시도 → 성공하면 1회 재시도.
 * 학생/학부모는 refresh 토큰이 없어 즉시 logout 처리.
 */
const fetchWithAuthRetry = async (method, path, makeInit) => {
  const url = buildUrl(path);
  let response = await fetch(url, makeInit());
  if (response.status === 401) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      response = await fetch(url, makeInit());
    } else {
      handle401(path);
    }
  }
  return safeJson(response, method, path);
};

export const apiGet = async (path) =>
  fetchWithAuthRetry("GET", path, () => ({ headers: authHeaders() }));

export const apiPost = async (path, body) =>
  fetchWithAuthRetry("POST", path, () => ({
    method: "POST",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: body ? JSON.stringify(snakeize(body)) : "{}",
  }));

export const apiDelete = async (path) =>
  fetchWithAuthRetry("DELETE", path, () => ({
    method: "DELETE",
    headers: authHeaders(),
  }));

export const apiPatch = async (path, body) =>
  fetchWithAuthRetry("PATCH", path, () => ({
    method: "PATCH",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: body ? JSON.stringify(snakeize(body)) : "{}",
  }));

export const apiUploadFile = async (fileId, file) => {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(buildUrl(`/v1/files/${fileId}/upload`), {
    method: "POST",
    headers: authHeaders(),
    body: formData,
  });
  return safeJson(response, "POST", `/v1/files/${fileId}/upload`);
};

export const apiPut = async (path, body) =>
  fetchWithAuthRetry("PUT", path, () => ({
    method: "PUT",
    headers: { ...authHeaders(), "Content-Type": "application/json" },
    body: body ? JSON.stringify(snakeize(body)) : "{}",
  }));

export const WS_BASE = (() => {
  if (API_BASE && API_BASE.startsWith("http")) {
    return API_BASE.replace(/^http/, "ws");
  }
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}`;
})();
