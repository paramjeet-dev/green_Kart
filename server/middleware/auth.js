const jwt = require("jsonwebtoken");
const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");

// Protect routes - verify JWT
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new ErrorResponse("Not authorized to access this route", 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);

    if (!req.user) {
      // A token can outlive the user it was issued for (deleted account,
      // stale token from before a wipe). This is an auth failure — 401, not
      // 404 — because the client's response interceptor only treats 401 as
      // "session is gone, log the user out" (see client/src/services/api.js).
      return next(new ErrorResponse("Not authorized, user no longer exists", 401));
    }

    // login() already refuses a deactivated account at sign-in, but that
    // does nothing for a token issued *before* an admin deactivated them —
    // without this check it keeps working for the rest of its (up to
    // 7-day) lifetime. Check it on every request, not just at login.
    if (!req.user.isActive) {
      return next(new ErrorResponse("Your account has been deactivated", 401));
    }

    next();
  } catch (error) {
    return next(new ErrorResponse("Not authorized, token failed", 401));
  }
};

// Role-based authorization
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorResponse(`Role '${req.user.role}' is not authorized to access this route`, 403)
      );
    }
    next();
  };
};
