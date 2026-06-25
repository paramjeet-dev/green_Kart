const nodemailer = require("nodemailer");

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST) return null; // silently skip if not configured

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

const FROM = `"GreenKart 🌱" <${process.env.SMTP_FROM || "noreply@greenkart.com"}>`;

// ── Generic send helper ───────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html }) => {
  const t = getTransporter();
  if (!t) return; // SMTP not configured — skip silently

  try {
    await t.sendMail({ from: FROM, to, subject, html });
  } catch (err) {
    console.error("Email send error:", err.message);
  }
};

// ── Templates ─────────────────────────────────────────────────────────────────
const wrap = (body) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F8FAF5;font-family:Inter,Arial,sans-serif;">
  <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:#2E7D32;padding:24px 32px;">
      <h1 style="margin:0;color:#fff;font-size:20px;font-weight:600;">🌱 GreenKart</h1>
    </div>
    <div style="padding:32px;">
      ${body}
      <hr style="border:none;border-top:1px solid #f0f0f0;margin:28px 0 20px;">
      <p style="margin:0;font-size:12px;color:#9ca3af;">You're receiving this because you have an account on GreenKart. If you didn't expect this email, you can safely ignore it.</p>
    </div>
  </div>
</body>
</html>`;

const btn = (url, label) =>
  `<a href="${url}" style="display:inline-block;margin-top:20px;padding:12px 24px;background:#2E7D32;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">${label}</a>`;

// ── Email senders ─────────────────────────────────────────────────────────────

exports.emailListingClaimed = (donorEmail, donorName, listingName, claimerName) =>
  sendEmail({
    to: donorEmail,
    subject: `Your listing "${listingName}" was claimed 🎉`,
    html: wrap(`
      <h2 style="color:#1F2937;margin-top:0;">Great news, ${donorName}!</h2>
      <p style="color:#4B5563;line-height:1.7;"><strong>${claimerName}</strong> has claimed your food listing <strong>"${listingName}"</strong>.</p>
      <p style="color:#4B5563;line-height:1.7;">Head to your messages to coordinate the pickup details.</p>
      ${btn(`${process.env.CLIENT_URL}/messages`, "Open Messages")}
    `),
  });

exports.emailExchangeComplete = (donorEmail, donorName, recipientEmail, recipientName, listingName) => {
  const msg = (name, role) =>
    sendEmail({
      to: role === "donor" ? donorEmail : recipientEmail,
      subject: `Exchange complete: "${listingName}" 🌱`,
      html: wrap(`
        <h2 style="color:#1F2937;margin-top:0;">Exchange complete!</h2>
        <p style="color:#4B5563;line-height:1.7;">Hi ${name}, the food exchange for <strong>"${listingName}"</strong> has been marked as complete.</p>
        <p style="color:#4B5563;line-height:1.7;">Thank you for helping reduce food waste in your community!</p>
        ${btn(`${process.env.CLIENT_URL}/dashboard`, "View Dashboard")}
      `),
    });

  return Promise.all([msg(donorName, "donor"), msg(recipientName, "recipient")]);
};

exports.emailNewMessage = (receiverEmail, receiverName, senderName, preview, listingId, senderId) =>
  sendEmail({
    to: receiverEmail,
    subject: `New message from ${senderName}`,
    html: wrap(`
      <h2 style="color:#1F2937;margin-top:0;">You have a new message</h2>
      <p style="color:#4B5563;line-height:1.7;"><strong>${senderName}</strong> sent you a message:</p>
      <blockquote style="border-left:3px solid #2E7D32;margin:16px 0;padding:12px 16px;background:#F8FAF5;color:#374151;border-radius:0 8px 8px 0;font-style:italic;">"${preview}"</blockquote>
      ${btn(`${process.env.CLIENT_URL}/messages/${listingId}/${senderId}`, "Reply")}
    `),
  });

exports.emailExpiryWarning = (donorEmail, donorName, listingName, listingId) =>
  sendEmail({
    to: donorEmail,
    subject: `Your listing "${listingName}" expires in 24 hours ⚠️`,
    html: wrap(`
      <h2 style="color:#1F2937;margin-top:0;">Listing expiring soon</h2>
      <p style="color:#4B5563;line-height:1.7;">Hi ${donorName}, your food listing <strong>"${listingName}"</strong> expires in less than 24 hours and hasn't been claimed yet.</p>
      <p style="color:#4B5563;line-height:1.7;">Consider sharing it with someone or extending the expiry date.</p>
      ${btn(`${process.env.CLIENT_URL}/listings/${listingId}`, "View Listing")}
    `),
  });

exports.emailWelcome = (email, name, role) =>
  sendEmail({
    to: email,
    subject: "Welcome to GreenKart 🌱",
    html: wrap(`
      <h2 style="color:#1F2937;margin-top:0;">Welcome, ${name}!</h2>
      <p style="color:#4B5563;line-height:1.7;">You've joined GreenKart as a <strong>${role}</strong>. Together we're reducing food waste and feeding communities.</p>
      <p style="color:#4B5563;line-height:1.7;">${
        role === "donor"
          ? "Start by creating your first food listing — it only takes a minute."
          : "Browse available food listings near you and connect with donors."
      }</p>
      ${btn(`${process.env.CLIENT_URL}/dashboard`, "Go to Dashboard")}
    `),
  });