const Cart = require("../models/Cart");
const Product = require("../models/Product");
const mongoose = require("mongoose");

const isValidQuantity = (q) => Number.isInteger(q) && q > 0 && q <= 1000;

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

// @route POST /api/cart  { productId, quantity }
const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    if (!mongoose.isValidObjectId(productId)) return res.status(400).json({ message: "Invalid product" });
    if (!isValidQuantity(quantity)) {
      return res.status(400).json({ message: "Quantity must be a whole number between 1 and 1000" });
    }

    const product = await Product.findById(productId).select("_id stock");
    if (!product) return res.status(404).json({ message: "Product not found" });
    if (product.stock < quantity) return res.status(400).json({ message: "Not enough stock available" });

    let cart = await Cart.findOne({ user: req.user._id });
    if (!cart) cart = new Cart({ user: req.user._id, items: [] });

    const existing = cart.items.find((i) => i.product.toString() === productId);
    if (existing) {
      const nextQuantity = existing.quantity + quantity;
      if (!isValidQuantity(nextQuantity)) {
        return res.status(400).json({ message: "Quantity must be a whole number between 1 and 1000" });
      }
      existing.quantity = nextQuantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();
    await cart.populate("items.product");
    res.json(cart);
  } catch (err) {
    res.status(400).json({ message: "Failed to add to cart", error: err.message });
  }
};

// @route PUT /api/cart/:productId  { quantity }
const updateCartItem = async (req, res) => {
  try {
    const { quantity } = req.body;
    if (!mongoose.isValidObjectId(req.params.productId)) return res.status(400).json({ message: "Invalid product" });
    if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity > 1000) {
      return res.status(400).json({ message: "Quantity must be a whole number no greater than 1000" });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.find((i) => i.product.toString() === req.params.productId);
    if (!item) return res.status(404).json({ message: "Item not in cart" });

    if (quantity <= 0) {
      cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
    } else {
      item.quantity = quantity;
    }

    await cart.save();
    await cart.populate("items.product");
    res.json(cart);
  } catch (err) {
    res.status(400).json({ message: "Failed to update cart item", error: err.message });
  }
};

// @route DELETE /api/cart/:productId
const removeFromCart = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.productId)) return res.status(400).json({ message: "Invalid product" });
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter((i) => i.product.toString() !== req.params.productId);
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
