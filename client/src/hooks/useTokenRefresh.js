import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

const ACCESS_TOKEN_TTL_MS = 6 * 60 * 1000; // refresh 1 min before 7-min window (conservative)

export default function useTokenRefresh() {
  const { token, logout, isAuthenticated } = useAuth();
  const timerRef = useRef(null);

  const refresh = useCallback(async () => {
    const refreshToken = localStorage.getItem("gk_refresh_token");
    if (!refreshToken) { logout(); return; }

    try {
      const { data } = await api.post("/auth/refresh", { refreshToken });
      localStorage.setItem("gk_token", data.token);
      localStorage.setItem("gk_refresh_token", data.refreshToken);
      // Reschedule
      scheduleRefresh();
    } catch {
      logout();
    }
  }, [logout]);

  const scheduleRefresh = useCallback(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(refresh, ACCESS_TOKEN_TTL_MS);
  }, [refresh]);

  useEffect(() => {
    if (!isAuthenticated) { clearTimeout(timerRef.current); return; }
    scheduleRefresh();
    return () => clearTimeout(timerRef.current);
  }, [isAuthenticated, scheduleRefresh]);
}