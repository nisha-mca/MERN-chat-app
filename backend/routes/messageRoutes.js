const express = require("express");
const router = express.Router();
const { getConversation, getUnreadCounts } = require("../controllers/messageController");
const protect = require("../middleware/auth");

router.get("/unread", protect, getUnreadCounts);
router.get("/:userId", protect, getConversation);

module.exports = router;
