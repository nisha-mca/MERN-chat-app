const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const Message = require("../models/Message");

// userId -> Set of socket ids (a user can have multiple tabs/devices open)
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

function initSocket(httpServer, clientUrl) {
  const io = new Server(httpServer, {
    cors: { origin: clientUrl, credentials: true },
  });

  // Every connecting socket must present a valid JWT, same as REST auth.
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

    // Tell everyone this user just came online
    io.emit("presence:update", { userId, online: true });
    // Send the full online list to the user who just connected
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

        // Deliver to every open tab/device of the receiver, if online
        const receiverSockets = onlineUsers.get(receiverId);
        if (receiverSockets) {
          receiverSockets.forEach((sid) => {
            io.to(sid).emit("message:new", message);
          });
        }

        // Echo back to every tab/device of the sender for a consistent view
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
