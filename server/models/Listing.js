const mongoose = require("mongoose");

const listingSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    foodName: {
      type: String,
      required: [true, "Food name is required"],
      trim: true,
      maxlength: [100, "Food name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    quantity: {
      type: String,
      required: [true, "Quantity is required"],
      trim: true,
    },
    category: {
      type: String,
      enum: ["cooked", "raw", "packaged", "fruits", "vegetables", "dairy", "bakery", "other"],
      default: "other",
    },
    expiryDate: {
      type: Date,
      required: [true, "Expiry date is required"],
    },
    pickupInstructions: {
      type: String,
      trim: true,
      maxlength: [300, "Pickup instructions cannot exceed 300 characters"],
    },
    images: [
      {
        url: { type: String },
        publicId: { type: String },
      },
    ],
    location: {
      address: { type: String, required: [true, "Address is required"] },
      lat: { type: Number },
      lng: { type: Number },
      // GeoJSON mirror of lat/lng, kept in sync by the controller whenever
      // location is written (see listingController create/updateListing).
      // MongoDB's geospatial queries ($near / $geoNear) require coordinates
      // in this [lng, lat] Point shape backed by a 2dsphere index — the old
      // plain lat/lng fields can't power a "listings within X km" query.
      geo: {
        type: { type: String, enum: ["Point"], default: "Point" },
        coordinates: { type: [Number], default: undefined }, // [lng, lat]
      },
    },
    status: {
      type: String,
      enum: ["active", "claimed", "completed", "expired"],
      default: "active",
    },
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    claimedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    views: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// NOTE: this used to be a TTL index (`expireAfterSeconds: 0`), which made MongoDB
// permanently DELETE the document the moment expiryDate passed — including
// listings that were already claimed/completed, silently corrupting donation
// history, dashboard stats, and any chat thread that referenced the listing.
// Marking listings "expired" is handled by the hourly cron job in utils/cron.js
// instead; this plain index just keeps that query (and the "expiring soon"
// reminder query) fast.
listingSchema.index({ status: 1, expiryDate: 1 });

// Supports getMyListings/getDashboardStats, which always filter by the
// listing's owner — without this every "my listings" or "my stats" query was
// doing a full collection scan.
listingSchema.index({ donor: 1 });

// Same reasoning for the claimant side: getDashboardStats' "food I've
// claimed" counts, and the claimedBy lookups in deleteUser, both filter on
// this field alone.
listingSchema.index({ claimedBy: 1 });

// Supports the daily cron job that archives listings stuck in "claimed" for too long
listingSchema.index({ status: 1, claimedAt: 1 });

// Text index for search
listingSchema.index({ foodName: "text", description: "text" });

// Powers "listings near me": $geoNear/$near queries need a 2dsphere index on
// a GeoJSON field. The old { "location.lat": 1, "location.lng": 1 } index
// could only ever support exact-match lookups, not real radius/distance
// queries, which is why "nearby listings" was never actually implemented.
listingSchema.index({ "location.geo": "2dsphere" });

module.exports = mongoose.model("Listing", listingSchema);