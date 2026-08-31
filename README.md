# wire — real-time MERN chat app

A minimal but complete real-time chat app: React frontend, Express + MongoDB backend,
Socket.io for live messaging, presence, and typing indicators. JWT-based auth.

## Structure

```
mern-chat-app/
├── server/     Express API + Socket.io server
└── client/     React (Vite) frontend
```

## Features

- Register / login with hashed passwords (bcrypt) and JWT auth
- Contact list of all other registered users
- Real-time messaging over Socket.io (falls back gracefully if a user is offline —
  messages are still saved and appear next time they open the conversation)
- Online/offline presence indicators
- "Typing…" indicator
- Per-contact unread message badges
- Message history persisted in MongoDB, loaded per conversation

## Setup

### 1. Backend

```bash
cd server
cp .env.example .env
# edit .env: set MONGO_URI to your MongoDB connection string, and JWT_SECRET to a random string
npm install
npm run dev
```

Requires a running MongoDB instance — either local (`mongodb://127.0.0.1:27017/mern-chat-app`)
or a free cluster from MongoDB Atlas.

The server runs on `http://localhost:5000` by default.

### 2. Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

The app runs on `http://localhost:5173` by default. Open it in two different browsers
(or one normal + one incognito window) to test real-time messaging between two accounts.

## How the real-time layer works

- The client connects to Socket.io and authenticates with the same JWT used for REST calls
  (`socket.handshake.auth.token`), verified server-side before the connection is accepted.
- Sending a message emits `message:send`; the server persists it to MongoDB, then pushes
  `message:new` to every open tab of both the sender and the receiver.
- `typing:start` / `typing:stop` are throttled client-side (a 1.5s idle timeout) and relayed
  to the other party as `typing:update`.
- Presence is tracked in-memory on the server as a map of `userId -> Set of socket ids`
  (so multiple open tabs count as one online user), broadcast via `presence:update`.

## Next steps you might want

- Group chats / channels (would need a `Conversation` model instead of the current 1:1 model)
- Message editing/deleting
- File and image attachments
- Push notifications for offline users
- Pagination for long message histories
