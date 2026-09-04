const express = require("express");
const { getMyReviews, deleteMyReview } = require("../controllers/reviewController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getMyReviews);
router.delete("/:reviewId", protect, deleteMyReview);

module.exports = router;