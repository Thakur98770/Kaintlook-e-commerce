const express = require("express");
const { getProductReviews, addReview, deleteReview } = require("../controllers/reviewController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router({ mergeParams: true }); // gives access to :productId from parent router

router.get("/", getProductReviews);
router.post("/", protect, addReview);
router.delete("/:reviewId", protect, deleteReview);

module.exports = router;
