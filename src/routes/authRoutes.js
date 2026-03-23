const express = require("express");

const { DEFAULT_STORAGE_LIMIT_BYTES, RESET_CODE_EXPIRY_MINUTES } = require("../config/constants");
const requireAuth = require("../middleware/requireAuth");
const User = require("../models/User");
const { syncUserStorageUsage } = require("../services/storageService");
const {
  createTokenHash,
  createUserPayload,
  generateSessionToken,
  isValidEmail,
  normalizeEmail,
  normalizeOptionalEmail,
  parseBoolean
} = require("../utils/authHelpers");

const router = express.Router();

router.post("/signup", async (req, res) => {
  try {
    const {
      fullName = "",
      email = "",
      password = "",
      confirmPassword = "",
      recoveryEmail = "",
      emailNotificationsEnabled
    } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const normalizedRecoveryEmail = normalizeOptionalEmail(recoveryEmail);

    if (!fullName.trim()) {
      return res.status(400).json({ message: "Full name is required." });
    }

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }

    if (password.length < 8) {
      return res.status(400).json({ message: "Password must be at least 8 characters long." });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    if (recoveryEmail && !normalizedRecoveryEmail) {
      return res.status(400).json({ message: "Enter a valid recovery email address." });
    }

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(409).json({ message: "An account already exists with this email." });
    }

    const user = new User({
      fullName: fullName.trim(),
      email: normalizedEmail,
      recoveryEmail: normalizedRecoveryEmail,
      emailNotificationsEnabled: parseBoolean(emailNotificationsEnabled, true)
    });

    user.setPassword(password);

    const sessionToken = generateSessionToken();
    user.sessions = [
      {
        tokenHash: createTokenHash(sessionToken),
        createdAt: new Date()
      }
    ];

    await user.save();

    res.status(201).json({
      message: "Account created successfully.",
      token: sessionToken,
      user: createUserPayload(user, DEFAULT_STORAGE_LIMIT_BYTES)
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "An account already exists with this email." });
    }

    res.status(500).json({ message: "Unable to create account right now." });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email = "", password = "" } = req.body;
    const user = await User.findOne({ email: normalizeEmail(email) });

    if (!user || !user.validatePassword(password)) {
      return res.status(401).json({ message: "Invalid email or password." });
    }

    const sessionToken = generateSessionToken();
    user.sessions = [
      ...user.sessions.slice(-4),
      {
        tokenHash: createTokenHash(sessionToken),
        createdAt: new Date()
      }
    ];

    await user.save();
    await syncUserStorageUsage(user);

    res.json({
      message: "Signed in successfully.",
      token: sessionToken,
      user: createUserPayload(user, DEFAULT_STORAGE_LIMIT_BYTES)
    });
  } catch (_error) {
    res.status(500).json({ message: "Unable to sign in right now." });
  }
});

router.post("/forgot-password", async (req, res) => {
  try {
    const normalizedEmail = normalizeEmail(req.body.email);

    if (!isValidEmail(normalizedEmail)) {
      return res.status(400).json({ message: "Enter a valid email address." });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.json({
        message: "If that email is registered, a reset code is now ready for use."
      });
    }

    const resetCode = user.createPasswordResetCode(RESET_CODE_EXPIRY_MINUTES);
    await user.save();

    res.json({
      message: "Reset code created. Enter it in the password reset form.",
      demoResetCode: resetCode,
      email: normalizedEmail,
      expiresInMinutes: RESET_CODE_EXPIRY_MINUTES
    });
  } catch (_error) {
    res.status(500).json({ message: "Unable to start password reset." });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const {
      email = "",
      resetCode = "",
      newPassword = "",
      confirmPassword = ""
    } = req.body;

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });

    if (!user || !user.validatePasswordResetCode(resetCode.trim())) {
      return res.status(400).json({ message: "Reset code is invalid or expired." });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ message: "New password must be at least 8 characters long." });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match." });
    }

    user.setPassword(newPassword);
    user.clearPasswordResetCode();

    const sessionToken = generateSessionToken();
    user.sessions = [
      {
        tokenHash: createTokenHash(sessionToken),
        createdAt: new Date()
      }
    ];

    await user.save();

    res.json({
      message: "Password reset successful. You are now signed in.",
      token: sessionToken,
      user: createUserPayload(user, DEFAULT_STORAGE_LIMIT_BYTES)
    });
  } catch (_error) {
    res.status(500).json({ message: "Unable to reset password right now." });
  }
});

router.get("/me", requireAuth, async (req, res) => {
  await syncUserStorageUsage(req.user);
  res.json({
    user: createUserPayload(req.user, DEFAULT_STORAGE_LIMIT_BYTES)
  });
});

router.post("/logout", requireAuth, async (req, res) => {
  try {
    req.user.sessions = req.user.sessions.filter(
      (session) => session.tokenHash !== req.tokenHash
    );
    await req.user.save();

    res.json({ message: "Logged out successfully." });
  } catch (_error) {
    res.status(500).json({ message: "Unable to log out right now." });
  }
});

module.exports = router;
