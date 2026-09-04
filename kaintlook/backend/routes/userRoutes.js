const express = require("express");
const { getUsers, updateUserRole, deleteUser } = require("../controllers/userController");
const { protect, adminOnly } = require("../middleware/authMiddleware");

const router = express.Router();

router.use(protect, adminOnly);

router.get("/", getUsers);
router.put("/:id/role", updateUserRole);
router.delete("/:id", deleteUser);

module.exports = router;
