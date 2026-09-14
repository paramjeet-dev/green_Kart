const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const dotenv = require("dotenv");
const jwt = require("jsonwebtoken");
const connectDB = require("./config/db");
const User = require("./models/User");
const errorHandler = require("./middleware/errorHandler");
const { helmetConfig, apiLimiter } = require("./middleware/security");
const setupCronJobs = require("./utils/cron");
const { notifyNewMessage } = require("./utils/push");

dotenv.config();
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.IO
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// ── Core middleware ───────────────────────────────────────────────────────────
app.use(helmetConfig);
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(apiLimiter);

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth",     require("./routes/auth"));
app.use("/api/listings", require("./routes/listings"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/admin",    require("./routes/admin"));
app.use("/api/push",     require("./routes/push"));

app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "GreenKart API is running 🌱", timestamp: new Date() });
});

app.use(errorHandler);

// ── Socket.IO ─────────────────────────────────────────────────────────────────

// Authenticate every socket connection with the same JWT used for the REST API.
// Without this, any client could emit "user:join" with someone else's id and
// silently receive their private notifications, or send messages that claim
// to be from another user.
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required"));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("name avatar role isActive");
    if (!user || !user.isActive) return next(new Error("Authentication failed"));

    socket.userId = decoded.id;
    socket.user = { id: decoded.id, name: user.name, avatar: user.avatar, role: user.role };
    next();
  } catch (err) {
    next(new Error("Authentication failed"));
  }
});

const activeUsers = new Map();

io.on("connection", (socket) => {
  // Identity comes from the verified token, not a client-supplied payload —
  // every connected user is auto-joined to their own private room.
  activeUsers.set(socket.userId, socket.id);
  socket.join(`user:${socket.userId}`);

  socket.on("chat:join", ({ listingId }) => {
    if (listingId) socket.join(`chat:${listingId}`);
  });

  socket.on("message:send", async ({ listingId, receiverId, content }) => {
    if (!listingId || !receiverId || !content) return;

    const payload = {
      listingId,
      senderId: socket.userId,
      receiverId,
      content,
      senderName: socket.user.name,
      senderAvatar: socket.user.avatar,
      createdAt: new Date(),
    };

    io.to(`chat:${listingId}`).emit("message:receive", payload);
    io.to(`user:${receiverId}`).emit("notification:message", {
      listingId,
      senderName: socket.user.name,
      preview: content.length > 50 ? content.slice(0, 50) + "..." : content,
    });

    // Web push for new message
    const preview = content.length > 80 ? content.slice(0, 80) + "…" : content;
    notifyNewMessage(receiverId, socket.user.name, preview).catch(() => {});
  });

  socket.on("listing:claimed",   ({ listingId, claimedBy }) => io.emit("listing:statusUpdate", { listingId, status: "claimed", claimedBy }));
  socket.on("listing:completed", ({ listingId }) => io.emit("listing:statusUpdate", { listingId, status: "completed" }));

  socket.on("chat:typing",     ({ listingId }) => socket.to(`chat:${listingId}`).emit("chat:userTyping",     { userId: socket.userId, userName: socket.user.name }));
  socket.on("chat:stopTyping", ({ listingId }) => socket.to(`chat:${listingId}`).emit("chat:userStopTyping", { userId: socket.userId }));

  socket.on("disconnect", () => {
    if (activeUsers.get(socket.userId) === socket.id) {
      activeUsers.delete(socket.userId);
    }
  });
});

// ── Cron jobs ─────────────────────────────────────────────────────────────────
setupCronJobs();

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 GreenKart server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});