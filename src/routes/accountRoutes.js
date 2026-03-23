const express = require("express");

const { DEFAULT_STORAGE_LIMIT_BYTES } = require("../config/constants");
const requireAuth = require("../middleware/requireAuth");
const { syncUserStorageUsage } = require("../services/storageService");
const {
  createUserPayload,
  normalizeOptionalEmail,
  parseBoolean
} = require("../utils/authHelpers");

const router = express.Router();

router.put("/", requireAuth, async (req, res) => {
  try {
    const { fullName = "", recoveryEmail = "", emailNotificationsEnabled } = req.body;
    const normalizedRecoveryEmail = normalizeOptionalEmail(recoveryEmail);

    if (recoveryEmail && !normalizedRecoveryEmail) {
      return res.status(400).json({ message: "Enter a valid recovery email address." });
    }

    if (fullName.trim()) {
      req.user.fullName = fullName.trim();
    }

    req.user.recoveryEmail = normalizedRecoveryEmail;
    req.user.emailNotificationsEnabled = parseBoolean(
      emailNotificationsEnabled,
      req.user.emailNotificationsEnabled
    );

    await req.user.save();
    await syncUserStorageUsage(req.user);

    res.json({
      message: "Account settings updated successfully.",
      user: createUserPayload(req.user, DEFAULT_STORAGE_LIMIT_BYTES)
    });
  } catch (_error) {
    res.status(500).json({ message: "Unable to update account settings right now." });
  }
});

module.exports = router;
