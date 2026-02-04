const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";
const TOKEN_KEY = "korfarm_token";

const buildUrl = (path) => {
  const base = API_BASE.replace(/\/$/, "");
  return path.startsWith("http") ? path : `${base}${path}`;
};

export const apiGet = async (path) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    throw new Error("관리자 토큰이 필요합니다.");
  }
  const response = await fetch(buildUrl(path), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = await response.json();
  if (!response.ok || payload?.success === false) {
    const message = payload?.error?.message || payload?.message || "요청에 실패했습니다.";
    throw new Error(message);
  }
  return payload?.data ?? payload;
};

export const apiPost = async (path, body) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    throw new Error("관리자 권한이 필요합니다.");
  }
  const response = await fetch(buildUrl(path), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : "{}",
  });
  const payload = await response.json();
  if (!response.ok || payload?.success === false) {
    const message = payload?.error?.message || payload?.message || "요청에 실패했습니다.";
    throw new Error(message);
  }
  return payload?.data ?? payload;
};

export const apiPut = async (path, body) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    throw new Error("관리자 권한이 필요합니다.");
  }
  const response = await fetch(buildUrl(path), {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : "{}",
  });
  const payload = await response.json();
  if (!response.ok || payload?.success === false) {
    const message = payload?.error?.message || payload?.message || "요청에 실패했습니다.";
    throw new Error(message);
  }
  return payload?.data ?? payload;
};

export const apiPatch = async (path, body) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    throw new Error("관리자 권한이 필요합니다.");
  }
  const response = await fetch(buildUrl(path), {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : "{}",
  });
  const payload = await response.json();
  if (!response.ok || payload?.success === false) {
    const message = payload?.error?.message || payload?.message || "요청에 실패했습니다.";
    throw new Error(message);
  }
  return payload?.data ?? payload;
};

export const apiDelete = async (path) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    throw new Error("관리자 권한이 필요합니다.");
  }
  const response = await fetch(buildUrl(path), {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const payload = await response.json();
  if (!response.ok || payload?.success === false) {
    const message = payload?.error?.message || payload?.message || "요청에 실패했습니다.";
    throw new Error(message);
  }
  return payload?.data ?? payload;
};
