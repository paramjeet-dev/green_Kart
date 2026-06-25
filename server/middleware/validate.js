const { body, validationResult } = require("express-validator");

// ── Sanitise and strip dangerous characters from all string body fields ────────
const sanitiseBody = (req, res, next) => {
  if (!req.body || typeof req.body !== "object") return next();

  const dangerous = /<[^>]*>|javascript:|on\w+\s*=/gi;

  const clean = (val) => {
    if (typeof val !== "string") return val;
    return val.replace(dangerous, "").trim();
  };

  const sanitiseObj = (obj) => {
    for (const key of Object.keys(obj)) {
      if (typeof obj[key] === "string") {
        obj[key] = clean(obj[key]);
      } else if (typeof obj[key] === "object" && obj[key] !== null) {
        sanitiseObj(obj[key]);
      }
    }
  };

  sanitiseObj(req.body);
  next();
};

// ── Validation rule sets ──────────────────────────────────────────────────────

const validateRegister = [
  body("name")
    .trim()
    .notEmpty().withMessage("Name is required")
    .isLength({ min: 2, max: 50 }).withMessage("Name must be 2–50 characters")
    .escape(),
  body("email")
    .trim()
    .notEmpty().withMessage("Email is required")
    .isEmail().withMessage("Must be a valid email")
    .normalizeEmail(),
  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  body("role")
    .notEmpty().withMessage("Role is required")
    .isIn(["donor", "ngo", "individual"]).withMessage("Invalid role"),
  body("phone").optional().trim().escape(),
  body("address").optional().trim().escape(),
];

const validateLogin = [
  body("email").trim().notEmpty().withMessage("Email is required").isEmail().normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

const validateListing = [
  body("foodName")
    .trim()
    .notEmpty().withMessage("Food name is required")
    .isLength({ max: 100 }).withMessage("Max 100 characters")
    .escape(),
  body("quantity")
    .trim()
    .notEmpty().withMessage("Quantity is required")
    .escape(),
  body("expiryDate")
    .notEmpty().withMessage("Expiry date is required")
    .isISO8601().withMessage("Invalid date format")
    .custom((val) => {
      if (new Date(val) <= new Date()) throw new Error("Expiry date must be in the future");
      return true;
    }),
  body("description").optional().trim().isLength({ max: 500 }).escape(),
  body("pickupInstructions").optional().trim().isLength({ max: 300 }).escape(),
  body("category")
    .optional()
    .isIn(["cooked", "raw", "packaged", "fruits", "vegetables", "dairy", "bakery", "other"])
    .withMessage("Invalid category"),
  body("address").trim().notEmpty().withMessage("Pickup address is required").escape(),
  body("lat").optional().isFloat({ min: -90, max: 90 }).withMessage("Invalid latitude"),
  body("lng").optional().isFloat({ min: -180, max: 180 }).withMessage("Invalid longitude"),
];

const validateMessage = [
  body("content")
    .trim()
    .notEmpty().withMessage("Message cannot be empty")
    .isLength({ max: 1000 }).withMessage("Message too long")
    .escape(),
  body("listingId").notEmpty().isMongoId().withMessage("Invalid listing"),
  body("receiverId").notEmpty().isMongoId().withMessage("Invalid receiver"),
];

// ── Validation result handler ─────────────────────────────────────────────────
const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const message = errors.array().map((e) => e.msg).join(", ");
    return res.status(400).json({ success: false, message });
  }
  next();
};

module.exports = {
  sanitiseBody,
  validateRegister,
  validateLogin,
  validateListing,
  validateMessage,
  handleValidation,
};