const path = require("path");

const ROOT_DIR = path.resolve(__dirname, "../..");
const PUBLIC_DIR = path.join(ROOT_DIR, "public");

const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0";
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/vaultify-smartdocs";
const RESET_CODE_EXPIRY_MINUTES =
  Number(process.env.RESET_CODE_EXPIRY_MINUTES) || 15;
const MAX_FILE_SIZE_MB = Number(process.env.MAX_FILE_SIZE_MB) || 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const DEFAULT_STORAGE_LIMIT_BYTES = 30 * 1024 * 1024;

module.exports = {
  ROOT_DIR,
  PUBLIC_DIR,
  PORT,
  HOST,
  MONGODB_URI,
  RESET_CODE_EXPIRY_MINUTES,
  MAX_FILE_SIZE_MB,
  MAX_FILE_SIZE_BYTES,
  DEFAULT_STORAGE_LIMIT_BYTES
};
