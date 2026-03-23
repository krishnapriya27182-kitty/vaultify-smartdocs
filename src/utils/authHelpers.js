const crypto = require("crypto");

function createTokenHash(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function generateSessionToken() {
  return crypto.randomBytes(32).toString("hex");
}

function normalizeEmail(email = "") {
  return email.trim().toLowerCase();
}

function isValidEmail(email = "") {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeOptionalEmail(email = "") {
  const normalizedEmail = email.trim().toLowerCase();
  return normalizedEmail && isValidEmail(normalizedEmail) ? normalizedEmail : "";
}

function parseBoolean(value, defaultValue = true) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    return !["false", "0", "off", "no"].includes(value.toLowerCase());
  }

  if (typeof value === "undefined") {
    return defaultValue;
  }

  return Boolean(value);
}

function createUserPayload(user, defaultStorageLimitBytes) {
  return {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    recoveryEmail: user.recoveryEmail || "",
    emailNotificationsEnabled: user.emailNotificationsEnabled !== false,
    storageLimitBytes: user.storageLimitBytes || defaultStorageLimitBytes,
    storageUsedBytes: user.storageUsedBytes || 0
  };
}

module.exports = {
  createTokenHash,
  generateSessionToken,
  normalizeEmail,
  isValidEmail,
  normalizeOptionalEmail,
  parseBoolean,
  createUserPayload
};
