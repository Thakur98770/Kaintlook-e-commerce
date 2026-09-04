const jwt = require("jsonwebtoken");

// Signs a JWT containing the user's id and role.
// Keep expiry short-ish for a storefront; adjust as needed.
const generateToken = (id, role, tokenVersion = 0) => {
  return jwt.sign({ id, role, tokenVersion }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });
};

module.exports = generateToken;
