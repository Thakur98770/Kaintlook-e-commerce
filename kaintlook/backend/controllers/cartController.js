const Cart = require("../models/Cart");
const Product = require("../models/Product");
const mongoose = require("mongoose");
const { hasVariants } = require("../utils/variantHelpers");

const isValidQuantity = (q) => Number.isInteger(q) && q > 0 && q <= 1000;

// Normalises "" / undefined / null all to "" so comparisons are consistent
// whether a value came from a query string, a JSON body, or a DB default.
const norm = (v) => (v || "").toString().trim();

const sameLine = (item, colorName, size) => norm(item.variantColorName) === norm(colorName) && norm(item.size) === norm(size);

// Validates that (colorName, size) is a real, purchasable combination for
// this product, and that at least `quantity` units are available. Throws a
// plain Error with a user-facing message otherwise — never trusts the client.
const assertPurchasable = (product, colorName, size, quantity) => {
  if (hasVariants(product)) {
    if (!norm(colorName) || !norm(size)) {
      throw new Error("Please select a color and size");
    }
    const variant = product.variants.find((v) => v.colorName === colorName);
    if (!variant) throw new Error("Selected color is no longer available");
    const row = variant.sizes.find((s) => s.size === size);
    if (!row) throw new Error("Selected size is no longer available");
    if (row.stock < quantity) throw new Error("Not enough stock available for this size/color");
  } else {
    if (product.stock < quantity) throw new Error("Not enough stock available");
  }
};

// @route GET /api/cart
const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
    if (!cart) cart = await Cart.create({ user: req.user._id, items: [] });
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch cart", error: err.message });
  }
};

// @route POST /api/cart  { productId, quantity, variantColorName, size }
const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const variantColorName = norm(req.body.variantColorName);
    const size = norm(req.body.size);
    if (!mongoose.isValidObjectId(productId)) return res.status(400).json({ message: "Invalid product" });
    if (!isValidQuantity(quantity)) {
      return res.status(400).json({ message: "Quantity must be a whole number between 1 and 1000" });
    }

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = new Cart({ user: req.user._id, items: [] });

    const existing = cart.items.find((i) => i.product.toString() === productId && sameLine(i, variantColorName, size));
    const nextQuantity = (existing?.quantity || 0) + quantity;

    assertPurchasable(product, variantColorName, size, nextQuantity);

    if (existing) {
      existing.quantity = nextQuantity;
    } else {
      cart.items.push({ product: productId, variantColorName, size, quantity });
    }

    await cart.save();
    await cart.populate("items.product");
    res.json(cart);
  } catch (err) {
    res.status(400).json({ message: err.message || "Failed to add to cart" });
  }
};

// @route PUT /api/cart/:productId?color=&size=  { quantity }
const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    const variantColorName = norm(req.query.color);
    const size = norm(req.query.size);
    if (!mongoose.isValidObjectId(req.params.productId)) return res.status(400).json({ message: "Invalid product" });
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity > 1000) {
      return res.status(400).json({ message: "Quantity must be a whole number no greater than 1000" });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find((i) => i.product.toString() === req.params.productId && sameLine(i, variantColorName, size));
    if (!item) return res.status(404).json({ message: "Item not in cart" });

    if (quantity <= 0) {
      cart.items = cart.items.filter((i) => i !== item);
    } else {
      const product = await Product.findById(req.params.productId);
      if (!product) return res.status(404).json({ message: "Product not found" });
      assertPurchasable(product, variantColorName, size, quantity);
      item.quantity = quantity;
    }

    await cart.save();
    await cart.populate("items.product");
    res.json(cart);
  } catch (err) {
    res.status(400).json({ message: err.message || "Failed to update cart item" });
  }
};

// @route DELETE /api/cart/:productId?color=&size=
const removeFromCart = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.productId)) return res.status(400).json({ message: "Invalid product" });
    const variantColorName = norm(req.query.color);
    const size = norm(req.query.size);

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter((i) => !(i.product.toString() === req.params.productId && sameLine(i, variantColorName, size)));
    await cart.save();
    res.json(cart);
  } catch (err) {
    res.status(500).json({ message: "Failed to remove item", error: err.message });
  }
};

// @route DELETE /api/cart
const clearCart = async (req, res) => {
  try {
    await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });
    res.json({ message: "Cart cleared" });
  } catch (err) {
    res.status(500).json({ message: "Failed to clear cart", error: err.message });
  }
};

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };