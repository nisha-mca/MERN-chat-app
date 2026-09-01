
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const Message = require("../models/Message");

const onlineUsers = new Map();

function addSocket(userId, socketId) {
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socketId);
}

function removeSocket(userId, socketId) {
  const sockets = onlineUsers.get(userId);
  if (!sockets) return;
  sockets.delete(socketId);
  if (sockets.size === 0) onlineUsers.delete(userId);
}

const vercelPreviewPattern = /^https:\/\/mern-chat-app-ufc5(-[a-z0-9]+)?-flower-shop1\.vercel\.app$/;

function initSocket(httpServer, clientUrl) {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (
          !origin ||
          origin === clientUrl ||
          origin === "http://localhost:5173" ||
          vercelPreviewPattern.test(origin)
        ) {
          return callback(null, true);
        }
        callback(new Error(`Not allowed by CORS: ${origin}`));
      },
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No auth token provided"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error("Invalid auth token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;
    addSocket(userId, socket.id);

    io.emit("presence:update", { userId, online: true });
    socket.emit("presence:list", Array.from(onlineUsers.keys()));

    socket.on("message:send", async ({ receiverId, text }, ack) => {
      try {
        if (!text || !text.trim()) {
          return ack?.({ ok: false, error: "Message cannot be empty" });
        }

        const message = await Message.create({
          sender: userId,
          receiver: receiverId,
          text: text.trim(),
        });

        const receiverSockets = onlineUsers.get(receiverId);
        if (receiverSockets) {
          receiverSockets.forEach((sid) => {
            io.to(sid).emit("message:new", message);
          });
        }

        const senderSockets = onlineUsers.get(userId);
        senderSockets?.forEach((sid) => {
          io.to(sid).emit("message:new", message);
        });

        ack?.({ ok: true, message });
      } catch (err) {
        ack?.({ ok: false, error: "Failed to send message" });
      }
    });

    socket.on("typing:start", ({ receiverId }) => {
      const receiverSockets = onlineUsers.get(receiverId);
      receiverSockets?.forEach((sid) => {
        io.to(sid).emit("typing:update", { userId, typing: true });
      });
    });

    socket.on("typing:stop", ({ receiverId }) => {
      const receiverSockets = onlineUsers.get(receiverId);
      receiverSockets?.forEach((sid) => {
        io.to(sid).emit("typing:update", { userId, typing: false });
      });
    });

    socket.on("disconnect", () => {
      removeSocket(userId, socket.id);
      if (!onlineUsers.has(userId)) {
        io.emit("presence:update", { userId, online: false });
      }
    });
  });

  return io;
}

module.exports = initSocket;

        

