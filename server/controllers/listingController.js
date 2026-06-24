const Listing = require("../models/Listing");
const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");
const { cloudinary } = require("../config/cloudinary");

// @desc    Get all active listings (with filters)
// @route   GET /api/listings
// @access  Public
exports.getListings = async (req, res, next) => {
  try {
    const { search, category, status = "active", page = 1, limit = 12 } = req.query;

    const query = { status };

    if (search) {
      query.$text = { $search: search };
    }

    if (category) {
      query.category = category;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const listings = await Listing.find(query)
      .populate("donor", "name email role phone avatar")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Listing.countDocuments(query);

    res.status(200).json({
      success: true,
      count: listings.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      listings,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single listing
// @route   GET /api/listings/:id
// @access  Public
exports.getListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate("donor", "name email role phone avatar address")
      .populate("claimedBy", "name email role");

    if (!listing) {
      return next(new ErrorResponse("Listing not found", 404));
    }

    // Increment view count
    await Listing.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });

    res.status(200).json({ success: true, listing });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a listing
// @route   POST /api/listings
// @access  Private (Donor only)
exports.createListing = async (req, res, next) => {
  try {
    const { foodName, description, quantity, category, expiryDate, pickupInstructions, address, lat, lng } = req.body;

    // Handle uploaded images from Cloudinary
    const images = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        images.push({
          url: file.path,
          publicId: file.filename,
        });
      });
    }

    const listing = await Listing.create({
      donor: req.user._id,
      foodName,
      description,
      quantity,
      category,
      expiryDate,
      pickupInstructions,
      images,
      location: {
        address,
        lat: lat ? parseFloat(lat) : undefined,
        lng: lng ? parseFloat(lng) : undefined,
      },
    });

    // Update donor's total donations count
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalDonations: 1 } });

    const populatedListing = await listing.populate("donor", "name email role phone avatar");

    res.status(201).json({ success: true, listing: populatedListing });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a listing
// @route   PUT /api/listings/:id
// @access  Private (Listing owner only)
exports.updateListing = async (req, res, next) => {
  try {
    let listing = await Listing.findById(req.params.id);

    if (!listing) {
      return next(new ErrorResponse("Listing not found", 404));
    }

    if (listing.donor.toString() !== req.user._id.toString()) {
      return next(new ErrorResponse("Not authorized to update this listing", 403));
    }

    const { foodName, description, quantity, category, expiryDate, pickupInstructions, address, lat, lng } = req.body;

    const updateData = {
      foodName,
      description,
      quantity,
      category,
      expiryDate,
      pickupInstructions,
      "location.address": address,
      "location.lat": lat ? parseFloat(lat) : undefined,
      "location.lng": lng ? parseFloat(lng) : undefined,
    };

    // Remove undefined fields
    Object.keys(updateData).forEach((key) => updateData[key] === undefined && delete updateData[key]);

    listing = await Listing.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    }).populate("donor", "name email role phone avatar");

    res.status(200).json({ success: true, listing });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a listing
// @route   DELETE /api/listings/:id
// @access  Private (Listing owner only)
exports.deleteListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return next(new ErrorResponse("Listing not found", 404));
    }

    if (listing.donor.toString() !== req.user._id.toString()) {
      return next(new ErrorResponse("Not authorized to delete this listing", 403));
    }

    // Delete images from Cloudinary
    if (listing.images && listing.images.length > 0) {
      await Promise.all(
        listing.images.map((img) => cloudinary.uploader.destroy(img.publicId))
      );
    }

    await listing.deleteOne();

    res.status(200).json({ success: true, message: "Listing deleted successfully" });
  } catch (error) {
    next(error);
  }
};

// @desc    Claim a listing (NGO/Individual)
// @route   PUT /api/listings/:id/claim
// @access  Private (NGO / Individual)
exports.claimListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return next(new ErrorResponse("Listing not found", 404));
    }

    if (listing.status !== "active") {
      return next(new ErrorResponse("This listing is no longer available", 400));
    }

    if (listing.donor.toString() === req.user._id.toString()) {
      return next(new ErrorResponse("You cannot claim your own listing", 400));
    }

    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      {
        status: "claimed",
        claimedBy: req.user._id,
        claimedAt: new Date(),
      },
      { new: true }
    )
      .populate("donor", "name email role phone avatar")
      .populate("claimedBy", "name email role");

    // Update recipient stats
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalReceived: 1 } });

    res.status(200).json({ success: true, listing: updatedListing });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark listing as completed
// @route   PUT /api/listings/:id/complete
// @access  Private (Donor only)
exports.completeListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id);

    if (!listing) {
      return next(new ErrorResponse("Listing not found", 404));
    }

    if (listing.donor.toString() !== req.user._id.toString()) {
      return next(new ErrorResponse("Not authorized", 403));
    }

    if (listing.status !== "claimed") {
      return next(new ErrorResponse("Listing must be claimed before completing", 400));
    }

    const updatedListing = await Listing.findByIdAndUpdate(
      req.params.id,
      { status: "completed", completedAt: new Date() },
      { new: true }
    )
      .populate("donor", "name email role phone avatar")
      .populate("claimedBy", "name email role");

    res.status(200).json({ success: true, listing: updatedListing });
  } catch (error) {
    next(error);
  }
};

// @desc    Get listings with coordinates for map view
// @route   GET /api/listings/map-data
// @access  Private
exports.getMapListings = async (req, res, next) => {
  try {
    const listings = await Listing.find({
      status: "active",
      "location.lat": { $exists: true, $ne: null },
      "location.lng": { $exists: true, $ne: null },
    })
      .populate("donor", "name role phone")
      .select("foodName quantity category status location expiryDate images donor createdAt")
      .limit(200);

    res.status(200).json({ success: true, count: listings.length, listings });
  } catch (error) {
    next(error);
  }
};

// @desc    Get my listings (donor)
// @route   GET /api/listings/my
// @access  Private
exports.getMyListings = async (req, res, next) => {
  try {
    const listings = await Listing.find({ donor: req.user._id })
      .populate("claimedBy", "name email role")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: listings.length, listings });
  } catch (error) {
    next(error);
  }
};

// @desc    Get dashboard stats
// @route   GET /api/listings/stats
// @access  Private
exports.getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const role = req.user.role;

    let stats = {};

    if (role === "donor") {
      const [active, claimed, completed, total] = await Promise.all([
        Listing.countDocuments({ donor: userId, status: "active" }),
        Listing.countDocuments({ donor: userId, status: "claimed" }),
        Listing.countDocuments({ donor: userId, status: "completed" }),
        Listing.countDocuments({ donor: userId }),
      ]);
      stats = { activeListings: active, claimedListings: claimed, completedExchanges: completed, totalListings: total };
    } else {
      const [claimed, completed, activeTotal] = await Promise.all([
        Listing.countDocuments({ claimedBy: userId }),
        Listing.countDocuments({ claimedBy: userId, status: "completed" }),
        Listing.countDocuments({ status: "active" }),
      ]);
      stats = { claimedListings: claimed, completedExchanges: completed, availableListings: activeTotal };
    }

    // Community stats (global)
    const [totalExchanges, totalActive] = await Promise.all([
      Listing.countDocuments({ status: "completed" }),
      Listing.countDocuments({ status: "active" }),
    ]);

    stats.communityExchanges = totalExchanges;
    stats.communityActiveListings = totalActive;

    res.status(200).json({ success: true, stats });
  } catch (error) {
    next(error);
  }
};