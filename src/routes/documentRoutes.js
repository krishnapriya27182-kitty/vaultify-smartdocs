const express = require("express");

const { DEFAULT_STORAGE_LIMIT_BYTES } = require("../config/constants");
const requireAuth = require("../middleware/requireAuth");
const upload = require("../middleware/upload");
const Document = require("../models/Document");
const {
  deleteGridFsFile,
  deleteStoredFile,
  streamStoredFile,
  syncUserStorageUsage,
  uploadBufferToGridFs
} = require("../services/storageService");

const router = express.Router();

function parseTags(value, fallback = []) {
  if (!value) {
    return fallback;
  }

  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

router.get("/", requireAuth, async (req, res) => {
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
        ? documents.filter((document) => document.getExpiryStatus() === status)
        : documents;

    res.json(filteredDocuments);
  } catch (_error) {
    res.status(500).json({ message: "Failed to fetch documents." });
  }
});

router.get("/:id", requireAuth, async (req, res) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found." });
    }

    res.json(document);
  } catch (_error) {
    res.status(500).json({ message: "Failed to fetch the document." });
  }
});

router.get("/:id/file", requireAuth, async (req, res) => {
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
  } catch (_error) {
    res.status(500).json({ message: "Unable to open the file." });
  }
});

router.post("/", requireAuth, upload.single("file"), async (req, res) => {
  let uploadedFileId = null;

  try {
    if (!req.file) {
      return res.status(400).json({ message: "Please upload a document file." });
    }

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
      tags: parseTags(req.body.tags),
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

router.put("/:id", requireAuth, upload.single("file"), async (req, res) => {
  let uploadedFileId = null;

  try {
    const document = await Document.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found." });
    }

    const previousStoredFile = req.file
      ? {
          gridFsFileId: document.gridFsFileId
        }
      : null;

    await syncUserStorageUsage(req.user);

    document.title = req.body.title || document.title;
    document.category = req.body.category || document.category;
    document.description = req.body.description || document.description;
    document.expiryDate = req.body.expiryDate || null;
    document.tags = parseTags(req.body.tags, document.tags);

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

router.delete("/:id", requireAuth, async (req, res) => {
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
  } catch (_error) {
    res.status(500).json({ message: "Failed to delete document." });
  }
});

module.exports = router;
