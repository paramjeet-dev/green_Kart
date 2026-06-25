const User = require("../models/User");
const RefreshToken = require("../models/RefreshToken");
const generateToken = require("../utils/generateToken");
const ErrorResponse = require("../utils/errorResponse");
const { emailWelcome } = require("../utils/email");

const sendTokenResponse = async (user, statusCode, req, res) => {
  const accessToken = generateToken(user._id);
  const refreshTokenDoc = await RefreshToken.generate(user._id, req);

  const userPayload = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    address: user.address,
    avatar: user.avatar,
    totalDonations: user.totalDonations,
    totalReceived: user.totalReceived,
    createdAt: user.createdAt,
  };

  res.status(statusCode).json({
    success: true,
    token: accessToken,
    refreshToken: refreshTokenDoc.token,
    user: userPayload,
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, role, phone, address } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return next(new ErrorResponse("Email already registered", 400));

    const user = await User.create({ name, email, password, role, phone, address });
    emailWelcome(user.email, user.name, user.role).catch(() => {});
    await sendTokenResponse(user, 201, req, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) return next(new ErrorResponse("Please provide email and password", 400));

    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchPassword(password))) {
      return next(new ErrorResponse("Invalid email or password", 403));
    }
    if (!user.isActive) return next(new ErrorResponse("Your account has been deactivated", 403));

    await sendTokenResponse(user, 200, req, res);
  } catch (error) {
    next(error);
  }
};

// @desc    Refresh access token
// @route   POST /api/auth/refresh
// @access  Public (requires valid refresh token)
exports.refreshToken = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return next(new ErrorResponse("Refresh token is required", 400));

    const tokenDoc = await RefreshToken.findOne({ token: refreshToken, isRevoked: false });

    if (!tokenDoc || tokenDoc.expiresAt < new Date()) {
      if (tokenDoc) await tokenDoc.deleteOne();
      return next(new ErrorResponse("Invalid or expired refresh token. Please log in again.", 401));
    }

    const user = await User.findById(tokenDoc.user);
    if (!user || !user.isActive) {
      await tokenDoc.deleteOne();
      return next(new ErrorResponse("User not found or deactivated", 401));
    }

    // Rotate — revoke old, issue new
    await tokenDoc.deleteOne();
    const accessToken = generateToken(user._id);
    const newRefreshTokenDoc = await RefreshToken.generate(user._id, req);

    res.status(200).json({
      success: true,
      token: accessToken,
      refreshToken: newRefreshTokenDoc.token,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Logout — revoke refresh token
// @route   POST /api/auth/logout
// @access  Private
exports.logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (refreshToken) {
      await RefreshToken.deleteOne({ token: refreshToken });
    }
    res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res, next) => {
  try {
    const { name, phone, address } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, phone, address },
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};
