const Coupon = require("../models/Coupon");
const couponFields = ["code", "discountType", "discountValue", "minOrderAmount", "expiresAt", "active"];
const pickCoupon = (body) => Object.fromEntries(couponFields.filter((field) => body[field] !== undefined).map((field) => [field, body[field]]));

// @route POST /api/coupons/validate  { code, orderAmount }  (logged-in user)
const validateCoupon = async (req, res) => {
  try {
    const { code, orderAmount } = req.body;
    const coupon = await Coupon.findOne({ code: code?.toUpperCase(), active: true });

    if (!coupon) return res.status(404).json({ message: "Invalid coupon code" });
    if (coupon.expiresAt < new Date()) return res.status(400).json({ message: "Coupon has expired" });
    if (orderAmount < coupon.minOrderAmount) {
      return res.status(400).json({ message: `Minimum order amount is ₹${coupon.minOrderAmount}` });
    }

    const discount =
      coupon.discountType === "percentage" ? (orderAmount * coupon.discountValue) / 100 : coupon.discountValue;

    res.json({ code: coupon.code, discount: Math.min(discount, orderAmount) });
  } catch (err) {
    res.status(500).json({ message: "Failed to validate coupon", error: err.message });
  }
};

// @route GET /api/coupons (admin only)
const getCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });
    res.json(coupons);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch coupons", error: err.message });
  }
};

// @route POST /api/coupons (admin only)
const createCoupon = async (req, res) => {
  try {
    const values = pickCoupon(req.body);
    if (values.discountType === "percentage" && (values.discountValue < 0 || values.discountValue > 100)) {
      return res.status(400).json({ message: "Percentage discount must be between 0 and 100" });
    }
    const coupon = await Coupon.create(values);
    res.status(201).json(coupon);
  } catch (err) {
    res.status(400).json({ message: "Failed to create coupon", error: err.message });
  }
};

// @route PUT /api/coupons/:id (admin only)
const updateCoupon = async (req, res) => {
  try {
    const values = pickCoupon(req.body);
    const current = await Coupon.findById(req.params.id).select("discountType");
    if (!current) return res.status(404).json({ message: "Coupon not found" });
    const discountType = values.discountType || current.discountType;
    if (discountType === "percentage" && values.discountValue !== undefined && (values.discountValue < 0 || values.discountValue > 100)) {
      return res.status(400).json({ message: "Percentage discount must be between 0 and 100" });
    }
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, values, { new: true, runValidators: true });
    res.json(coupon);
  } catch (err) {
    res.status(400).json({ message: "Failed to update coupon", error: err.message });
  }
};

// @route DELETE /api/coupons/:id (admin only)
const deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);
    if (!coupon) return res.status(404).json({ message: "Coupon not found" });
    res.json({ message: "Coupon deleted" });
  } catch (err) {
    res.status(500).json({ message: "Failed to delete coupon", error: err.message });
  }
};

module.exports = { validateCoupon, getCoupons, createCoupon, updateCoupon, deleteCoupon };
