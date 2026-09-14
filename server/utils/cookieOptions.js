// The refresh token is a long-lived credential (30 days — see RefreshToken.generate),
// so it's stored as an httpOnly cookie rather than in the JSON body / localStorage.
// That way an XSS bug can't read it and use it to mint new access tokens forever.
const REFRESH_COOKIE_NAME = "gk_refresh_token";

const refreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/auth", // only ever sent to the auth endpoints that need it (refresh, logout)
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
});

module.exports = { REFRESH_COOKIE_NAME, refreshCookieOptions };