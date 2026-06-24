const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const { adminOnly } = require("../middleware/admin");
const {
  getStats,
  getUsers,
  getUser,
  toggleUser,
  deleteUser,
  getListings,
  expireListing,
  deleteListing,
  getMapData,
} = require("../controllers/adminController");

// All admin routes require auth + admin role
router.use(protect, adminOnly);

router.get("/stats", getStats);
router.get("/map", getMapData);

router.get("/users", getUsers);
router.get("/users/:id", getUser);
router.put("/users/:id/toggle", toggleUser);
router.delete("/users/:id", deleteUser);

router.get("/listings", getListings);
router.put("/listings/:id/expire", expireListing);
router.delete("/listings/:id", deleteListing);

module.exports = router;