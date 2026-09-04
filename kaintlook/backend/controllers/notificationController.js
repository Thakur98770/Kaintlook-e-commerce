const EmailNotification = require("../models/EmailNotification");

const getEmailNotifications = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page || "1", 10));
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit || "50", 10)));
    const notifications = await EmailNotification.find()
      .populate("user", "name")
      .populate("order", "_id")
      .select("user order recipientEmail eventType status sentAt error retryCount createdAt")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    res.json({ notifications, page, limit });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch email notifications", error: err.message });
  }
};

module.exports = { getEmailNotifications };