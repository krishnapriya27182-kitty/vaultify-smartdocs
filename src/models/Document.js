const mongoose = require("mongoose");

const documentSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      default: "",
      trim: true
    },
    expiryDate: {
      type: Date,
      default: null
    },
    tags: {
      type: [String],
      default: []
    },
    fileName: {
      type: String,
      required: true
    },
    gridFsFileId: {
      type: mongoose.Schema.Types.ObjectId,
      default: null
    },
    fileType: {
      type: String,
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform: (_doc, ret) => {
        const expiry = ret.expiryDate ? new Date(ret.expiryDate) : null;
        const now = new Date();

        if (!expiry) {
          ret.expiryStatus = "no-expiry";
        } else if (expiry < now) {
          ret.expiryStatus = "expired";
        } else {
          const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
          ret.expiryStatus = diffDays <= 30 ? "expiring-soon" : "active";
        }

        ret.downloadUrl = `/api/documents/${ret._id}/file`;
        delete ret.gridFsFileId;
        delete ret.__v;

        return ret;
      }
    }
  }
);

documentSchema.methods.getExpiryStatus = function getExpiryStatus() {
  if (!this.expiryDate) {
    return "no-expiry";
  }

  const now = new Date();
  const expiry = new Date(this.expiryDate);

  if (expiry < now) {
    return "expired";
  }

  const diffDays = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  return diffDays <= 30 ? "expiring-soon" : "active";
};

module.exports = mongoose.model("Document", documentSchema);
