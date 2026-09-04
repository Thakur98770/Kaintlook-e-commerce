const Order = require("../models/Order");
const User = require("../models/User");
const Product = require("../models/Product");

// @route GET /api/analytics/summary (admin only)
// Top-line cards: revenue, orders, users, products, low stock count.
const getSummary = async (req, res) => {
  try {
    const [revenueAgg, orderCount, userCount, productCount, lowStockCount] = await Promise.all([
      Order.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
      Order.countDocuments(),
      User.countDocuments(),
      Product.countDocuments(),
      Product.countDocuments({ stock: { $lte: 5 } }),
    ]);

    res.json({
      totalRevenue: revenueAgg[0]?.total || 0,
      totalOrders: orderCount,
      totalUsers: userCount,
      totalProducts: productCount,
      lowStockCount,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch summary", error: err.message });
  }
};

// @route GET /api/analytics/sales?days=30 (admin only)
// Revenue grouped by day for a simple line chart.
const getSalesOverTime = async (req, res) => {
  try {
    const days = Number.parseInt(req.query.days || "30", 10);
    if (!Number.isInteger(days) || days < 1 || days > 365) return res.status(400).json({ message: "Days must be between 1 and 365" });
    const since = new Date();
    since.setDate(since.getDate() - days);

    const sales = await Order.aggregate([
      { $match: { paymentStatus: "paid", createdAt: { $gte: since } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          revenue: { $sum: "$totalAmount" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json(sales.map((s) => ({ date: s._id, revenue: s.revenue, orders: s.orders })));
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch sales data", error: err.message });
  }
};

// @route GET /api/analytics/top-products?limit=5 (admin only)
const getTopProducts = async (req, res) => {
  try {
    const limit = Number.parseInt(req.query.limit || "5", 10);
    if (!Number.isInteger(limit) || limit < 1 || limit > 100) return res.status(400).json({ message: "Limit must be between 1 and 100" });

    const top = await Order.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.product",
          name: { $first: "$items.name" },
          unitsSold: { $sum: "$items.quantity" },
          revenue: { $sum: { $multiply: ["$items.price", "$items.quantity"] } },
        },
      },
      { $sort: { revenue: -1 } },
      { $limit: limit },
    ]);

    res.json(top);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch top products", error: err.message });
  }
};

module.exports = { getSummary, getSalesOverTime, getTopProducts };
