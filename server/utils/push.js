const webpush = require("web-push");
const PushSubscription = require("../models/PushSubscription");

// Configure VAPID — keys come from .env (generate once with: npx web-push generate-vapid-keys)
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_EMAIL || "admin@greenkart.com"}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
}

// ── Send a push to a single user ──────────────────────────────────────────────
const sendPushToUser = async (userId, payload) => {
  if (!process.env.VAPID_PUBLIC_KEY) return; // silently skip if not configured

  const subscriptions = await PushSubscription.find({ user: userId });
  if (!subscriptions.length) return;

  const message = JSON.stringify(payload);
  const stale = [];

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(sub.subscription, message);
      } catch (err) {
        // 404/410 = subscription expired or unsubscribed
        if (err.statusCode === 404 || err.statusCode === 410) {
          stale.push(sub._id);
        }
      }
    })
  );

  // Remove stale subscriptions
  if (stale.length) {
    await PushSubscription.deleteMany({ _id: { $in: stale } });
  }
};

// ── Notification builders ─────────────────────────────────────────────────────

const notifyListingClaimed = (donorId, listingName, claimerName) =>
  sendPushToUser(donorId, {
    title: "Your food was claimed! 🎉",
    body: `${claimerName} claimed your listing "${listingName}". Coordinate the pickup.`,
    icon: "/pwa-192x192.png",
    url: "/listings",
    tag: "listing-claimed",
  });

const notifyExchangeComplete = (userId, listingName) =>
  sendPushToUser(userId, {
    title: "Exchange completed! 🌱",
    body: `The exchange for "${listingName}" is marked complete. Thank you for reducing food waste!`,
    icon: "/pwa-192x192.png",
    url: "/dashboard",
    tag: "exchange-complete",
  });

const notifyNewMessage = (receiverId, senderName, preview) =>
  sendPushToUser(receiverId, {
    title: `New message from ${senderName}`,
    body: preview.length > 60 ? preview.slice(0, 60) + "…" : preview,
    icon: "/pwa-192x192.png",
    url: "/messages",
    tag: "new-message",
  });

const notifyExpiryWarning = (donorId, listingName) =>
  sendPushToUser(donorId, {
    title: "Listing expiring soon ⚠️",
    body: `Your listing "${listingName}" expires in less than 24 hours and hasn't been claimed yet.`,
    icon: "/pwa-192x192.png",
    url: "/listings",
    tag: "expiry-warning",
  });

module.exports = {
  sendPushToUser,
  notifyListingClaimed,
  notifyExchangeComplete,
  notifyNewMessage,
  notifyExpiryWarning,
};