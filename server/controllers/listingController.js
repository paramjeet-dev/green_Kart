const Listing = require("../models/Listing");
const User = require("../models/User");
const ErrorResponse = require("../utils/errorResponse");
const { cloudinary } = require("../config/cloudinary");
const { notifyListingClaimed, notifyExchangeComplete } = require("../utils/push");
const { emailListingClaimed, emailExchangeComplete } = require("../utils/email");
const { canSeeExactLocation, applyLocationPrivacy } = require("../utils/locationPrivacy");

// Builds the GeoJSON Point stored at location.geo from plain lat/lng, or
// undefined when either is missing (a listing without a geocoded pickup
// point just won't show up in "near me" results — it's still findable via
// search/browse).
function buildGeoPoint(lat, lng) {
  if (lat == null || lng == null || Number.isNaN(lat) || Number.isNaN(lng)) return undefined;
  return { type: "Point", coordinates: [lng, lat] };
}

const DEFAULT_RADIUS_KM = 10;
const MAX_RADIUS_KM = 100;

// @desc    Get all active listings (with filters)
// @route   GET /api/listings
// @access  Private (any authenticated role)
exports.getListings = async (req, res, next) => {
  try {
    const { search, category, status = "active", page = 1, limit = 12, lat, lng, radius } = req.query;

    const nearLat = lat !== undefined ? parseFloat(lat) : NaN;
    const nearLng = lng !== undefined ? parseFloat(lng) : NaN;
    const hasNear = !Number.isNaN(nearLat) && !Number.isNaN(nearLng);

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const requesterId = req.user._id.toString();
    const isAdmin = req.user.role === "admin";

    let listingObjs, total;

    if (hasNear) {
      // "Near me" discovery. $geoNear must be the pipeline's first stage and
      // needs the 2dsphere index on location.geo; it sorts by distance for
      // us and adds distanceMeters to every doc, which is what makes "1.2 km
      // away" possible on the card. It can't be combined with a $text search
      // in the same query, so an active "near me" radius takes priority over
      // free-text search (the UI only shows one control at a time).
      const radiusKm = Math.min(parseFloat(radius) || DEFAULT_RADIUS_KM, MAX_RADIUS_KM);
      const matchStage = { status };
      if (category) matchStage.category = category;

      const [result] = await Listing.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: [nearLng, nearLat] },
            distanceField: "distanceMeters",
            maxDistance: radiusKm * 1000,
            spherical: true,
            query: matchStage,
            key: "location.geo",
          },
        },
        {
          $facet: {
            data: [
              { $skip: skip },
              { $limit: parseInt(limit) },
              {
                $lookup: {
                  from: "users",
                  let: { donorId: "$donor" },
                  pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$donorId"] } } },
                    { $project: { name: 1, role: 1, avatar: 1 } },
                  ],
                  as: "donor",
                },
              },
              { $unwind: "$donor" },
            ],
            totalCount: [{ $count: "count" }],
          },
        },
      ]);

      const rawListings = result?.data || [];
      total = result?.totalCount?.[0]?.count || 0;
      listingObjs = rawListings.map((l) => applyLocationPrivacy(l, { requesterId, isAdmin }));
    } else {
      const query = { status };
      if (search) query.$text = { $search: search };
      if (category) query.category = category;

      const listings = await Listing.find(query)
        .populate("donor", "name role avatar")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      total = await Listing.countDocuments(query);
      listingObjs = listings.map((l) => applyLocationPrivacy(l.toObject(), { requesterId, isAdmin }));
    }

    res.status(200).json({
      success: true,
      count: listingObjs.length,
      total,
      pages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      listings: listingObjs,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single listing
// @route   GET /api/listings/:id
// @access  Private (any authenticated role)
exports.getListing = async (req, res, next) => {
  try {
    const listing = await Listing.findById(req.params.id)
      .populate("donor", "name role avatar phone")
      .populate("claimedBy", "name role");

    if (!listing) {
      return next(new ErrorResponse("Listing not found", 404));
    }

    // Only count views from people other than the donor — a donor
    // repeatedly checking their own listing shouldn't inflate its "views"
    // stat. (This doesn't de-duplicate repeat visits from the same
    // recipient; doing that properly needs per-viewer tracking, which felt
    // like more state than this stat warrants — this just fixes the most
    // common source of inflation.)
    if (listing.donor.toString() !== req.user._id.toString()) {
      await Listing.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
    }

    // Exact address, coordinates, and donor phone are only for people
    // actually party to this exchange — the donor, whoever claimed it, or
    // an admin. Everyone else should message through the app first and get
    // an approximate area until a claim is made.
    const listingObj = listing.toObject();
    const requesterId = req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    const authorized = canSeeExactLocation({
      donorId: listingObj.donor?._id,
      claimedById: listingObj.claimedBy?._id,
      requesterId,
      isAdmin,
    });

    if (!authorized && listingObj.donor) {
      delete listingObj.donor.phone;
    }
    applyLocationPrivacy(listingObj, { requesterId, isAdmin });

    res.status(200).json({ success: true, listing: listingObj });
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

    const parsedLat = lat ? parseFloat(lat) : undefined;
    const parsedLng = lng ? parseFloat(lng) : undefined;

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
        lat: parsedLat,
        lng: parsedLng,
        // Keep the GeoJSON point in sync with lat/lng so this listing is
        // actually discoverable by the radius query in getListings below.
        geo: buildGeoPoint(parsedLat, parsedLng),
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

    const parsedLat = lat ? parseFloat(lat) : undefined;
    const parsedLng = lng ? parseFloat(lng) : undefined;

    const updateData = {
      foodName,
      description,
      quantity,
      category,
      expiryDate,
      pickupInstructions,
      "location.address": address,
      "location.lat": parsedLat,
      "location.lng": parsedLng,
      // Re-derive so an edited address/pin still shows up in "near me" results.
      "location.geo": buildGeoPoint(parsedLat, parsedLng),
    };

    // A changed expiry date means the old warning (if any already went out)
    // is no longer relevant to the new deadline — let the cron warn again.
    if (expiryDate) {
      updateData.expiryWarningSent = false;
    }

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

    // A claimed listing has someone else counting on it — deleting it out
    // from under them would orphan their chat thread and any pickup they've
    // arranged. Once it's unclaimed again or actually completed, it's fair
    // game to remove.
    if (listing.status === "claimed") {
      return next(new ErrorResponse("This listing has been claimed and can't be deleted — mark the exchange complete first", 400));
    }

    // Best-effort image cleanup — Promise.all would reject the whole batch
    // (and block deleting the listing) if even one Cloudinary call flaked,
    // so any that fail here are just left as orphaned assets rather than
    // stopping the donor from deleting their own listing.
    if (listing.images && listing.images.length > 0) {
      await Promise.allSettled(
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
    // Fetched only to give a clear "not found" / "can't claim your own"
    // message — the actual claim below is atomic on its own and doesn't
    // rely on this read for correctness.
    const listing = await Listing.findById(req.params.id);
    if (!listing) {
      return next(new ErrorResponse("Listing not found", 404));
    }
    if (listing.donor.toString() === req.user._id.toString()) {
      return next(new ErrorResponse("You cannot claim your own listing", 400));
    }

    // Atomic claim: the availability check happens as part of the same
    // write that sets status to "claimed", not as an earlier separate read.
    // Two people tapping "Claim" at the same moment could previously both
    // pass a `status !== "active"` check before either write landed, so the
    // second write silently overwrote the first — two NGOs both told "you
    // claimed it!" for the same food. Scoping the filter to status: "active"
    // means only the first request can ever match; the second gets null.
    const updatedListing = await Listing.findOneAndUpdate(
      { _id: req.params.id, status: "active" },
      { status: "claimed", claimedBy: req.user._id, claimedAt: new Date() },
      { new: true }
    )
      .populate("donor", "name email role phone avatar")
      .populate("claimedBy", "name email role");

    if (!updatedListing) {
      return next(new ErrorResponse("This listing is no longer available", 400));
    }

    // Update recipient stats
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalReceived: 1 } });

    // Notify donor - push + email (fire and forget)
    const donor = await User.findById(updatedListing.donor._id);
    notifyListingClaimed(donor._id, updatedListing.foodName, req.user.name).catch(() => {});
    emailListingClaimed(donor.email, donor.name, updatedListing.foodName, req.user.name).catch(() => {});

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


    // Notify both parties on completion
    if (updatedListing.claimedBy) {
      const claimer = await User.findById(updatedListing.claimedBy._id);
      notifyExchangeComplete(req.user._id, updatedListing.foodName).catch(() => {});
      notifyExchangeComplete(claimer._id, updatedListing.foodName).catch(() => {});
      emailExchangeComplete(req.user.email, req.user.name, claimer.email, claimer.name, updatedListing.foodName).catch(() => {});
    }
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
      .populate("donor", "name role")
      .select("foodName quantity category status location expiryDate images donor claimedBy createdAt")
      .limit(200);

    const requesterId = req.user._id.toString();
    const isAdmin = req.user.role === "admin";
    const listingObjs = listings.map((l) => applyLocationPrivacy(l.toObject(), { requesterId, isAdmin }));

    res.status(200).json({ success: true, count: listingObjs.length, listings: listingObjs });
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
      .select("-location.geo") // internal-only field used for $geoNear, not a UI value
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