const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    // "" for a legacy/simple product with no variants — a cart "line" is
    // uniquely identified by product + variantColorName + size together,
    // so Black/M and Black/XL of the same product stay separate lines.
    variantColorName: { type: String, default: "", trim: true },
    size: { type: String, default: "", trim: true },
    quantity: { type: Number, required: true, min: 1, default: 1 },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    items: [cartItemSchema],
    checkoutLockUntil: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Cart", cartSchema);