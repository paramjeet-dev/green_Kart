const express = require("express");
const router = express.Router();
const { register, login, refreshToken, logout, getMe, updateProfile } = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { authLimiter } = require("../middleware/security");
const { validateRegister, validateLogin, handleValidation, sanitiseBody } = require("../middleware/validate");

router.post("/register", authLimiter, sanitiseBody, validateRegister, handleValidation, register);
router.post("/login",    authLimiter, sanitiseBody, validateLogin,    handleValidation, login);
router.post("/refresh",  authLimiter, refreshToken);
router.post("/logout",   protect, logout);
router.get("/me",        protect, getMe);
router.put("/profile",   protect, sanitiseBody, updateProfile);

module.exports = router;
