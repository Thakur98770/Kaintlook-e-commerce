const mongoose = require("mongoose");

const emailNotificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null, index: true },
    recipientEmail: { type: String, required: true },
    eventType: { type: String, required: true },
    status: { type: String, enum: ["pending", "sent", "skipped", "failed"], default: "pending" },
    eventKey: { type: String, required: true, unique: true },
    sentAt: { type: Date },
    providerMessageId: { type: String, default: "" },
    error: { type: String, default: "" },
    retryCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("EmailNotification", emailNotificationSchema);