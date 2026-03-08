import { API_BASE, TOKEN_KEY } from "./api";

const buildUrl = (path) => {
  const base = API_BASE.replace(/\/$/, "");
  return path.startsWith("http") ? path : `${base}${path}`;
};

const getToken = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) throw new Error("관리자 토큰이 필요합니다.");
  return token;
};

const parseError = async (response, method, path) => {
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
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!response.ok) {
    throw new Error(await parseError(response, "GET", path));
  }
  const payload = await response.json();
  return payload?.data ?? payload;
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
  if (!response.ok) {
    throw new Error(await parseError(response, "POST", path));
  }
  const payload = await response.json();
  return payload?.data ?? payload;
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
  if (!response.ok) {
    throw new Error(await parseError(response, "PUT", path));
  }
  const payload = await response.json();
  return payload?.data ?? payload;
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
  if (!response.ok) {
    throw new Error(await parseError(response, "PATCH", path));
  }
  const payload = await response.json();
  return payload?.data ?? payload;
};

export const apiDelete = async (path) => {
  const response = await fetch(buildUrl(path), {
    method: "DELETE",
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!response.ok) {
    throw new Error(await parseError(response, "DELETE", path));
  }
  const payload = await response.json();
  return payload?.data ?? payload;
};
