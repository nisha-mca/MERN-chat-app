const mongoose = require("mongoose");
const Message = require("../models/Message");

// Full message history between the logged-in user and :userId, oldest first.
exports.getConversation = async (req, res) => {
  try {
    const me = req.userId;
    const other = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: me, receiver: other },
        { sender: other, receiver: me },
      ],
    }).sort("createdAt");

    // Mark incoming messages from this contact as read
    await Message.updateMany(
      { sender: other, receiver: me, readAt: null },
      { readAt: new Date() }
    );

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Failed to load conversation", error: err.message });
  }
};

// Unread message count per contact, used to render badges in the sidebar.
exports.getUnreadCounts = async (req, res) => {
  try {
    const counts = await Message.aggregate([
      { $match: { receiver: new mongoose.Types.ObjectId(req.userId), readAt: null } },
      { $group: { _id: "$sender", count: { $sum: 1 } } },
    ]);
    res.json(counts);
  } catch (err) {
    res.status(500).json({ message: "Failed to load unread counts", error: err.message });
  }
};
