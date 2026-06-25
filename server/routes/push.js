const express = require("express");
const router = express.Router();
const { protect } = require("../middleware/auth");
const PushSubscription = require("../models/PushSubscription");

// @route   GET /api/push/vapid-public-key
// @access  Public
router.get("/vapid-public-key", (req, res) => {
  res.json({ success: true, publicKey: process.env.VAPID_PUBLIC_KEY || null });
});

// @route   POST /api/push/subscribe
// @access  Private
router.post("/subscribe", protect, async (req, res) => {
  try {
    const { subscription } = req.body;

    if (!subscription?.endpoint) {
      return res.status(400).json({ success: false, message: "Invalid subscription object" });
    }

    await PushSubscription.findOneAndUpdate(
      { "subscription.endpoint": subscription.endpoint },
      { user: req.user._id, subscription },
      { upsert: true, new: true }
    );

    res.status(201).json({ success: true, message: "Push subscription saved" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// @route   DELETE /api/push/unsubscribe
// @access  Private
router.delete("/unsubscribe", protect, async (req, res) => {
  try {
    const { endpoint } = req.body;
    await PushSubscription.deleteOne({ user: req.user._id, "subscription.endpoint": endpoint });
    res.status(200).json({ success: true, message: "Unsubscribed" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;