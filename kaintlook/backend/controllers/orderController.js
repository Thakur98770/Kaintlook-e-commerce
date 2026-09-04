const mongoose = require("mongoose");
const Order = require("../models/Order");
const Cart = require("../models/Cart");
const Coupon = require("../models/Coupon");
const Product = require("../models/Product");
const Address = require("../models/Address");
const { sendOrderNotification, sendReturnNotification } = require("../utils/emailNotifications");
const FREE_DELIVERY_MINIMUM = 1999;
const DELIVERY_CHARGE = 99;

// @route POST /api/orders  { shippingAddress, couponCode, paymentMethod }
const placeOrder = async (req, res) => {
  let claimedCart;
  try {
    if (req.body.paymentMethod && req.body.paymentMethod !== "cod") {
      return res.status(400).json({ message: "Only Cash on Delivery is available" });
    }
    if (!req.body.addressId) return res.status(400).json({ message: "A saved shipping address is required" });
    const address = await Address.findOne({ _id: req.body.addressId, user: req.user._id }).lean();
    if (!address) return res.status(400).json({ message: "Shipping address not found" });
    let cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    const insufficient = cart.items.filter((i) => !i.product || i.product.stock < i.quantity);
    if (insufficient.length > 0) {
      return res.status(400).json({
        message: "Some items in your cart don't have enough stock",
        items: insufficient.map((i) => ({
          product: i.product?._id,
          name: i.product?.name || "Unknown product",
          available: i.product?.stock ?? 0,
          requested: i.quantity,
        })),
      });
    }

    claimedCart = await Cart.findOneAndUpdate(
      { _id: cart._id, $or: [{ checkoutLockUntil: null }, { checkoutLockUntil: { $lt: new Date() } }] },
      { checkoutLockUntil: new Date(Date.now() + 5 * 60 * 1000) },
      { new: true }
    ).populate("items.product");
    if (!claimedCart) return res.status(409).json({ message: "Checkout already in progress. Please try again." });
    cart = claimedCart;

    const decremented = [];
    for (const i of cart.items) {
      const updated = await Product.findOneAndUpdate(
        { _id: i.product._id, stock: { $gte: i.quantity } },
        { $inc: { stock: -i.quantity } },
        { new: true }
      );
      if (!updated) {
        await Promise.all(
          decremented.map((d) => Product.updateOne({ _id: d.product }, { $inc: { stock: d.quantity } }))
        );
        return res.status(400).json({
          message: `"${i.product.name}" no longer has enough stock`,
        });
      }
      decremented.push({ product: i.product._id, quantity: i.quantity });
    }

    const items = cart.items.map((i) => ({
      product: i.product._id,
      name: i.product.name,
      price: i.product.price,
      quantity: i.quantity,
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
      await Promise.all(
        decremented.map((d) => Product.updateOne({ _id: d.product }, { $inc: { stock: d.quantity } }))
      );
      throw err;
    }

    cart.items = [];
    cart.checkoutLockUntil = null;
    await cart.save();

    sendOrderNotification(req.user, order, "placed");

    res.status(201).json(order);
  } catch (err) {
    if (claimedCart) {
      await Cart.updateOne({ _id: claimedCart._id }, { checkoutLockUntil: null }).catch(() => {});
    }
    res.status(400).json({ message: "Failed to place order", error: err.message });
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
    order.items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.quantity } }))
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
    res.status(400).json({ message: "Failed to request return", error: err.message });
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
