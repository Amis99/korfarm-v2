import { useMemo } from "react";
import { TOKEN_KEY } from "../utils/api";

export function useAuth() {
  const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
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

  const roles = user?.roles || [];
  const isPremium = roles.includes("PAID") || roles.includes("ADMIN") || roles.includes("PREMIUM");

  return { isLoggedIn, user, token, isPremium };
}
