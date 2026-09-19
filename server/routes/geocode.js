const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { protect } = require("../middleware/auth");

// Nominatim's usage policy (https://operations.osmfoundation.org/policies/nominatim/)
// requires a real User-Agent identifying the app, caps at ~1 req/sec, and
// strongly encourages caching results client-side isn't enough since every
// browser tab counts as a separate "client" from Nominatim's point of view.
// Proxying through the server lets us enforce all three from one place.
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";
const USER_AGENT = `GreenKart/1.0 (+${process.env.CONTACT_EMAIL || "admin@greenkart.com"})`;

// ── Tiny in-memory cache ────────────────────────────────────────────────────
// Addresses don't change minute to minute, and the same query text (or reverse
// lookup near the same coordinates) gets typed by many users. Caching here
// keeps almost all repeat lookups off the network entirely.
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h
const CACHE_MAX_ENTRIES = 5000;
const cache = new Map(); // key -> { data, expiresAt }

function getCached(key) {
  const hit = cache.get(key);
  if (!hit) return null;
  if (hit.expiresAt < Date.now()) {
    cache.delete(key);
    return null;
  }
  return hit.data;
}

function setCached(key, data) {
  if (cache.size >= CACHE_MAX_ENTRIES) {
    // crude FIFO eviction — good enough to keep memory bounded without a dependency
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

// Keep this well under Nominatim's 1 req/sec ceiling even if the cache misses
// on every request from several users at once.
const geocodeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { success: false, message: "Too many location lookups. Please slow down." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Only logged-in users hit this (it's only ever called from listing create/edit
// forms, which already require auth) — keeps it out of reach of anonymous scraping.
router.use(protect, geocodeLimiter);

// @desc    Forward-geocode a free-text address (autocomplete)
// @route   GET /api/geocode/search?q=...
// @access  Private
router.get("/search", async (req, res, next) => {
  try {
    const q = (req.query.q || "").toString().trim();
    if (q.length < 3) {
      return res.status(200).json({ success: true, results: [] });
    }

    const cacheKey = `search:${q.toLowerCase()}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.status(200).json({ success: true, results: cached, cached: true });
    }

    const url = `${NOMINATIM_BASE}/search?q=${encodeURIComponent(q)}&format=json&limit=5&addressdetails=1`;
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, "Accept-Language": "en" },
    });

    if (!response.ok) {
      return res.status(502).json({ success: false, message: "Location lookup is temporarily unavailable" });
    }

    const data = await response.json();
    const results = data.map((item) => ({
      place_id: item.place_id,
      display_name: item.display_name,
      lat: item.lat,
      lon: item.lon,
    }));

    setCached(cacheKey, results);
    res.status(200).json({ success: true, results });
  } catch (error) {
    next(error);
  }
});

// @desc    Reverse-geocode coordinates to an address (e.g. "use my location")
// @route   GET /api/geocode/reverse?lat=...&lon=...
// @access  Private
router.get("/reverse", async (req, res, next) => {
  try {
    const lat = parseFloat(req.query.lat);
    const lon = parseFloat(req.query.lon);
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      return res.status(400).json({ success: false, message: "Valid lat and lon are required" });
    }

    // Round to ~11m precision so nearby requests share a cache entry without
    // meaningfully degrading the address returned.
    const cacheKey = `reverse:${lat.toFixed(4)},${lon.toFixed(4)}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return res.status(200).json({ success: true, result: cached, cached: true });
    }

    const url = `${NOMINATIM_BASE}/reverse?lat=${lat}&lon=${lon}&format=json&addressdetails=1`;
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, "Accept-Language": "en" },
    });

    if (!response.ok) {
      return res.status(502).json({ success: false, message: "Location lookup is temporarily unavailable" });
    }

    const data = await response.json();
    const result = { display_name: data.display_name, lat: data.lat, lon: data.lon };

    setCached(cacheKey, result);
    res.status(200).json({ success: true, result });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
