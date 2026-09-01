import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

export default function Sidebar({ users, activeUser, onSelect, unreadCounts }) {
  const { user, logout } = useAuth();
  const { onlineUserIds } = useSocket();

  return (
    <div className="w-72 shrink-0 bg-surface border-r border-line flex flex-col h-full">
      <div className="px-4 py-4 border-b border-line flex items-center justify-between">
        <h1 className="font-mono text-lg text-text font-bold">
         Livewire<span className="text-accent">_</span>
        </h1>
        <button
          onClick={logout}
          className="text-xs text-textDim hover:text-text transition-colors"
        >
          Sign out
        </button>
      </div>

      <div className="px-4 py-3 flex items-center gap-2.5 border-b border-line">
        <span
          className="w-8 h-8 rounded-full flex items-center justify-center text-ink text-sm font-semibold"
          style={{ backgroundColor: user.avatarColor }}
        >
          {user.username[0].toUpperCase()}
        </span>
        <div className="min-w-0">
          <p className="text-sm text-text truncate">{user.username}</p>
          <p className="text-xs text-accent">online</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {users.length === 0 && (
          <p className="text-sm text-textDim px-4 py-6">No other users yet — invite someone.</p>
        )}
        {users.map((u) => {
          const isOnline = onlineUserIds.has(u._id);
          const unread = unreadCounts[u._id] || 0;
          const isActive = activeUser?._id === u._id;

          return (
            <button
              key={u._id}
              onClick={() => onSelect(u)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-l-2 ${
                isActive
                  ? "bg-surfaceAlt border-accent"
                  : "border-transparent hover:bg-surfaceAlt/60"
              }`}
            >
              <span className="relative shrink-0">
                <span
                  className="w-9 h-9 rounded-full flex items-center justify-center text-ink text-sm font-semibold"
                  style={{ backgroundColor: u.avatarColor }}
                >
                  {u.username[0].toUpperCase()}
                </span>
                {isOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-accent border-2 border-surface" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm text-text truncate">{u.username}</span>
                <span className="block text-xs text-textDim">
                  {isOnline ? "online" : "offline"}
                </span>
              </span>
              {unread > 0 && (
                <span className="shrink-0 bg-accent text-ink text-xs font-semibold rounded-full min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center">
                  {unread}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
