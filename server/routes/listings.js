const express = require("express");
const router = express.Router();
const {
  getListings,
  getListing,
  createListing,
  updateListing,
  deleteListing,
  claimListing,
  completeListing,
  getMyListings,
  getDashboardStats,
} = require("../controllers/listingController");
const { protect, authorize } = require("../middleware/auth");
const { upload } = require("../config/cloudinary");

// Public routes
router.get("/", getListings);
router.get("/stats", protect, getDashboardStats);
router.get("/my", protect, getMyListings);
router.get("/:id", getListing);

// Protected routes
router.post("/", protect, authorize("donor"), upload.array("images", 3), createListing);
router.put("/:id", protect, authorize("donor"), updateListing);
router.delete("/:id", protect, authorize("donor"), deleteListing);
router.put("/:id/claim", protect, authorize("ngo", "individual"), claimListing);
router.put("/:id/complete", protect, authorize("donor"), completeListing);

module.exports = router;
