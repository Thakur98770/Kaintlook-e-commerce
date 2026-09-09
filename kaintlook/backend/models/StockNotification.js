const mongoose = require("mongoose");

// A "notify me when back in stock" subscription, tied to one exact
// product + color + size combination (never the whole product).
const stockNotificationSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    // Snapshot of the product name at request time, so the admin list and any
    // notification email still make sense even if the product is later renamed/removed.
    productName: { type: String, required: true },
    // "" for a legacy product with no color variants at all.
    colorName: { type: String, default: "", trim: true },
    colorCode: { type: String, default: "" },
    size: { type: String, default: "", trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    status: { type: String, enum: ["active", "notified", "cancelled"], default: "active", index: true },
    notifiedAt: { type: Date },
  },
  { timestamps: true }
);

// Fast lookup of "who's waiting for this exact variant" when a restock happens.
stockNotificationSchema.index({ product: 1, colorName: 1, size: 1, status: 1 });

module.exports = mongoose.model("StockNotification", stockNotificationSchema);