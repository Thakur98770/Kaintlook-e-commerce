const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { subscribe, listNotifications } = require("../controllers/stockNotificationController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// Best-effort auth for the public subscribe endpoint: if a valid token is
// present, attach req.user (so we can link the subscription to an account);
// if not, or if it's invalid/expired, just continue as a guest. This never
// blocks the request — unlike `protect`, a missing/bad token is not an error
// here since anonymous shoppers must be able to use "Notify Me" too.
const optionalAuth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (header && header.startsWith("Bearer")) {
    try {
      const decoded = jwt.verify(header.split(" ")[1], process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("-password");
      if (user && (decoded.tokenVersion || 0) === (user.tokenVersion || 0)) req.user = user;
    } catch {
      // ignore — proceed as a guest
    }
  }
  next();
};

router.post("/", optionalAuth, subscribe);
router.get("/", protect, adminOnly, listNotifications);

module.exports = router;