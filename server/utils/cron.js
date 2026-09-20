const cron = require("node-cron");
const Listing = require("../models/Listing");
const RefreshToken = require("../models/RefreshToken");
const User = require("../models/User");
const { notifyExpiryWarning } = require("./push");
const { emailExpiryWarning } = require("./email");

const setupCronJobs = () => {
  // ── Expire overdue listings every hour ──────────────────────────────────────
  cron.schedule("0 * * * *", async () => {
    try {
      const result = await Listing.updateMany(
        {
          status: "active",
          expiryDate: { $lte: new Date() },
        },
        { $set: { status: "expired" } }
      );

      if (result.modifiedCount > 0) {
        console.log(`⏰ Cron: Expired ${result.modifiedCount} listing(s)`);
      }
    } catch (err) {
      console.error("Cron expiry error:", err.message);
    }
  });

  // ── Clean up revoked/expired refresh tokens daily at 2am ───────────────────
  cron.schedule("0 2 * * *", async () => {
    try {
      const result = await RefreshToken.deleteMany({
        $or: [{ expiresAt: { $lte: new Date() } }, { isRevoked: true }],
      });
      if (result.deletedCount > 0) {
        console.log(`🧹 Cron: Cleaned ${result.deletedCount} stale refresh token(s)`);
      }
    } catch (err) {
      console.error("Cron token cleanup error:", err.message);
    }
  });

  // ── Archive claimed listings not completed after 7 days daily at 3am ────────
  cron.schedule("0 3 * * *", async () => {
    try {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const result = await Listing.updateMany(
        {
          status: "claimed",
          claimedAt: { $lte: sevenDaysAgo },
        },
        { $set: { status: "expired" } }
      );
      if (result.modifiedCount > 0) {
        console.log(`🗂️  Cron: Archived ${result.modifiedCount} stale claimed listing(s)`);
      }
    } catch (err) {
      console.error("Cron archive error:", err.message);
    }
  });

  // -- Send expiry warnings, checked hourly for listings expiring within 24h --
  // Previously this ran once a day at a fixed noon, so a listing whose 24h
  // window opened shortly after that run wouldn't get warned until nearly a
  // full day later — sometimes after it had already expired. Running hourly
  // and tracking `expiryWarningSent` (so a listing is only ever warned once,
  // instead of every run for as long as it stays in the 24h window) makes
  // the warning relative to each listing's own expiry instead of the clock.
  cron.schedule("0 * * * *", async () => {
    try {
      const in24h = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const expiring = await Listing.find({
        status: "active",
        expiryDate: { $gte: new Date(), $lte: in24h },
        expiryWarningSent: { $ne: true },
      }).populate("donor", "name email");
      for (const listing of expiring) {
        if (!listing.donor) continue;
        notifyExpiryWarning(listing.donor._id, listing.foodName).catch(() => {});
        emailExpiryWarning(listing.donor.email, listing.donor.name, listing.foodName, listing._id).catch(() => {});
        listing.expiryWarningSent = true;
        await listing.save();
      }
      if (expiring.length) console.log(`⚠️  Cron: Warned donors about ${expiring.length} expiring listing(s)`);
    } catch (err) { console.error("Cron expiry warning error:", err.message); }
  });

  console.log("⏱️  Cron jobs initialised");
};

module.exports = setupCronJobs;