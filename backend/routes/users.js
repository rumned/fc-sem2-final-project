const express = require("express");
const router = express.Router();
const { getUsers, getUser, updateUser, deleteUser } = require("../controllers/userController");
const { protect, requireAdmin } = require("../middleware/auth");

// All user routes require authentication
router.use(protect);

router.get("/",        requireAdmin, getUsers);  // admin only
router.get("/:id",     getUser);
router.put("/:id",     updateUser);
router.delete("/:id",  requireAdmin, deleteUser); // admin only

module.exports = router;
