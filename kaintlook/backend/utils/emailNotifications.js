const EmailNotification = require("../models/EmailNotification");
const { sendEmail } = require("./sendEmail");
const { otpEmail, welcomeEmail, orderEmail, adminOrderEmail, returnEmail, restockEmail } = require("./emailTemplates");

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

// Internal "new order" alert to the store owner/admin — configured via ADMIN_EMAIL.
// This intentionally bypasses the EmailNotification dedupe pipeline above (which
// is keyed to a registered User doc): the recipient here is a plain mailbox from
// env, not a user account, and placeOrder() only ever fires this once per order.
// If ADMIN_EMAIL isn't set, this silently no-ops (nothing to send).
const sendAdminOrderNotification = (order, customer) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) return Promise.resolve({ sent: false, skipped: true });
  return sendEmail({ to: adminEmail, ...adminOrderEmail(customer, order) });
};

// Back-in-stock alert — sent to a plain email address (no User account
// required), so this bypasses the EmailNotification dedupe pipeline just like
// sendAdminOrderNotification does. Idempotency here is handled by the caller
// (restockNotifier.js marks the subscription "notified" before sending).
const sendRestockNotification = (email, product, colorName, size, colorCode) =>
  sendEmail({ to: email, ...restockEmail(product, colorName, size, colorCode) });

module.exports = { sendOtpNotification, sendWelcomeNotification, sendOrderNotification, sendAdminOrderNotification, sendReturnNotification, sendRestockNotification };