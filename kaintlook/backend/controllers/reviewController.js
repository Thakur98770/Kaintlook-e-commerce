const Review = require("../models/Review");
const Product = require("../models/Product");
const mongoose = require("mongoose");

// Recompute and store average rating + count on the product
const syncProductRating = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { product: productId } },
    { $group: { _id: "$product", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
  ]);

  await Product.findByIdAndUpdate(productId, {
    rating: stats[0] ? Number(stats[0].avgRating.toFixed(1)) : 0,
    numReviews: stats[0] ? stats[0].count : 0,
  });
};

// @route GET /api/products/:productId/reviews
const getProductReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ product: req.params.productId }).sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch reviews", error: err.message });
  }
};

// @route POST /api/products/:productId/reviews  { rating, comment }  (logged-in user)
const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const existing = await Review.findOne({ product: req.params.productId, user: req.user._id });
    if (existing) {
      return res.status(400).json({ message: "You have already reviewed this product" });
    }

    const review = await Review.create({
      product: req.params.productId,
      user: req.user._id,
      name: req.user.name,
      rating,
      comment,
    });

    await syncProductRating(req.params.productId);
    res.status(201).json(review);
  } catch (err) {
    res.status(400).json({ message: "Failed to add review", error: err.message });
  }
};

// @route DELETE /api/products/:productId/reviews/:reviewId (owner or admin)
const deleteReview = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.productId) || !mongoose.isValidObjectId(req.params.reviewId)) {
      return res.status(400).json({ message: "Invalid review or product" });
    }
    const review = await Review.findOne({ _id: req.params.reviewId, product: req.params.productId });
    if (!review) return res.status(404).json({ message: "Review not found" });

    const isOwner = review.user.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to delete this review" });
    }

    await review.deleteOne();
    await syncProductRating(req.params.productId);
    res.json({ message: "Review deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete review", error: err.message });
  }
};

const deleteMyReview = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.reviewId)) return res.status(400).json({ message: "Invalid review" });
    const review = await Review.findOneAndDelete({ _id: req.params.reviewId, user: req.user._id });
    if (!review) return res.status(404).json({ message: "Review not found" });
    if (await Product.exists({ _id: review.product })) await syncProductRating(review.product);
    res.json({ message: "Review deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete review", error: err.message });
  }
};

// @route GET /api/my-reviews  (logged-in user)
// All reviews the current user has written, across every product.
const getMyReviews = async (req, res) => {
  try {
    const reviews = await Review.find({ user: req.user._id })
      .populate("product", "name images")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch your reviews", error: err.message });
  }
};

module.exports = { getProductReviews, addReview, deleteReview, deleteMyReview, getMyReviews };