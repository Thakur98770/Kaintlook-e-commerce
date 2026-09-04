const express = require("express");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { getEmailNotifications } = require("../controllers/notificationController");

const router = express.Router();
router.get("/emails", protect, adminOnly, getEmailNotifications);

module.exports = router;