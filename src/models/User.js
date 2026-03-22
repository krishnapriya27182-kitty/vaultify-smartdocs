const mongoose = require("mongoose");
const crypto = require("crypto");

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function hashResetCode(code) {
  return crypto.createHash("sha256").update(code).digest("hex");
}

function safeCompare(hexA, hexB) {
  if (!hexA || !hexB) {
    return false;
  }

  const bufferA = Buffer.from(hexA, "hex");
  const bufferB = Buffer.from(hexB, "hex");

  if (bufferA.length !== bufferB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufferA, bufferB);
}

const sessionSchema = new mongoose.Schema(
  {
    tokenHash: {
      type: String,
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    recoveryEmail: {
      type: String,
      default: "",
      lowercase: true,
      trim: true
    },
    emailNotificationsEnabled: {
      type: Boolean,
      default: true
    },
    storageLimitBytes: {
      type: Number,
      default: 30 * 1024 * 1024
    },
    storageUsedBytes: {
      type: Number,
      default: 0
    },
    passwordHash: {
      type: String,
      required: true
    },
    passwordSalt: {
      type: String,
      required: true
    },
    sessions: {
      type: [sessionSchema],
      default: []
    },
    passwordResetCodeHash: {
      type: String,
      default: null
    },
    passwordResetExpiresAt: {
      type: Date,
      default: null
    }
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        delete ret.passwordHash;
        delete ret.passwordSalt;
        delete ret.passwordResetCodeHash;
        delete ret.passwordResetExpiresAt;
        delete ret.sessions;
        delete ret.__v;
        return ret;
      }
    }
  }
);

userSchema.methods.setPassword = function setPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  this.passwordSalt = salt;
  this.passwordHash = hashPassword(password, salt);
};

userSchema.methods.validatePassword = function validatePassword(password) {
  const computedHash = hashPassword(password, this.passwordSalt);
  return safeCompare(computedHash, this.passwordHash);
};

userSchema.methods.createPasswordResetCode = function createPasswordResetCode(expiryMinutes = 15) {
  const code = crypto.randomInt(100000, 999999).toString();

  this.passwordResetCodeHash = hashResetCode(code);
  this.passwordResetExpiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

  return code;
};

userSchema.methods.validatePasswordResetCode = function validatePasswordResetCode(code) {
  if (!this.passwordResetCodeHash || !this.passwordResetExpiresAt) {
    return false;
  }

  if (new Date(this.passwordResetExpiresAt) < new Date()) {
    return false;
  }

  return safeCompare(hashResetCode(code), this.passwordResetCodeHash);
};

userSchema.methods.clearPasswordResetCode = function clearPasswordResetCode() {
  this.passwordResetCodeHash = null;
  this.passwordResetExpiresAt = null;
};

module.exports = mongoose.model("User", userSchema);
