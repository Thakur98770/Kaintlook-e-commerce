const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    tokenVersion: { type: Number, default: 0 },
    failedLoginAttempts: { type: Number, default: 0, select: false },
    loginLockUntil: { type: Date, default: null, select: false },
    phone: { type: String, trim: true, default: "" },
    birthday: { type: Date, default: null },
    gender: {
      type: String,
      enum: ["male", "female", "other", "prefer_not_to_say", ""],
      default: "",
    },
    categoryPreferences: { type: [String], default: [] },

    // Email verification (used at signup)
    isVerified: { type: Boolean, default: false },

    // Shared OTP fields — reused for both signup verification and forgot-password.
    // otpPurpose tells us which flow the current OTP belongs to.
    otp: { type: String, select: false },
    otpExpiry: { type: Date, select: false },
    otpPurpose: { type: String, enum: ["signup", "reset", null], default: null, select: false },
    otpAttempts: { type: Number, default: 0, select: false },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with hashed password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
