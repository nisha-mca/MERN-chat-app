import { useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";
import MessageInput from "./MessageInput";

function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function ChatWindow({ activeUser, messages, onSend, onBack }) {
  const { user } = useAuth();
  const { onlineUserIds, typingUserIds } = useSocket();
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeUser]);

  if (!activeUser) {
    return (
      <div className="flex-1 hidden md:flex items-center justify-center bg-ink">
        <p className="text-textDim font-mono text-sm">Pick a conversation to start chatting.</p>
      </div>
    );
  }

  const isOnline = onlineUserIds.has(activeUser._id);
  const isTyping = typingUserIds.has(activeUser._id);

  return (
    <div className="flex-1 flex flex-col bg-ink min-w-0">
      <div className="px-3 md:px-5 py-4 border-b border-line flex items-center gap-3">
        <button
          onClick={onBack}
          className="md:hidden text-textDim hover:text-text -ml-1 px-1 text-xl leading-none"
          aria-label="Back to conversations"
        >
          ‹
        </button>
        <span
          className="w-9 h-9 rounded-full flex items-center justify-center text-ink text-sm font-semibold shrink-0"
          style={{ backgroundColor: activeUser.avatarColor }}
        >
          {activeUser.username[0].toUpperCase()}
        </span>
        <div>
          <p className="text-text font-medium">{activeUser.username}</p>
          <p className="text-xs text-textDim">
            {isTyping ? <span className="text-accent">typing…</span> : isOnline ? "online" : "offline"}
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 md:px-5 py-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-textDim text-sm text-center mt-8">
            No messages yet. Say hello to {activeUser.username}.
          </p>
        )}
        {messages.map((m) => {
          const mine = m.sender === user.id || m.sender?._id === user.id;
          return (
            <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                  mine
                    ? "bg-bubble text-text rounded-br-sm"
                    : "bg-surface text-text rounded-bl-sm"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap break-words">{m.text}</p>
                <p className="text-[10px] text-textDim mt-1 text-right">{formatTime(m.createdAt)}</p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <MessageInput onSend={onSend} receiverId={activeUser._id} />
    </div>
  );
}

      
        
