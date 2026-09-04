const express = require("express");
const fs = require("fs");
const upload = require("../middleware/upload");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

// POST /api/upload/products — admin only. Field name must be "images",
// up to 5 files. Returns { urls: [...] } — plug those straight into a
// product's `images` array.
router.post("/products", protect, adminOnly, (req, res) => {
  upload.array("images", 5)(req, res, (err) => {
    if (err) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "Each photo must be under 5MB"
          : err.code === "LIMIT_FILE_COUNT" || err.code === "LIMIT_UNEXPECTED_FILE"
          ? "You can upload up to 5 photos at a time"
          : err.message || "Upload failed";
      return res.status(400).json({ message });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files received" });
    }

    const valid = req.files.every((file) => {
      const header = fs.readFileSync(file.path).subarray(0, 12);
      return (header[0] === 0xff && header[1] === 0xd8 && header[2] === 0xff) ||
        (header[0] === 0x89 && header[1] === 0x50 && header[2] === 0x4e && header[3] === 0x47) ||
        (header[0] === 0x47 && header[1] === 0x49 && header[2] === 0x46) ||
        (header.toString("ascii", 0, 4) === "RIFF" && header.toString("ascii", 8, 12) === "WEBP");
    });
    if (!valid) {
      req.files.forEach((file) => fs.unlink(file.path, () => {}));
      return res.status(400).json({ message: "Uploaded files are not valid images" });
    }

    const urls = req.files.map(
      (file) => `${req.protocol}://${req.get("host")}/uploads/${file.filename}`
    );
    res.json({ urls });
  });
});

module.exports = router;
