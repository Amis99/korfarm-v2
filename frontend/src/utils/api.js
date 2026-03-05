export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8080";
export const TOKEN_KEY = "korfarm_token";

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
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

// 401 응답 시 토큰 삭제 + 로그인 페이지 리다이렉트
const handle401 = (path) => {
  // 로그인/회원가입 관련 요청에서는 리다이렉트하지 않음
  const authPaths = ["/v1/auth/login", "/v1/auth/signup", "/v1/auth/request-password-reset"];
  if (authPaths.some((p) => path.includes(p))) return;
  localStorage.removeItem(TOKEN_KEY);
  window.location.href = import.meta.env.BASE_URL + "login";
};

const parseError = async (response, method, path) => {
  if (response.status === 401) {
    handle401(path);
  }
  try {
    const payload = await response.json();
    if (payload?.error?.message) return payload.error.message;
    if (payload?.message) return payload.message;
  } catch {
    // JSON 파싱 실패 시 기본 메시지
  }
  return `${method} ${path} 요청 실패: ${response.status}`;
};

export const apiGet = async (path) => {
  const response = await fetch(buildUrl(path), {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new ApiError(await parseError(response, "GET", path), response.status);
  }
  const payload = await response.json();
  return payload?.data ?? payload;
};

export const apiPost = async (path, body) => {
  const response = await fetch(buildUrl(path), {
    method: "POST",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : "{}",
  });
  if (!response.ok) {
    throw new ApiError(await parseError(response, "POST", path), response.status);
  }
  const payload = await response.json();
  return payload?.data ?? payload;
};

export const apiDelete = async (path) => {
  const response = await fetch(buildUrl(path), {
    method: "DELETE",
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new ApiError(await parseError(response, "DELETE", path), response.status);
  }
  const payload = await response.json();
  return payload?.data ?? payload;
};

export const apiPut = async (path, body) => {
  const response = await fetch(buildUrl(path), {
    method: "PUT",
    headers: {
      ...authHeaders(),
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : "{}",
  });
  if (!response.ok) {
    throw new ApiError(await parseError(response, "PUT", path), response.status);
  }
  const payload = await response.json();
  return payload?.data ?? payload;
};

export const WS_BASE = (() => {
  if (API_BASE && API_BASE.startsWith("http")) {
    return API_BASE.replace(/^http/, "ws");
  }
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}`;
})();
