const mongoose = require("mongoose");

const Document = require("../models/Document");

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

  res.status(404).json({ message: "Stored file could not be found." });
}

module.exports = {
  syncUserStorageUsage,
  uploadBufferToGridFs,
  deleteGridFsFile,
  deleteStoredFile,
  streamStoredFile
};
