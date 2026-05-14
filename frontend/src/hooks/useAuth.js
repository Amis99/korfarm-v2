import { useMemo, useCallback } from "react";
import { TOKEN_KEY, REFRESH_KEY } from "../utils/api";

// JWT payload 디코드 — base64url + UTF-8 안전 처리.
// atob 는 표준 base64 만 처리하고 padding 이 없으면 일부 브라우저에서 InvalidCharacterError.
// JWT 는 base64url (`-`/`_` 사용 + padding 생략) 이므로 변환 후 디코드 필요.
// 또한 한글 name 등 UTF-8 멀티바이트는 TextDecoder 로 안전 처리.
function decodeJwtPayload(token) {
  const part = token.split(".")[1];
  if (!part) throw new Error("invalid token");
  const b64 = part.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const bytes = Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
  const json = new TextDecoder("utf-8").decode(bytes);
  return JSON.parse(json);
}

export function useAuth() {
  const token = typeof window !== "undefined" ? sessionStorage.getItem(TOKEN_KEY) : null;
  const isLoggedIn = Boolean(token);

  const user = useMemo(() => {
    if (!token) return null;
    try {
      const payload = decodeJwtPayload(token);
      const roles = payload.roles || (payload.role ? [payload.role] : []);
      return {
        id: payload.sub || payload.userId,
        name: payload.name || "농부",
        roles,
      };
    } catch {
      return null;
    }
  }, [token]);

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    window.location.href = import.meta.env.BASE_URL || "/";
  }, []);

  const roles = user?.roles || [];
  const isPremium = roles.includes("HQ_ADMIN") || roles.includes("ORG_ADMIN") || roles.includes("PAID") || roles.includes("PREMIUM");

  return { isLoggedIn, user, token, isPremium, logout };
}
