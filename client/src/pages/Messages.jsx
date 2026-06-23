import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import Spinner from "../components/common/Spinner";
import toast from "react-hot-toast";
import { Send, MessageSquare, ArrowLeft } from "lucide-react";

function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(date) {
  const d = new Date(date);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

export default function Messages() {
  const { listingId, userId } = useParams();
  const { user } = useAuth();
  const { joinChat, sendMessage: socketSend, onMessage, emitTyping, emitStopTyping } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [activeConv, setActiveConv] = useState(listingId && userId ? { listingId, userId } : null);

  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);

  // Load conversations
  useEffect(() => {
    api.get("/messages/conversations")
      .then(({ data }) => setConversations(data.conversations))
      .catch(() => toast.error("Failed to load conversations"))
      .finally(() => setLoadingConvs(false));
  }, []);

  // Load messages when a conversation is selected
  useEffect(() => {
    if (!activeConv) return;
    setLoadingMsgs(true);
    joinChat(activeConv.listingId);

    api.get(`/messages/${activeConv.listingId}/${activeConv.userId}`)
      .then(({ data }) => setMessages(data.messages))
      .catch(() => toast.error("Failed to load messages"))
      .finally(() => setLoadingMsgs(false));
  }, [activeConv]);

  // Socket listeners
  useEffect(() => {
    const unsub = onMessage((msg) => {
      if (msg.listingId === activeConv?.listingId) {
        setMessages((prev) => [...prev, { ...msg, sender: { _id: msg.senderId, name: msg.senderName, avatar: msg.senderAvatar } }]);
      }
    });
    return unsub;
  }, [activeConv, onMessage]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !activeConv || sending) return;
    setSending(true);
    try {
      const { data } = await api.post("/messages", {
        listingId: activeConv.listingId,
        receiverId: activeConv.userId,
        content: input.trim(),
      });
      setMessages((prev) => [...prev, data.message]);
      socketSend({
        listingId: activeConv.listingId,
        senderId: user._id,
        receiverId: activeConv.userId,
        content: input.trim(),
        senderName: user.name,
      });
      setInput("");
    } catch {
      toast.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleTyping = () => {
    emitTyping(activeConv?.listingId);
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => emitStopTyping(activeConv?.listingId), 1500);
  };

  // Group messages by date
  const groupedMessages = messages.reduce((acc, msg) => {
    const date = formatDate(msg.createdAt);
    if (!acc[date]) acc[date] = [];
    acc[date].push(msg);
    return acc;
  }, {});

  return (
    <div className="page-container py-6">
      <div className="card overflow-hidden" style={{ height: "calc(100vh - 140px)" }}>
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-80 border-r border-gray-100 flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-heading font-semibold text-gray-text">Messages</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {loadingConvs ? (
                <div className="flex justify-center py-10"><Spinner /></div>
              ) : conversations.length === 0 ? (
                <div className="p-6 text-center">
                  <MessageSquare className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-sub">No conversations yet</p>
                  <p className="text-xs text-gray-400 mt-1">Message a donor from a food listing</p>
                </div>
              ) : (
                conversations.map((conv) => {
                  const isActive = activeConv?.listingId === conv.listing?._id && activeConv?.userId === conv.otherUser?._id;
                  return (
                    <button
                      key={`${conv.listing?._id}-${conv.otherUser?._id}`}
                      onClick={() => setActiveConv({ listingId: conv.listing?._id, userId: conv.otherUser?._id })}
                      className={`w-full text-left p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors ${isActive ? "bg-green-light border-l-2 border-l-green-primary" : ""}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-9 h-9 bg-green-light rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-green-primary font-semibold text-sm">{conv.otherUser?.name?.charAt(0).toUpperCase()}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center">
                            <p className="text-sm font-medium text-gray-text truncate">{conv.otherUser?.name}</p>
                            {conv.unreadCount > 0 && (
                              <span className="bg-green-primary text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">{conv.unreadCount}</span>
                            )}
                          </div>
                          <p className="text-xs text-green-primary truncate">{conv.listing?.foodName}</p>
                          <p className="text-xs text-gray-sub truncate mt-0.5">{conv.lastMessage}</p>
                        </div>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Chat area */}
          <div className="flex-1 flex flex-col min-w-0">
            {!activeConv ? (
              <div className="flex-1 flex items-center justify-center text-center p-8">
                <div>
                  <MessageSquare className="w-14 h-14 text-gray-200 mx-auto mb-3" />
                  <p className="font-medium text-gray-text">Select a conversation</p>
                  <p className="text-sm text-gray-sub mt-1">Or start one from a food listing page</p>
                </div>
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="p-4 border-b border-gray-100 bg-white">
                  <p className="text-sm font-medium text-gray-text">Conversation</p>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                  {loadingMsgs ? (
                    <div className="flex justify-center py-10"><Spinner /></div>
                  ) : (
                    Object.entries(groupedMessages).map(([date, msgs]) => (
                      <div key={date}>
                        <div className="flex items-center gap-3 my-4">
                          <div className="flex-1 h-px bg-gray-200" />
                          <span className="text-xs text-gray-400 font-medium">{date}</span>
                          <div className="flex-1 h-px bg-gray-200" />
                        </div>
                        {msgs.map((msg, i) => {
                          const isMine = msg.sender?._id === user._id || msg.senderId === user._id;
                          return (
                            <div key={msg._id || i} className={`flex ${isMine ? "justify-end" : "justify-start"} mb-2`}>
                              {!isMine && (
                                <div className="w-7 h-7 bg-green-light rounded-full flex items-center justify-center mr-2 flex-shrink-0 self-end">
                                  <span className="text-green-primary text-xs font-semibold">{msg.sender?.name?.charAt(0).toUpperCase()}</span>
                                </div>
                              )}
                              <div className={`max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm ${isMine ? "bg-green-primary text-white rounded-br-sm" : "bg-white text-gray-text rounded-bl-sm shadow-sm"}`}>
                                <p>{msg.content}</p>
                                <p className={`text-xs mt-1 ${isMine ? "text-white/70" : "text-gray-400"}`}>{formatTime(msg.createdAt)}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t border-gray-100 bg-white">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => { setInput(e.target.value); handleTyping(); }}
                      onKeyDown={handleKeyDown}
                      placeholder="Type a message..."
                      className="input-field flex-1"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || sending}
                      className="btn-primary px-4 flex items-center gap-2 flex-shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
