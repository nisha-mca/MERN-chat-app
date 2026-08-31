import { useEffect, useState, useCallback } from "react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";

export default function Chat() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [users, setUsers] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [unreadCounts, setUnreadCounts] = useState({});

  // Load the contact list and unread badge counts once on mount
  useEffect(() => {
    api.get("/users").then((res) => setUsers(res.data));
    refreshUnread();
  }, []);

  function refreshUnread() {
    api.get("/messages/unread").then((res) => {
      const map = {};
      res.data.forEach((row) => {
        map[row._id] = row.count;
      });
      setUnreadCounts(map);
    });
  }

  const selectUser = useCallback((u) => {
    setActiveUser(u);
    api.get(`/messages/${u._id}`).then((res) => setMessages(res.data));
    setUnreadCounts((prev) => ({ ...prev, [u._id]: 0 }));
  }, []);

  // Listen for incoming messages in real time
  useEffect(() => {
    if (!socket) return;

    function handleNewMessage(message) {
      const otherId =
        message.sender === user.id ? message.receiver : message.sender;

      setMessages((prev) => {
        const relevantToOpenChat =
          activeUser && (otherId === activeUser._id);
        if (!relevantToOpenChat) return prev;
        return [...prev, message];
      });

      if (!activeUser || otherId !== activeUser._id) {
        setUnreadCounts((prev) => ({
          ...prev,
          [otherId]: (prev[otherId] || 0) + 1,
        }));
      }
    }

    socket.on("message:new", handleNewMessage);
    return () => socket.off("message:new", handleNewMessage);
  }, [socket, activeUser, user.id]);

  function sendMessage(text) {
    if (!socket || !activeUser) return;
    socket.emit("message:send", { receiverId: activeUser._id, text }, (res) => {
      if (!res?.ok) console.error(res?.error);
    });
  }

  return (
    <div className="h-screen flex">
      <Sidebar
        users={users}
        activeUser={activeUser}
        onSelect={selectUser}
        unreadCounts={unreadCounts}
      />
      <ChatWindow activeUser={activeUser} messages={messages} onSend={sendMessage} />
    </div>
  );
}
