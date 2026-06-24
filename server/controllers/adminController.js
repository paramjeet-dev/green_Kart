const User = require("../models/User");
const Listing = require("../models/Listing");
const Message = require("../models/Message");
const ErrorResponse = require("../utils/errorResponse");

// @desc    Get platform-wide stats
// @route   GET /api/admin/stats
// @access  Admin
exports.getStats = async (req, res, next) => {
  try {
    const [
      totalUsers, totalDonors, totalNGOs, totalIndividuals,
      totalListings, activeListings, claimedListings, completedListings, expiredListings,
      totalMessages,
      recentUsers, recentListings,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "donor" }),
      User.countDocuments({ role: "ngo" }),
      User.countDocuments({ role: "individual" }),
      Listing.countDocuments(),
      Listing.countDocuments({ status: "active" }),
      Listing.countDocuments({ status: "claimed" }),
      Listing.countDocuments({ status: "completed" }),
      Listing.countDocuments({ status: "expired" }),
      Message.countDocuments(),
      User.find().sort({ createdAt: -1 }).limit(5).select("name email role createdAt"),
      Listing.find().sort({ createdAt: -1 }).limit(5).populate("donor", "name").select("foodName status createdAt donor"),
    ]);

    // Monthly breakdown — last 6 months
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyListings = await Listing.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          total: { $sum: 1 },
          completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    const monthlyUsers = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { year: { $year: "$createdAt" }, month: { $month: "$createdAt" } },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]);

    res.status(200).json({
      success: true,
      stats: {
        users: { total: totalUsers, donors: totalDonors, ngos: totalNGOs, individuals: totalIndividuals },
        listings: { total: totalListings, active: activeListings, claimed: claimedListings, completed: completedListings, expired: expiredListings },
        messages: { total: totalMessages },
        recentUsers,
        recentListings,
        monthlyListings,
        monthlyUsers,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Admin
exports.getUsers = async (req, res, next) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      users,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single user
// @route   GET /api/admin/users/:id
// @access  Admin
exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(new ErrorResponse("User not found", 404));

    const [listings, claimedListings] = await Promise.all([
      Listing.find({ donor: user._id }).sort({ createdAt: -1 }).limit(10),
      Listing.find({ claimedBy: user._id }).sort({ claimedAt: -1 }).limit(10),
    ]);

    res.status(200).json({ success: true, user, listings, claimedListings });
  } catch (error) {
    next(error);
  }
};

// @desc    Toggle user active status
// @route   PUT /api/admin/users/:id/toggle
// @access  Admin
exports.toggleUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(new ErrorResponse("User not found", 404));
    if (user.email === req.user.email) return next(new ErrorResponse("Cannot deactivate your own account", 400));

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({ success: true, user, message: `User ${user.isActive ? "activated" : "deactivated"} successfully` });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Admin
exports.deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return next(new ErrorResponse("User not found", 404));
    if (user.email === req.user.email) return next(new ErrorResponse("Cannot delete your own account", 400));

    await Promise.all([
      Listing.deleteMany({ donor: user._id }),
      Message.deleteMany({ $or: [{ sender: user._id }, { receiver: user._id }] }),
      user.deleteOne(),
    ]);

    res.status(200).json({ success: true, message: "User and all associated data deleted" });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all listings (admin view)
// @route   GET /api/admin/listings
// @access  Admin
exports.getListings = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = status;
    if (search) query.$text = { $search: search };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [listings, total] = await Promise.all([
      Listing.find(query)
        .populate("donor", "name email role")
        .populate("claimedBy", "name email role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Listing.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      listings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Force-expire a listing
// @route   PUT /api/admin/listings/:id/expire
// @access  Admin
exports.expireListing = async (req, res, next) => {
  try {
    const listing = await Listing.findByIdAndUpdate(
      req.params.id,
      { status: "expired" },
      { new: true }
    ).populate("donor", "name email");

    if (!listing) return next(new ErrorResponse("Listing not found", 404));

    res.status(200).json({ success: true, listing });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a listing (admin)
// @route   DELETE /api/admin/listings/:id
// @access  Admin
exports.deleteListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return next(new ErrorResponse("Listing not found", 404));
    await listing.deleteOne();
    res.status(200).json({ success: true, message: "Listing deleted by admin" });
  } catch (error) {
    next(error);
  }
};

// @desc    Get map data — all active listings with coordinates
// @route   GET /api/admin/map
// @access  Admin
exports.getMapData = async (req, res, next) => {
  try {
    const listings = await Listing.find({
      status: { $in: ["active", "claimed"] },
      "location.lat": { $exists: true, $ne: null },
      "location.lng": { $exists: true, $ne: null },
    })
      .populate("donor", "name role")
      .select("foodName quantity category status location expiryDate images donor createdAt");

    res.status(200).json({ success: true, count: listings.length, listings });
  } catch (error) {
    next(error);
  }
};