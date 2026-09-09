const mongoose = require("mongoose");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Coupon = require("../models/Coupon");
const Product = require("../models/Product");
const Address = require("../models/Address");
const { sendOrderNotification, sendAdminOrderNotification, sendReturnNotification } = require("../utils/emailNotifications");
const { hasVariants } = require("../utils/variantHelpers");
const FREE_DELIVERY_MINIMUM = 1999;
const DELIVERY_CHARGE = 99;

const norm = (v) => (v || "").toString().trim();

// How many units of this exact color+size (or, for a legacy product, the
// product itself) are available right now. Always the source of truth —
// never trust a stock number the client sends up.
const availableStock = (product, colorName, size) => {
  if (!hasVariants(product)) return product.stock ?? 0;
  const variant = product.variants.find((v) => v.colorName === colorName);
  const row = variant?.sizes.find((s) => s.size === size);
  return row?.stock ?? 0;
};

const variantImage = (product, colorName) => {
  if (hasVariants(product)) {
    const variant = product.variants.find((v) => v.colorName === colorName);
    if (variant?.images?.length) return variant.images[0];
  }
  return product.images?.[0] || "";
};

const variantSku = (product, colorName, size) => {
  if (!hasVariants(product)) return "";
  const variant = product.variants.find((v) => v.colorName === colorName);
  const row = variant?.sizes.find((s) => s.size === size);
  return row?.sku || "";
};

const variantColorCode = (product, colorName) => {
  if (!hasVariants(product)) return "";
  return product.variants.find((v) => v.colorName === colorName)?.colorCode || "";
};

// Atomically take `qty` units off a specific color+size (or the legacy
// top-level stock). Only actually decrements if enough stock is still there
// at the moment of the write — returns null if not (caller treats that as
// "no longer available", exactly like the pre-variant code already did.
async function decrementStock(productId, colorName, size, qty) {
  if (norm(colorName) && norm(size)) {
    return Product.findOneAndUpdate(
      {
        _id: productId,
        variants: { $elemMatch: { colorName, sizes: { $elemMatch: { size, stock: { $gte: qty } } } } },
      },
      { $inc: { "variants.$[v].sizes.$[s].stock": -qty } },
      { arrayFilters: [{ "v.colorName": colorName }, { "s.size": size }], new: true }
    );
  }
  return Product.findOneAndUpdate({ _id: productId, stock: { $gte: qty } }, { $inc: { stock: -qty } }, { new: true });
}

// Reverses decrementStock — used for rollbacks and order cancellations.
async function incrementStock(productId, colorName, size, qty) {
  if (norm(colorName) && norm(size)) {
    await Product.updateOne(
      { _id: productId, "variants.colorName": colorName, "variants.sizes.size": size },
      { $inc: { "variants.$[v].sizes.$[s].stock": qty } },
      { arrayFilters: [{ "v.colorName": colorName }, { "s.size": size }] }
    );
  } else {
    await Product.updateOne({ _id: productId }, { $inc: { stock: qty } });
  }
}

// Normalises either the user's Cart, or a single "Buy Now" item, into the
// same shape so the rest of placeOrder doesn't need to know which one it's
// dealing with: [{ product (full doc), variantColorName, size, quantity }]
async function resolveSourceItems(req) {
  if (req.body.buyNow) {
    const { productId, variantColorName, size, quantity = 1 } = req.body.buyNow;
    if (!mongoose.isValidObjectId(productId)) throw Object.assign(new Error("Invalid product"), { status: 400 });
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000) {
      throw Object.assign(new Error("Quantity must be a whole number between 1 and 1000"), { status: 400 });
    }
    const product = await Product.findById(productId);
    if (!product) throw Object.assign(new Error("Product not found"), { status: 404 });
    return { items: [{ product, variantColorName: norm(variantColorName), size: norm(size), quantity }], cart: null };
  }

  const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
  if (!cart || cart.items.length === 0) {
    throw Object.assign(new Error("Cart is empty"), { status: 400 });
  }
  const items = cart.items.map((i) => ({
    product: i.product,
    variantColorName: norm(i.variantColorName),
    size: norm(i.size),
    quantity: i.quantity,
  }));
  return { items, cart };
}

// @route POST /api/orders  { addressId, couponCode, paymentMethod, buyNow? }
// buyNow (optional): { productId, variantColorName, size, quantity } — when
// present, this single item is purchased directly and the user's Cart is
// left completely untouched.
const placeOrder = async (req, res) => {
  let claimedCart;
  try {
    if (req.body.paymentMethod && req.body.paymentMethod !== "cod") {
      return res.status(400).json({ message: "Only Cash on Delivery is available" });
    }
    if (!req.body.addressId) return res.status(400).json({ message: "A saved shipping address is required" });
    const address = await Address.findOne({ _id: req.body.addressId, user: req.user._id }).lean();
    if (!address) return res.status(400).json({ message: "Shipping address not found" });

    const { items: sourceItems, cart } = await resolveSourceItems(req);

    // Validate every line has a real product and enough stock for its exact
    // color+size before touching anything.
    const insufficient = sourceItems.filter((i) => !i.product || availableStock(i.product, i.variantColorName, i.size) < i.quantity);
    if (insufficient.length > 0) {
      return res.status(400).json({
        message: "Some items don't have enough stock",
        items: insufficient.map((i) => ({
          product: i.product?._id,
          name: i.product?.name || "Unknown product",
          variantColorName: i.variantColorName,
          size: i.size,
          available: i.product ? availableStock(i.product, i.variantColorName, i.size) : 0,
          requested: i.quantity,
        })),
      });
    }

    // Only cart-based checkouts need the short "in progress" lock — a Buy Now
    // purchase doesn't touch the shared Cart document, so there's nothing to lock.
    if (cart) {
      claimedCart = await Cart.findOneAndUpdate(
        { _id: cart._id, $or: [{ checkoutLockUntil: null }, { checkoutLockUntil: { $lt: new Date() } }] },
        { checkoutLockUntil: new Date(Date.now() + 5 * 60 * 1000) },
        { new: true }
      );
      if (!claimedCart) return res.status(409).json({ message: "Checkout already in progress. Please try again." });
    }

    const decremented = [];
    for (const i of sourceItems) {
      const updated = await decrementStock(i.product._id, i.variantColorName, i.size, i.quantity);
      if (!updated) {
        await Promise.all(decremented.map((d) => incrementStock(d.product, d.variantColorName, d.size, d.quantity)));
        const variantLabel = [i.variantColorName, i.size].filter(Boolean).join(" / ");
        return res.status(409).json({
          message: variantLabel
            ? `Sorry, "${i.product.name}" (${variantLabel}) is no longer available. Please select another size/color.`
            : `"${i.product.name}" no longer has enough stock`,
        });
      }
      decremented.push({ product: i.product._id, variantColorName: i.variantColorName, size: i.size, quantity: i.quantity });
    }

    const items = sourceItems.map((i) => ({
      product: i.product._id,
      name: i.product.name,
      price: i.product.price,
      quantity: i.quantity,
      variantColorName: i.variantColorName,
      variantColorCode: variantColorCode(i.product, i.variantColorName),
      size: i.size,
      image: variantImage(i.product, i.variantColorName),
      sku: variantSku(i.product, i.variantColorName, i.size),
    }));

    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    let discount = 0;
    let couponCode = "";
    if (req.body.couponCode) {
      const coupon = await Coupon.findOne({ code: req.body.couponCode.toUpperCase(), active: true });
      if (coupon && coupon.expiresAt >= new Date() && subtotal >= coupon.minOrderAmount) {
        discount =
          coupon.discountType === "percentage" ? (subtotal * coupon.discountValue) / 100 : coupon.discountValue;
        discount = Math.min(discount, subtotal);
        couponCode = coupon.code;
      }
    }

    const paymentMethod = "cod";
    const deliveryCharge = subtotal - discount >= FREE_DELIVERY_MINIMUM ? 0 : DELIVERY_CHARGE;

    let order;
    try {
      order = await Order.create({
        user: req.user._id,
        items,
        subtotal,
        discount,
        coupon: couponCode,
        deliveryCharge,
        totalAmount: subtotal - discount + deliveryCharge,
        shippingAddress: {
          fullName: address.fullName, line1: address.line1, line2: address.line2,
          landmark: address.landmark, city: address.city, state: address.state, pincode: address.pincode, phone: address.phone,
        },
        paymentMethod,
        trackingHistory: [{ status: "pending", note: `Order placed (${paymentMethod.toUpperCase()})` }],
      });
    } catch (err) {
      await Promise.all(decremented.map((d) => incrementStock(d.product, d.variantColorName, d.size, d.quantity)));
      throw err;
    }

    if (cart) {
      cart.items = [];
      cart.checkoutLockUntil = null;
      await cart.save();
    }

    sendOrderNotification(req.user, order, "placed");
    // Fire-and-forget, same pattern as customer emails — never blocks the response.
    sendAdminOrderNotification(order, req.user).catch((err) => {
      console.error(`Failed to send admin order notification for order ${order._id}:`, err.message);
    });

    res.status(201).json(order);
  } catch (err) {
    if (claimedCart) {
      await Cart.updateOne({ _id: claimedCart._id }, { checkoutLockUntil: null }).catch(() => {});
    }
    res.status(err.status || 400).json({ message: err.message || "Failed to place order" });
  }
};

// @route GET /api/orders/my
const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders", error: err.message });
  }
};

// @route GET /api/orders/:id
const getOrderById = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid order" });
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: "Order not found" });

    const isOwner = order.user.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to view this order" });
    }

    res.json(order);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch order", error: err.message });
  }
};

// @route GET /api/orders  (admin only - all orders)
const getAllOrders = async (req, res) => {
  try {
    const filter = {};
    if (req.query.month) {
      const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(req.query.month);
      if (!match) return res.status(400).json({ message: "Month must use YYYY-MM format" });
      const year = Number(match[1]);
      const month = Number(match[2]) - 1;
      filter.createdAt = {
        $gte: new Date(Date.UTC(year, month, 1)),
        $lt: new Date(Date.UTC(year, month + 1, 1)),
      };
    }
    const orders = await Order.find(filter).populate("user", "name email").sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders", error: err.message });
  }
};

// Returns items to stock — used whenever an order transitions into "cancelled".
const restockOrderItems = async (order) => {
  await Promise.all(
    order.items.map((i) => incrementStock(i.product, i.variantColorName, i.size, i.quantity))
  );
};

// @route PUT /api/orders/:id/status  { status, note, courierName, trackingNumber }  (admin only)
const updateOrderStatus = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid order" });
    const order = await Order.findById(req.params.id).populate("user", "name email");
    if (!order) return res.status(404).json({ message: "Order not found" });

    const transitions = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["processing", "cancelled"],
      processing: ["packed", "cancelled"],
      packed: ["shipped", "cancelled"],
      shipped: ["out_for_delivery", "cancelled"],
      out_for_delivery: ["delivered"],
      delivered: [],
      cancelled: [],
    };
    const trackingOnly = req.body.status === order.status &&
      (req.body.courierName !== undefined || req.body.trackingNumber !== undefined);
    if (!trackingOnly && !transitions[order.status]?.includes(req.body.status)) {
      return res.status(400).json({ message: `Order cannot move from ${order.status} to ${req.body.status}` });
    }
    const previousStatus = order.status;
    order.status = req.body.status;
    if (!trackingOnly) order.trackingHistory.push({ status: req.body.status, note: req.body.note || "" });

    // Courier + AWB number are entered manually by the admin (e.g. once they've
    // booked the shipment) — only overwrite when actually provided.
    if (req.body.courierName !== undefined) order.courierName = req.body.courierName;
    if (req.body.trackingNumber !== undefined) order.trackingNumber = req.body.trackingNumber;

    await order.save();

    if (previousStatus !== "cancelled" && req.body.status === "cancelled") {
      await restockOrderItems(order);
    }

    if (!trackingOnly) sendOrderNotification(order.user, order, req.body.status);

    res.json(order);
  } catch (err) {
    res.status(400).json({ message: "Failed to update order", error: err.message });
  }
};

// @route PUT /api/orders/:id/cancel  { reason }  (owner only)
// Only allowed while still pending — once an admin has moved it to processing
// (i.e. started fulfilling it), the customer can no longer self-cancel; only
// an admin can cancel it from that point via updateOrderStatus.
const cancelOrder = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ message: "Invalid order" });
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, status: "pending" },
      { $set: { status: "cancelled", cancelReason: req.body.reason || "", cancelledAt: new Date() }, $push: { trackingHistory: { status: "cancelled", note: req.body.reason || "Cancelled by customer" } } },
      { new: true }
    );
    if (!order) return res.status(404).json({ message: "Order not found" });
    await restockOrderItems(order);

    sendOrderNotification(req.user, order, "cancelled");

    res.json(order);
  } catch (err) {
    res.status(400).json({ message: "Failed to cancel order", error: err.message });
  }
};

// @route POST /api/orders/:id/return  { reason }  (owner only)
// Only allowed once the order has been delivered.
const requestReturn = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (order.status !== "delivered") {
      return res.status(400).json({ message: "Only delivered orders can be returned" });
    }
    if (order.return.status !== "none") {
      return res.status(400).json({ message: "A return has already been requested for this order" });
    }

    order.return = { requested: true, reason: req.body.reason || "", status: "requested", requestedAt: new Date() };
    await order.save();

    sendReturnNotification(req.user, order);

    res.json(order);
  } catch (err) {
    res.status(400).json({ message: "Failed to request return" });
  }
};

// @route PUT /api/orders/:id/return/status  { status }  (admin only)
// status: approved | rejected | refunded
const updateReturnStatus = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate("user", "name email");
    if (!order) return res.status(404).json({ message: "Order not found" });

    if (!["approved", "rejected", "refunded"].includes(req.body.status)) {
      return res.status(400).json({ message: "Invalid return status" });
    }
    if (order.return.status !== "requested") {
      return res.status(400).json({ message: "Return is not awaiting review" });
    }
    if (req.body.status === "refunded") {
      return res.status(400).json({ message: "Refund processing is unavailable for COD orders" });
    }
    order.return.status = req.body.status;
    order.return.resolvedAt = new Date();
    await order.save();

    sendReturnNotification(order.user, order);

    res.json(order);
  } catch (err) {
    res.status(400).json({ message: "Failed to update return status", error: err.message });
  }
};

module.exports = {
  placeOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  requestReturn,
  updateReturnStatus,
};