const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Verifies the JWT sent in the Authorization header and attaches
// the logged-in user (without password) to req.user
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    try {
      token = req.headers.authorization.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = await User.findById(decoded.id).select("-password");
      if (!req.user) {
        return res.status(401).json({ message: "User no longer exists" });
      }
      if ((decoded.tokenVersion || 0) !== (req.user.tokenVersion || 0)) {
        return res.status(401).json({ message: "Session expired, please log in again" });
      }
      return next();
    } catch (err) {
      return res.status(401).json({ message: "Not authorized, token invalid or expired" });
    }
  }

  return res.status(401).json({ message: "Not authorized, no token provided" });
};

// Use after `protect` — only lets admin role through
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Admin access only" });
};

module.exports = { protect, adminOnly };
