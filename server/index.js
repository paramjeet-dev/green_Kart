const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

// Load env vars
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);

// Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/listings", require("./routes/listings"));
app.use("/api/messages", require("./routes/messages"));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "GreenKart API is running 🌱", timestamp: new Date() });
});

// Error handler (must be last)
app.use(errorHandler);

// ─── Socket.IO Real-Time Events ────────────────────────────────────────────────
const activeUsers = new Map(); // userId -> socketId

io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // User joins with their userId
  socket.on("user:join", (userId) => {
    activeUsers.set(userId, socket.id);
    socket.join(`user:${userId}`);
    console.log(`👤 User ${userId} joined`);
  });

  // Join a listing-specific chat room
  socket.on("chat:join", ({ listingId, userId }) => {
    const room = `chat:${listingId}`;
    socket.join(room);
    console.log(`💬 User ${userId} joined chat room: ${room}`);
  });

  // Send a message
  socket.on("message:send", async (data) => {
    const { listingId, senderId, receiverId, content, senderName, senderAvatar } = data;

    const messagePayload = {
      listingId,
      senderId,
      receiverId,
      content,
      senderName,
      senderAvatar,
      createdAt: new Date(),
    };

    // Emit to both the chat room and the receiver directly
    io.to(`chat:${listingId}`).emit("message:receive", messagePayload);
    io.to(`user:${receiverId}`).emit("notification:message", {
      listingId,
      senderName,
      preview: content.length > 50 ? content.slice(0, 50) + "..." : content,
    });
  });

  // Listing status updates
  socket.on("listing:claimed", ({ listingId, claimedBy }) => {
    io.emit("listing:statusUpdate", { listingId, status: "claimed", claimedBy });
  });

  socket.on("listing:completed", ({ listingId }) => {
    io.emit("listing:statusUpdate", { listingId, status: "completed" });
  });

  // Typing indicators
  socket.on("chat:typing", ({ listingId, userId, userName }) => {
    socket.to(`chat:${listingId}`).emit("chat:userTyping", { userId, userName });
  });

  socket.on("chat:stopTyping", ({ listingId, userId }) => {
    socket.to(`chat:${listingId}`).emit("chat:userStopTyping", { userId });
  });

  socket.on("disconnect", (reason) => {
    console.log(`❌ Socket disconnected: ${socket.id}, reason: ${reason}`);
    // Remove user from active users
    for (const [userId, socketId] of activeUsers.entries()) {
      if (socketId === socket.id) {
        activeUsers.delete(userId);
        break;
      }
    }
    console.log(`❌ Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 GreenKart server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
});
