const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true }, // snapshot in case product changes later
    price: { type: Number, required: true }, // price at time of order
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [orderItemSchema],
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    coupon: { type: String, default: "" },
    deliveryCharge: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    shippingAddress: {
      fullName: String,
      line1: String,
      line2: String,
      landmark: String,
      city: String,
      state: String,
      pincode: String,
      phone: String,
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "processing", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"],
      default: "pending",
    },
    trackingHistory: [
      {
        status: { type: String },
        note: { type: String, default: "" },
        at: { type: Date, default: Date.now },
      },
    ],
    courierName: { type: String, default: "" },
    trackingNumber: { type: String, default: "" },
    paymentMethod: { type: String, enum: ["cod"], required: true, default: "cod" },
    paymentStatus: { type: String, enum: ["unpaid", "paid", "failed", "refunded"], default: "unpaid" },
    cancelReason: { type: String, default: "" },
    cancelledAt: { type: Date },
    return: {
      requested: { type: Boolean, default: false },
      reason: { type: String, default: "" },
      status: { type: String, enum: ["none", "requested", "approved", "rejected", "refunded"], default: "none" },
      requestedAt: { type: Date },
      resolvedAt: { type: Date },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);
