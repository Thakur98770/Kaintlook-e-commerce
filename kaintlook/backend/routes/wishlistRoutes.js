const express = require("express");
const { getWishlist, addToWishlist, removeFromWishlist } = require("../controllers/wishlistController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect); // every wishlist route requires login

router.get("/", getWishlist);
router.post("/", addToWishlist);
router.delete("/:productId", removeFromWishlist);

module.exports = router;
