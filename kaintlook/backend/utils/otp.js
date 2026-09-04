const crypto = require("crypto");

// Generates a 6-digit numeric OTP as a string, e.g. "042817"
function generateOtp() {
  return String(crypto.randomInt(100000, 1000000));
}

// Hash the OTP before saving to DB — never store the raw OTP.
function hashOtp(otp) {
  return crypto.createHash("sha256").update(otp).digest("hex");
}

module.exports = { generateOtp, hashOtp };
