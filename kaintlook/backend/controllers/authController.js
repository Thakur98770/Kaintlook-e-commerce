const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const { generateOtp, hashOtp } = require("../utils/otp");
const { sendOtpNotification, sendWelcomeNotification } = require("../utils/emailNotifications");

const OTP_TTL_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_LOCK_MINUTES = 15;

// Emails are stored lowercase (schema has `lowercase: true`), but Mongoose does
// NOT lowercase query filters automatically — only values being saved. Without
// this, User.findOne({ email }) is case-sensitive, so "Name@Gmail.com" at login
// silently fails to match "name@gmail.com" in the database. Normalize every
// email before it's used in a query.
const normalizeEmail = (email) => (email || "").trim().toLowerCase();

// Small helper to email a fresh OTP for a given purpose ("signup" | "reset")
// and save its hash + expiry on the user doc.
async function issueOtp(user, purpose) {
  const otp = generateOtp();
  user.otp = hashOtp(otp);
  user.otpExpiry = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
  user.otpPurpose = purpose;
  user.otpAttempts = 0;
  await user.save();

  await sendOtpNotification(user, otp, purpose);
}

// @route POST /api/auth/register
// Creates the user as unverified and emails a signup OTP.
// No token is issued yet — the user must verify before they can log in.
const registerUser = async (req, res) => {
  try {
    const { name, password } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!name || !email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      if (existing.isVerified) {
        return res.status(400).json({ message: "Email is already registered" });
      }
      // User exists but never verified (e.g. closed the tab, or an earlier OTP
      // email failed to send) — just issue a fresh OTP instead of blocking them.
      await issueOtp(existing, "signup");
      return res.status(200).json({
        message: "OTP sent to your email. Please verify to activate your account.",
        email: existing.email,
      });
    }

    const user = await User.create({ name, email, password, isVerified: false });
    await issueOtp(user, "signup");

    res.status(201).json({
      message: "OTP sent to your email. Please verify to activate your account.",
      email: user.email,
    });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
};

// @route POST /api/auth/verify-otp   { email, otp }
// Verifies the signup OTP and, on success, activates the account and logs the user in.
const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const email = normalizeEmail(req.body.email);
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email }).select("+otp +otpExpiry +otpPurpose +otpAttempts");
    if (!user || user.otpPurpose !== "signup" || !user.otp) {
      return res.status(400).json({ message: "No pending verification for this email" });
    }
    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ message: "OTP expired. Please request a new one." });
    }
    if (user.otp !== hashOtp(otp)) {
      user.otpAttempts += 1;
      if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
        user.otp = undefined;
        user.otpExpiry = undefined;
        user.otpPurpose = null;
        user.otpAttempts = 0;
        await user.save();
        return res.status(429).json({ message: "Too many incorrect OTP attempts. Please request a new OTP." });
      }
      await user.save();
      return res.status(400).json({ message: "Incorrect OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.otpPurpose = null;
    user.otpAttempts = 0;
    await user.save();
    sendWelcomeNotification(user);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role, user.tokenVersion),
    });
  } catch (err) {
    res.status(500).json({ message: "OTP verification failed", error: err.message });
  }
};

// @route POST /api/auth/resend-otp   { email }
// Re-sends a signup OTP for an unverified account (e.g. user closed the tab, OTP expired).
const resendOtp = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: "No account with this email" });
    if (user.isVerified) return res.status(400).json({ message: "Account is already verified" });

    await issueOtp(user, "signup");
    res.json({ message: "A new OTP has been sent to your email." });
  } catch (err) {
    res.status(500).json({ message: "Failed to resend OTP", error: err.message });
  }
};

// @route POST /api/auth/login
// Normal login stays OTP-free: correct email + password logs the user in directly.
// Only requirement is that the account has already been verified via signup OTP.
const loginUser = async (req, res) => {
  try {
    const { password } = req.body;
    const email = normalizeEmail(req.body.email);

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email }).select("+password +failedLoginAttempts +loginLockUntil");
    if (user?.loginLockUntil && user.loginLockUntil > new Date()) {
      return res.status(429).json({ message: "Too many failed attempts. Please try again later." });
    }
    if (!user || !(await user.matchPassword(password))) {
      if (user) {
        user.failedLoginAttempts += 1;
        if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
          user.loginLockUntil = new Date(Date.now() + LOGIN_LOCK_MINUTES * 60 * 1000);
          user.failedLoginAttempts = 0;
        }
        await user.save();
      }
      return res.status(401).json({ message: "Invalid email or password" });
    }

    user.failedLoginAttempts = 0;
    user.loginLockUntil = null;
    await user.save();

    if (!user.isVerified) {
      // Account was created but never verified — nudge them back into the OTP flow
      // instead of a generic error, and don't hand out a token.
      return res.status(403).json({
        message: "Please verify your email before logging in.",
        needsVerification: true,
        email: user.email,
      });
    }

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id, user.role, user.tokenVersion),
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};

// @route POST /api/auth/forgot-password   { email }
// Always responds with the same generic message whether or not the email exists,
// so this endpoint can't be used to check which emails are registered.
const forgotPassword = async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    if (!email) return res.status(400).json({ message: "Email is required" });

    const user = await User.findOne({ email });
    if (user) {
      await issueOtp(user, "reset");
    }

    res.json({ message: "If that email is registered, an OTP has been sent." });
  } catch (err) {
    res.status(500).json({ message: "Failed to process request", error: err.message });
  }
};

// @route POST /api/auth/reset-password   { email, otp, newPassword }
// Verifies the reset OTP and sets the new password.
const resetPassword = async (req, res) => {
  try {
    const { otp, newPassword } = req.body;
    const email = normalizeEmail(req.body.email);
    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findOne({ email }).select("+otp +otpExpiry +otpPurpose +otpAttempts +password");
    if (!user || user.otpPurpose !== "reset" || !user.otp) {
      return res.status(400).json({ message: "No pending password reset for this email" });
    }
    if (user.otpExpiry < new Date()) {
      return res.status(400).json({ message: "OTP expired. Please request a new one." });
    }
    if (user.otp !== hashOtp(otp)) {
      user.otpAttempts += 1;
      if (user.otpAttempts >= MAX_OTP_ATTEMPTS) {
        user.otp = undefined;
        user.otpExpiry = undefined;
        user.otpPurpose = null;
        user.otpAttempts = 0;
        await user.save();
        return res.status(429).json({ message: "Too many incorrect OTP attempts. Please request a new OTP." });
      }
      await user.save();
      return res.status(400).json({ message: "Incorrect OTP" });
    }

    user.password = newPassword; // pre-save hook re-hashes this
    user.tokenVersion += 1;
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.otpPurpose = null;
    user.otpAttempts = 0;
    await user.save();

    res.json({ message: "Password reset successful. You can now log in." });
  } catch (err) {
    res.status(500).json({ message: "Password reset failed", error: err.message });
  }
};

// @route GET /api/auth/me  (protected)
const getProfile = async (req, res) => {
  res.json(req.user);
};

// @route PUT /api/auth/profile  { name }  (protected)
// Email is intentionally not editable here — it's the login identifier.
const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (req.body.name) user.name = req.body.name;
    await user.save();

    res.json({ _id: user._id, name: user.name, email: user.email, role: user.role });
  } catch (err) {
    res.status(400).json({ message: "Failed to update profile", error: err.message });
  }
};

// @route PUT /api/auth/change-password  { currentPassword, newPassword }  (protected)
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new password are required" });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user._id).select("+password");
    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword; // pre-save hook re-hashes this
    user.tokenVersion += 1;
    await user.save();

    res.json({ message: "Password updated" });
  } catch (err) {
    res.status(400).json({ message: "Failed to change password", error: err.message });
  }
};

module.exports = {
  registerUser,
  verifyOtp,
  resendOtp,
  loginUser,
  forgotPassword,
  resetPassword,
  getProfile,
  updateProfile,
  changePassword,
};