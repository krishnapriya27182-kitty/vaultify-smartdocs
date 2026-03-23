const User = require("../models/User");
const { createTokenHash } = require("../utils/authHelpers");

async function requireAuth(req, res, next) {
  try {
    const authorization = req.headers.authorization || "";
    const token = authorization.startsWith("Bearer ")
      ? authorization.slice(7)
      : "";

    if (!token) {
      return res.status(401).json({ message: "Please sign in to continue." });
    }

    const tokenHash = createTokenHash(token);
    const user = await User.findOne({ "sessions.tokenHash": tokenHash });

    if (!user) {
      return res.status(401).json({ message: "Session expired. Please sign in again." });
    }

    req.user = user;
    req.tokenHash = tokenHash;
    next();
  } catch (_error) {
    res.status(500).json({ message: "Authentication failed." });
  }
}

module.exports = requireAuth;
