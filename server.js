const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

const Document = require("./src/models/Document");
const User = require("./src/models/User");

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/vaultify-smartdocs";
const RESET_CODE_EXPIRY_MINUTES =
  Number(process.env.RESET_CODE_EXPIRY_MINUTES) || 15;
const MAX_FILE_SIZE_MB = Number(process.env.MAX_FILE_SIZE_MB) || 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const DEFAULT_STORAGE_LIMIT_BYTES = 30 * 1024 * 1024;
const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

function resolveStoredFilePath(filePath) {
  return path.join(__dirname, filePath.replace(/^[/\\]+/, ""));
}

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

function createUserPayload(user) {
  return {
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    recoveryEmail: user.recoveryEmail || "",
    emailNotificationsEnabled: user.emailNotificationsEnabled !== false,
    storageLimitBytes: user.storageLimitBytes || DEFAULT_STORAGE_LIMIT_BYTES,
    storageUsedBytes: user.storageUsedBytes || 0
  };
}

async function calculateUserStorageUsage(userId) {
  const [result] = await Document.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId)
      }
    },
    {
      $group: {
        _id: null,
        totalSize: { $sum: "$fileSize" }
      }
    }
  ]);

  return result ? result.totalSize : 0;
}

async function syncUserStorageUsage(user) {
  const totalSize = await calculateUserStorageUsage(user._id);
  user.storageUsedBytes = totalSize;
  await user.save();
  return totalSize;
}

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

function getFileBucket() {
  if (!mongoose.connection.db) {
    throw new Error("MongoDB connection is not ready.");
  }

  return new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "documentFiles"
  });
}

function uploadBufferToGridFs(file, ownerId) {
  return new Promise((resolve, reject) => {
    const bucket = getFileBucket();
    const uploadStream = bucket.openUploadStream(file.originalname, {
      contentType: file.mimetype,
      metadata: {
        ownerId: String(ownerId),
        uploadedAt: new Date()
      }
    });

    uploadStream.on("error", reject);
    uploadStream.on("finish", () => {
      resolve(uploadStream.id);
    });

    uploadStream.end(file.buffer);
  });
}

async function deleteGridFsFile(fileId) {
  if (!fileId || !mongoose.isValidObjectId(fileId)) {
    return;
  }

  try {
    await getFileBucket().delete(new mongoose.Types.ObjectId(fileId));
  } catch (error) {
    if (error.code === "ENOENT" || error.message.includes("FileNotFound")) {
      return;
    }

    throw error;
  }
}

async function deleteStoredFile(document) {
  if (!document) {
    return;
  }

  if (document.gridFsFileId) {
    await deleteGridFsFile(document.gridFsFileId);
    return;
  }

  if (document.filePath) {
    const filePath = resolveStoredFilePath(document.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

function streamStoredFile(document, res) {
  if (document.gridFsFileId) {
    const bucket = getFileBucket();
    const downloadStream = bucket.openDownloadStream(
      new mongoose.Types.ObjectId(document.gridFsFileId)
    );

    downloadStream.on("error", () => {
      if (!res.headersSent) {
        res.status(404).json({ message: "Stored file could not be found." });
      } else {
        res.end();
      }
    });

    downloadStream.pipe(res);
    return;
  }

  if (!document.filePath) {
    res.status(404).json({ message: "Stored file could not be found." });
    return;
  }

  const filePath = resolveStoredFilePath(document.filePath);

  if (!fs.existsSync(filePath)) {
    res.status(404).json({ message: "Stored file could not be found." });
    return;
  }

  res.sendFile(filePath);
}

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
  } catch (error) {
    res.status(500).json({ message: "Authentication failed." });
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.post("/api/auth/signup", async (req, res) => {
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
      user: createUserPayload(user)
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "An account already exists with this email." });
    }

    res.status(500).json({ message: "Unable to create account right now." });
  }
});

app.post("/api/auth/login", async (req, res) => {
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
      user: createUserPayload(user)
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to sign in right now." });
  }
});

app.post("/api/auth/forgot-password", async (req, res) => {
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
  } catch (error) {
    res.status(500).json({ message: "Unable to start password reset." });
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
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
      user: createUserPayload(user)
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to reset password right now." });
  }
});

app.get("/api/auth/me", requireAuth, async (req, res) => {
  await syncUserStorageUsage(req.user);
  res.json({
    user: createUserPayload(req.user)
  });
});

app.put("/api/account", requireAuth, async (req, res) => {
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
      user: createUserPayload(req.user)
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to update account settings right now." });
  }
});

app.get("/api/notifications", requireAuth, async (req, res) => {
  try {
    await syncUserStorageUsage(req.user);
    const notifications = await buildNotificationsForUser(req.user);

    res.json({
      notifications,
      unreadCount: notifications.length
    });
  } catch (error) {
    res.status(500).json({ message: "Unable to fetch notifications right now." });
  }
});

app.post("/api/auth/logout", requireAuth, async (req, res) => {
  try {
    req.user.sessions = req.user.sessions.filter(
      (session) => session.tokenHash !== req.tokenHash
    );
    await req.user.save();

    res.json({ message: "Logged out successfully." });
  } catch (error) {
    res.status(500).json({ message: "Unable to log out right now." });
  }
});

app.get("/api/documents", requireAuth, async (req, res) => {
  try {
    const { search = "", category = "", status = "" } = req.query;
    const query = {
      owner: req.user._id
    };

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $elemMatch: { $regex: search, $options: "i" } } }
      ];
    }

    if (category) {
      query.category = category;
    }

    const documents = await Document.find(query).sort({ createdAt: -1 });

    const filteredDocuments =
      status && status !== "all"
        ? documents.filter((document) => {
            const docStatus = document.getExpiryStatus();
            return docStatus === status;
          })
        : documents;

    res.json(filteredDocuments);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch documents." });
  }
});

app.get("/api/documents/:id", requireAuth, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found." });
    }

    res.json(document);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch the document." });
  }
});

app.get("/api/documents/:id/file", requireAuth, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found." });
    }

    res.setHeader("Content-Type", document.fileType || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `inline; filename*=UTF-8''${encodeURIComponent(document.fileName)}`
    );

    streamStoredFile(document, res);
  } catch (error) {
    res.status(500).json({ message: "Unable to open the file." });
  }
});

app.post("/api/documents", requireAuth, upload.single("file"), async (req, res) => {
  let uploadedFileId = null;

  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a document file." });
    }

    const tags = req.body.tags
      ? req.body.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : [];

    await syncUserStorageUsage(req.user);

    const projectedStorageUsage = (req.user.storageUsedBytes || 0) + req.file.size;
    if (projectedStorageUsage > (req.user.storageLimitBytes || DEFAULT_STORAGE_LIMIT_BYTES)) {
      return res.status(400).json({
        message: "Storage limit reached. Delete existing files or upload a smaller document."
      });
    }

    uploadedFileId = await uploadBufferToGridFs(req.file, req.user._id);

    const document = await Document.create({
      owner: req.user._id,
      title: req.body.title,
      category: req.body.category,
      description: req.body.description,
      expiryDate: req.body.expiryDate || null,
      tags,
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      gridFsFileId: uploadedFileId
    });

    req.user.storageUsedBytes = projectedStorageUsage;
    await req.user.save();

    res.status(201).json(document);
  } catch (error) {
    console.error("Create document error:", error.message);
    if (uploadedFileId) {
      await deleteGridFsFile(uploadedFileId).catch(() => {});
    }

    res.status(400).json({ message: "Failed to add document." });
  }
});

app.put("/api/documents/:id", requireAuth, upload.single("file"), async (req, res) => {
  let uploadedFileId = null;

  try {
    const document = await Document.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found." });
    }

    const tags = req.body.tags
      ? req.body.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      : document.tags;

    const previousStoredFile = req.file
      ? {
          gridFsFileId: document.gridFsFileId,
          filePath: document.filePath
        }
      : null;

    await syncUserStorageUsage(req.user);

    document.title = req.body.title || document.title;
    document.category = req.body.category || document.category;
    document.description = req.body.description || document.description;
    document.expiryDate = req.body.expiryDate || null;
    document.tags = tags;

    if (req.file) {
      const projectedStorageUsage =
        (req.user.storageUsedBytes || 0) - (document.fileSize || 0) + req.file.size;

      if (projectedStorageUsage > (req.user.storageLimitBytes || DEFAULT_STORAGE_LIMIT_BYTES)) {
        return res.status(400).json({
          message: "Storage limit reached. Delete existing files or upload a smaller document."
        });
      }

      uploadedFileId = await uploadBufferToGridFs(req.file, req.user._id);
      document.fileName = req.file.originalname;
      document.fileType = req.file.mimetype;
      document.fileSize = req.file.size;
      document.gridFsFileId = uploadedFileId;
      document.filePath = null;
      document.storedFileName = null;

      req.user.storageUsedBytes = projectedStorageUsage;
    }

    await document.save();
    await req.user.save();

    if (previousStoredFile) {
      await deleteStoredFile(previousStoredFile).catch((cleanupError) => {
        console.error("File cleanup warning:", cleanupError.message);
      });
    }

    res.json(document);
  } catch (error) {
    console.error("Update document error:", error.message);
    if (uploadedFileId) {
      await deleteGridFsFile(uploadedFileId).catch(() => {});
    }

    res.status(400).json({ message: "Failed to update document." });
  }
});

app.delete("/api/documents/:id", requireAuth, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found." });
    }

    await deleteStoredFile(document);
    await document.deleteOne();
    req.user.storageUsedBytes = Math.max(
      0,
      (req.user.storageUsedBytes || 0) - (document.fileSize || 0)
    );
    await req.user.save();

    res.json({ message: "Document deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete document." });
  }
});

app.use((error, _req, res, next) => {
  if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      message: `File is too large. Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`
    });
  }

  if (error) {
    return res.status(500).json({ message: "Unexpected server error." });
  }

  next();
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

async function startServer() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000
    });
    console.log("Connected to MongoDB");

    app.listen(PORT, HOST, () => {
      console.log(`Server running on http://${HOST}:${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection error:", error.message);
    process.exit(1);
  }
}

startServer();
