const express = require("express");

const requireAuth = require("../middleware/requireAuth");
const { buildNotificationsForUser } = require("../services/notificationService");
const { syncUserStorageUsage } = require("../services/storageService");

const router = express.Router();

router.get("/", requireAuth, async (req, res) => {
  try {
    await syncUserStorageUsage(req.user);
    const notifications = await buildNotificationsForUser(req.user);

    res.json({
      notifications,
      unreadCount: notifications.length
    });
  } catch (_error) {
    res.status(500).json({ message: "Unable to fetch notifications right now." });
  }
});

module.exports = router;
