import { useRef, useState } from "react";
import { useSocket } from "../context/SocketContext";

export default function MessageInput({ onSend, receiverId }) {
  const [text, setText] = useState("");
  const { socket } = useSocket();
  const typingTimeout = useRef(null);

  function handleChange(e) {
    setText(e.target.value);

    if (!socket) return;
    socket.emit("typing:start", { receiverId });

    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit("typing:stop", { receiverId });
    }, 1500);
  }

  function handleSubmit(e) {
    e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    onSend(trimmed);
    setText("");
    clearTimeout(typingTimeout.current);
    socket?.emit("typing:stop", { receiverId });
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-line p-3 flex gap-2">
      <input
        value={text}
        onChange={handleChange}
        placeholder="Write a message…"
        className="flex-1 bg-surfaceAlt border border-line rounded-md px-3 py-2.5 text-text placeholder:text-textDim/60 focus:border-accent transition-colors"
      />
      <button
        type="submit"
        disabled={!text.trim()}
        className="bg-accent text-ink font-semibold rounded-md px-4 disabled:opacity-40 hover:brightness-95 transition"
      >
        Send
      </button>
    </form>
  );
}
