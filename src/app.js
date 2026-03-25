const express = require("express");
const multer = require("multer");
const path = require("path");

const { MAX_FILE_SIZE_MB, PUBLIC_DIR } = require("./config/constants");
const accountRoutes = require("./routes/accountRoutes");
const authRoutes = require("./routes/authRoutes");
const documentRoutes = require("./routes/documentRoutes");
const notificationRoutes = require("./routes/notificationRoutes");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(PUBLIC_DIR));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/documents", documentRoutes);

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

module.exports = app;
