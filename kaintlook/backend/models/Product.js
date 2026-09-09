const mongoose = require("mongoose");

// One size row within a color variant — e.g. { size: "M", stock: 15 }.
const sizeStockSchema = new mongoose.Schema(
  {
    size: { type: String, required: true, trim: true },
    stock: { type: Number, default: 0, min: 0 },
    sku: { type: String, trim: true, default: "" },
    // Optional per-size price override — if not set, the variant/product price applies.
    price: { type: Number, min: 0 },
  },
  { _id: false }
);

// One color variant — its own images + a size/stock breakdown.
const variantSchema = new mongoose.Schema({
  colorName: { type: String, required: true, trim: true },
  // Hex code exactly as chosen by the admin (e.g. "#FF69B4") — never guessed/derived.
  colorCode: { type: String, required: true, trim: true, match: /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/ },
  images: [{ type: String }],
  sizes: [sizeStockSchema],
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true },
    description: { type: String, default: "" },
    category: { type: String, required: true, index: true },
    subcategory: { type: String, trim: true, default: "", index: true },
    price: { type: Number, required: true, min: 0 },
    unit: { type: String, default: "Pcs" },
    // Legacy/simple stock — only meaningful for products with NO variants.
    // Existing products created before variants existed keep working off this
    // field exactly as before; it's ignored once `variants` has entries.
    stock: { type: Number, default: 0, min: 0 },
    images: [{ type: String }],
    tag: { type: String, enum: ["New", "Bestseller", "Sale", ""], default: "" },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0, min: 0 },

    // Below this count (per size, or per-product for legacy items), a variant
    // shows as "Low Stock" instead of "In Stock". 0 always means Out of Stock.
    lowStockThreshold: { type: Number, default: 5, min: 0 },
    variants: [variantSchema],
  },
  { timestamps: true }
);

productSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("Product", productSchema);