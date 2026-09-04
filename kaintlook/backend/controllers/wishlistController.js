const Wishlist = require("../models/Wishlist");
const Product = require("../models/Product");
const mongoose = require("mongoose");

// @route GET /api/wishlist
const getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user._id }).populate("products");
    if (!wishlist) wishlist = await Wishlist.create({ user: req.user._id, products: [] });
    res.json(wishlist);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch wishlist", error: err.message });
  }
};

// @route POST /api/wishlist  { productId }
const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!mongoose.isValidObjectId(productId)) return res.status(400).json({ message: "Invalid product" });
    if (!(await Product.exists({ _id: productId }))) return res.status(404).json({ message: "Product not found" });
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) wishlist = new Wishlist({ user: req.user._id, products: [] });

    if (!wishlist.products.some((p) => p.toString() === productId)) {
      wishlist.products.push(productId);
      await wishlist.save();
    }

    await wishlist.populate("products");
    res.json(wishlist);
  } catch (err) {
    res.status(400).json({ message: "Failed to add to wishlist", error: err.message });
  }
};

// @route DELETE /api/wishlist/:productId
const removeFromWishlist = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.productId)) return res.status(400).json({ message: "Invalid product" });
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) return res.status(404).json({ message: "Wishlist not found" });

    wishlist.products = wishlist.products.filter((p) => p.toString() !== req.params.productId);
    await wishlist.save();
    res.json(wishlist);
  } catch (err) {
    res.status(500).json({ message: "Failed to remove from wishlist", error: err.message });
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist };
