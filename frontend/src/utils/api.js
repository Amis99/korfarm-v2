export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";
export const TOKEN_KEY = "korfarm_token";

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
  // 로그인/회원가입 관련 요청에서는 리다이렉트하지 않음
  const authPaths = ["/v1/auth/login", "/v1/auth/signup", "/v1/auth/request-password-reset"];
  if (authPaths.some((p) => path.includes(p))) return;
  sessionStorage.removeItem(TOKEN_KEY);
  window.location.href = import.meta.env.BASE_URL + "login";
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
    if (response.status === 401) handle401(path);
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

export const apiGet = async (path) => {
  const response = await fetch(buildUrl(path), {
    headers: authHeaders(),
  });
  return safeJson(response, "GET", path);
};

export const apiPost = async (path, body) => {
  const response = await fetch(buildUrl(path), {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(snakeize(body)) : "{}",
  });
  return safeJson(response, "POST", path);
};

export const apiDelete = async (path) => {
  const response = await fetch(buildUrl(path), {
    method: "DELETE",
    headers: authHeaders(),
  });
  return safeJson(response, "DELETE", path);
};

export const apiPatch = async (path, body) => {
  const response = await fetch(buildUrl(path), {
    method: "PATCH",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(snakeize(body)) : "{}",
  });
  return safeJson(response, "PATCH", path);
};

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

export const apiPut = async (path, body) => {
  const response = await fetch(buildUrl(path), {
    method: "PUT",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(snakeize(body)) : "{}",
  });
  return safeJson(response, "PUT", path);
};

export const WS_BASE = (() => {
  if (API_BASE && API_BASE.startsWith("http")) {
    return API_BASE.replace(/^http/, "ws");
  }
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}`;
})();
