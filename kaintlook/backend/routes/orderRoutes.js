const express = require("express");
const {
  placeOrder,
  getMyOrders,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  cancelOrder,
  requestReturn,
  updateReturnStatus,
} = require("../controllers/orderController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect); // every order route requires login

router.post("/", placeOrder);
router.get("/my", getMyOrders);
router.get("/:id", getOrderById);
router.put("/:id/cancel", cancelOrder);
router.post("/:id/return", requestReturn);

// Admin only
router.get("/", adminOnly, getAllOrders);
router.put("/:id/status", adminOnly, updateOrderStatus);
router.put("/:id/return/status", adminOnly, updateReturnStatus);

module.exports = router;
