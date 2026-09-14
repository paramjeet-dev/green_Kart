import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { getTokenExpiryMs } from "../utils/jwt";

const REFRESH_MARGIN_MS = 60 * 1000;       // refresh 1 minute before the token actually expires
const FALLBACK_DELAY_MS = 5 * 60 * 1000;   // only used if a token can't be decoded
const MIN_DELAY_MS = 10 * 1000;            // never hammer the refresh endpoint

// How long to wait before refreshing, based on the token's real `exp` claim —
// not a hardcoded guess. Previously this assumed a 7-minute access token and
// refreshed every 6 minutes regardless of the server's actual JWT_EXPIRE
// (default 7 days), which did nothing but waste requests and — on a shared
// IP — could trip the /auth/refresh rate limiter for everyone on it.
const delayFor = (token) => {
  const expiryMs = token ? getTokenExpiryMs(token) : null;
  if (!expiryMs) return FALLBACK_DELAY_MS;
  return Math.max(MIN_DELAY_MS, expiryMs - Date.now() - REFRESH_MARGIN_MS);
};

export default function useTokenRefresh() {
  const { token, logout, isAuthenticated, refreshAccessToken } = useAuth();
  const timerRef = useRef(null);

  useEffect(() => {
    if (!isAuthenticated || !token) {
      clearTimeout(timerRef.current);
      return;
    }

    const scheduleNext = (forToken) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        try {
          const newToken = await refreshAccessToken(); // reads the httpOnly cookie server-side
          scheduleNext(newToken); // reschedule from the fresh token, not stale context state
        } catch {
          logout();
        }
      }, delayFor(forToken));
    };

    scheduleNext(token);
    return () => clearTimeout(timerRef.current);
    // Only (re)start the cycle when auth state changes — rescheduling after
    // each refresh is handled internally via scheduleNext's own closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);
}