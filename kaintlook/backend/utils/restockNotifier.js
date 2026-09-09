// Detects "0 -> positive" restock events when an admin updates a product,
// and notifies anyone waiting on that exact color+size (or the whole legacy
// product, if it has no variants). Never fires for 5->10, only for 0->N.

const StockNotification = require("../models/StockNotification");
const { sendRestockNotification } = require("./emailNotifications");

const findSize = (variant, size) => (variant?.sizes || []).find((s) => s.size === size);

async function notifySubscribers(product, colorName, size, colorCode) {
  const subs = await StockNotification.find({ product: product._id, colorName, size, status: "active" });
  if (subs.length === 0) return;

  for (const sub of subs) {
    // Fire-and-forget per subscriber, but still mark as notified right away so a
    // second restock update a moment later (or a retry) never double-sends.
    sub.status = "notified";
    sub.notifiedAt = new Date();
    await sub.save().catch((err) => console.error(`Failed to mark notification ${sub._id} as notified:`, err.message));

    sendRestockNotification(sub.email, product, colorName, size, colorCode).catch((err) => {
      console.error(`Failed to send restock email to ${sub.email} for product ${product._id}:`, err.message);
    });
  }
}

// oldProduct / newProduct are plain-enough objects (Mongoose docs or lean
// objects both work) from immediately before and after an update.
async function checkAndNotifyRestock(oldProduct, newProduct) {
  try {
    const oldVariants = oldProduct.variants || [];
    const newVariants = newProduct.variants || [];

    if (oldVariants.length === 0 && newVariants.length === 0) {
      // Legacy simple product — restock tracked on the top-level `stock` field.
      const oldStock = Number(oldProduct.stock) || 0;
      const newStock = Number(newProduct.stock) || 0;
      if (oldStock <= 0 && newStock > 0) {
        await notifySubscribers(newProduct, "", "", "");
      }
      return;
    }

    for (const newVariant of newVariants) {
      const oldVariant = oldVariants.find((v) => v.colorName === newVariant.colorName);
      for (const newSize of newVariant.sizes || []) {
        const oldSize = findSize(oldVariant, newSize.size);
        const oldStock = Number(oldSize?.stock) || 0;
        const newStock = Number(newSize.stock) || 0;
        if (oldStock <= 0 && newStock > 0) {
          await notifySubscribers(newProduct, newVariant.colorName, newSize.size, newVariant.colorCode);
        }
      }
    }
  } catch (err) {
    // Never let a notification failure block or fail the admin's product-save request.
    console.error(`Restock notification check failed for product ${newProduct?._id}:`, err.message);
  }
}

module.exports = { checkAndNotifyRestock };