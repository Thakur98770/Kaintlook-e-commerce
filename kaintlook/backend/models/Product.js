const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, trim: true },
    description: { type: String, default: "" },
    category: { type: String, required: true, index: true },
    subcategory: { type: String, trim: true, default: "", index: true },
    price: { type: Number, required: true, min: 0 },
    unit: { type: String, default: "Pcs" },
    stock: { type: Number, default: 0, min: 0 },
    images: [{ type: String }],
    tag: { type: String, enum: ["New", "Bestseller", "Sale", ""], default: "" },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    numReviews: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

productSchema.index({ name: "text", description: "text" });

module.exports = mongoose.model("Product", productSchema);
