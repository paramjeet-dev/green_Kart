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

// Auto-expire listings past their expiry date
listingSchema.index({ expiryDate: 1 }, { expireAfterSeconds: 0 });

// Text index for search
listingSchema.index({ foodName: "text", description: "text" });

// Geo index for location-based queries
listingSchema.index({ "location.lat": 1, "location.lng": 1 });

module.exports = mongoose.model("Listing", listingSchema);
