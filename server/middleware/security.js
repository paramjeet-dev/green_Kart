const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

// ── Helmet ────────────────────────────────────────────────────────────────────
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "res.cloudinary.com", "*.openstreetmap.org", "tile.openstreetmap.org"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      connectSrc: ["'self'", "nominatim.openstreetmap.org"],
    },
  },
  crossOriginEmbedderPolicy: false, // allow Leaflet tiles
});

// ── Rate limiters ─────────────────────────────────────────────────────────────

// Strict: auth endpoints — 10 requests / 15 min per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
});

// Standard: general API — 100 requests / 15 min per IP
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: "Too many requests. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.NODE_ENV === "development", // disable in dev
});

// Upload: listing creation with images — 20 / hour per IP
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 20,
  message: { success: false, message: "Upload limit reached. Try again in an hour." },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { helmetConfig, authLimiter, apiLimiter, uploadLimiter };