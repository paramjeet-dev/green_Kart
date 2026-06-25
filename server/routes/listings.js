const express = require("express");
const router = express.Router();
const {
  getListings, getListing, createListing, updateListing, deleteListing,
  claimListing, completeListing, getMyListings, getDashboardStats, getMapListings,
} = require("../controllers/listingController");
const { protect, authorize } = require("../middleware/auth");
const { upload } = require("../config/cloudinary");
const { uploadLimiter } = require("../middleware/security");
const { validateListing, handleValidation, sanitiseBody } = require("../middleware/validate");

// Public
router.get("/",         getListings);
router.get("/stats",    protect, getDashboardStats);
router.get("/my",       protect, getMyListings);
router.get("/map-data", protect, getMapListings);
router.get("/:id",      getListing);

// Protected
router.post(   "/",           protect, authorize("donor"), uploadLimiter, upload.array("images", 3), sanitiseBody, validateListing, handleValidation, createListing);
router.put(    "/:id",        protect, authorize("donor"), sanitiseBody, updateListing);
router.delete( "/:id",        protect, authorize("donor"), deleteListing);
router.put(    "/:id/claim",  protect, authorize("ngo", "individual"), claimListing);
router.put(    "/:id/complete", protect, authorize("donor"), completeListing);

module.exports = router;