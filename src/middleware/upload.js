const multer = require("multer");

const { MAX_FILE_SIZE_BYTES } = require("../config/constants");

module.exports = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES
  }
});
