const EmailNotification = require("../models/EmailNotification");
const { sendEmail } = require("./sendEmail");
const { otpEmail, welcomeEmail, orderEmail, returnEmail } = require("./emailTemplates");

async function notify({ user, order = null, eventType, eventKey, payload }) {
  if (!user?.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) return;
  let notification;
  try {
    notification = await EmailNotification.findOneAndUpdate(
      { eventKey },
      { $setOnInsert: { user: user._id, order: order?._id || null, recipientEmail: user.email, eventType, eventKey } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    if (notification.status === "sent" || notification.status === "skipped") return notification;
    const result = await sendEmail({ to: user.email, ...payload });
    notification.status = result.sent ? "sent" : result.skipped ? "skipped" : "failed";
    notification.sentAt = result.sent ? new Date() : undefined;
    notification.providerMessageId = result.messageId || "";
    notification.error = result.error || "";
    notification.retryCount += result.sent || result.skipped ? 0 : 1;
    await notification.save();
    return notification;
  } catch (error) {
    if (notification) {
      notification.status = "failed";
      notification.error = error.message;
      notification.retryCount += 1;
      await notification.save().catch(() => {});
    }
  }
}

const sendOtpNotification = (user, otp, purpose) => notify({ user, eventType: `${purpose}_otp`, eventKey: `user:${user._id}:${purpose}:otp:${user.otpExpiry?.getTime() || Date.now()}`, payload: otpEmail(user, otp, purpose) });
const sendWelcomeNotification = (user) => notify({ user, eventType: "welcome", eventKey: `user:${user._id}:welcome`, payload: welcomeEmail(user) });
const sendOrderNotification = (user, order, eventType) => notify({ user, order, eventType, eventKey: `order:${order._id}:${eventType}`, payload: orderEmail(user, order, eventType) });
const sendReturnNotification = (user, order) => notify({ user, order, eventType: `return_${order.return.status}`, eventKey: `order:${order._id}:return:${order.return.status}`, payload: returnEmail(user, order) });

module.exports = { sendOtpNotification, sendWelcomeNotification, sendOrderNotification, sendReturnNotification };