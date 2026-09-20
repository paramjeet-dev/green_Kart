import axios from "axios";

const api = axios.create({
  baseURL: "/api",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
  withCredentials: true, // send the httpOnly refresh-token cookie
});

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("gk_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// A bare axios instance with none of this file's interceptors — used only
// for the refresh call itself, since calling it through `api` would run
// straight back into the response interceptor below and recurse.
const refreshClient = axios.create({ baseURL: "/api", withCredentials: true });

let pendingRefresh = null;

// The one place that actually talks to POST /auth/refresh. Used both
// reactively (by the 401 handler just below) and proactively (by
// AuthContext / useTokenRefresh, which schedule a refresh shortly before
// the token would expire) — previously each of those had its own separate
// refresh logic, which is what let the redirect-vs-silent-refresh race
// described below happen in the first place.
export function refreshAccessToken() {
  if (!pendingRefresh) {
    // Multiple requests can 401 around the same moment (e.g. several
    // widgets loading data at once) — share one in-flight refresh instead
    // of firing several concurrent POST /auth/refresh calls, any of which
    // would revoke the refresh token the others are relying on (rotation).
    pendingRefresh = refreshClient
      .post("/auth/refresh")
      .then(({ data }) => {
        localStorage.setItem("gk_token", data.token);
        return data.token;
      })
      .finally(() => { pendingRefresh = null; });
  }
  return pendingRefresh;
}

// Requests to these already-public/self-contained auth endpoints should
// never trigger a refresh-and-retry — a failed login is just a failed
// login, and refreshing off a failed /auth/refresh would recurse.
const SKIP_REFRESH = ["/auth/login", "/auth/register", "/auth/refresh"];

// On a 401 from anything else, try one silent refresh (via the httpOnly
// cookie) and replay the original request before giving up. Only a refresh
// that itself fails means the session is actually gone — that's the one
// place this clears storage and sends the user to /login. This replaces
// the old "redirect on any 401" behaviour, which used to fire in parallel
// with AuthContext's own mount-time refresh attempt: a merely-stale access
// token on page load could win a race against a full-page redirect instead
// of quietly refreshing.
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response, config } = error;

    if (!response || response.status !== 401 || !config || config._retried || SKIP_REFRESH.some((p) => config.url?.includes(p))) {
      return Promise.reject(error);
    }

    config._retried = true;
    try {
      const newToken = await refreshAccessToken();
      config.headers.Authorization = `Bearer ${newToken}`;
      return api(config);
    } catch {
      localStorage.removeItem("gk_token");
      localStorage.removeItem("gk_user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
      return Promise.reject(error);
    }
  }
);

export default api;