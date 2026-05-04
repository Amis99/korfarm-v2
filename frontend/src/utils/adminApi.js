import { API_BASE, TOKEN_KEY } from "./api";

// 최상위 키만 snake_case로 변환 (content 등 내부 payload는 그대로 유지)
const camelToSnake = (s) => s.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const snakeizeTop = (obj) => {
  if (!obj || typeof obj !== "object" || Array.isArray(obj)) return obj;
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [camelToSnake(k), v])
  );
};

// 깊은 snake_case 변환 — 배열/객체 재귀. 백엔드가 SNAKE_CASE strategy 라 nested 도 변환 필요.
const deepSnakeize = (val) => {
  if (Array.isArray(val)) return val.map(deepSnakeize);
  if (val && typeof val === "object") {
    return Object.fromEntries(
      Object.entries(val).map(([k, v]) => [camelToSnake(k), deepSnakeize(v)])
    );
  }
  return val;
};

// 깊은 camelCase 변환 — 백엔드 SNAKE_CASE 응답을 프론트엔드가 쓰는 camelCase 로 통일.
// 응답에 nested 배열/객체가 많은 비주얼 에디터에서 필수.
const snakeToCamel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
const deepCamelize = (val) => {
  if (Array.isArray(val)) return val.map(deepCamelize);
  if (val && typeof val === "object" && val.constructor === Object) {
    return Object.fromEntries(
      Object.entries(val).map(([k, v]) => [snakeToCamel(k), deepCamelize(v)])
    );
  }
  return val;
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

/**
 * 401(미인증/만료) → 토큰 폐기 + 로그인 페이지로
 * 403(권한 부족) → 토큰은 유지, 어드민 메인(/admin) 으로 부드럽게 되돌리기
 *   (ORG_ADMIN 이 HQ 전용 페이지를 호출했을 때 한 번 forbidden 후 모든 라우트가
 *    로그인 페이지로 튀는 사고를 방지)
 */
const handleAuthFailure = (status) => {
  const current = window.location.pathname;
  if (status === 401) {
    try { sessionStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
    if (current.startsWith("/admin")) {
      const base = import.meta.env.BASE_URL || "/";
      const redirect = encodeURIComponent(current + window.location.search);
      window.location.href = `${base}login?redirect=${redirect}&reason=expired`;
    }
    return;
  }
  // 403 — 토큰 유지. admin 영역이고 admin 메인이 아닐 때만 메인으로 보냄.
  if (current.startsWith("/admin") && current !== "/admin" && current !== "/admin/") {
    const base = import.meta.env.BASE_URL || "/";
    window.location.href = `${base}admin?reason=forbidden`;
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

/** 깊은 camelCase 변환 GET — 백엔드 snake_case 응답을 nested 까지 camelCase 로 변환.
 *  비주얼 에디터처럼 questionType / boxContent / fillBlanks 등 nested 필드를
 *  camelCase 로 읽어야 하는 화면에서 사용.
 */
export const apiGetCamel = async (path) => {
  const response = await fetchWithTimeout(buildUrl(path), {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  const data = await safeJson(response, "GET", path);
  return deepCamelize(data);
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

/** 깊은 snake_case 변환 POST (nested 객체·배열 모두 변환). study questions:bulk 등.
 *  응답도 nested 까지 camelCase 로 변환 — 저장 후 메모리 상태가 snake 로 깨지지 않도록. */
export const apiPostDeep = async (path, body) => {
  const response = await fetchWithTimeout(buildUrl(path), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(deepSnakeize(body)) : "{}",
  });
  const data = await safeJson(response, "POST", path);
  return deepCamelize(data);
};

/** 깊은 snake_case 변환 PATCH. 응답도 nested 까지 camelCase 로 변환. */
export const apiPatchDeep = async (path, body) => {
  const response = await fetchWithTimeout(buildUrl(path), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(deepSnakeize(body)) : "{}",
  });
  const data = await safeJson(response, "PATCH", path);
  return deepCamelize(data);
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

/**
 * 바이너리(예: ZIP) 다운로드를 트리거하는 POST.
 * 응답을 blob으로 받아 a 태그 클릭으로 자동 다운로드.
 * 에러는 JSON으로 fallback해서 메시지 추출.
 */
export const apiPostDownload = async (path, body, fallbackFilename = "download.bin") => {
  const response = await fetchWithTimeout(
    buildUrl(path),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(snakeizeTop(body)) : "{}",
    },
    120_000
  );
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      handleAuthFailure(response.status);
    }
    let msg = `다운로드 실패: ${response.status}`;
    try {
      const payload = await response.json();
      msg = payload?.error?.message || payload?.message || msg;
    } catch { /* ignore */ }
    throw new Error(msg);
  }
  const blob = await response.blob();
  // Content-Disposition 에서 filename 추출
  const cd = response.headers.get("content-disposition") || "";
  const match = cd.match(/filename\*?=(?:UTF-8'')?["']?([^"';]+)/i);
  const filename = match ? decodeURIComponent(match[1]) : fallbackFilename;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
  return { filename, sizeBytes: blob.size };
};

export const apiDelete = async (path) => {
  const response = await fetchWithTimeout(buildUrl(path), {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return safeJson(response, "DELETE", path);
};
