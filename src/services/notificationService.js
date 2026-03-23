const { DEFAULT_STORAGE_LIMIT_BYTES } = require("../config/constants");
const Document = require("../models/Document");

async function buildNotificationsForUser(user) {
  const documents = await Document.find({ owner: user._id }).sort({
    expiryDate: 1,
    createdAt: -1
  });
  const notifications = [];
  const now = new Date();
  const storageLimitBytes = user.storageLimitBytes || DEFAULT_STORAGE_LIMIT_BYTES;
  const storageUsedBytes = user.storageUsedBytes || 0;
  const usageRatio = storageLimitBytes ? storageUsedBytes / storageLimitBytes : 0;

  if (usageRatio >= 1) {
    notifications.push({
      type: "storage-critical",
      level: "danger",
      title: "Storage limit reached",
      message: "You have reached your storage limit. Delete or replace files to upload more."
    });
  } else if (usageRatio >= 0.85) {
    notifications.push({
      type: "storage-warning",
      level: "warning",
      title: "Storage almost full",
      message: "Your account is using more than 85% of the available storage."
    });
  }

  documents.forEach((document) => {
    if (!document.expiryDate) {
      return;
    }

    const expiryDate = new Date(document.expiryDate);
    const diffDays = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      notifications.push({
        type: "expired-document",
        level: "danger",
        documentId: document._id,
        title: `${document.title} has expired`,
        message: `${document.title} expired on ${expiryDate.toLocaleDateString("en-IN")}.`
      });
      return;
    }

    if (diffDays <= 30) {
      notifications.push({
        type: "expiring-document",
        level: "warning",
        documentId: document._id,
        title: `${document.title} is expiring soon`,
        message: `${document.title} will expire in ${diffDays} day${diffDays === 1 ? "" : "s"}.`
      });
    }
  });

  return notifications.slice(0, 8);
}

module.exports = {
  buildNotificationsForUser
};
