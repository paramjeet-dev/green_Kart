const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
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
const activeUsers = new Map();

io.on("connection", (socket) => {
  socket.on("user:join", (userId) => {
    activeUsers.set(userId, socket.id);
    socket.join(`user:${userId}`);
  });

  socket.on("chat:join", ({ listingId, userId }) => {
    socket.join(`chat:${listingId}`);
  });

  socket.on("message:send", async (data) => {
    const { listingId, senderId, receiverId, content, senderName } = data;

    const payload = {
      listingId, senderId, receiverId, content,
      senderName, senderAvatar: data.senderAvatar,
      createdAt: new Date(),
    };

    io.to(`chat:${listingId}`).emit("message:receive", payload);
    io.to(`user:${receiverId}`).emit("notification:message", {
      listingId, senderName,
      preview: content.length > 50 ? content.slice(0, 50) + "..." : content,
    });

    // Web push for new message
    const preview = content.length > 80 ? content.slice(0, 80) + "…" : content;
    notifyNewMessage(receiverId, senderName, preview).catch(() => {});
  });

  socket.on("listing:claimed",   ({ listingId, claimedBy }) => io.emit("listing:statusUpdate", { listingId, status: "claimed", claimedBy }));
  socket.on("listing:completed", ({ listingId }) => io.emit("listing:statusUpdate", { listingId, status: "completed" }));

  socket.on("chat:typing",     ({ listingId, userId, userName }) => socket.to(`chat:${listingId}`).emit("chat:userTyping",     { userId, userName }));
  socket.on("chat:stopTyping", ({ listingId, userId })           => socket.to(`chat:${listingId}`).emit("chat:userStopTyping", { userId }));

  socket.on("disconnect", () => {
    for (const [uid, sid] of activeUsers.entries()) {
      if (sid === socket.id) { activeUsers.delete(uid); break; }
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
