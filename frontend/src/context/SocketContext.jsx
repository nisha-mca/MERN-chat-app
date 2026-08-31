import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "https://mern-chat-app-vi9x.onrender.com";

export function SocketProvider({ children }) {
  const { token, user } = useAuth();
  const socketRef = useRef(null);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [typingUserIds, setTypingUserIds] = useState(new Set());

  useEffect(() => {
    if (!token || !user) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const socket = io(SOCKET_URL, { auth: { token } });
    socketRef.current = socket;

    socket.on("presence:list", (ids) => setOnlineUserIds(new Set(ids)));

    socket.on("presence:update", ({ userId, online }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        if (online) next.add(userId);
        else next.delete(userId);
        return next;
      });
    });

    socket.on("typing:update", ({ userId, typing }) => {
      setTypingUserIds((prev) => {
        const next = new Set(prev);
        if (typing) next.add(userId);
        else next.delete(userId);
        return next;
      });
    });

    return () => socket.disconnect();
  }, [token, user]);

  return (
    <SocketContext.Provider
      value={{ socket: socketRef.current, onlineUserIds, typingUserIds }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
