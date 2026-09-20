import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api, { refreshAccessToken as refreshTokenRequest } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("gk_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("gk_token") || null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(async () => {
    api.post("/auth/logout").catch(() => {});
    setToken(null);
    setUser(null);
    localStorage.removeItem("gk_token");
    localStorage.removeItem("gk_user");
  }, []);

  // The refresh token lives in an httpOnly cookie the browser sends automatically —
  // this just asks the server to mint a new access token from it. The actual
  // request lives in services/api.js so this and the reactive 401 handler
  // there share one implementation instead of two.
  const refreshAccessToken = useCallback(async () => {
    const newToken = await refreshTokenRequest();
    setToken(newToken);
    return newToken;
  }, []);

  // Verify token on mount. api.js's response interceptor already retries a
  // 401 here with one silent refresh before this ever sees an error, so if
  // this still throws, the session is genuinely gone — no need to duplicate
  // that refresh attempt here too.
  useEffect(() => {
    const verify = async () => {
      if (!token) { setLoading(false); return; }
      try {
        const { data } = await api.get("/auth/me");
        setUser(data.user);
        localStorage.setItem("gk_user", JSON.stringify(data.user));
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    };
    verify();
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("gk_token", data.token);
    localStorage.setItem("gk_user", JSON.stringify(data.user));
    return data.user;
  }, []);

  const register = useCallback(async (formData) => {
    const { data } = await api.post("/auth/register", formData);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem("gk_token", data.token);
    localStorage.setItem("gk_user", JSON.stringify(data.user));
    return data.user;
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem("gk_user", JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateUser, refreshAccessToken, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};