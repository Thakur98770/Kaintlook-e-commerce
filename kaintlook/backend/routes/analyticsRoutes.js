const express = require("express");
const { getSummary, getSalesOverTime, getTopProducts } = require("../controllers/analyticsController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, adminOnly);

router.get("/summary", getSummary);
router.get("/sales", getSalesOverTime);
router.get("/top-products", getTopProducts);

module.exports = router;
