import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, token, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user || !token) return;

    // The token is verified server-side in the Socket.IO auth middleware —
    // the server derives our identity from it rather than trusting anything
    // we emit, so we never send our own userId/name over the socket.
    const socket = io(import.meta.env.VITE_SERVER_URL || "http://localhost:5000", {
      transports: ["websocket", "polling"],
      auth: { token },
    });

    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));
    socket.on("connect_error", () => setConnected(false));

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [isAuthenticated, user, token]);

  const joinChat = (listingId) => {
    socketRef.current?.emit("chat:join", { listingId });
  };

  const sendMessage = ({ listingId, receiverId, content }) => {
    socketRef.current?.emit("message:send", { listingId, receiverId, content });
  };

  const onMessage = (handler) => {
    socketRef.current?.on("message:receive", handler);
    return () => socketRef.current?.off("message:receive", handler);
  };

  const onNotification = (handler) => {
    socketRef.current?.on("notification:message", handler);
    return () => socketRef.current?.off("notification:message", handler);
  };

  const emitTyping = (listingId) => {
    socketRef.current?.emit("chat:typing", { listingId });
  };

  const emitStopTyping = (listingId) => {
    socketRef.current?.emit("chat:stopTyping", { listingId });
  };

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, joinChat, sendMessage, onMessage, onNotification, emitTyping, emitStopTyping }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useSocket must be used within SocketProvider");
  return ctx;
};