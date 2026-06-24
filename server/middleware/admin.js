const ErrorResponse = require("../utils/errorResponse");

// Admin role check
exports.adminOnly = (req, res, next) => {
  if (req.user.role !== "admin") {
    return next(new ErrorResponse("Access denied: admin only", 403));
  }
  next();
};