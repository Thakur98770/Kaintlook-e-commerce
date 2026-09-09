const mongoose = require("mongoose");
const StockNotification = require("../models/StockNotification");
const Product = require("../models/Product");
const { hasVariants } = require("../utils/variantHelpers");

const norm = (v) => (v || "").toString().trim();
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// @route POST /api/stock-notifications  { productId, colorName, size, email }
// Public (works for guests too) — but if the user is logged in, req.user may
// be attached by optionalAuth so we can link the subscription to their account.
const subscribe = async (req, res) => {
  try {
    const { productId } = req.body;
    const colorName = norm(req.body.colorName);
    const size = norm(req.body.size);
    const email = norm(req.body.email).toLowerCase();

    if (!mongoose.isValidObjectId(productId)) return res.status(400).json({ message: "Invalid product" });
    if (!email || !emailRe.test(email)) return res.status(400).json({ message: "Enter a valid email address" });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    // Make sure this is a real, currently out-of-stock variant — no point
    // subscribing to something that's already available or doesn't exist.
    if (hasVariants(product)) {
      if (!colorName || !size) return res.status(400).json({ message: "Select a color and size first" });
      const variant = product.variants.find((v) => v.colorName === colorName);
      const row = variant?.sizes.find((s) => s.size === size);
      if (!row) return res.status(400).json({ message: "Selected size/color not found" });
      if (row.stock > 0) return res.status(400).json({ message: "This item is currently in stock" });
    } else if (product.stock > 0) {
      return res.status(400).json({ message: "This item is currently in stock" });
    }

    const existing = await StockNotification.findOne({ product: productId, colorName, size, email, status: "active" });
    if (existing) return res.status(200).json({ message: "You're already on the notification list.", alreadySubscribed: true });

    await StockNotification.create({
      product: productId,
      productName: product.name,
      colorName,
      colorCode: hasVariants(product) ? product.variants.find((v) => v.colorName === colorName)?.colorCode || "" : "",
      size,
      email,
      user: req.user?._id || null,
    });

    res.status(201).json({ message: "We'll email you when this is back in stock." });
  } catch (err) {
    res.status(400).json({ message: "Failed to save notification request", error: err.message });
  }
};

// @route GET /api/stock-notifications  (admin only) — ?status=active|notified|cancelled
const listNotifications = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const notifications = await StockNotification.find(filter).sort({ createdAt: -1 }).limit(500);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch notifications", error: err.message });
  }
};

module.exports = { subscribe, listNotifications };