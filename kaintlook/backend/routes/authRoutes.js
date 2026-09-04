const express = require("express");
const {
  registerUser,
  verifyOtp,
  resendOtp,
  loginUser,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  changePassword,
} = require("../controllers/authController");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const rateLimit = require("../middleware/rateLimit");

const router = express.Router();
const authLimit = rateLimit({ windowMs: 15 * 60 * 1000, max: 20 });
const otpLimit = rateLimit({ windowMs: 10 * 60 * 1000, max: 8 });

// Signup flow: register -> OTP emailed -> verify-otp activates account + logs in
router.post("/register", authLimit, registerUser);
router.post("/verify-otp", otpLimit, verifyOtp);
router.post("/resend-otp", otpLimit, resendOtp);

// Normal login stays OTP-free for verified users with the correct password
router.post("/login", authLimit, loginUser);

// Forgot password flow: forgot-password emails OTP -> reset-password verifies + sets new password
router.post("/forgot-password", authLimit, forgotPassword);
router.post("/reset-password", otpLimit, resetPassword);
router.get("/me", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePassword);

// Example admin-only route — mount real admin routes (products, orders) behind these two
router.get("/admin/check", protect, adminOnly, (req, res) => {
  res.json({ message: `Welcome admin ${req.user.name}` });
});

module.exports = router;