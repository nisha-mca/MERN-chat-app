const User = require("../models/User");

// Returns every user except the requester, for the sidebar contact list.
exports.getUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.userId } })
      .select("username email avatarColor")
      .sort("username");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Failed to load users", error: err.message });
  }
};
