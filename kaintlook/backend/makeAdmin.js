// One-off CLI script to promote an existing user to admin.
//
// Usage (run from the backend/ folder):
//   node makeAdmin.js someone@example.com
//
// The user must already have an account (signed up + OTP-verified) —
// this script only flips their role, it doesn't create a new user.

require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error("Usage: node makeAdmin.js <email>");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const user = await User.findOne({ email });
  if (!user) {
    console.error(`No user found with email: ${email}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  if (user.role === "admin") {
    console.log(`${email} is already an admin.`);
  } else {
    user.role = "admin";
    await user.save();
    console.log(`Done — ${email} is now an admin.`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Failed:", err.message);
  process.exit(1);
});
