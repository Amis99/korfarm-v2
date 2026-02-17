export const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8080";
export const TOKEN_KEY = "korfarm_token";

const buildUrl = (path) => {
  const base = API_BASE.replace(/\/$/, "");
  return path.startsWith("http") ? path : `${base}${path}`;
};

const authHeaders = () => {
  const token = localStorage.getItem(TOKEN_KEY);
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const apiGet = async (path) => {
  const response = await fetch(buildUrl(path), {
    headers: authHeaders(),
  });
  if (!response.ok) {
    throw new Error(`GET ${path} failed: ${response.status}`);
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
    throw new Error(`POST ${path} failed: ${response.status}`);
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
    throw new Error(`DELETE ${path} failed: ${response.status}`);
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
    throw new Error(`PUT ${path} failed: ${response.status}`);
  }
  const payload = await response.json();
  return payload?.data ?? payload;
};
