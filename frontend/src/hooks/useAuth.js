import { useMemo, useCallback } from "react";
import { TOKEN_KEY, REFRESH_KEY } from "../utils/api";

export function useAuth() {
  const token = typeof window !== "undefined" ? sessionStorage.getItem(TOKEN_KEY) : null;
  const isLoggedIn = Boolean(token);

  const user = useMemo(() => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
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
