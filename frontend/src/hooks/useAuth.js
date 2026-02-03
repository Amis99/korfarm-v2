import { useMemo } from "react";

const TOKEN_KEY = "korfarm_token";

export function useAuth() {
  const token = typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null;
  const isLoggedIn = Boolean(token);

  const user = useMemo(() => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return {
        id: payload.sub || payload.userId,
        name: payload.name || "농부",
        role: payload.role || "FREE",
      };
    } catch {
      return null;
    }
  }, [token]);

  const isPremium = user?.role === "PAID" || user?.role === "ADMIN";

  return { isLoggedIn, user, token, isPremium };
}
