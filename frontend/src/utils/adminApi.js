import { API_BASE, TOKEN_KEY } from "./api";

const buildUrl = (path) => {
  const base = API_BASE.replace(/\/$/, "");
  return path.startsWith("http") ? path : `${base}${path}`;
};

const getToken = () => {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (!token) throw new Error("관리자 토큰이 필요합니다.");
  return token;
};

/**
 * 응답을 안전하게 JSON 파싱.
 * CloudFront가 403/404를 200 + index.html로 변환하는 경우를 방어.
 */
const safeJson = async (response, method, path) => {
  const ct = response.headers.get("content-type") || "";
  if (!ct.includes("application/json")) {
    throw new Error(
      `${method} ${path} 요청 실패: 서버가 JSON이 아닌 응답을 반환했습니다 (${response.status})`
    );
  }
  if (!response.ok) {
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
  const response = await fetch(buildUrl(path), {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return safeJson(response, "GET", path);
};

export const apiPost = async (path, body) => {
  const response = await fetch(buildUrl(path), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : "{}",
  });
  return safeJson(response, "POST", path);
};

export const apiPut = async (path, body) => {
  const response = await fetch(buildUrl(path), {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : "{}",
  });
  return safeJson(response, "PUT", path);
};

export const apiPatch = async (path, body) => {
  const response = await fetch(buildUrl(path), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : "{}",
  });
  return safeJson(response, "PATCH", path);
};

export const apiDelete = async (path) => {
  const response = await fetch(buildUrl(path), {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  return safeJson(response, "DELETE", path);
};
