import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const socket = io(import.meta.env.VITE_SERVER_URL || "http://localhost:5000", {
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("user:join", user._id);
    });

    socket.on("disconnect", () => setConnected(false));

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setConnected(false);
    };
  }, [isAuthenticated, user]);

  const joinChat = (listingId) => {
    if (socketRef.current && user) {
      socketRef.current.emit("chat:join", { listingId, userId: user._id });
    }
  };

  const sendMessage = (payload) => {
    if (socketRef.current) {
      socketRef.current.emit("message:send", payload);
    }
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
    socketRef.current?.emit("chat:typing", { listingId, userId: user._id, userName: user.name });
  };

  const emitStopTyping = (listingId) => {
    socketRef.current?.emit("chat:stopTyping", { listingId, userId: user._id });
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
