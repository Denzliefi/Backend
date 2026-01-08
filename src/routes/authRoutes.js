const router = require("express").Router();
const { register, login } = require("../controllers/authController");

// Base: /api/auth
router.post("/register", register);
router.post("/login", login);

// Optional: router.post("/google", googleAuth);

module.exports = router;
