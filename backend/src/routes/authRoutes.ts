import { Router } from "express";
import { googleCallback, googleLogin, login, logout, refresh, register } from "../controllers/authController.js";
import { getMe } from "../controllers/userController.js";
import { authenticate } from "../middleware/authMiddleware.js";
import { authLimiter } from "../middleware/rateLimiters.js";

const router = Router();

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me", authenticate, getMe);
router.get("/google", googleLogin);
router.get("/google/callback", googleCallback);

export default router;
